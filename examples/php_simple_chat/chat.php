<?php

# Simple chat demo for Mountain View JavaScript Meetup Group
# 15 July 2010 -- Martin Hunt
#
# hookbox --admin-password=abc --cb-single-url="http://localhost/chat.php"
#
# See also http://hookbox.org/docs

session_start();

if (empty($_SESSION['username'])) {
	if (!empty($_POST['username'])) {
		$_SESSION['username'] = $_POST['username'];
	} else {
		echo "<form method='post' action='chat.php'><input name='username'><input type='submit' value='connect'>";
		exit(0);
	}
}
$username = $_SESSION['username'];

$form = array_merge($_GET, $_POST);
if (!empty($form["action"])) {
	switch($form["action"]) {
		case "connect":
			echo '[true, {"name":"'.$username.'"}]';
			break;
		case "create_channel":
			if ($form['channel_name'] == 'chat') {
				echo '[true, {"history_size": 30, '
					.'"history": [], '
					.'"presenceful": true, '
					.'"reflective": true}]';
			} else {
				echo '[false, {}]';
			}
			break;
		case "subscribe":
		case "publish":
		case "unsubscribe":
		case "disconnect":
			echo "[true, {}]";
			break;
		default:
			echo "[false, {}]";
			break;
	}
	exit(0);
}

?>
<!doctype html>

<style>
body { font: 16px Helvetica, Arial, sans-serif; font-weight: bold; padding: 40px; background: #88A; }
.box { border: 3px solid #EEE; -moz-border-radius: 5px; -webkit-border-radius: 5px; }
#history { height: 200px; width: 400px; background: #FFF; padding: 10px; overflow: auto;  margin: 0px auto 5px; }
#msg { height: 26px; width: 414px; padding: 3px; margin: 0px auto; display: block; background: #AAF; }
#msg:hover { background: #CCF;}
#msg:focus { background: #DDF; border-color: #AAF;}
</style>

<body>
<div class="box" id="history"></div>
<input class="box" id="msg">

<script src="//172.16.160.1:8001/static/hookbox.js"></script>
<script>
// UTILITY
$ = function(id) { return /^</.test(id) ? document.createElement(id.substring(1, id.length - 1)) : document.getElementById(id); }
parseDateTime = function(datetime) { var d = new Date(Date.parse(datetime.replace('T', ' ').replace(/\-/g, '/'))), h = d.getHours(), m = d.getMinutes(), s = d.getSeconds(); if (m < 10) { m = '0' + m; }; if (s < 10) { s = '0' + s; }; return [h, m, s].join(':'); }

// UI
var inputEl = $('msg'),
	historyEl = $('history');

inputEl.onkeypress = function(e) {
	if ((e || window.event).keyCode == 13) {
		conn.publish('chat', inputEl.value);
		inputEl.value = '';
	}
}

// NETWORK
var conn = hookbox.connect("http://172.16.160.1:8001");

conn.onSubscribed = function(name, subscription) {
	subscription.onPublish = function(args) {
		var msg = document.createTextNode(
			parseDateTime(args.datetime) + ' '
			+ args.user + ': '
			+ args.payload);
		
		historyEl.insertBefore($('<div>'), historyEl.firstChild)
			.appendChild(msg);
	}
}

conn.subscribe('chat');
</script>
