==============
Javascript API
==============

The Hookbox javascript api is contained completely in the hookbox.js file that comes with the Hookbox daemon. The file is served by hookbox at http://HOOKBOX_HOST:HOOKBOX_PORT/static/hookbox.js, but you may serve the file from any location and it will still work.

Connecting
==========

To connect to hookbox you need to provide the url of the hookbox server, with a "/csp" as the path. For example, if hookbox server is running on host "localhost" and port 8001, (the default) then the to connect:

.. sourcecode:: javascript

    var conn = hookbox.connect('http://localhost:8001/csp')

Once the connection has been successfully established, the ``onopen`` callback will be called. You can attach your own callback to catch:

.. sourcecode:: javascript

    conn.onOpen = function() { alert("connection established!"); }

If there was an error when connecting the ``onError`` callback will be invoked:

.. sourcecode:: javascript

    conn.onError = function(err) { alert("connection failed: " + err.msg); }



Subscribing to Channels
=======================

As soon as you have a connection object after calling hookbox.connect, you are free to make calls to conn.subscribe, even before the connection is established. These calls will be buffered until after the onOpen event is fired.

To subscribe to a channel use the conn.subscribe function:

.. sourcecode:: javascript

    conn.subscribe("my_channel_name");

There is no returned object when calling conn.subscribe; rather, a subscription object is passed to you through the onSubscribe callback once the subscription is successful.

.. sourcecode:: javascript

    var subscription = null;
    conn.onSubscribe = function(channelName, _subscription) {
      subscription = _subscription;
    }

Its important to understand that the ``onSubscribe`` callback can be called even if you've never made a call to subscribe. This might be because the web application decided to ``auto_subscribe`` you to some channel, or it could be because the user is already logged in and subscribed to multiple channels, though in a different browser window or tab. If the subscribe call is made successfully in another tab, then this tab's Hookbox connection object will also issue an ``onSubscribe`` callback.

Interacting with Channels
=========================

Once you have a subsription object, you are able to inspect the channel's attributes, publish to the channel, and receive publishes from other subscribers in the channel.

Channel Attributes
------------------

If the channel is set to have ``history_size`` > 0, then you will have access to history information for that channel:

.. sourcecode:: javascript

    >>> subscription.history
    [["PUBLISH", Object { user="mcarter", payload="greetings!"}], ["SUBSCRIBE", Object { user="mcarter" } ] ... ]

All attributes are read only. The complete list:
		
 * ``historySize``: the length of the history for the channel.
 * ``history``: a list of the last N elements where N is the ``history_size`` attribute of the channel 
 * ``state``: arbitrary (json) data set on the channel by the web application. This attribute updates automatically when the web application changes it, and an onState callback is issued on the subscription.
 * ``presenceful``: boolean that signifies rather this channel relays presence information
 * ``presence``: a list of users subscribed to the channel. This is always empty if ``presenceful`` is false.
 * ``reflective``: boolean signifying if this channel reflects publish frames back to the connection that orignated them.
 
Presence Information
--------------------

Note in the above example that one of the frames in the history is ``SUBSCRIBE``. The channel will only relay subscribe and unsubscribe frames to the browser if ``presenceful`` = true is set on the channel by the web application. If it is set, then the subscription object will provide access to a list of users currently subscribed to this channel:

    >>> subscription.presence
    [ "mgh", "mcarter", "desmaj" ]

Whenever a user subscribes or unsubscribes from the channel you will receive an ``onSubscribe`` or ``onUnsubscribe`` callback from the subscription, and the presence attribute will be updated.

.. sourcecode:: javascript

    subscription.onSubscribe = function(frame) {
      // the user is now in our presence list
      assertTrue(subscription.presence.indexOf(frame.user) != -1);
      alert("user: " + frame.user + " has subscribed!");
    }

    subscription.onUnsubscribe = function(frame) {
      // the user is no longer in our presence list
      assertTrue(subscription.presence.indexOf(frame.user) == -1);
      alert("user: " + frame.user + " has unsubscribed!");
    }

Publishing
----------

Perhaps the most important part of interacting with channels is publishing data receiving published data. You may publish data by calling the ``subscription.publish`` method:

.. sourcecode:: javascript

    subscription.publish(42);
    subscription.publish({foo: "bar"});
    subscription.publish(null);
    subscription.publish([1,2,3, {a: [4,5,6] });

As you can see, any native javascript object that can be transported as ``JSON`` is legal.

Whenever data is published to the channel, the onPublish callback on the subscription will be called. If the ``reflective`` attribute is set on the channel by the web application, then your own calls to publish will cause an onPublish callback as well.

.. sourcecode:: javascript

    subscription.onPublish = function(frame) {
      alert(frame.user + " said: " + frame.payload);
    }

Remember, frame.payload can be any javascript object that can be represented  as ``JSON``.

State
-----

It sometimes makes sense for the web application to stash some additional state information on the channel either by setting it in a webhook callback response, or using the rest api. In javascript, the subscription object maintains the ``state`` attribute and issues onState callbacks whenever this attribute is modified. The state cannot be modified by the client; it is unidirectional only. The ``state`` attribute is always a valid json object {}.

.. sourcecode:: javascript

    subscription.onState = function(frame) {
        var updates = frame.updates; // object with the new keys/values and 
                                     // modified keys/values

        var deletes = frame.deletes; // list containing all deleted keys.

        // No need to compute the state from the updates and deletes, its done
        // for you and stored on subscription.state
        alert('the name state is: ' + JSON.stringify(subscription.state));
    }
	
	