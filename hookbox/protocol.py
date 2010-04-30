import logging
import uuid
import eventlet
from errors import ExpectedException
import rtjp.errors

class HookboxConn(object):
    logger = logging.getLogger('RTJPConnection')
    
    def __init__(self, server, rtjp_conn, config):
        self._rtjp_conn = rtjp_conn
        self.server = server
        self.state = 'initial'
        self.cookies = None
        self.cookie_string = None
        self.cookie_id = None
        self.cookie_identifier = config['cookie_identifier']
        self.id = str(uuid.uuid4()).replace('-', '')
        self.user = None
        eventlet.spawn(self._run)
        
    def serialize(self):
        return {
            "id": self.id,
            "user": self.user and self.user.get_name(),
            "cookie": self.cookie_string
        }
        
    def send_frame(self, *args, **kw):
        return self._rtjp_conn.send_frame(*args, **kw)

    def send_error(self, *args, **kw):
        return self._rtjp_conn.send_error(*args, **kw)

    def get_cookie(self):
        return self.cookie_string
        
    def get_id(self):
        return self.id
    
    def get_cookie_id(self):
        return self.cookie_id
    
    def _close(self):
        if self.state == 'connected':
            self.server.closed(self)
        
    def _run(self):
        while True:
            try:
#                print 'read a frame...'
                fid, fname, fargs= self._rtjp_conn.recv_frame().wait()
#                print 'got frame', fid, fname, fargs
            except rtjp.errors.ConnectionLost, e:
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
        if self.user:
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

def parse_cookies(cookieString):
    output = {}
    for m in cookieString.split('; '):
        try:
            k,v = m.split('=', 1)
            output[k] = v
        except:
            continue
    return output
