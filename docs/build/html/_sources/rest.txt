==============
Rest Interface
==============

channel_info
============

Returns all settings and attributes of a channel.

Form Variables:

* ``secret``: The password specified in the config as ``-r`` or ``--rest-secret``.
* ``channel_name``: The target channel.

Returns json:

[ success (boolean) , details (object) ]

Example:

Client Requests URL:
    
.. sourcecode:: none

    /rest/channel_info?secret=yo&channel_name=testing


Server Replies:
    
.. sourcecode:: javascript
    
    [
        true, 
        {
            "name": "testing", 
            "options": {
                "anonymous": false, 
                "history": [
                    [
                        "SUBSCRIBE", 
                        {
                            "user": "mcarter"
                        }
                    ], 
                    [
                        "PUBLISH", 
                        {
                            "payload": "good day", 
                            "user": "mcarter"
                        }
                    ], 
                    [
                        "PUBLISH", 
                        {
                            "payload": "was gibt es?", 
                            "user": "mcarter"
                        }
                    ]
                ], 
                "history_size": 5, 
                "moderated": false, 
                "moderated_publish": true, 
                "moderated_subscribe": true, 
                "moderated_unsubscribe": true, 
                "polling": {
                    "form": {}, 
                    "interval": 5, 
                    "mode": "", 
                    "originator": "", 
                    "url": ""
                }, 
                "presenceful": true, 
                "reflective": true
            }, 
            "subscribers": [
                "mcarter"
            ]
        }
    ]

set_channel_info
================

publish
=======

destroy_channel
===============

