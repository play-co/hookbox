#!/usr/bin/python
"""
-- License: MIT ---

 Copyright (c) 2010 Hookbox

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

"""
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

