import logging
import uuid
import eventlet
from errors import ExpectedException
import rtjp_eventlet

class HookboxConn(object):
    logger = logging.getLogger('HookboxConn')
    
    def __init__(self, server, rtjp_conn, config, remote_addr):
        self._rtjp_conn = rtjp_conn
        self.server = server
        self.state = 'initial'
        self.cookies = None
        self.cookie_string = None
        self.cookie_id = None
        self.cookie_identifier = config['cookie_identifier']
        self.id = str(uuid.uuid4()).replace('-', '')
        self.user = None
        self.remote_addr = remote_addr
        
    def serialize(self):
        return {
            "id": self.id,
            "user": self.user and self.user.get_name(),
            "cookie": self.cookie_string
        }
        
    def send_frame(self, *args, **kw):
        try:
            self._rtjp_conn.send_frame(*args, **kw).wait()
        except Exception, e:
            if 'closed' in str(e).lower():
                pass
            else:
                self.logger.warn("Unexpected error: %s", e, exc_info=True)

    def send_error(self, *args, **kw):
        return self._rtjp_conn.send_error(*args, **kw)

    def get_cookie(self):
        return self.cookie_string
        
    def get_id(self):
        return self.id
    
    def get_cookie_id(self):
        return self.cookie_id
    
    def get_remote_addr(self):
        return self.remote_addr

    def _close(self):
        if self.state == 'connected':
            self.server.closed(self)
        
    def run(self):
        while True:
            try:
#                print 'read a frame...'
                self.logger.debug('%s waiting for a frame', self)
                fid, fname, fargs= self._rtjp_conn.recv_frame().wait()
#                print 'got frame', fid, fname, fargs
            except rtjp_eventlet.errors.ConnectionLost, e:
                self.logger.debug('received connection lost error')
#                print 'connection lost'
                break
            except:
#                print 'some error..'
                self.logger.warn("Error reading frame", exc_info=True)
                continue
            f = getattr(self, 'frame_' + fname, None)
            if f:
                try:
                        f(fid, fargs)
                except ExpectedException, e:
                    self.send_error(fid, e)
                except Exception, e:
                    self.logger.warn("Unexpected error: %s", e, exc_info=True)
                    self.send_error(fid, e)
            else:
                self._default_frame(fid, fname, fargs)
#        print 'all DONE!'
        # cleanup
        self.logger.debug('loop done')
        if self.user:
            self.logger.debug('cleanup user')
#            print 'go call remove connection'
            self.user.remove_connection(self)
            self.server.disconnect(self)
        
    def _default_frame(fid, fname, fargs):
        pass
    
    def frame_CONNECT(self, fid, fargs):
        if self.state != 'initial':
            return self.send_error(fid, "Already logged in")
        if 'cookie_string' not in fargs:
            raise ExpectedException("Missing cookie_string")

        self.cookie_string = fargs['cookie_string']
        self.cookies = parse_cookies(fargs['cookie_string'])
        self.cookie_id = self.cookies.get(self.cookie_identifier, None)
        self.server.connect(self)
        self.state = 'connected'
        self.send_frame('CONNECTED', { 'name': self.user.get_name() })
    
    def frame_SUBSCRIBE(self, fid, fargs):
        if self.state != 'connected':
            return self.send_error(fid, "Not connected")
        if 'channel_name' not in fargs:
            return self.send_error(fid, "channel_name required")
        channel = self.server.get_channel(self, fargs['channel_name'])
        channel.subscribe(self.user, conn=self)
            
    def frame_UNSUBSCRIBE(self, fid, fargs):
        if self.state != 'connected':
            return self.send_error(fid, "Not connected")
        if 'channel_name' not in fargs:
            return self.send_error(fid, "channel_name required")
        channel = self.server.get_channel(self, fargs['channel_name'])
        channel.unsubscribe(self.user, conn=self)
    
    def frame_PUBLISH(self, fid, fargs):
        if self.state != 'connected':
            return self.send_error(fid, "Not connected")
        if 'channel_name' not in fargs:
            return self.send_error(fid, "channel_name required")
        channel = self.server.get_channel(self, fargs['channel_name'])
        channel.publish(self.user, fargs.get('payload', 'null'), conn=self)

    def frame_MESSAGE(self, fid, fargs):
        if self.state != 'connected':
            return self.send_error(fid, "Not connected")
        if 'name' not in fargs:
            return self.send_error(fid, "name")
        user_name = fargs['name']
        if not self.server.exists_user(user_name):
            # TODO: Maybe this is too much info to expose, that the user isn't signed on...
            return self.send_error(fid, "invalid user name")
        user = self.server.get_user(user_name)
        user.send_message(self.user.get_name(), fargs.get('payload', 'null'))
        
        
def parse_cookies(cookieString):
    output = {}
    for m in cookieString.split('; '):
        try:
            k,v = m.split('=', 1)
            output[k] = v
        except:
            continue
    return output
