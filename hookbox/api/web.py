import cgi
import logging
from hookbox.errors import ExpectedException
try:
    import json
except:
    import simplejson as json
import urlparse

class HookboxWebAPI(object):
    logger = logging.getLogger('HookboxRest')
    def __init__(self, api):
        self.api = api
        
    def __call__(self, environ, start_response):
        path = environ['PATH_INFO']
        handler = getattr(self, 'render_' + path[1:], None)
        if not handler:
            start_response('404 Not Found', ())
            return "Not Found"
        if not self.api.is_enabled():
            start_response('200 Ok', ())
            return json.dumps([False, { 'msg': "Rest api is disabled by configuration. (Please supply --rest-secret/-r option at start)" }])

        try:
            form = get_form(environ)
            secret = form.pop('security_token', None)
            self.api.authorize(secret)
            return handler(form, start_response)
        except Exception, e:
            self.logger.warn('REST Error: %s', path, exc_info=True)
            start_response('500 Internal server error', [])
            return json.dumps([False, {'msg': str(e) }])
        except ExpectedException, e:
            start_response('200 Ok', [])
            return json.dumps([False, {'msg': str(e) }])
            
    def render_publish(self, form, start_response):
        channel_name = form.get('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        payload = form.get('payload', 'null')
        originator = form.get('originator', None)
        send_hook = form.get('send_hook', '0') == '1'
        self.api.publish(channel_name, payload, originator, send_hook)
        
        start_response('200 Ok', [])
        return json.dumps([True, {}])

    def render_publish_multi(self, form, start_response):
        channel_names = form.get('channel_names', None)
        if not channel_names:
            raise ExpectedException("Missing channel_names")
        channel_name_list = channel_names.split(',')
        payload = form.get('payload', 'null')
        originator = form.get('originator', None)
        send_hook = form.get('send_hook', '0') == '1'
        self.api.publish_multi(channel_name_list, payload, originator, send_hook)
        start_response('200 Ok', [])
        return json.dumps([True, {}])

    def render_unsubscribe(self, form, start_response):
        channel_name = form.get('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        name= form.get('name', None)
        if not name:
            raise ExpectedException("Missing name")
        send_hook = form.get('send_hook', '0') == '1'

        self.api.unsubscribe(channel_name, name, send_hook)
        start_response('200 Ok', [])
        return json.dumps([True, {}])

    def render_subscribe(self, form, start_response):
        channel_name = form.get('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        name= form.get('name', None)
        if not name:
            raise ExpectedException("Missing name")
        send_hook = form.get('send_hook', '0') == '1'
        
        self.api.subscribe(channel_name, name, send_hook)
        start_response('200 Ok', [])
        return json.dumps([True, {}])

    def render_message(self, form, start_response):
        sender_name = form.get('sender_name', None)
        if not sender_name:
            raise ExpectedException("Missing sender_name")
        recipient_name = form.get('recipient_name', None)
        if not recipient_name:
            raise ExpectedException("Missing recipient_name")
        payload = form.get('payload', 'null')
        send_hook = form.get('send_hook', '0') == '1'
        
        self.api.message(sender_name, recipient_name, payload, send_hook)
        start_response('200 Ok', [])
        return json.dumps([True, {}])

    def render_set_user_options(self, form, start_response):
        user_name = form.pop('user_name', None)
        if not user_name:
            raise ExpectedException("Missing user_name")
        for key, val in form.items():
            try:
                form[key] = json.loads(val)
            except:
                raise ExpectedException("Invalid json value for option %s" % (key,))
        self.api.set_user_options(user_name, form)
        start_response('200 Ok', [])
        return json.dumps([True, {}])

    def render_get_user_info(self, form, start_response):
        user_name = form.get('user_name', None)
        if not user_name:
            raise ExpectedException("Missing user_name")
        info = self.api.get_user_info(user_name)
        start_response('200 Ok', [])
        return json.dumps([True, info])

    def render_disconnect(self, form, start_response):
        identifier = form.get('identifier', None)
        self.api.disconnect(identifier)
        start_response('200 Ok', [])
        return json.dumps([True, {}])

    def render_destroy_channel(self, form, start_response):
        channel_name = form.get('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        send_hook = form.get('send_hook', '0') == '1'
        self.api.destroy_channel(channel_name, send_hook)

        start_response('200 Ok', [])
        return json.dumps([True, {}])

    def render_create_channel(self, form, start_response):
        channel_name = form.pop('channel_name', None)
        
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        send_hook = form.pop('send_hook', '0') == '1'
        for key, val in form.items():
            try:
                form[key] = json.loads(val)
            except:
                raise ExpectedException("Invalid json value for option %s" % (key,))

        self.api.create_channel(channel_name, form, send_hook)
        start_response('200 Ok', [])
        return json.dumps([True, {}])

    def render_set_channel_options(self, form, start_response):
        channel_name = form.pop('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        for key, val in form.items():
            try:
                form[key] = json.loads(val)
            except:
                raise ExpectedException("Invalid json value for option %s" % (key,))
        self.api.set_channel_options(channel_name, form)
        start_response('200 Ok', [])
        return json.dumps([True, {}])
        
    def render_get_channel_info(self, form, start_response):
        channel_name = form.get('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        info = self.api.get_channel_info(channel_name)
        start_response('200 Ok', [])
        return json.dumps([True, info])

        
    def render_state_set_key(self, form, start_response):
        channel_name = form.pop('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        if 'key' not in form:
            raise ExpectedExcpetion("Missing 'key' argument")
        if 'val' not in form:
            raise ExpectedException("Missing 'val' argument")
        try:
            val = json.loads(form['val'])
        except:
            raise ExpectedException('Invalid json: "%s"' % (val,))
        self.api.state_set_key(channel_name, form['key'], val)
        start_response('200 Ok', [])
        return json.dumps([True, {}])
        
    def render_state_delete_key(self, form, start_response):
        channel_name = form.pop('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        if 'key' not in form:
            raise ExpectedExcpetion("Missing 'key' argument")
        self.api.state_delete_key(channel_name, key)
        start_response('200 Ok', [])
        return json.dumps([True, {}])

    def render_set_config(self, form, start_response):
        
        for key in form:
            try:
                form[key] = json.loads(form[key])
            except:
                raise ExpectedException("Invalid json value for form key '%s'" % (key,))
        self.api.set_config(form)
        start_response('200 Ok', [])
        return json.dumps([True, {}])
        
def get_form(environ):
    form = {}
    if environ['REQUEST_METHOD'].upper() == 'POST':
        qs = environ['wsgi.input'].read()
    else:
        qs = environ['QUERY_STRING']
    for key, val in cgi.parse_qs(qs).items():
        form[key] = val[0]
    return form
