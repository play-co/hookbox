.. _webhooks_toplevel:

==================
Webhooks
==================

message
=======

Send a private message to a user.

Webhook Form Variables:

* ``sender``: The user name of the sending user.
* ``recipient``: The user name of the receiving user.
* ``payload``: The json payload to send to the

Webhook post includes sender cookies.

Returns json:

.. sourcecode:: javascript

    [ success (boolean) , details (object) ]


Optional Webhook return details:

* ``override_payload``: A new payload that will be send instead of the original payload.


Example:

Client Calls:

.. sourcecode:: javascript

    connection.message("mcarter", { title: "a message", body: "some text" });


Webhook Called With:

.. sourcecode:: javascript

    { sender: "some_user", recipient: "mcarter", payload: { title: "a message", body: "some text" } }


Webhook replies:

.. sourcecode:: javascript

    [ true, { override_payload: { title: "a new title", body: "some text" } } ]


And the following frame is published to the user 'mcarter':

.. sourcecode:: javascript

    { sender: "some_user", recipient: "mcarter", "payload": { title: "a new title", body: "some text" } }



