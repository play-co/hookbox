import eventlet
from server import HookboxServer
import logging
import os

def create_server(config):
    server = HookboxServer(config['interface'], config['port'])
    return server

def main():
    from config import config
    logging.basicConfig()
    server = create_server(config)
    server.run()
    
    if config['debug']:
        debugloop()
    else:
        mainloop()
        
        
def debugloop():
    from pyjsiocompile.compile import main as pyjsiocompile
    files = {
    }
    for f in [ 'hookbox.pkg', 'hookbox.js']:
        files[f] = os.stat(os.path.join(os.path.dirname(__file__), 'js_src', f))[7]
            
    while True:
        try:
            eventlet.sleep(0.1)
            recompile = False
            for f in [ 'hookbox.pkg', 'hookbox.js']:
                modified = os.stat(os.path.join(os.path.dirname(__file__), 'js_src', f))[7]
                if files[f] != modified:
                    files[f] = modified
                    recompile = True
            if recompile:
                src = os.path.join(os.path.dirname(__file__), 'js_src', 'hookbox.pkg')
                out = os.path.join(os.path.dirname(__file__), 'static', 'hookbox.js')
                pyjsiocompile([src, '--output', out])
            
        except KeyboardInterrupt:
            print "Ctr+C pressed; Exiting."
            break                
                
def mainloop():
    while True:
        try:
            eventlet.sleep(10)
        except KeyboardInterrupt:
            print "Ctr+C pressed; Exiting."
            break
  
if __name__ == "__main__":
    main()