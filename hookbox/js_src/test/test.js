jsio("from util.browser import $");

var View = Class(function() {
	this.appendTo = function(parent) { if(parent && this.el) parent.appendChild(this.el); return this; }
	this.show = function() { if (this.parent) this.appendTo(this.parent); }
	this.hide = function() { if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el); }
});

var Tab = Class(View, function() {
	this.init = function(text, onClick) { this.el = $.create({className: 'tab', text: text}); $.onEvent(this.el, 'click', onClick); }
});

var TabView = Class(View, function() {
	this.init = function(className) {
		this.el = $.create({className: 'tabView'});
		this.tabs = $.create({className: 'tabs', parent: this.el, style: {display: 'none'}});
		this.views = $.create({className: 'views roundBottoms roundTopRight', parent: this.el, style: {display: 'none'}});
		this.list = {};
		
		if (className) { $.addClass(this.el, className); }
	}
	
	this.addView = function(view, name) {
		if (name in this.list) { return; }
		this.list[name] = {
			view: view,
			tab: new Tab(name, bind(this, 'showView', name)).appendTo(this.tabs)
		};
		
		this.showView(name);

		this.tabs.style.display = 'block';
		this.views.style.display = 'block';
	}
	
	this.showView = function(name) {
		var handle = this.list[name],
			prev = this.list[this.current];
		
		if (prev) {
			$.remove(prev.view.el);
			$.removeClass(prev.tab.el, 'tabSelected');
		}
		this.current = name;
		$.addClass(handle.tab.el, 'tabSelected');
		handle.view.appendTo(this.views);
	}
});

var ConnectionView = Class(View, function() {
	this.init = function(conn) {
		this.conn = conn;
		conn.onSubscribed = bind(this, 'onSubscribed');
		conn.onMessaged = bind(this, 'onMessaged');
		conn.onOpen = bind(this, 'onOpen');
		conn.onClose = bind(this, 'onClose');
		conn.onError = bind(this, 'onError');
		
		this.el = $.create({className: 'connectionView'});
		
		this.logger = new LogView(this.el);
		$.addClass(this.logger.el, 'connectionLogger round');
		
		this.controls = $.create({className: 'channelControls', parent: this.el});
		this.controls.innerHTML = '<h2>Channels</h2><b>name:</b> ';
		this.channelInput = $.create({className: 'channelInput', tag: 'input', parent: this.controls});
		this.channelSubmit = $.create({className: 'channelSubmit', tag: 'button', text: 'subscribe', parent: this.controls});
		
		$.onEvent(this.channelInput, 'keypress', this, function(e) { if(e.keyCode == 13) this.submitChannel(); });
		$.onEvent(this.channelSubmit, 'click', this, 'submitChannel');
		
		this.tabView = new TabView('channelTabs').appendTo(this.el);
		
		this.logger.info('connecting to', conn.url);
	}
	
	this.submitChannel = function() {
		var name = this.channelInput.value;
		this.conn.subscribe(name);
		this.channelInput.value = '';
		this.logger.info('subscribing to', name);
	}
	
	this.onOpen = function() { this.logger.info('connected'); }
	this.onClose = function(reason, wasConnected) {
		if (wasConnected) {
			this.logger.info('connection closed', reason);
		} else {
			this.logger.info('could not connect', reason);
		}
	}
	
	this.onError = function(args) { this.logger.error(JSON.stringify(args)); }
	this.onSubscribed = function(name, sub) {
		var view = new ChannelView(this.conn, sub, this.views);
		this.tabView.addView(view, name);
		this.logger.info('subscribed to', name);
	}
	this.onMessaged = function(args) {
		this.logger.info('*private message*:', JSON.stringify(args));
	}
	
});

