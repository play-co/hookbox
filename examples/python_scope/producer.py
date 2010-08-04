#!/usr/bin/python
""" producer.py
Produces random data samples for the EQ sliders.
Uses the Hookbox REST api for publishing the data 
on channel "chan1".

--- License: MIT ---

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

import time, urllib, urllib2, json, random
import math

def main ():

    # assume the hookbox server is on localhost:2974    
    url = "http://127.0.0.1:2974/rest/publish"

    values = { "secret" : "altoids",
               "channel_name" : "chan1",
               "payload" : []
             }

    pub_count = 0
    pub_delta = 1/750.0 
    samp_delta = pub_delta / (48000.0/750.0)
    num_samples = int(pub_delta / samp_delta)
    samples = [math.sin(750*(i*samp_delta)) for i in range(0, 48000)] # a second's worth of samples

    while True:
        x = int((pub_count % 750) * num_samples)
        tv = [(pub_count*pub_delta)+(i*samp_delta) for i in range(0,num_samples)]

        payload = zip(tv, samples[x:x+num_samples])
        payload = map(list, payload)
    
        values["payload"] = payload
        data = urllib.urlencode(values)
        req = urllib2.Request(url, data)
        resp = urllib2.urlopen(req)
        pub_count += 1
        time.sleep(pub_delta)
                


if __name__ == "__main__":
    main()
