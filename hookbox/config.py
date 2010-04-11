from optparse import OptionParser
config = {}

parser = OptionParser()

parser.add_option("-i", "--interface", dest="interface", type="string", default="",
                  help="bind listening socket to IFACE, (default: %default)", metavar="IFACE")
parser.add_option("-p", "--port", dest="port", default=8001, type="int",
    help="bind listening socket to PORT, (default: %default)", metavar="PORT")
parser.add_option("--cbport", dest="cbport", default=80, type="int",
    help="Make http callbacks to PORT, (default: %default)", metavar="PORT")
parser.add_option("--cbhost", dest="cbhost", default="localhost", type="string",
    help="Make http callbacks to HOST, (default: %default)", metavar="HOST")
parser.add_option("--cbpath", dest="cbpath", default="/hookbox", type="string",
    help="Make http callbacks to base PATH, (default: %default)", metavar="PATH")
parser.add_option("-c", "--cookie-identifier", dest="cookie_identifier", type="string",
    help="The name of the cookie field used to identify unique sessions.", metavar="COOKIE_IDENTIFIER")
parser.add_option("-s", "--secret", dest="secret", type="string",
    help="The SECRET token to pass to all webhook callbacks as form variable \"secret\".", metavar="SECRET")

parser.add_option('--cb-connect', dest='cb_connect', type='string', default='connect',
    help='relative path for connect webhook callbacks. (default: %default)')
parser.add_option('--cb-disconnect', dest='cb_disconnect', type='string', default='disconnect',
    help='relative path for disconnect webhook callbacks. (default: %default)')
parser.add_option('--cb-create_channel', dest='cb_create_channel', type='string', default='create_channel',
    help='name for create_channel webhook callbacks. (default: %default)')
parser.add_option('--cb-subscribe', dest='cb_subscribe', type='string', default='subscribe',
    help='name for subscribe webhook callbacks. (default: %default)')
parser.add_option('--cb-unsubscribe', dest='cb_unsubscribe', type='string', default='unsubscribe',
    help='relative path for unsubscribe webhook callbacks. (default: %default)')
parser.add_option('--cb-publish', dest='cb_publish', type='string', default='publish',
    help='relative path for publish webhook callbacks. (default: %default)')

parser.add_option("-d", "--debug", dest="debug", action="store_true", default=False,
    help="Run in debug mode (recompiles hookbox.js whenever the source changes)")
parser.add_option("-o", "--objgraph", dest="objgraph", type="int", default=0,
    help="turn on objgraph")
    
    
    
(options, args) = parser.parse_args()
for key in dir(options):
    if not key.startswith('_') and key not in ('ensure_value', 'read_file', 'read_module'):
        config[key] = getattr(options, key)
