jsio('import net');
jsio('from net.protocols.rtjp import RTJPProtocol');
jsio('import lib.PubSub as PubSub');

exports.logging = logging
logger.setLevel(logging.DEBUG);

exports.AdminProtocol= Class([RTJPProtocol, PubSub], function(supr) {
	this.init = function(password) {
		supr(this, 'init', []);
			this._password = password;
	}
	this.setPassword = function(password) {
		this._password = password;
	}
	this.connectionMade = function() {
		logger.debug('connectionMade');
		this.sendFrame('LOGIN', { password: this._password});
	}

	this.frameReceived = function(fId, fName, fArgs) {
		logger.debug('frameReceived', fId, fName, fArgs);
		this.publish(fName, fArgs);
	}
	this.connectionLost = function() {
		logger.debug('connectionLost');
		this.connected = false;
	}
});

exports.Gui = Class(function() {
	
	this.init = function() {
		this.client = new exports.AdminProtocol();
		this.state = 'init';
		this.current = new LoginView(this);
		this.selectedLink = $("#side_menu a:nth-child(1)").click(bind(this, 'linkClick', 'overview'));
		$("#side_menu a:nth-child(2)").click(bind(this, 'linkClick', 'channels'));
		$("#side_menu a:nth-child(3)").click(bind(this, 'linkClick', 'users'));
		$("#side_menu a:nth-child(4)").click(bind(this, 'linkClick', 'configuration'));
		
		window.onresize = bind(this, 'onResize');
		this.onResize();
	}
	
	this.linkClick = function(which, e) {
		e.preventDefault();
		if (this.selectedLink) { this.selectedLink.removeClass('selected'); }
		this.selectedLink = $(e.target).addClass('selected');
		if(this[which]) { this[which](); }
	}
	
	this.center = function(el) {
		var h = el.offsetHeight || parseInt(el.style.height),
			w = el.offsetWidth || parseInt(el.style.width);
			
		if (el && w && h) {
			el.style.top = this._height / 2 - h / 2 + 'px';
			el.style.left = this._width / 2 - w / 2 + 'px';
		}
	}
	
	this.onResize = function() {
		this._height = document.documentElement.clientHeight;
		this._width = document.documentElement.clientWidth;
		
		if (this.current.onResize) {
			this.current.onResize(this._height);
		} else {
			var el = this.current._el && this.current._el[0] || this.current._el || this.current && this.current[0] || this.current;
			this.center(el);
		}
		
		var app = $('#app')[0];
		app.style.height = this._height - 20 + 'px';
		app.style.width = 800 + 'px';
		this.center(app);
	}
	
	this.signon = function() {
		this.client.setPassword($('#password').val())
		net.connect(this.client, 'csp', {'url': 'http://localhost:8001/admin/csp'});
		this.client.subscribe("CONNECTED", this, this.CONNECTED);
		this.client.subscribe("OVERVIEW", this, this.OVERVIEW);
		this.state = 'connecting'
	}
	
	this.overview = function() {
		if (this.state == "overview") { return; }
		this.current.hide()
		this.current = $("#overview").show()
		this.state = "overview";
		this.client.sendFrame('SWITCH', { location: 'overview' });		
	}
	
	this.channels = function() {
		
		if (this.state == "channels") { return; }
		this.state = "channels";
		this.current.hide()
		this.current = new ChannelList(this);
		//this.client.sendFrame('SWITCH', { location: 'watch_channel', channel_name: 'testing' });
	}
	this.users = function() {
		if (this.state == "users") { return; }
		this.state = "users";
		this.current.hide()
		this.current = new UserList(this);
		//this.client.sendFrame('SWITCH', { location: 'watch_channel', channel_name: 'testing' });
	}
	
	this.channel = function(name) {
		if (this.state == "channel:" + name) { return; }
		this.current.hide()
		this.state = "channel:" + name;
		this.current = new ChannelView(this, name);
	}
	this.CONNECTED = function() {
		this.overview();
		$("#app").show()
//
	}
	this.OVERVIEW= function(fArgs) {
		$("#overview_num_users").html(fArgs.num_users);
		$("#overview_num_channels").html(fArgs.num_channels);
	}
});

LoginView = Class(function() {
	this.init = function(gui) {
		this._el = $('#login');
		this._pass = $('#password').focus();
		this._signon = $('#signon');
		this._pass.keypress(bind(this, function(e) { if (e.keyCode == 13) { gui.signon(); e.preventDefault(); } }));
		this._signon.click(bind(gui, 'signon'));
	}
	
	this.hide = function() { this._el.hide(); }
});

