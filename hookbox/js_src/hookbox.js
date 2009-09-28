require('jsio', ['bind', 'Class'])
require('jsio', {'connect': 'jsioConnect'})
require('jsio.protocols.rtjp', ['RTJPProtocol'])
require('jsio.logging');
var logger = jsio.logging.getLogger('hookbox');

exports.logging = jsio.logging

exports.connect = function(url) {
    var p = new HookBoxProtocol();
    jsioConnect(p, 'csp', {url: url})
    return p;
}

var Subscription = Class(function(supr) {
    this.init = function(destination) {
    }

    this.onCancel = function() { }

    this.onFrame = function(frame) { }
    this.onSetup = function(frame) { }

    this.getDestination = function() {
        return this.channel;
    }

    this.cancel = function() {

    }

})

HookBoxProtocol = Class([RTJPProtocol], function(supr) {
    // Public api
    this.onopen = function() { }
    this.onclose = function() { }
    this.onerror = function() { }

    this.init = function(url) {
        supr(this, 'init', []);
        this.url = url;
        this.connected = false;
        this._subscriptions = {}
        this._publishes = []
    }

    this.subscribe = function(dest) {
        var s = new Subscription();
        console.log('s is', s);
        var subscribers;
        s.onCancel = bind(function() {
            var i = subscribers.indexOf(s);
            subscribers.splice(i, 1);
            if (!subscribers.length) {
                delete this._subscriptions[dest];
            }
            delete s.onCancel;
        })
        if (subscribers = this._subscriptions[dest]) {
            subscribers.push(s);
        } else {
            subscribers = [ s ];
            this._subscriptions[dest] = subscribers;
            if (this.connected) {
                this.sendFrame('SUBSCRIBE', {destination: dest});
            }
        }
        return s;   
    }

    this.publish = function(destination, data) {
        if (this.connected) {
            this.sendFrame('PUBLISH', { destination: destination, payload: JSON.stringify(data) });
        } else {
            this._publishes.push([destination, data]);
        }
        
    }

    this.connectionMade = function() {
        logger.debug('connectionMade');
        this.sendFrame('CONNECT', { cookie: document.cookie });
    }

    this.frameReceived = function(fId, fName, fArgs) {
        logger.debug('frameReceived', fId, fName, fArgs);
        switch(fName) {
            case 'CONNECTED':
                this.connected = true;
                for (key in this._subscriptions) {
                    this.sendFrame('SUBSCRIBE', {destination: key});
                }
                while (this._publishes.length) {
                    var pub = this._publishes.splice(0, 1)[0];
                    this.publish.apply(this, pub);
                }
                this.onopen();
                break;
            case 'PUBLISH':
                var subscribers;
                if (subscribers = this._subscriptions[fArgs.destination]) {
                    for (var i = 0, subscriber; subscriber = subscribers[i]; ++i) {
                        try {
                            subscriber.onFrame(fArgs);
                        } catch(e) {
                            setTimeout(function() { throw e; }, 0);
                        }
                    }
                }
                break;
            case 'ERROR':
                this.onerror(fArgs);
                break;
        }
    }
    this.connectionLost = function() {
        logger.debug('connectionLost');
        this.connected = false;
        this.onclose();
    }
    // TODO: we need another var besides this.connnected, as that becomes true
    //       only after we get a CONNECTED frame. Maybe our transport is 
    //       connected, but we haven't gotten the frame yet. For now, no one
    //       should be calling this anyway until they get an onclose.
    this.reconnect = function() {
        jsioConnect(this, this.url);
    }
    
})


