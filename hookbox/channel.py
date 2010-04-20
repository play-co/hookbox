from errors import ExpectedException

try:
    import json
except ImportError:
    import simplejson as json


class Channel(object):
    _options = {
        'reflective': True,
        'history': [],
        'history_size': 0,
        'moderated': True,
        'moderated_publish': True,
        'moderated_subscribe': True,
        'moderated_unsubscribe': True,
        'presenceful': True,
        'anonymous': False
    }

    def __init__(self, server, name, **options):
        self.__dict__.update(self._options)
        self.update_options(**options)
        self.server = server
        self.name = name
        self.subscribers = []
        # overwrites the default self.history
        self.history = []


    def user_disconnected(self, user):
        # TODO: remove this pointless check, it should never happen, right?
        if user not in self.subscribers:
            return
        self.unsubscribe(self, needs_auth=False)

        

    def set_history(self, history):
        self.history = history
        self.prune_history()

    def prune_history(self):
        while len(self.history) > self.history_size:
            self.history.pop(0)

    def update_options(self, **options):
        for key, val in options.items():
            if key not in self._options:
                raise ValueError("Invalid keyword argument %s" % (key))
            default = self._options[key]
            if val.__class__ != default.__class__:
                raise ValueError("Invalid type for %s (should be %s)" % (key, default.__class__))
        # two loops forces exception *before* any of the options are set.
        for key, val in options.items():
            # this should create copies of any dicts or lists that are options
            setattr(self, key, val.__class__(val))

    def publish(self, user, payload, needs_auth=True, conn=None, **kwargs):
        try:
            encoded_payload = json.loads(payload)
        except:
            raise ExpectedException("Invalid json for payload")
        payload = encoded_payload
        if needs_auth and (self.moderated or self.moderated_publish):
            form = { 'channel_name': self.name, 'payload': payload }
            success, options = self.server.http_request('publish', user.get_cookie(conn), form)
            if not success:
                raise ExpectedException(options.get('error', 'Unauthorized'))
            payload = options.get('override_payload', payload)
            self.server.maybe_auto_subscribe(user, options)

        frame = {"channel_name": self.name, "payload":payload}

        if not self.anonymous:
            if 'originator' in kwargs:
                frame['user'] = kwargs['originator']
            else:
                frame['user'] = user.get_name()

        omit = None
        if not self.reflective:
            omit = conn
        for subscriber in self.subscribers:
            subscriber.send_frame('PUBLISH', frame, omit=omit)
        self.server.admin.channel_event('publish', self.name, frame)
        if self.history_size:
            del frame['channel_name']
            self.history.append(frame)
            self.prune_history()

    def subscribe(self, user, conn=None, needs_auth=True):

        if user in self.subscribers:
            return

        has_initial_data = False
        initial_data = None
        
        if needs_auth and (self.moderated or self.moderated_subscribe):
            form = { 'destination': self.name }
            success, options = self.server.http_request('subscribe', user.get_cookie(conn), form)
            if not success:
                raise ExpectedException(options.get('error', 'Unauthorized'))
            if 'initial_data' in options:
                has_initial_data = True
                initial_data = options['initial_data']
            self.server.maybe_auto_subscribe(user, options)
            
        if has_initial_data or self.history:
            frame = dict(channel_name=self.name, history=self.history, initial_data=initial_data)
            user.send_frame('CHANNEL_INIT', frame)

        self.subscribers.append(user)
        user.channel_subscribed(self)
        
        frame = {"channel_name": self.name, "user": user.get_name()}
        self.server.admin.channel_event('subscribe', self.name, frame)
        if self.presenceful:
            omit = None
            if not self.reflective:
                omit = conn
            for subscriber in self.subscribers:
                subscriber.send_frame('SUBSCRIBED', frame, omit=omit)


    def unsubscribe(self, user, conn=None, needs_auth=True):
        if user not in self.subscribers:
            return

        if needs_auth and (self.moderated or self.moderated_unsubscribe):
            form = { 'channel_name': self.name }
            success, options = self.server.http_request('unsubscribe', user.get_cookie(conn), form)
            if not success:
                raise ExpectedException(options.get('error', 'Unauthorized'))
            self.server.maybe_auto_subscribe(user, options)

        frame = {"channel_name": self.name, "user": user.get_name()}
        self.server.admin.channel_event('unsubscribe', self.name, frame)
        if self.presenceful:
            omit = None
            if not self.reflective:
                omit = conn
            for subscriber in self.subscribers:
                subscriber.send_frame('UNSUBSCRIBED', frame, omit=omit)

        self.subscribers.remove(user)
        user.channel_unsubscribed(self)
        

    def serialize(self):
        return {
            'name': self.name,
            'options': dict([ (key, getattr(self, key)) for key in self._options]),
            'subscribers': [ user.name for user in self.subscribers ]
        }
