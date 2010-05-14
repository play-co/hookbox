jsio('from net import connect as jsioConnect');
jsio('from net.protocols.rtjp import RTJPProtocol');

exports.logging = logging

exports.connect = function(url, cookieString) {
	var p = new HookBoxProtocol(url, cookieString);
	jsioConnect(p, 'csp', {url: url})
	return p;
}

var Subscription = Class(function(supr) {
	// Public API

	this.init = function(args) {
		this.channelName = args.channel_name;
		this.history = args.history;
		this.historySize = args.history_size;
		this.state = args.state;
		this.presence = args.presence;
		this.canceled = false;
	}

	this.onPublish = function(frame) { }
	this.onSubscribe = function(frame) {}
	this.onUnsubscribe = function(frame) {}
	this.onState = function(frame) {}

	this.frame = function(name, args) {
		switch(name) {
			case 'PUBLISH':
				if (this.historySize) { 
					this.history.push(["PUBLISH", { user: args.user, payload: args.payload}]) 
					while (this.history.length > this.historySize) { 
						this.history.shift(); 
					}
				}
				this.onPublish(args);
				break;
			case 'UNSUBSCRIBE':
				if (this.historySize) { 
					this.history.push(["UNSUBSCRIBE", { user: args.user}]) 
					while (this.history.length > this.historySize) { 
						this.history.shift(); 
					}
				}
				var i = this.presence.indexOf(args.user);
				if (i > -1) { this.presence.splice(i, 1); }
				this.onUnsubscribe(args);
				break;
			case 'SUBSCRIBE':
				if (this.historySize) { 
					this.history.push(["SUBSCRIBE", { user: args.user}]) 
					while (this.history.length > this.historySize) { 
						this.history.shift(); 
					}
				}
				this.presence.push(args.user);
				this.onSubscribe(args);
				break;
			case 'STATE_UPDATE':
				for (var i = 0, key; key = args.deletes[i]; ++i) {
					delete this.state[key];
				}
				for (key in args.updates) {
					this.state[key] = args.updates[key];
				}
				this.onState(args);
				break;
		}
	}
	
	this.cancel = function() {
		if (!this.canceled) {
			logger.debug('calling this._onCancel()');
			this._onCancel();
		}
	}

	// Private API
	this._onCancel = function() { }


})

HookBoxProtocol = Class([RTJPProtocol], function(supr) {
	// Public api
	this.onOpen = function() { }
	this.onClose = function() { }
	this.onError = function() { }
	this.onSubscribed = function() { }
	this.onUnsubscribed = function() { }
	this.init = function(url, cookieString) {
		supr(this, 'init', []);
		this.url = url;
		try {
			this.cookieString = cookieString || document.cookie;
		} catch(e) {
			this.cookieString = "";
		}
		this.connected = false;

		this._subscriptions = {}
		this._buffered_subs = []
		this._publishes = []
		this._errors = {}
		this.username = null;
	}

	this.subscribe = function(channel_name) {
		if (!this.connected) {
			this._buffered_subs.push(channel_name);
		}
		else {
			var fId = this.sendFrame('SUBSCRIBE', {channel_name: channel_name});
		}
	}

	this.publish = function(channel_name, data) {
		if (this.connected) {
			this.sendFrame('PUBLISH', { channel_name: channel_name, payload: JSON.stringify(data) });
		} else {
			this._publishes.push([channel_name, data]);
		}

	}

	this.connectionMade = function() {
		logger.debug('connectionMade');
		this.sendFrame('CONNECT', { cookie_string: this.cookieString });
	}

	this.frameReceived = function(fId, fName, fArgs) {
		switch(fName) {
			case 'CONNECTED':
				this.connected = true;
				this.username = fArgs.name;
				while (this._buffered_subs.length) {
					var chan = this._buffered_subs.shift();
					this.sendFrame('SUBSCRIBE', {channel_name: chan});
				}
				while (this._publishes.length) {
					var pub = this._publishes.splice(0, 1)[0];
					this.publish.apply(this, pub);
				}
				this.onOpen();
				break;
			case 'SUBSCRIBE':
				if (fArgs.user == this.username) {
					var s = new Subscription(fArgs);
					this._subscriptions[fArgs.channel_name] = s;
					s._onCancel = bind(this, function() {
						this.sendFrame('UNSUBSCRIBE', {
							channel_name: fArgs.channel_name
						});
					});
					this.onSubscribed(fArgs.channel_name, s);
					K = s;
				}
				else {
					this._subscriptions[fArgs.channel_name].frame(fName, fArgs);
				}
				break
			case 'STATE_UPDATE':
				/* FALL THROUGH */
			case 'PUBLISH':
				/* FALL THROUGH */
				var sub = this._subscriptions[fArgs.channel_name];
				sub.frame(fName, fArgs);
				break;
				
			case 'UNSUBSCRIBE':
				var sub = this._subscriptions[fArgs.channel_name];
				sub.canceled = true;
				sub.frame(fName, fArgs);
				if (fArgs.user == this.username) {
					delete this._subscriptions[fArgs.channel_name]
					this.onUnsubscribed(sub, fArgs);
				}
				break;
			case 'ERROR':
				this.onError(fArgs);
				break;
		}
	}
	this.connectionLost = function() {
		logger.debug('connectionLost');
		this.connected = false;
		this.onClose();
	}

	// TODO: we need another var besides this.connnected, as that becomes true
	//       only after we get a CONNECTED frame. Maybe our transport is
	//       connected, but we haven't gotten the frame yet. For now, no one
	//       should be calling this anyway until they get an onclose.

	this.reconnect = function() {
		jsioConnect(this, this.url);
	}
	
	this.disconnect = function() {
		this.transport.loseConnection();
	}

})
