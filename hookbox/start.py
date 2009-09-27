from eventlet import wsgi, api
from server import HookboxServer
import logging

def main():
    from config import config
    logging.basicConfig()
    server = HookboxServer(config['interface'], config['port'])
    server.run()        
    while True:
        try:
            api.sleep(10)
        except KeyboardInterrupt:
            print "Ctr+C pressed; Exiting."
            break

if __name__ == "__main__":
    main()