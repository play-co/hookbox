from twisted.internet import protocol, defer
from twisted.web.client import getPage
import logging
import rtjp
import urllib
import cgi

try:
    import json
except:
    import simplejson as json

class HookBoxServer(protocol.Factory):
    protocol = HookBoxProtocol
    
    def __init__(self, remote_base):
        self.remote_base
    
    def makeRequest(self, location, cookies, **form):
        url = self.remote_base + '/connect'
        body = urllib.urlencode(form)
        return getPage(url, method='POST', postdata=body, cookies=cookies)
    
    
    def connect(self, conn):
        def success(response):
            
        d = makeRequest('/connect', conn.cookies)
        d.addCallback(self.responseSuccess, 'login').addErback(self.responseErr, 'login')
        
            
getPage(url, method='POST', postdata=encode(headers))





class HookBoxProtocol(rtjp.RTJPProtocol):
    logger = logging.getLogger('HookBoxProtocol')
  
    def __init__(self):
        rtjp.RTJPProtocol.__init__(self)
        self.cookies = {}
        self.id = None
    def connectionMade(self, data):
        self.state = 'initial'
    
    def frameReceived(self, fId, fName, fArgs):
        if fName == 'CONNECT':
            if self.state != 'initial':
                return self.sendError(fId, "Already logged in")
            for m in fArgs['cookies'].split('; '):
                try:
                    k,v = m.split('=', 1)
                except:
                    continue
                self.cookies[k] = v
                
            def _login_success(arg, identifier):
                self.state = 'connected'
                self.sendFrame('CONNECTED')
                
            def _login_failure(err):
                self.sendError(fId, err)
            
    @defer.inlineCallbacks  
    def frame_CONNECT(self, fId, fArgs):
        if self.state != 'initial':
            self.sendError(fId, "Already logged in")
            return
        self.cookies = parse_cookies(fArgs('cookies'))
        try:
            self.id = yield self.factory.login(self, fArgs['cookies'])
        except Exception, e:
            self.sendError(fId, str(e))
            return
        self.state = 'connected'
        self.sendFrame('CONNECTED')
    
    @defer.inlineCallbacks
    def frame_SUBSCRIBE(self, fId, fArgs):
        pass
            
    def connectionLost(self, reason):
        pass
    
def parse_cookies(cookieString):
    output = {}
    for m in cookieString.split('; '):
        try:
            k,v = m.split('=', 1)
            output[k] = v
        except:
            continue
    return output
