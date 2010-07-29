#!/usr/bin/python

import os
from quixote.directory import Directory
from quixote.publish import Publisher
from quixote.util import StaticFile
from quixote.server.simple_server import run

import json

class Root (Directory):
    """ This is the application root.
    """
    _q_exports = ['', 'connect', 'disconnect', 'create_channel', 'subscribe', 'unsubscribe', 'publish']
    
    def _q_index (self):
        # serve the index.html at /
        p = os.path.join(os.getcwd(), 'index.html')
        index = StaticFile(path=p, mime_type="text/html")
        return index()

    def connect (self):
        # accept all connect requests and assume they are from 'guest'
        return json.dumps([ True, {"name":"guest"} ])
    
    def disconnect (self):
        return [ True, {} ]

    def create_channel (self):
        # accept all create channel requests. in this example,
        # only one channel is ever created: 'chan1'
        return json.dumps([ True, { "history_size" : 0, 
                                    "reflective" : True, 
                                    "presenceful" : True } ])

    def subscribe (self):
        return json.dumps([ True, {} ])

    def unsubscribe (self):
        return json.dumps([ True, {} ])

    def publish (self):
        return json.dumps([ True, {} ])


def create_publisher():
    return Publisher(Root(), display_exceptions='plain')

def main ():
    # create an http server bound to the host and port specified
    # and publish the Root instance.
    run(create_publisher, host="127.0.0.1", port=8080)

if __name__ == '__main__':
    main()