var ChannelView = Class(View, function() {
	this.init = function(conn, sub, parent) {
		this.conn = conn;
		this.sub = sub;
		this.parent = parent;
		
		this.el = $.create({className: 'channelView'});
		this.info = $.create({className: 'channelHeader channelInfo', parent: this.el});
		var state = $.create({className: 'channelHeader channelState', parent: this.el});
		state.innerHTML = '<h3>state:</h3> <pre></pre>';
		this.state = state.lastChild;
		
		this.presence = $.create({className: 'channelHeader channelPresence', parent: this.el});
		
		var header = $.create({className: 'channelHeader channelPublisher', parent: this.el});
		this.publishInput = $.create({className: 'channelPublish', tag: 'input', parent: header});
		this.publishBtn = $.create({className: 'channelPublishBtn', tag: 'button', text: 'publish', parent: header});
		
		$.onEvent(this.publishBtn, 'click', this, 'publish');
		$.onEvent(this.publishInput, 'keypress', this, function(e) { if(e.keyCode == 13) this.publish(); });
		
		this.logger = new LogView(this.el);
		$.addClass(this.logger.el, 'channelLogger');
		
		sub.onSubscribe = bind(this, 'onSubscribe');
		sub.onPublish = bind(this, 'onPublish');
		sub.onUnsubscribe = bind(this, 'onUnsubscribe');
		sub.onState = bind(this, 'renderState');
		
		this.logger.addFixed(sub.historySize, 'stored channel history ends here');
		
		this.renderHistory();
		this.onSubscribe({user: conn.username});
		this.renderState();
	}
	
	this.publish = function() {
		var value;
		try {
			value = JSON.parse(this.publishInput.value);
		} catch(e) {
			value = this.publishInput.value;
		}
		
		this.conn.publish(this.sub.channelName, value);
	}
	
	this.onSubscribe = function(args, dontRender) {
		this.logger.info(args.user, 'subscribed');
		if (!dontRender) { this.renderPresence(); }
	}
	
	this.onUnsubscribe = function(args, dontRender) {
		this.logger.info(args.user, 'unsubscribed');
		if (!dontRender) { this.renderPresence(); }
	}
	
	this.onPublish = function(args) {
		this.logger.msg(args.user + ':', args.payload);
	}
	
	this.renderHistory = function() {
		var h = this.sub.history;
		for (var i = 0, len = h.length; i < len; ++i) {
			if (!h[i]) { continue; }
			var args = h[i][1];
			switch(h[i][0]) {
				case 'PUBLISH':
					this.onPublish(args);
					break;
				case 'UNSUBSCRIBE':
					this.onUnsubscribe(args, true);
					break;
				case 'SUBSCRIBE':
					this.onSubscribe(args, true);
					break;
			}
		}
	}
	
	this.renderState = function() {
		this.info.innerHTML = '<h3>historySize:</h3> ' + this.sub.historySize;
		$.setText(this.state, JSON.stringify(this.sub.state, null, '\t'));
	}
	
	this.renderPresence = function() {
		if (this.sub.presence) {
			this.presence.innerHTML = '<h3>Presence:</h3>';
			var p = this.sub.presence;
			for (var i = 0, len = p.length; i < len; ++i) {
				$.create({className: 'presenceRow', text: this.sub.presence[i], parent: this.presence});
			}
		} else {
			$.setText(this.presence, 'This channel does not have presence.');
		}
	};
});

var LogView = Class(View, function() {
	this.init = function(el) {
		this.el = $.create({className: 'logView', parent: el});
		this._fixed = [];
	}
	
	var sortPadding = '---------------------';
	this.addFixed = function(where) {
		var el = $.create({className: 'logRow logFixed', text: Array.prototype.slice.call(arguments, 1).join(' ')});
		where = where == undefined ? this.el.childNodes.length : where;
		var sortIndex = where + sortPadding;
		this._fixed.push({node: el, count: where, toString: function() { return sortIndex; }});
		this._fixed.sort();
		this.updateFixed();
	}
	
	this.updateFixed = function() {
		var children = this.el.childNodes,
			numFixedAbove = 0;
		
		for (var i = 0, fixed; fixed = this._fixed[i]; ++i) {
			$.remove(fixed.node);
		}
		
		for (var i = 0, fixed; fixed = this._fixed[i]; ++i) {
			insertBefore(this.el, fixed.node, children[fixed.count + numFixedAbove]);
			numFixedAbove++;
		}
	}
	
	this.getText = function(args) {
		var d = new Date(),
			time = [d.getHours(), d.getMinutes(), d.getSeconds()];
		for (var i = 0; i < 3; ++i) {
			if (time[i] < 10) { time[i] = '0' + time[i]; }
		}
		return time.join(':') + ': ' + Array.prototype.slice.call(args).join(' ');
	}
	
	function createLog(cn) {
		return function() {
			var el = $.create({className: 'logRow ' + cn, text: this.getText(arguments)});
			insertFirst(this.el, el);
			this.updateFixed();
			return el;
		 };
	}
	
	this.msg = createLog('logMsg');
	this.info = createLog('logInfo');
	this.warn = createLog('logWarn');
	this.error = createLog('logError');
});

function insertFirst(parent, el) {
	if (parent) { insertBefore(parent, el, parent.firstChild); }
}

function insertBefore(parent, el, node) {
	if (!parent || !el) { return; }
	if (node) {
		parent.insertBefore(el, node);
	} else {
		parent.appendChild(el);
	}
}

var conns = GLOBAL.conns = [],
	numConns = 0;

function connect() {
	var url = $.id('url').value,
		conn = hookbox.connect(url),
		view = new ConnectionView(conn);
	
	main.addView(view, numConns + ':' + url);
	++numConns;
	
	var ref = {
		conn: conn,
		view: view
	};
	
	conns[url] = ref;
	conns.push(ref);
}

main = new TabView('connectionTabs');
$.id('content').appendChild(main.el);

var url = $.id('url');
if (!url.value) { url.value = location.protocol + '\/\/' + location.host; }

$.onEvent('connect', 'click', connect);
$.onEvent('url', 'keypress', function(e) { if(e.keyCode == 13) { connect(); } });
