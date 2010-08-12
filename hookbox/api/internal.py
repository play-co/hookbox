from hookbox.errors import ExpectedException
import logging
class HookboxAPI(object):
    
    logger = logging.getLogger('HookboxAPI')
    def __init__(self, server, config):
        self.config = config
        self.server = server
        self.user = None # hack to make channel implementation simpler

    def is_enabled(self):
        return bool(self.config['api_security_token'])

    def authorize(self, secret):
        if secret != self.config['api_security_token']:
            raise ExpectedException("Invalid Security Token")

    def publish(self, channel_name, payload='null', originator=None, send_hook=False):
        channel = self.server.get_channel(None, channel_name)
        channel.publish(self, payload, needs_auth=send_hook, originator=originator)

    def unsubscribe(self, channel_name, name, send_hook=False):
        if not self.server.exists_channel(channel_name):
            raise ExpectedException("Channel %s doesn't exist" % (channel_name,))
        if not self.server.exists_user(name):
            raise ExpectedException("User %s doesn't exist" % (name,))
        channel = self.server.get_channel(None, channel_name)
        user = self.server.get_user(name)
        channel.unsubscribe(user, needs_auth=send_hook)
    
    def subscribe(self, channel_name, name, send_hook=False):
        if not self.server.exists_user(name):
            raise ExpectedException("User %s doesn't exist" % (name,))
        channel = self.server.get_channel(None, channel_name)
        user = self.server.get_user(name)
        channel.subscribe(user, needs_auth=send_hook)


    def disconnect_user(self, name):
        raise ExpectedException("Not Implemented")
        if not self.server.exists_user(name):
            raise ExpectedException("User %s doesn't exist" % (name,))
        user = self.server.get_user(name)
        # TODO: disconnect the user
        
    def disconnect(self, identifier):
        raise ExpectedException("Not Implemented")
        # TODO: find the connection by identifier and disconnect it
        
    def destroy_channel(self, channel_name, send_hook=False):
        # NOTE: "already exists" errors will be raised as necessary by this method call
        self.server.destroy_channel(channel_name, needs_auth=send_hook)
        
    def create_channel(self, channel_name, options, send_hook=False):
        if self.server.exists_channel(channel_name):
            raise ExpectedException("Channel %s alread exists" % (channel_name,))
        self.server.create_channel(None, channel_name, options, needs_auth=send_hook)


    def set_channel_options(self, channel_name, options):
        if not self.server.exists_channel(channel_name):
            raise ExpectedException("Channel %s doesn't exists" % (channel_name,))
        channel = self.server.get_channel(None, channel_name)
        channel.update_options(**options)
    
    def get_channel_info(self, channel_name):
        if not self.server.exists_channel(channel_name):
            raise ExpectedException("Channel %s doesn't exists" % (channel_name,))
        channel = self.server.get_channel(None, channel_name)
        return channel.serialize()
        

    def state_set_key(self, channel_name, key, val):
        if not self.server.exists_channel(channel_name):
            raise ExpectedException("Channel %s doesn't exists" % (channel_name,))
        channel = self.server.get_channel(None, channel_name)
        channel.state_set(key, val)

    def state_delete_key(self, channel_name, key):
        if not self.server.exists_channel(channel_name):
            raise ExpectedException("Channel %s doesn't exists" % (channel_name,))
        channel = self.server.get_channel(None, channel_name)
        channel.state_del(key)
        
        
    _config_vars = [
        "cbhost",
        "cbport",
        "cbpath",
        "cb_connect",
        "cb_disconnect",
        "cb_create_channel",
        "cb_destroy_channel",
        "cb_subscribe",
        "cb_unsubscribe",
        "cb_publish",
        "cb_single_url",
        "admin_password",
        "webhook_secret",
        "api_security_token",
    ]

    def set_config(self, options):
        for key, val in options:
            if option in self._config_vars:
                self.server.config[key] = val
        