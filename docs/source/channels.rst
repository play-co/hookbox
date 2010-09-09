.. _channels_toplevel:

========
Channels
========

Overview
========

Hookbox is built around the concept channels which can be used as an abstraction for routing real-time communication between browers and your web application. These channels have many options, making them suitable for a multitude of basic types of applications. You need to consider the features needed by the real-time portion of your application, and adjust the channel options appropriately. You can read about some :ref:`intro_common_patterns` to find a good starting point for your application.

Ultimately, your web application has complete control over these channels. A user may perform three actions on a channel, subsribing, publishing, or unsubscribing. Whenever a user attempts to perform an action on a channel, Hookbox will make a :ref:`Webhook <webhooks_toplevel>` call back to your application to obtain permission for the action by that user, or simply to notify your web application that the action took place.

The application may itself perform any of these actions on a channel by using the :ref:`REST API <rest_toplevel>`; it may perform any action on behalf of any user, and it can even publish with arbitrary usernames. The application may additionally use the REST API to alter a channel's state or options at any time.

Finally, the web application may sometimes perform actions on channels on behalf of a particular user when that user causes a webhook callback. For instance, a user might subscribe to the channel 'foo', which would result in a ``subscribe`` webhook to be issued. The web application may respond with the ``auto_subscribe`` directive in order to subscribe the user to another channel, such as 'bar'. 

You can think of channels as three parts:

#) Unique name
#) List of actively connected/subscribed users
#) History/state
 
And you can think of the operations you can perform on a channel in three categories:
    
#) Putting data into a channel
#) Getting data out of a channel
#) Altering channel subscriptions 





Getting Data out of a Channel
=============================

The most common way to get data out of a channel is to simply subscribe with the :ref:`Javascript API <javascript_subscribing>`. This method allows javascript code to attach a publish callback which will be invoked whenever a new message is published to the channel.

Putting Data into Channels
=============================



Channel Properties
=============================

* ``history_size``: the maximum number of entries in the channel history.
* ``history``: A list of events that have previously occurred on this channel. They may be Subscribe, Unsubscribe, or Publish events.
* ``name``: The name of the channel.
* ``presenceful``: A Boolean indicating whether presence information is shared with channel subscribers.
* ``moderated``: If true, any action will cause a Webhook callback.
* TODO: etc.

