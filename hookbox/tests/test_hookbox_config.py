from hookbox.config import HookboxConfig
from hookbox.config import HookboxOptionParser
from hookbox.config import NoDefault

class TestHookboxOptionParser(object):
    
    def setup(self):
        self.parser = HookboxOptionParser(HookboxConfig.defaults)
    
    def test_create_parser_smoketest(self):
        HookboxOptionParser(HookboxConfig.defaults)
    
    def test_update_from_commandline_arguments__interface(self):
        args = ['--interface', 'beano.com']
        options, args = self.parser.parse_arguments(args)
        assert 'beano.com' == options['interface']
    
class TestHookboxConfig(object):
    
    def test_create_config_smoketest(self):
        HookboxConfig()
    
    def _assert_default(self, config, attr, expected):
        actual = getattr(config, attr)
        assert expected == actual, \
            (expected, actual)
    
    def test_defaults(self):
        default_config = HookboxConfig()
        expected_defaults = [('interface', '127.0.0.1'),
                             ('port', 8001),
                             ('cbport', 80),
                             ('cbhost', '127.0.0.1'),
                             ('cbpath', '/hookbox'),
                             ('cookie_identifier', NoDefault),
                             ('secret', NoDefault),
                             ('cb_connect', 'connect'),
                             ('cb_disconnect', 'disconnect'),
                             ('cb_create_channel', 'create_channel'),
                             ('cb_destroy_channel', 'destroy_channel'),
                             ('cb_subscribe', 'subscribe'),
                             ('cb_unsubscribe', 'unsubscribe'),
                             ('cb_publish', 'publish'),
                             ('rest_secret', NoDefault),
                             ('admin_password', NoDefault),
                             ('debug', False),
                             ('objgraph', 0),
                             ]
        for attr, default in expected_defaults:
            yield '_assert_default', default_config, attr, default
    
    def test_update_from_commandline_arguments(self):
        args = ['--interface', 'beano.com']
        config = HookboxConfig()
        config.update_from_commandline_arguments(args)
        assert 'beano.com' == config.interface
    
    def test_update_from_commandline_arguments_with_defaults(self):
        args = ['--interface', 'beano.com']
        config = HookboxConfig()
        config.update_from_commandline_arguments(args)
        assert 8001 == config.port
    
    def test_config_acts_like_a_dict(self):
        config = HookboxConfig()
        assert '127.0.0.1' == config['interface']
