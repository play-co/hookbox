from twisted.internet import protocol
from eventlet import api, coros
import logging
try:
    import json
except ImportError:
    import simplejson as json

class RTJPConnection(object):
    logger = logging.getLogger('RTJPConnection')
    
    def __init__(self, sock, delimiter='\r\n'):
        self.frame_id = 0
        self.sock = sock
        self._frame_channel = coros.Queue()
        self.delimiter = delimiter
        api.spawn(self._read_forever)
        
    def _read_forever(self):
        buffer = ""
        while True:
            data = self.sock.recv(1024)
            if not data:
                break;
            buffer += data
            while self.delimiter in buffer:
                raw_frame, buffer = buffer.split(self.delimiter, 1)
                try:
                    frame = json.loads(raw_frame)
                except:
                    self.logger.warn("Error parsing frame: " + repr(raw_frame), exc_info=True)
                    # TODO: Error?
                    continue
                if not isinstance(frame, list):
                    self.logger.warn("Invalid frame (not a list): " + repr(frame))
                    continue
                if not len(frame) == 3:
                    self.logger.warn("Invalid frame length for: " + repr(frame))
                    continue
                if (isinstance(frame[2], unicode)):
                    frame[2] = str(frame[2])
                if not isinstance(frame[0], int):
                    self.logger.warn("Invalid frame id: " + repr(frame[0]))
                    continue
                if not isinstance(frame[1], str) or len(frame[1]) == 0:
                    self.logger.warn("Invalid frame name: " + repr(frame[1]))
                    continue
                if not isinstance(frame[2], dict):
                    self.logger.warn("Invalid frame kwargs: " + repr(frame[2]))
                    continue
                self._frame_channel.send(frame)
        if self._frame_channel.waiting():
            self._frame_channel.send_exception(Exception("Connection Lost"))
            
    def recv_frame(self):
        return self._frame_channel.wait()


    def send_frame(self, name, args={}):
        self.logger.debug('send_frame', name, args)
        self.frame_id += 1
        buffer = json.dumps([self.frame_id, name, args]) + self.delimiter
        while buffer:
            bsent = self.sock.send(buffer)
            buffer = buffer[bsent:]
            
    def send_error(self, reference_id, msg):
        self.send_frame('ERROR', { 'reference_id': reference_id, 'msg': str(msg) })
        
        



"""class RTJPProtocol(protocol.Protocol):
    logger = logging.getLogger('RTJPProtocol')
  
    def __init__(self):
        self.buffer = ""
        self.frameId = 0
        
    def dataReceived(self, data):
        self.buffer += data
        while '\r\n' in self.buffer:
            rawFrame, self.buffer = self.buffer.split('\r\n',1)
            try:
                frame = json.loads(rawFrame)
            except:
                self.logger.warn("Error parsing frame: " + repr(frame))
                # TODO: Error?
                continue
            if not frame isinstance list:
                self.logger.warn("Invalid frame (not a list): " + repr(frame))
                continue
            if not len(frame) == 3:
                self.logger.warn("Invalid frame length for: " + repr(frame))
                continue
            if not isinstance(frame[0], int):
                self.logger.warn("Invalid frame id: " + repr(frame[0]))
                continue
            if not isinstance(frame[1], str) or len(frame[1]) == 0:
                self.logger.warn("Invalid frame name: " + repr(frame[1]))
                continue
            if not isinstance(frame[2], dict)
                self.logger.warn("Invalid frame kwargs: " + repr(frame[2]))
                continue
            fId, fName, fArgs = frame
            self.frameReceived(fId, fName, fArgs)
    
    def frameReceived(self, fId, fName, fArgs):
        pass
    
    def sendFrame(self, name, args={}):
        self.logger.debug('sendFrame', name, args)
        self.frameId += 1
        self.transport.write(json.dumps([self.frameId, name, args]) + '\r\n')
    
    def sendError(self, fId, msg):
        self.sendFrame('ERROR', { 'id': fId, 'msg': msg })
"""
        
        