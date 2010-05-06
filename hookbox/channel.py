import urllib
import eventlet
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
        'moderated_publish': False,
        'moderated_subscribe': False,
        'moderated_unsubscribe': False,
        'presenceful': False,
        'anonymous': False,
        'polling': {
            'mode': "",
            'interval': 5.0,
            'url': "",
            'form': {},
            'originator': ""
        }
    }

    def __init__(self, server, name, **options):
#        self.__dict__.update(self._options)
        self.server = server
        self.name = name
        self.subscribers = []
        # overwrites the default self.history
        self.history = []
        self._polling_task = None
        self._polling_lock = eventlet.semaphore.Semaphore()
        #print 'self._options is', self._options
        self.update_options(**self._options)
        self.update_options(**options)

    def user_disconnected(self, user):
        # TODO: remove this pointless check, it should never happen, right?
        if user not in self.subscribers:
            return
        self.unsubscribe(user, needs_auth=False)

        

    def set_history(self, history):
        self.history = history
        self.prune_history()

    def prune_history(self):
        while len(self.history) > self.history_size:
            self.history.pop(0)

    def update_options(self, notify_polling=True, **options):
        # TODO: this can't remain so generic forever. At some point we need
        #       better checks on values, such as the list of dictionaries
        #       for history, or the polling options.
        
        # TODO: add support for lists (we only have dicts now)
        # TODO: Probably should make this whole function recursive... though
        #       we only really have one level of nesting now.
        
        for key, val in options.items():
            if key not in self._options:
                raise ValueError("Invalid keyword argument %s" % (key))
            default = self._options[key]
            cls = default.__class__
            if cls in (unicode, str):
                cls = basestring
            if not isinstance(val, cls):
                raise ValueError("Invalid type for %s (should be %s)" % (key, default.__class__))
            
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
        if 'polling' in options and notify_polling:
            self.polling_modified()
            
    def polling_modified(self):
        self._polling_lock.acquire()
        if self._polling_task:
            self._polling_task.kill()
        if self.polling['mode'] in ('once', 'simple', 'persistent'):
            self._polling_task = eventlet.spawn(self._poll)
        self._polling_lock.release()
        
            
    def _poll(self):
        while True:
            mode = self.polling['mode']
            interval = self.polling['interval']
            if mode == None:
                return
            eventlet.sleep(interval)
            max_backoff = max(300, interval)
            backoff_interval = 1
            while True:
                self._polling_lock.acquire()
                try:
                    if mode == 'simple':
                        payload = urllib.urlopen(self.polling['url']).read()
                        try:
                            payload = json.loads(payload)
                        except:
                            pass
                        success = True
                        options = {}
                    else: # "persistent" or "once"
                        success, options = self.server.http_request(form=self.polling['form'], full_path = self.polling['url'])
                        payload = options.pop('payload', None)
                except Exception, e:
                    self._polling_lock.release()
                    backoff_interval = min(backoff_interval * 2, max_backoff)
                    eventlet.sleep(backoff_interval)
                    continue
                break
            try:
                self.update_options(notify_polling=False, **options)
            except Exception, e:
                # TODO: Failure on return options... log it?
                pass
            payload = json.dumps(payload)
            self.publish(None, payload, needs_auth=False, originator=self.polling['originator'])
            # Note: calling release here may cause us this greenlet to be killed
            self._polling_lock.release()
            
            if 'polling' in options or self.polling['mode'] in ('simple', 'persistent'):
                continue
            return
            
    def publish(self, user, payload, needs_auth=True, conn=None, **kwargs):
        try:
            encoded_payload = json.loads(payload)
        except:
            raise ExpectedException("Invalid json for payload")
        payload = encoded_payload
        if needs_auth and (self.moderated or self.moderated_publish):
            form = { 'channel_name': self.name, 'payload': payload }
            success, options = self.server.http_request('publish', user.get_cookie(conn), form)
            self.server.maybe_auto_subscribe(user, options)
            if not success:
                raise ExpectedException(options.get('error', 'Unauthorized'))
            payload = options.get('override_payload', payload)

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
            self.history.append(('PUBLISH', frame))
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
            for subscriber in self.subscribers:
                if subscriber == user: continue
                subscriber.send_frame('SUBSCRIBE', frame)
                
        frame = self._build_subscribe_frame(user, initial_data)
        conn.send_frame('SUBSCRIBE', frame)
        if self.history_size:
            del frame['channel_name']
            self.history.append(('SUBSCRIBE', {"user": user.get_name() }))
            self.prune_history()


    def _build_subscribe_frame(self, user, initial_data=None):
        frame = {"channel_name": self.name, "user": user.get_name()}
        frame["history"] = self.history
        frame["history_size"] = self.history_size
        frame["initial_data"] = initial_data        
        if self.presenceful:
            frame['presence'] = [ subscriber.get_name() for subscriber in self.subscribers ]
        else:
            frame['presence'] = [];
        return frame

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
            for subscriber in self.subscribers:
                if subscriber == user: continue
                subscriber.send_frame('UNSUBSCRIBE', frame)
        user.send_frame('UNSUBSCRIBE', frame)
        self.subscribers.remove(user)
        user.channel_unsubscribed(self)
        if self.history_size:
            del frame['channel_name']
            self.history.append(('UNSUBSCRIBE', {"user": user.get_name() }))
            self.prune_history()
        
        if not self.subscribers:
            self.server.destroy_channel(self.name)
    
    def destroy(self, needs_auth=True):
        form = { 'channel_name': self.name }
        try:
            success, options = self.server.http_request('destroy_channel', form=form)
        except ExpectedException:
            return False
        
        return success
        
    def serialize(self):
        return {
            'name': self.name,
            'options': dict([ (key, getattr(self, key)) for key in self._options]),
            'subscribers': [ user.name for user in self.subscribers ]
        }
