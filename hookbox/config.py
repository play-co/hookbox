from optparse import OptionParser

class NoDefault(object):
    
    def __nonzero__(self): 
        return False

class DefaultObject(object):
    pass

class HookboxOptionParser(object):
    
    def __init__(self, defaults):
        parser = OptionParser()
        self._add_csp_options(parser, defaults)
        self._add_callback_interface_options(parser, defaults)
        self._add_callback_path_options(parser, defaults)        
        self._add_admin_options(parser, defaults)
        self._parser = parser
    
    def parse_arguments(self, arguments):
        options, args = self._parser.parse_args(arguments)
        option_dict = dict((attr, getattr(options, attr))
                           for attr in dir(options)
                           if self._is_hookbox_attr(attr))
        return (option_dict, args)
    
    def _is_hookbox_attr(self, attr):
        return (not attr.startswith('_')) and \
            (attr not in ('ensure_value', 'read_file', 'read_module'))
    
    def _add_csp_options(self, parser, defaults):
        """ add options specific to the CSP interface """
        parser.add_option("-i", "--interface", 
                          dest="interface", type="string", 
                          default=defaults._interface, metavar="IFACE",
                          help="bind listening socket to IFACE, (default: %default)")
        parser.add_option("-p", "--port", 
                          dest="port", type="int",
                          default=defaults._port, metavar="PORT",
                          help="bind listening socket to PORT, (default: %default)")
    
    def _add_callback_interface_options(self, parser, defaults):
        """ add options related to the hookbox callbacks """
        parser.add_option("--cbport", 
                          dest="cbport", type="int", 
                          default=defaults._cbport, metavar="PORT",
                          help="Make http callbacks to PORT, (default: %default)")
        parser.add_option("--cbhost", 
                          dest="cbhost", type="string", 
                          default=defaults._cbhost, metavar="HOST",
                          help="Make http callbacks to HOST, (default: %default)")
        parser.add_option("--cbpath", 
                          dest="cbpath", type="string", 
                          default=defaults._cbpath, metavar="PATH",
                          help="Make http callbacks to base PATH, (default: %default)")
        parser.add_option("-c", "--cookie-identifier", 
                          dest="cookie_identifier", type="string",
                          metavar="COOKIE_IDENTIFIER",
                          help="The name of the cookie field used to identify unique sessions.")
        parser.add_option("-s", "--secret", 
                          dest="secret", type="string",
                          metavar="SECRET",
                          help="The SECRET token to pass to all webhook callbacks as form variable \"secret\".")
    
    def _add_callback_path_options(self, parser, defaults):
        parser.add_option('--cb-connect', 
                          dest='cb_connect', type='string', 
                          default=defaults._cb_connect,
                          help='relative path for connect webhook callbacks. (default: %default)')
        parser.add_option('--cb-disconnect', 
                          dest='cb_disconnect', type='string', 
                          default=defaults._cb_disconnect,
                          help='relative path for disconnect webhook callbacks. (default: %default)')
        parser.add_option('--cb-create_channel', 
                          dest='cb_create_channel', type='string', 
                          default=defaults._cb_create_channel,
                          help='name for create_channel webhook callbacks. (default: %default)')
        parser.add_option('--cb-destroy_channel', 
                          dest='cb_destroy_channel', type='string', 
                          default=defaults._cb_destroy_channel,
                          help='name for destroy_channel webhook callbacks. (default: %default)')
        parser.add_option('--cb-subscribe', 
                          dest='cb_subscribe', type='string', 
                          default=defaults._cb_subscribe,
                          help='name for subscribe webhook callbacks. (default: %default)')
        parser.add_option('--cb-unsubscribe', 
                          dest='cb_unsubscribe', type='string', 
                          default=defaults._cb_unsubscribe,
                          help='relative path for unsubscribe webhook callbacks. (default: %default)')
        parser.add_option('--cb-publish', 
                          dest='cb_publish', type='string', 
                          default=defaults._cb_publish,
                          help='relative path for publish webhook callbacks. (default: %default)')
        parser.add_option("--cb-single-url",
                          dest='cb_single_url', type='string', 
                          default=defaults._cb_single_url,
                          help='Override to send all callbacks to given absolute url.')
        
    def _add_admin_options(self, parser, defaults):
        parser.add_option("-r", "--rest-secret", 
                          dest="rest_secret", type="string", 
                          default=defaults._rest_secret, metavar="SECRET",
                          help="The SECRET token that must be in present in all rest api calls as the form variable \"secret\".")
        parser.add_option("-a", "--admin-password", 
                          dest="admin_password", type="string", 
                          default=defaults._admin_password,
                          help='password used for admin web access.')
        parser.add_option("-d", "--debug", 
                          dest="debug", action="store_true", 
                          default=defaults._debug,
                          help="Run in debug mode (recompiles hookbox.js whenever the source changes)")
        parser.add_option("-o", "--objgraph", 
                          dest="objgraph", type="int",
                          default=defaults._objgraph,
                          help="turn on objgraph")

class HookboxConfig(object):
    """ The hookbox config holds server configuration data
    """
    
    # define the defaults here
    defaults = DefaultObject()
    defaults._interface = '0.0.0.0'
    defaults._port = 8001
    defaults._cbport = 80
    defaults._cbhost = '127.0.0.1'
    defaults._cbpath = '/hookbox'
    defaults._cookie_identifier = NoDefault()
    defaults._secret = NoDefault()
    defaults._cb_connect = 'connect'
    defaults._cb_disconnect = 'disconnect'
    defaults._cb_create_channel = 'create_channel'
    defaults._cb_destroy_channel = 'destroy_channel'
    defaults._cb_subscribe = 'subscribe'
    defaults._cb_unsubscribe = 'unsubscribe'
    defaults._cb_publish = 'publish'
    defaults._cb_single_url = NoDefault()
    defaults._rest_secret = NoDefault()
    defaults._admin_password = NoDefault()
    defaults._debug = False
    defaults._objgraph = 0
    
    def __init__(self):
        config_items = [attr for attr in dir(self.defaults) 
                        if not attr.startswith('__')]
        for config_item in config_items:
            setattr(self, config_item[1:], 
                    getattr(self.defaults, config_item))
    
    def update_from_commandline_arguments(self, args):
        parser = HookboxOptionParser(self.defaults)
        options, arguments = parser.parse_arguments(args)
        for attr in options:
            setattr(self, attr, options[attr])
    
    get = __getitem__ = lambda self, attr: getattr(self, attr)
