import collections
import logging
from eventlet.green import httplib
import os
from eventlet import wsgi, api
from csp.eventlet import Listener
from paste import urlmap
import static
from errors import ExpectedException
import rtjp
try:
    import json
except:
    import simplejson as json
    
from config import config
class EmptyLogShim(object):
    def write(self, *args, **kwargs):
        return
    
class HookboxServer(object):
  
    def __init__(self, interface, port):
        self.interface = interface
        self.port = port
        
#        self.identifer_key = 'abc';
        self.base_host = config['cbhost']
        self.base_port = config['cbport']
        self.base_path = config['cbpath']
        self.subscriptions = collections.defaultdict(list)
        
    def run(self):
        api.spawn(self._run)
        
    def _run(self):
        app = urlmap.URLMap()
        csp = Listener()
        app['/csp'] = csp
        static_path = os.path.join(os.path.split(os.path.abspath(__file__))[0], 'static')
        app['/static'] = static.Cling(static_path)
        
        api.spawn(wsgi.server, api.tcp_listener((self.interface, self.port)), app, log=EmptyLogShim())
        while True:
            try:
                sock, addr_info = csp.accept()
                conn = HookboxConn(self, sock)
            except:
                raise
                break
        print "HookboxServer Stopped"

        
        
    def http_request(self, path, cookie_string):
        http = httplib.HTTPConnection(self.base_host, self.base_port)
        http.request('POST', self.base_path + path, headers={ 'Cookie': cookie_string })
        response = http.getresponse()
        if response.status != 200:
            raise ExpectedException("Invalid callback response, status=" + str(response.status))
        body = response.read()
        try:
           output = json.loads(body)
        except:
            raise ExpectedException("Invalid json: " + body)
        if not isinstance(output, list) or len(output) != 2:
            raise ExpectedException("Invalid response (expected json list of length 2)")
        return output
    
    def connect(self, conn):
        success, options = self.http_request('/connect', conn.cookie_string)
        if not success:
            raise ExpectedException("Unauthorized")
        conn.name = options.get('name', None)
        for destination in options.get('auto_subscribe', ()):
            self.subscribe(conn, destination)
        for destination in options.get('auto_unsubscribe', ()):
            self.unsubscribe(conn, destination)
        return True
    
    def subscribe(self, conn, destination):
        if conn in self.subscriptions[destination]:
            return
        self.subscriptions[destination].append(conn)

    def unsubscribe(self, conn, destination):
        if conn in self.subscriptions.get(destination, ()):
            self.subscriptions[destination].remove(conn)
        
    def publish(self, conn, destination, payload):
        for conn in self.subscriptions.get(destination, ()):
            conn.send_frame('PUBLISH', {"destination":destination, "payload":payload})
        
def parse_cookies(cookieString):
    output = {}
    for m in cookieString.split('; '):
        try:
            k,v = m.split('=', 1)
            output[k] = v
        except:
            continue
    return output
        
        
        
class HookboxConn(rtjp.RTJPConnection):
    logger = logging.getLogger('RTJPConnection')
    
    def __init__(self, server, sock):
        rtjp.RTJPConnection.__init__(self, sock)
        self.server = server
        self.state = 'initial'
        self.cookies = None
        self.cookie_string = None
        api.spawn(self._run)
        
    def _close(self):
        if self.state == 'connected':
            self.server.closed(self)
        
    def _run(self):
        while True:
            try:
                fid, fname, fargs= self.recv_frame()
            except:
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
            
    def _default_frame(fid, fname, fargs):
        pass                
            
    def frame_CONNECT(self, fid, fargs):
        if self.state != 'initial':
            return self.send_error(fid, "Already logged in")
        self.cookies = parse_cookies(fargs['cookie'])
        self.cookie_string = fargs['cookie']
        self.server.connect(self)
        self.state = 'connected'
        self.send_frame('CONNECTED')
    
    def frame_SUBSCRIBE(self, fid, fargs):
        if self.state != 'connected':
            return self.send_error(fid, "Not connected")
        if 'destination' not in fargs:
            return self.send_error(fid, "destination required")
        self.server.subscribe(self, fargs['destination'])
            
    def frame_UNSUBSCRIBE(self, fid, fargs):
        if self.state != 'connected':
            return self.send_error(fid, "Not connected")
        if 'destination' not in fargs:
            return self.send_error(fid, "destination required")
        self.server.unsubscribe(self, fargs['destination'])
            
            
    def frame_PUBLISH(self, fid, fargs):
        if self.state != 'connected':
            return self.send_error(fid, "Not connected")
        if 'destination' not in fargs:
            return self.send_error(fid, "destination required")
        if 'payload' not in fargs:
            return self.send_error(fid, "payload required")
        self.server.publish(self, fargs['destination'], fargs['payload'])
        
    