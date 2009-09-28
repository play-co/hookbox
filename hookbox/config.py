from optparse import OptionParser
config = {}

parser = OptionParser()

parser.add_option("-i", "--interface", dest="interface", type="string", default="",
                  help="bind listening socket to IFACE, (default: %default)", metavar="IFACE")
parser.add_option("-p", "--port", dest="port", default=8001, type="int",
    help="bind listening socket to PORT, (default: %default)", metavar="PORT")
parser.add_option("-P", "--cbport", dest="cbport", default=80, type="int",
    help="Make http callbacks to PORT, (default: %default)", metavar="PORT")
parser.add_option("-H", "--cbhost", dest="cbhost", default="localhost", type="string",
    help="Make http callbacks to PORT, (default: %default)", metavar="PORT")
parser.add_option("-B", "--cbpath", dest="cbpath", default="/hookbox", type="string",
    help="Make http callbacks to base PATH, (default: %default)", metavar="PATH")
    
parser.add_option("-d", "--debug", dest="debug", action="store_true", default=False,
    help="Run in debug mode (recompiles hookbox.js whenever the source changes)")
(options, args) = parser.parse_args()
for key in dir(options):
    if not key.startswith('_') and key not in ('ensure_value', 'read_file', 'read_module'):
        config[key] = getattr(options, key)
