.. _web_toplevel:

==================
Web/HTTP Interface
==================

publish
=======

Publish a message to a channel.

Required Form Variables:

* ``security_token``: The password specified in the config as ``-r`` or ``--api-security-token``.
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

    /web/publish?security_token=yo&channel_name=testing&payload=[1, 2, "foo"]&originator=dictator


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

* ``security_token``: The password specified in the config as ``-r`` or ``--api-security-token``.
* ``channel_name``: The target channel.
* ``name``: The name of the target user.

Returns json:

.. sourcecode:: javascript

    [ success (boolean) , details (object) ]


Example:

Client Requests URL:
    
.. sourcecode:: none

    /web/subscribe?security_token=yo&channel_name=testing&user=mcarter


Server Replies:
    
.. sourcecode:: javascript
    
    [ true, {} ]

And the user "mcarter" is subscribed to the channel "testing".

unsubscribe
===========

Remove a user from a channel.

Required Form Variables:

* ``security_token``: The password specified in the config as ``-r`` or ``--api-security-token``.
* ``channel_name``: The target channel.
* ``name``: The name of the target user.

Returns json:

.. sourcecode:: javascript

    [ success (boolean) , details (object) ]


Example:

Client Requests URL:
    
.. sourcecode:: none

    /web/unsubscribe?security_token=yo&channel_name=testing&user=mcarter


Server Replies:
    
.. sourcecode:: javascript
    
    [ true, {} ]

And the user "mcarter" is unsubscribed from the channel "testing".


get_channel_info
================

Returns all settings and attributes of a channel.

Required Form Variables:

* ``security_token``: The password specified in the config as ``-r`` or ``--api-security-token``.
* ``channel_name``: The target channel.

Returns json:

[ success (boolean) , details (object) ]

Example:

Client Requests URL:
    
.. sourcecode:: none

    /web/get_channel_info?security_token=yo&channel_name=testing


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

* ``security_token``: The password specified in the config as ``-r`` or ``--api-security-token``.
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
* ``state``: json object

Example:
    
Client Requests URL:
    
.. sourcecode:: none

    /web/set_channel_options?security_token=yo&channel_name=testing&history_size=2&presenceful=true


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


state_set_key
=============
Sets a key in a channel's state object. If the key already exists it is replaced, and if not it is created.

Required Form Variables:

* ``security_token``: The password specified in the config as ``-r`` or ``--api-security-token``.
* ``channel_name``: The target channel.

Optional Form Variables:

* ``key``: The target key in the state
* ``val``: any valid json structure; it will be the new value of the given key on the state

Example:
    
Client Requests URL:
    
.. sourcecode:: none

    /web/state_set_key?security_token=yo&channel_name=testing&key=score&val={ "mcarter": 5, "desmaj": 11 }


Server Replies:
    
.. sourcecode:: javascript
    
    [ true, {} ]

The ``state`` of the channel now contains the key "testing" with the value { "mcarter": 5, "desmaj": 11 }. An onState javascript callback will be issued to all subscribers; They will be able to access subscription.state.score.mcarter and will see the value 5.

state_delete_key
================

Removes a key from the state of a channel. If the key doesn't exist then nothing happens.

Required Form Variables:

* ``security_token``: The password specified in the config as ``-r`` or ``--api-security-token``.
* ``channel_name``: The target channel.

Optional Form Variables:

* ``key``: The target key in the state to delete

Example:
    
Client Requests URL:
    
.. sourcecode:: none

    /web/state_delete_key?security_token=yo&channel_name=testing&key=score

	
Server Replies:
    
.. sourcecode:: javascript
    
    [ true, {} ]

	
The ``state`` of the channel no longer contains the key "score". An onState callback will be issued to all subscribers.

set_config
==========

Update certain configuration parameters (mostly webhook related options) immediately without restarting hookbox.

Required Form variables:
    
* ``security_token``: The password specified in the config as ``-r`` or ``--api-security-token``.

Optional Form Variables:

* ``cbhost``: json string
* ``cbport``: json integer
* ``cbpath``: json string
* ``cb_connect``: json string
* ``cb_disconnect``: json string
* ``cb_create_channel``: json string
* ``cb_destroy_channel``: json string
* ``cb_subscribe``: json string
* ``cb_unsubscribe``: json string
* ``cb_publish``: json string
* ``cb_single_url``: json string
* ``admin_password``: json string
* ``webhook_secret``: json string
* ``api_security_token``: json string

Example:
    
Client Requests URL:
    
.. sourcecode:: none

    /web/state_delete_key?security_token=yo&cbhost="1.2.3.4&cbport=80

  
Server Replies:
    
.. sourcecode:: javascript
    
    [ true, {} ]


The callback host is now set to ``1.2.3.4`` and the port is now ``80``.
