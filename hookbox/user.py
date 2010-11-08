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
    _options = {
        'reflective': True,
        'moderated_message': True,
    }

    def __init__(self, server, name, **options):
        self.server = server
        self.name = name
        self.connections = []
        self.channels = []
        self._temp_cookie = ""
        self.update_options(**self._options)
        self.update_options(**options)

    def serialize(self):
        return {
            'channels': [ chan.name for chan in self.channels ],
            'connections': [ conn.id for conn in self.connections ],
            'name': self.name,
            'options': dict([ (key, getattr(self, key)) for key in self._options])
        }

    def extract_valid_options(self, options):
        return dict([ (key, options.pop(key, self._options[key])) for key in self._options ])

    def update_options(self, **options):
        # TODO: this can't remain so generic forever. At some point we need
        #       better checks on values, such as the list of dictionaries
        #       for history, or the polling options.
        # TODO: add support for lists (we only have dicts now)
        # TODO: Probably should make this whole function recursive... though
        #       we only really have one level of nesting now.
        # TODO: most of this function is duplicated from Channel#update_options
        #       (including the TODOs above), could be a lot DRYer
        for key, val in options.items():
            if key not in self._options:
                raise ValueError("Invalid keyword argument %s" % (key))
            default = self._options[key]
            cls = default.__class__
            if cls in (unicode, str):
                cls = basestring
            if not isinstance(val, cls):
                raise ValueError("Invalid type for %s (should be %s)" % (key, default.__class__))
            if key == 'state':
                self.state_replace(val)
                continue
            if isinstance(val, dict):
                for _key, _val in val.items():
                    if _key not in self._options[key]:
                        raise ValueError("Invalid keyword argument %s" % (_key))
                    default = self._options[key][_key]
                    cls = default.__class__
                    if isinstance(default, float) and isinstance(_val, int):
                        _val = float(_val)
                    if cls in (unicode, str):
                        cls = basestring
                    if not isinstance(_val, cls):
                        raise ValueError("%s is Invalid type for %s (should be %s)" % (_val, _key, default.__class__))
        # two loops forces exception *before* any of the options are set.
        for key, val in options.items():
            # this should create copies of any dicts or lists that are options
            if isinstance(val, dict) and hasattr(self, key):
                getattr(self, key).update(val)
            else:
                setattr(self, key, val.__class__(val))
        
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
        
    def send_message(self, recipient, payload, conn=None, needs_auth=True):
        try:
            encoded_payload = json.loads(payload)
        except:
            raise ExpectedException("Invalid json for payload")
        payload = encoded_payload
        if needs_auth and self.moderated_message:
            form = { 'sender': self.get_name(), 'recipient': recipient.get_name(), 'payload': json.dumps(payload) }
            success, options = self.server.http_request('message', self.get_cookie(conn), form, conn=conn)
            self.server.maybe_auto_subscribe(self, options, conn=conn)
            if not success:
                raise ExpectedException(options.get('error', 'Unauthorized'))
            payload = options.get('override_payload', payload)
        
        frame = {"sender": self.get_name(), "recipient": recipient.get_name(), "payload": payload, "datetime": get_now()}
        recipient.send_frame('MESSAGE', frame)
        if recipient.name != self.name and self.reflective:
            self.send_frame('MESSAGE', frame)
        
    
