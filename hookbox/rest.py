import cgi
import logging
from errors import ExpectedException
try:
    import json
except:
    import simplejson as json

class HookboxRest(object):
    logger = logging.getLogger('HookboxRest')
    def __init__(self, server, config):
        self.secret = config['rest_secret']
        self.server = server
        self.user = None # hack to make channel implementation simpler
        
    def __call__(self, environ, start_response):
        path = environ['PATH_INFO']
        handler = getattr(self, 'render_' + path[1:], None)
        if not handler:
            start_response('404 Not Found', ())
            return "Not Found"
        if self.secret is None:
            start_response('200 Ok', ())
            return json.dumps([False, { 'msg': "Rest api is disabled by configuration. (Please supply --rest-secret/-r option at start)" }])

        try:
            form = get_form(environ)
            if self.secret != form.pop('secret', None):
                start_response('200 Ok', ())
                return json.dumps([False, { 'msg': "Invalid secret" }])
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
        channel = self.server.get_channel(None, channel_name)
        channel.publish(self, payload, needs_auth=False, originator=originator)
        start_response('200 Ok', [])
        return json.dumps([True, {}])


    def render_unsubscribe(self, form, start_response):
        channel_name = form.get('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        name= form.get('name', None)
        if not name:
            raise ExpectedException("Missing name")
        if not self.server.exists_channel(channel_name):
            raise ExpectedException("Channel %s doesn't exist" % (channel_name,))
        if not self.server.exists_user(name):
            raise ExpectedException("User %s doesn't exist" % (name,))
        channel = self.server.get_channel(None, channel_name)
        user = self.server.get_user(name)
        channel.unsubscribe(user, needs_auth=False)
        start_response('200 Ok', [])
        return json.dumps([True, {}])

    def render_subscribe(self, form, start_response):
        channel_name = form.get('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        name= form.get('name', None)
        if not name:
            raise ExpectedException("Missing name")
        if not self.server.exists_channel(channel_name):
            raise ExpectedException("Channel %s doesn't exist" % (channel_name,))
        if not self.server.exists_user(name):
            raise ExpectedException("User %s doesn't exist" % (name,))
        channel = self.server.get_channel(None, channel_name)
        user = self.server.get_user(name)
        channel.subscribe(user, needs_auth=False)
        start_response('200 Ok', [])
        return json.dumps([True, {}])



    def render_disconnect(self, form, start_response):
        identifier = form.get('identifier', None)
        raise ExpectedException("Not Implemented")

    def render_destroy_channel(self, form, start_response):
        raise ExpectedException("Not Implemented")

    def render_create_channel(self, form, start_response):
        raise ExpectedException("Not Implemented")


    def render_set_channel_options(self, form, start_response):
        channel_name = form.get('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        del form['channel_name']
        if not self.server.exists_channel(channel_name):
            start_response('200 Ok', [])
            return json.dumps([False, {"msg": "Channel %s doesn't exist" % (channel_name,) }])
        channel = self.server.get_channel(None, channel_name)
        for key, val in form.items():
            try:
                form[key] = json.loads(val)
            except:
                raise ExpectedException("Invalid json value for option %s" % (key,))
        channel.update_options(**form)
        start_response('200 Ok', [])
        return json.dumps([True, {}])
        
    def render_get_channel_info(self, form, start_response):
        channel_name = form.get('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        if not self.server.exists_channel(channel_name):
            start_response('200 Ok', [])
            return json.dumps([False, {"msg": "Channel %s doesn't exist" % (channel_name,) }])
        channel = self.server.get_channel(None, channel_name)
        start_response('200 Ok', [])
        return json.dumps([True, channel.serialize()])

        
    def render_state_set_key(self, form, start_response):
        channel_name = form.pop('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        if not self.server.exists_channel(channel_name):
            start_response('200 Ok', [])
            return json.dumps([False, {"msg": "Channel %s doesn't exist" % (channel_name,) }])
        if 'key' not in form:
            raise ExpectedExcpetion("Missing 'key' argument")
        if 'val' not in form:
            raise ExpectedException("Missing 'val' argument")
        try:
            val = json.loads(form['val'])
        except:
            raise ExpectedException('Invalid json: "%s"' % (val,))
            
        channel = self.server.get_channel(None, channel_name)
        channel.state_set(form['key'], val)
        start_response('200 Ok', [])
        return json.dumps([True, {}])
        
    def render_state_delete_key(self, form, start_response):
        channel_name = form.pop('channel_name', None)
        if not channel_name:
            raise ExpectedException("Missing channel_name")
        if not self.server.exists_channel(channel_name):
            start_response('200 Ok', [])
            return json.dumps([False, {"msg": "Channel %s doesn't exist" % (channel_name,) }])
        if 'key' not in form:
            raise ExpectedExcpetion("Missing 'key' argument")
        channel = self.server.get_channel(None, channel_name)
        channel.state_del(form['key'])
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