ChannelList = Class(function() {
	this.init = function(gui) {
		this._gui = gui;
		this._elements = {}
		$("#channel_list ul").html("");
		$("#channel_list").show();
		$("#no_channels").show();
		this._gui.client.sendFrame('SWITCH', { location: 'channel_list' });
		this._gui.client.subscribe('CHANNEL_LIST', this, this.CHANNEL_LIST);
		this._gui.client.subscribe('CREATE_CHANNEL', this, this.CREATE_CHANNEL);
		this._gui.client.subscribe('DESTROY_CHANNEL', this, this.DESTROY_CHANNEL);
	}
	this.hide = function() {
		$("#channel_list").hide();
		this._gui.client.unsubscribe('CHANNEL_LIST', this);
		this._gui.client.unsubscribe('CREATE_CHANNEL', this);
		this._gui.client.unsubscribe('DESTROY_CHANNEL', this);
	}
	
	this.CHANNEL_LIST = function(args) {
		logger.debug("channels:", args.channels);
		for (var i = 0, chan; chan = args.channels[i]; ++i) {
			this._addChannel(chan);
		}
	}
	this._addChannel = function(name) {
		this._elements[name] = $("<li></li>").appendTo($("#channel_list ul"));
		$("<a href='#'>" + name + "</a>").click(bind(this, this.showChannel, name))
			.appendTo(this._elements[name])
		$("#no_channels").hide();
	}
	this.showChannel = function(name) {
		this._gui.channel(name);
	}

	this.CREATE_CHANNEL= function(args) {
		logger.debug("create channel:", args);
		this._addChannel(args.name);
	}
	this.DESTROY_CHANNEL = function(args) {
		logger.debug("destroy channel:", args);
		this._elements[args.name].remove()
		delete this._elements[args.name];
		// show "no channels" message if none are left
		for (key in this._elements) { return; }
		$("#no_channels").show();
	}
});

UserList = Class(function() {
	this.init = function(gui) {
		this._gui = gui;
		this._elements = {}
		$("#user_list ul").html("")
		$("#user_list").show()
		$("#no_users").show();
		this._gui.client.sendFrame('SWITCH', { location: 'user_list' });
		this._gui.client.subscribe('USER_LIST', this, this.USER_LIST);
		this._gui.client.subscribe('USER_CONNECT', this, this.USER_CONNECT);
		this._gui.client.subscribe('USER_DISCONNECT', this, this.USER_DISCONNECT);
	}
	this.hide = function() {
		$("#user_list").hide();
		this._gui.client.unsubscribe('USER_LIST', this);
		this._gui.client.unsubscribe('USER_CONNECT', this);
		this._gui.client.unsubscribe('USER_DISCONNECT', this);
	}
	
	this.USER_LIST = function(args) {
		logger.debug("users:", args.users);
		for (var i = 0, user; user = args.users[i]; ++i) {
			this._addUser(user);
		}
	}
	this._addUser= function(name) {
		logger.debug('_addUser', name);
		
		this._elements[name] = $("<li></li>").appendTo($("#user_list ul"));
		$("<a href='#'>" + name + "</a>").click(bind(this, this.showUser, name))
			.appendTo(this._elements[name])
		$("#no_users").hide();
	}
	this.showUser= function(name) {
		logger.debug("show user", name);
		this._gui.user(name);
	}
	this.USER_CONNECT = function(args) {
		logger.debug("user connect:", args);
		this._addUser(args.name);
	}
	this.USER_DISCONNECT = function(args) {
		logger.debug("user disconnect:", args);
		this._elements[args.name].remove()
		delete this._elements[args.name];
		// show "no channels" message if none are left
		for (key in this._elements) { return; }
		$("#no_users").show();
	}
});



ChannelView = Class(function() {
	
	this.init = function(gui, name) {
		X = this;
		this._gui = gui;
		this._gui.client.sendFrame('SWITCH', { location: 'watch_channel', channel_name: name });
		this._gui.client.subscribe('CHANNEL_EVENT', this, this.CHANNEL_EVENT);
		this._subscribers = {}
		this._history = {}
		$("#channel_name").html(name);
		$("#channel").show()
	}

	this.hide = function() {
		$("#channel").hide();
		$("#channel_users").html("")
		$("#channel_events").html("")
		this._gui.client.unsubscribe('CHANNEL_EVENT', this);
		
	}
	
	this._addChannel = function(name) {
		this._elements[name] = $("<li></li>").appendTo($("#channel_list ul"));
		$("<a href='#'>" + name + "</a>").click(bind(this, this.showChannel, name))
			.appendTo(this._elements[name])
		$("#no_channels").hide();
	}
	
	
	
	this._addUser = function(name) {
		this._subscribers[name] = $("<div></div>").appendTo($("#channel_users"))
		$("<a href='#'>" + name + "</a>").click(bind(this, this.showUser, name))
			.appendTo(this._subscribers[name]);
	}
	
	this.showUser = function(name) {
		
	}
	this._removeUser = function(name) {
		this._subscribers[name].remove()
		delete this._subscribers[name];
	}
	
	this.CHANNEL_EVENT = function(args) {
		logger.debug('!ChannelView CHANNEL_EVENT', args);
		var msg = args.type;
		switch (args.type) {
			case 'create_channel':
				for (var i =0, user; user = args.data.subscribers[i]; ++i) {
					this._addUser(user);
				}
				break;
			case 'destroy_channel':
				break;
			case 'publish':
				msg = "PUBLISH, " + args.data.user + ": " + JSON.stringify(args.data.payload);
				break;
			case 'subscribe':
				msg = "SUBSCRIBE, " + args.data.user
				this._addUser(args.data.user);
				break;
			case 'unsubscribe':
				msg = "UNSUBSCRIBE, " + args.data.user
				this._removeUser(args.data.user);
				break;
		}
		$("<div class='channel_event'>" + msg + "</div>").appendTo($("#channel_events"));
		
	}
	
});