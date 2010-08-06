=============
Configuration
=============

As of version 0.2, hookbox is completely configurable via command line options. While developing your application, you will want to create a startup script that contains all of the appropriate settings.

A typical hookbox start command looks like this:

.. sourcecode:: none
    
    # hookbox -a myadminpassword -r myapitoken -s mycallbacksecret

Basic Options
=============

Port (-p, --port)
-----------------
The port hookbox binds to is specified by -p PORT or --port=PORT; the default is 8001.

Interface (-i, --interface)
---------------------------
The interface hookbox binds to is specified by -i INTERFACE or --interface=INTERFACE; the default is "0.0.0.0"

Webhook Callback Options
========================

Callback Port (--cbport)
------------------------
The port of the web application which will handle webhook callbacks is specified by --cbport=PORT; the default is 80.

Callback Hostname (--cbhost)
----------------------------
The hostname of the web application which will handle webhook callbacks is specified by --cbhost=HOSTNAME; the default is "localhost".

Callback Path Prefix (--cbpath)
-------------------------------
All callbacks will be prefixed with the value specified by --cbpath=PATH_PREFIX; the default is "/hookbox".

Callback Secret Token (-s, --webhook-secret)
--------------------------------------------
If a secret token is provided, all callbacks with include that token value as the form variable "secret"; this is useful for blocking unauthorized requests to the callback urls. The secret is specified by -s SECRET or --webhook-secret=SECRET; the default is null (no secret.)

Extended Callback Options
=========================

These options are typically left as default, except in cases where its helpful to point all callbacks at a single url, for instance a single PHP script.

Connect Callback Path (--cb-connect)
------------------------------------
The subpath for the connect callback is specified by --cb-connect PATH; the default is "connect"


Disconnect Callback Path (--cb-disconnect)
------------------------------------------
The subpath for the connect callback is specified by --cb-disconnect PATH; the default is "disconnect"


Create Channel Callback Path (--cb-create_channel)
--------------------------------------------------
The subpath for the create_channel callback is specified by --cb-create_channel PATH; the default is "create_channel"


Destroy Channel Callback Path (--cb-destroy_channel)
----------------------------------------------------
The subpath for the destroy_channel callback is specified by --cb-destroy_channel PATH; the default is "destroy_channel"


Subscribe Callback Path (--cb-subscribe)
----------------------------------------
The subpath for the subscribe callback is specified by --cb-subscribe PATH; the default is "subscribe"


Unsubscribe Callback Path (--cb-unsubscribe)
--------------------------------------------
The subpath for the unsubscribe callback is specified by --cb-unsubscribe PATH; the default is "unsubscribe"


Publish Callback Path (--cb-publish)
------------------------------------
The subpath for the publish callback is specified by --cb-publish PATH; the default is "publish"

Cookie Identifier (-c, --cookie-identifier)
-------------------------------------------
Hookbox will include all user cookies in any user-triggered webhook callback. This option is purely an optimization that will cause hookbox to include only the cookie specified by -c COOKIE_NAME or --cookie-identifier COOKIE_NAME; the default is to include all cookies.

API Options
============

API Secret (-r, --api-security-token)
-------------------------------------
The external api interfaces are disabled by default and will only be enabled if an API secret is specified by -r SECRET or --api-security-token SECRET. The value specified must appear in the form as the value for the key "secret" when using the Web/HTTP Hookbox API.

Admin Options
=============

Admin Password (-a, --admin-password)
-------------------------------------

Hookbox includes an admin console which can be found at the /admin relative url. (e.g. http://localhost:8001/admin) This console is disabled by default unless an admin password is specified by -a PASSWORD or --admin-password PASSWORD

