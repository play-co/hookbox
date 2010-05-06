==============
Rest Interface
==============

publish
=======

Publish a message to a channel.

Required Form Variables:

* ``secret``: The password specified in the config as ``-r`` or ``--rest-secret``.
* ``channel_name``: The target channel.
* ``payload``: The json payload to publish

Optional Form Variables:
    
* ``originator``: The name of the user who will appear to do the publish

Returns json:

.. sourcecode:: javascript

    [ success (boolean) , details (object) ]


Example:

Client Requests URL:
    
.. sourcecode:: none

    /rest/publish?secret=yo&channel_name=testing&payload=[1, 2, "foo"]&originator=dictator


Server Replies:
    
.. sourcecode:: javascript
    
    [ true, {} ]

And the following frame is published to channel 'testing':

.. sourcecode:: javascript

    { "user": dictator, "payload": [1, 2, "foo"] }



subscribe
=========

Add a user to a channel.

Required Form Variables:

* ``secret``: The password specified in the config as ``-r`` or ``--rest-secret``.
* ``channel_name``: The target channel.
* ``name``: The name of the target user.

Returns json:

.. sourcecode:: javascript

    [ success (boolean) , details (object) ]


Example:

Client Requests URL:
    
.. sourcecode:: none

    /rest/subscribe?secret=yo&channel_name=testing&user=mcarter


Server Replies:
    
.. sourcecode:: javascript
    
    [ true, {} ]

And the user "mcarter" is subscribed to the channel "testing".

unsubscribe
===========

Remove a user from a channel.

Required Form Variables:

* ``secret``: The password specified in the config as ``-r`` or ``--rest-secret``.
* ``channel_name``: The target channel.
* ``name``: The name of the target user.

Returns json:

.. sourcecode:: javascript

    [ success (boolean) , details (object) ]


Example:

Client Requests URL:
    
.. sourcecode:: none

    /rest/unsubscribe?secret=yo&channel_name=testing&user=mcarter


Server Replies:
    
.. sourcecode:: javascript
    
    [ true, {} ]

And the user "mcarter" is unsubscribed from the channel "testing".


get_channel_info
================

Returns all settings and attributes of a channel.

Required Form Variables:

* ``secret``: The password specified in the config as ``-r`` or ``--rest-secret``.
* ``channel_name``: The target channel.

Returns json:

[ success (boolean) , details (object) ]

Example:

Client Requests URL:
    
.. sourcecode:: none

    /rest/get_channel_info?secret=yo&channel_name=testing


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

set_channel_options
===================

Set the options on a channel. 

Required Form Variables:

* ``secret``: The password specified in the config as ``-r`` or ``--rest-secret``.
* ``channel_name``: The target channel.

Optional Form Variables:

* ``anonymous``: json boolean
* ``history``: json list in the proper history format
* ``history_size``: json integer
* ``moderated``: json boolean
* ``moderated_publish``: json boolean
* ``moderated_subscribe``: json boolean
* ``moderated_unsubscribe``: json boolean
* ``polling``: json object in the proper polling format
* ``presenceful``: json boolean
* ``reflective``: json boolean

Example:
    
Client Requests URL:
    
.. sourcecode:: none

    /rest/set_channel_options?secret=yo&channel_name=testing&history_size=2&presenceful=true


Server Replies:
    
.. sourcecode:: javascript
    
    [ true, {} ]

The ``history_size`` of the channel is now `2`, and ``presenceful`` is `false`.

create_channel
==============

TODO

destroy_channel
===============

TODO
