import eventlet
from errors import ExpectedException
try:
    import json
except ImportError:
    import simplejson as json
import datetime

def get_now():
  return datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')

class User(object):
    def __init__(self, server, name):
        self.server = server
        self.name = name
        self.connections = []
        self.channels = []
        self._temp_cookie = ""
    def serialize(self):
        return {
            'channels': [ chan.name for chan in self.channels ],
            'connections': [ conn.id for conn in self.connections ],
            'name': self.name
        }
        
    def add_connection(self, conn):
        self.connections.append(conn)
        conn.user = self
        # call later...
        eventlet.spawn(self._send_initial_subscriptions, conn)
        
    def _send_initial_subscriptions(self, conn):
        for channel in self.channels:
            frame = channel._build_subscribe_frame(self)
            conn.send_frame('SUBSCRIBE', frame)
            
    def remove_connection(self, conn):
        self.connections.remove(conn)
        if not self.connections:
            # each call to user_disconnected might result in an immediate call
            # to self.channel_unsubscribed, thus modifying self.channels and
            # messing up our loop. So we loop over a copy of self.channels...
            
            for channel in self.channels[:]:
                channel.user_disconnected(self)
#            print 'tell server to remove user...'
            # so the disconnect callback has a cookie
            self._temp_cookie = conn.get_cookie()
            self.server.remove_user(self.name)
            
    def channel_subscribed(self, channel):
        self.channels.append(channel)
        
    def channel_unsubscribed(self, channel):
        self.channels.remove(channel)
        
    def get_name(self):
        return self.name
    
    def send_frame(self, name, args={}, omit=None):
        for conn in self.connections:
            if conn is not omit:
                conn.send_frame(name, args)

    def get_cookie(self, conn=None):
        if conn:
            return conn.get_cookie()
        
        return self._temp_cookie or ""
        
    def send_message(self, sender_name, payload, conn=None, needs_auth=False):
        try:
            decoded_payload = json.loads(payload)
        except:
            raise ExpectedException("Invalid json for payload")
#        payload = encoded_payload
        cookie_string = conn and conn.get_cookie() or ""
        if needs_auth and (self.moderated or self.moderated_publish):
            form = { 'sender': sender_name, 'payload': payload }
            success, options = self.server.http_request('message', cookie_string, form, conn=conn)
            self.server.maybe_auto_subscribe(user, options, conn=conn)
            if not success:
                raise ExpectedException(options.get('error', 'Unauthorized'))
            payload = options.get('override_payload', payload)
            try:
                decoded_payload = json.loads(payload)
            except:
                raise ExcpectedException("Server returned invalid payload for message webhook")
        
        frame = {"sender": sender_name, "recipient": self.get_name(), "payload": decoded_payload, "datetime": get_now()}
        self.send_frame('MESSAGE', frame)
        if sender_name != self.name and self.server.exists_user(sender_name):
            user = self.server.get_user(sender_name)
            user.send_frame('MESSAGE', frame, omit=conn)
        
    