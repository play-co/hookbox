jsio('from net import connect as jsioConnect');
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
		this.client = new admin.AdminProtocol();
		this.state = 'init';
		this.current = $("#login");
		$("#signon").click(bind(this, this.signon));
		$("#side_menu a:nth-child(1)").click(bind(this, this.overview))
		$("#side_menu a:nth-child(2)").click(bind(this, this.channels))
		$("#side_menu a:nth-child(3)").click(bind(this, this.users))
		$("#side_menu a:nth-child(4)").click(bind(this, this.configuration))
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

ChannelList = Class(function() {
	this.init = function(gui) {
		this._gui = gui;
		this._elements = {}
		$("#channel_list ul").html("")
		$("#channel_list").show()
		$("#no_channels").show();
		this._gui.client.sendFrame('SWITCH', { location: 'channel_list' });
		this._gui.client.subscribe('CHANNEL_LIST', this, this.CHANNEL_LIST);
		this._gui.client.subscribe('CREATE_CHANNEL', this, this.CREATE_CHANNEL);
		this._gui.client.subscribe('DESTROY_CHANNEL', this, this.DESTROY_CHANNEL);
	}
	this.hide = function() {
		$("#channel_list").hide();
		this._gui.client.unsubscribe('CHANNEL_LIST', this);
	}
	
	this.CHANNEL_LIST = function(args) {
		logger.debug("channels:", args.channels);
		for (var i = 0, chan; chan = args.channels[i]; ++i) {
			this._addChannel(chan);
		}
	}
	this._addChannel = function(name) {
		this._elements[name] = $("<li>" + name + "</li>").appendTo($("#channel_list ul"));
		$("#no_channels").hide();
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
		$("#channel_list ul").html("")
		$("#channel_list").show()
		$("#no_channels").show();
		this._gui.client.sendFrame('SWITCH', { location: 'channel_list' });
		this._gui.client.subscribe('CHANNEL_LIST', this, this.CHANNEL_LIST);
		this._gui.client.subscribe('CREATE_CHANNEL', this, this.CREATE_CHANNEL);
		this._gui.client.subscribe('DESTROY_CHANNEL', this, this.DESTROY_CHANNEL);
	}
	this.hide = function() {
		$("#channel_list").hide();
		this._gui.client.unsubscribe('CHANNEL_LIST', this);
	}
	
	this.CHANNEL_LIST = function(args) {
		logger.debug("channels:", args.channels);
		for (var i = 0, chan; chan = args.channels[i]; ++i) {
//			this._addChannel(chan);
		}
	}
	this._addChannel = function(name) {
		logger.debug('_addChannel', name);
		this._elements[name] = $("<li></li>").appendTo($("#channel_list ul"));
		$("<a href='#'>" + name + "</a>").click(bind(this, this.showChannel, name))
			.appendTo(this._elements[name])
		$("#no_channels").hide();
		logger.debug('what?');
	}
	this.showChannel = function(name) {
		logger.debug("show channel", name);
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



ChannelView = Class(function() {
	this.init = function(gui) {
		this._gui = gui;
	}

	this.hide = function() {
		$("#channel").hide();
	}
});