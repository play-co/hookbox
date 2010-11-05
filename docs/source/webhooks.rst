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
* ``recipient_exists``: True if the recipient name is that of a connected user, false otherwise.
* ``payload``: The json payload to send to the receiving user.

Webhook post includes sender cookies.

Returns json:

.. sourcecode:: javascript

    [ success (boolean) , details (object) ]


Optional Webhook return details:

* ``override_payload``: A new payload that will be sent instead of the original payload.
* ``override_recipient_name``: The name of a user to send the message to instead of the original reciepient.


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



