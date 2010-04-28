============
Introduction
============

Overview
========

Hookbox's purpose is to ease the development of real-time web applications, with an emphasis on tight integration with existing web technology. Put simply, Hookbox is a web-enabled message queue. Browers may directly connect to Hookbox, subscribe to named channels, and publish and receive messages on those channels in real-time. An external application (typically the web application itself) may also publish messages to channels by means of the Hookbox REST interface. All authentication and authorization is performed by an external web application via designated "webhook" callbacks.

.. image:: diagrams/overview.png

Any time a user connects or operates on a channel, ( subscribe, publish, unsubscribe) Hookbox makes an http request to the web application for authorization for the action. Once subscribed to a channel, the user's browser will receive real-time events that originate either in another browser via the javascript api, or from the web application via the REST api.



They key insight is that all application development with hookbox Happens either in javascript, or in the native language of the web application itself (e.g. PHP.)


Installation
============

Hookbox is written in python and depends on setuptools for installation. The fastest way to install hookbox is to type: 

.. sourcecode:: none

    # easy_install hookbox


If you are missing python or setuptools, please refer to the following links:

* `install python <http://python.org/download>`_
* `install setuptools <http://peak.telecommunity.com/DevCenter/EasyInstall#installation-instructions>`_

To confirm your installation succeeded, type:

.. sourcecode:: none

    # hookbox --help

Github
======

The development version of Hookbox is located on github:

* http://github.com/mcarter/hookbox

You can get a copy of the latest source by cloning the repository:

.. sourcecode:: none

    # git clone git://github.com/mcarter/hookbox.git


To install hookbox from source, ensure you have python and setuptools, then run:


.. sourcecode:: none

    # cd hookbox/hookbox
    # python setup.py install


