#!/usr/bin/python
""" producer.py
Produces random data samples for the EQ sliders.
Uses the Hookbox REST api for publishing the data 
on channel "chan1".
"""

import time, urllib, urllib2, json, random

def main ():

    # assume the hookbox server is on localhost:2974    
    url = "http://127.0.0.1:2974/rest/publish"

    values = { "secret" : "altoids",
               "channel_name" : "chan1",
               "payload" : []
             }

    # data samples from 0 - 99 inclusive
    pop = range(0,100)

    while True:
        # generate seven random data points every 0.5 seconds
        # and publish them via the HTTP/REST api.
        values["payload"] = random.sample(pop, 7)
        data = urllib.urlencode(values)
        req = urllib2.Request(url, data)
        resp = urllib2.urlopen(req)
        # the hookbox response can be useful for debugging,
        # but i'm commenting it out.
        #page = resp.read()
        #print page
        print values["payload"]
        time.sleep(0.5)
                


if __name__ == "__main__":
    main()
