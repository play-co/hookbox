jsio('import net');
jsio('from net.protocols.rtjp import RTJPProtocol');
jsio('import lib.PubSub as PubSub');
jsio('import base');
jsio('import std.uri as uri');

base.logging.get("net.protocols.rtjp").setLevel(base.logging.DEBUG);

exports.logging = logging
logger.setLevel(logging.DEBUG);


exports.AdminProtocol = Class([RTJPProtocol, PubSub], function(supr) {
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
		this.publish('ConnectionLost');
	}
});

var GUI = Class(function() {
	
	this.init = function() {
		this.client = new exports.AdminProtocol();
		this.state = 'init';
		
		this._loginView = new LoginView(this);
		this.current = this._loginView;
		
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
		if (!el) { return; }
		
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
			el && el.style && this.center(el);
		}
		
		var app = $('#app')[0];
		app.style.width = this._width - 30 + 'px';
		app.style.left = app.style.top = '10px';
		var body = $('#body')[0];
		body.style.minHeight = this._height - 20 + 'px';
		body.style.minWidth = this._width - 210 + 'px';
	}
	
	this.signon = function() {
		this.client.setPassword($('#password').val())
		var url = 'http://' + document.domain + ':' + (location.port || 80) + '/admin/csp'
		net.connect(this.client, 'csp', {'url': url});
		this.client.subscribe("CONNECTED", this, 'CONNECTED');
		this.client.subscribe("OVERVIEW", this, 'OVERVIEW');
		this.client.subscribe('ConnectionLost', this, 'onConnectionLost');
		this.state = 'connecting'
	}
	
	this.signout = function() {
		this.state = 'init';
		
		this.current.hide();
		this.current = this._loginView;
		this.current.show();
		$("#app").hide()
		
		// TODO? this.client.disconnect();
		this.client
			.unsubscribe("CONNECTED", this)
			.unsubscribe("OVERVIEW", this)
			.unsubscribe("ConnectionLost", this);
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
	
	this.user = function(name) {
		if (this.state == "user:" + name) { return; }
		this.current.hide()
		this.state = "user:" + name;
		this.current = new UserView(this, name);
	}
	
	this.connection = function(id, user) {
		if (this.state == "connection:" + id) { return; }
		this.current.hide()
		this.state = "connection:" + id;
		this.current = new ConnectionView(this, id, user);
		
	}
	
	this.CONNECTED = function() {
		this.overview();
		$("#app").show()
	}
	
	this.OVERVIEW= function(fArgs) {
		$("#overview_num_users").html(fArgs.num_users);
		$("#overview_num_channels").html(fArgs.num_channels);
	}
	
	this.onConnectionLost = function() {
		this.signout();
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
	
	this.show = function() { this._el.show(); }
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

UserView = Class(function() {
	this.init = function(gui, name) {
		logger.debug('in userview!');
		this._gui = gui;
		this._gui.client.sendFrame('SWITCH', { location: 'watch_user', user: name });
		this._gui.client.subscribe('USER_EVENT', this, this.USER_EVENT);
		this._subscribers = {}
		this._history = {}
		this._name = name;
		this._channels = {};
		this._connections = {};
		$("#user_name").html(name);
		$("#user").show()
	}
	this.hide = function() {
		this._gui.client.unsubscribe('USER_EVENT', this);
		$("#user_no_channels").show()
		$("#user_status").html("Disconnected")
		$("#user").hide()
		$("#user_channels").html("")
 		$("#user_connections").html("")
	}
	this.USER_EVENT = function(args) {
		switch(args.type) {
			case 'create':
				$("#user_status").html("Connected");
				for (var i =0, channel; channel= args.data.channels[i]; ++i) {
					this._addChannel(channel);
				}
				for (var i =0, conn; conn = args.data.connections[i]; ++i) {
					this._addConnection(conn);
				}
				break;
			case 'destroy':
				for (key in this._channels) {
					this._removeChannel(key);
				}
				for (key in this._connections) {
					this._removeConnection(key);
					$("#user_connections").html("(no connections)");
				}
				$("#user_status").html("Disconnected")
				break;
			case 'connect':
				this._addConnection(args.data.id);
				break;
			case 'disconnect':
				this._removeConnection(args.data.id);
				break;
		}
		logger.debug('got USER_EVENT', args);
	}
	
	
	this.showChannel = function(name) {
		this._gui.channel(name);
	}
	
	this.showConnection = function(id) {
		this._gui.connection(id, this._name);
	}
	
	this._removeChannel = function(name) {
		this._channels[name].remove()
		delete this._channels[name];
		// show "no channels" message if none are left
		for (key in this._channels) { return; }
		$("#user_no_channels").show();
	}
	this._addChannel = function(name) {
		this._channels[name] = $("<li></li>").appendTo($("#user_channels"));
		$("<a href='#'>" + name + "</a>").click(bind(this, this.showChannel, name))
			.appendTo(this._channels[name])
		$("#user_no_channels").hide();
	}
	this._removeConnection = function(id) {
		this._connections[id].remove()
		delete this._connections[id];
		// show "no channels" message if none are left
		for (key in this._connections) { return; }
	}
	
	this._addConnection = function (id) {
		logger.debug('add connection!', id);
		this._connections[id] = $("<li></li>").appendTo($("#user_connections"));
		$("<a href='#'>" + id+ "</a>").click(bind(this, this.showConnection, id))
			.appendTo(this._connections[id])
	}
});

ConnectionView = Class(function() {
	
	this.init = function(gui, id, user) {
		this._gui = gui;
		this._gui.client.sendFrame('SWITCH', { location: 'watch_connection', connection_id: id});
		this._gui.client.subscribe('CONNECTION_EVENT', this, this.CONNECTION_EVENT);
//		this._gui.
		this._id = id;
		this._user = user;

		$("#connection_title").html('Connection ' + id);
		$("#connection_id").html(id);
		$("#connection_status").html("Connected");
		$("#connection_user").html(util.userLink(user));
		$("#connection").show();
		
		logger.debug('f');
		
	}
	
	this.hide = function() {
		$("#connection").hide();
		$("#connection_user").html("")
	}
	
	this.CONNECTION_EVENT = function(args) {
		switch(args.type) {
			case 'connect':
				$("#connection_cookie").html(args.data.cookie);
				break;
			case 'disconnect':
				$("#connection_status").html("Disconnected")
				break;
		}
	}
	
});

util = {
	userLink: function(userName) { return '<a class="link userLink" href="#user=' + encodeURIComponent(userName) + '">' + userName + '</a>'; },
	removeUserLink: function(userName) { return '<a class="link removeUserLink" href="#removeUser=' + encodeURIComponent(userName) + '">remove</a>'; }, 
	onLinkClick: function(event) {
		var url = new uri.Uri(event.target.href);
		if (!url._anchor) { return; }
		
		var data = uri.parseQuery(url._anchor);
		if (data.user) {
			GUI.user(data.user);
		} else if (data.removeUser) {
			GUI.current.removeUser(data.removeUser);
		} else if (typeof GUI[url._anchor] == 'function') {
			GUI[url._anchor]();
		}
	},
	setChannelOption: function(checkbox, id) {
		GUI.current.changeChannelSettings();
	}
}

ChannelView = Class(function() {
	
	this.init = function(gui, name) {
		this._gui = gui;
		this._gui.client.sendFrame('SWITCH', { location: 'watch_channel', channel_name: name });
		this._gui.client.subscribe('CHANNEL_EVENT', this, this.CHANNEL_EVENT);
		this._subscribers = {}
		this._history = {}
		this._name = name;
		
		this._usersEl = $('#channel_users');
		
		$("#channel_name").html(name);
		$("#channel").show();
		
		$("#channel_publish_submit")[0].onclick = bind(this, 'publish');
	}

	this.hide = function() {
		$("#channel").hide();
		$("#channel_users").html("")
		$("#channel_events").html("")
		this._gui.client.unsubscribe('CHANNEL_EVENT', this);
	}
	
	this.changeChannelSettings = function(settings) {
		settings.channel_name = this._name;
		this._gui.client.sendFrame('SET_CHANNEL_INFO', settings)
	}
	
	this.publish = function() {
		var errorEl = $('#channel_publish_error').html(''),
			raw = $('#channel_publish_data')[0].value;
		
		try {
			var payload = JSON.stringify(eval('(' + raw + ')'));
		} catch(e) {
			errorEl.html('invalid payload: ' + e.toString());
			return;
		}
		
		var user = $('#channel_publish_user')[0].value || 'admin';
		
		this._gui.client.sendFrame('PUBLISH', {
			channel_name: this._name,
			payload: payload,
			user: user
		});
		
		// TODO: keep a history!
		$('#channel_publish_data')[0].value = payload;
		errorEl.html('sending');
	}
	
	this._showHistory = function(history) {
		var html = [];
		for (var i = 0, line; line = history[i]; ++i) {
			html.push(this._addHistoryLine(line));
		}
		$('#channel_history').html(html.join('<br>'));
	}
	
	this._addHistoryLine = function(item) {
		var name = item[0],
			data = item[1],
			link = data.user && util.userLink(data.user) || '';
		switch(name) {
			case 'SUBSCRIBE': 	return link + ' subscribed';
			case 'PUBLISH': 	return link + ' published ' + JSON.stringify(data.payload);
			case 'UNSUBSCRIBE':	return link + ' unsubscribed';
			default: 			return link + ' ' + name;
		}
	}
	
	this._userList = function(users) {
		for (var i = 0, user; user = users[i]; ++i) {
			this._addUser(user);
		}
	}
	
	this._addUser = function(user) {
		this._subscribers[user] = $('<div>').html(util.userLink(user) + ' (' + util.removeUserLink(user) + ')').appendTo(this._usersEl);
	}
	
	this.showUser = function(name) {
		this._gui.user(name);
	}
	
	this.removeUser = function(user) {
		this._gui.client.sendFrame('UNSUBSCRIBE', {
			channel_name: this._name,
			user: user
		});
		
		this._removeUser();
	}
	
	this._removeUser = function(user) {
		if (this._subscribers[user]) {
			this._subscribers[user].remove()
			delete this._subscribers[user];
		}
	}
	
	this._optionsForm = function(options) {
		// call with no arguments to reset to last settings
		if (!options) { options = this._lastOptions; }
		this._lastOptions = options;
		
		var html = {'checkbox': [], 'number': []};
		for (var id in options) {
			switch(typeof options[id]) {
				case 'object':
					switch(id) {
						case 'history':
							this._showHistory(options.history)
							break;
						case 'polling':
					}
					break;
				case 'boolean':
					html.checkbox.push('<tr><td><input id="channelSettingsCheckbox' + id + '" type="checkbox" channelSetting="'+id+'"'+(options[id] ? ' checked' : '')+'></td><td><label for="channelSettingsCheckbox' + id + '">' + id + '</label></td></tr>');
					break;
				case 'number':
				case 'string':
					html.number.push('<tr><td>' + id + '</td><td><input type="text" class="inputNumber" channelSetting="'+id+'" value="'+options[id]+'"></td></tr>');
					break;
			}
		}
		
		var optionsDiv = $('#channel_options');
		optionsDiv.html('<table class="channelOptionsTable"><tbody>'
			+ html.checkbox.join('')
			+ html.number.join('')
			+ '</tbody></table>');
		var optionsBtns = $('<div class="channelOptionsButtons">').appendTo(optionsDiv);
		
		$('table input', optionsDiv).live('change', bind(this, 'saveSettings'));
		
//		$('<button>').html('reset').click(bind(this, 'resetSettings')).appendTo(optionsBtns);
//		$('<button>').html('save').click(bind(this, 'saveSettings')).appendTo(optionsBtns);
	}
	
	this.saveSettings = function() {
		var data = {},
			lastOptions = this._lastOptions,
			changed = false;
		
		$('input', $('#channel_options')).each(function(i) {
			var id = this.getAttribute('channelSetting');
			if (!id) { return; }
			
			var value;
			switch(typeof lastOptions[id]) {
				case 'boolean':
					value = !!this.checked;
					break;
				case 'number':
					value = parseFloat(this.value);
					break;
				case 'string':
					value = this.value;
					break;
			}
			
			if (lastOptions[id] != value) {
				lastOptions[id] = data[id] = value;
				changed = true;
			}
		});
		
		if (changed) {
			this.changeChannelSettings(data);
		}
	}
	
	this.resetSettings = function() { this._optionsForm(this._lastOptions); }
	
	this.CHANNEL_EVENT = function(args) {
		logger.debug('!ChannelView CHANNEL_EVENT', args);
		var msg = args.type,
			data = args.data;
		switch (args.type) {
			case 'create_channel':
				this._userList(data.subscribers);
				this._optionsForm(data.options);
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

exports.init = function() {
	GUI = new GUI();
	
	// link event delegation
	$('a', $('#body')).live('click', bind(util, 'onLinkClick'));
}