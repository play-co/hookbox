<!doctype html>

<?php $host = !empty($_QUERY['host']) ? $_QUERY['host'] : 'http://'.$_SERVER['HTTP_HOST'].':8001'; ?>

<head>
<script src="<?php echo $host; ?>/static/hookbox.js"></script>
<script>
	function doChat() {
		var el = document.getElementById('chat_input');
		conn.publish('testing', el.value);
		el.value = '';
		el.focus();
	};
	
	function addHistory(txt) {
		var h = document.getElementById('history');
		h.appendChild(document.createElement('div')).innerHTML = txt;
		
		var shouldScroll = (h.scrollTop + h.offsetHeight) == h.scrollHeight;
		if (shouldScroll) { h.scrollTop = h.scrollHeight; }
	}
	
	onload = function() {
		hookbox.logging.get('hookbox').setLevel(hookbox.logging.DEBUG);
		hookbox.logging.get('net.protocols.rtjp').setLevel(hookbox.logging.DEBUG);
		conn = hookbox.connect('<?php echo $host; ?>');
		conn.onSubscribed = function(channel_name, subscription) {
			SUB = subscription;
			
			subscription.onPublish = function(frame) {
				addHistory(frame.user + ': ' + frame.payload);
			};
			
			subscription.onSubscribe = function(frame) {
				addHistory('* ' + frame.user + ' joined');
			}
			
			subscription.onUnsubscribe = function(frame) {
				addHistory('* ' + frame.user + ' left');
			}
			
			subscription.onFailure = function(msg) {
					alert('Error: ' + msg);
			}
			
			subscription.onState = function(frame) {
				addHistory("* Channel State Changed...");
			}
			
			for (var i = 0, item; item = subscription.history[i]; ++i) {
				var name = item[0];
				var frame = item[1];
				if (name == 'SUBSCRIBE') { subscription.onSubscribe(frame); }
				if (name == 'UNSUBSCRIBE') { subscription.onUnsubscribe(frame); }
				if (name == 'PUBLISH') { subscription.onPublish(frame); }
			}
			
			addHistory('* ' + conn.username + ' enters ' + channel_name);
		}
		
		conn.onUnsubscribed = function(sub, args) {
			addHistory("** You have been unsubscribed from the channel");
		}
		
		conn.onError = function(frame) { alert("Error: " + frame.msg); }
		
		conn.subscribe('testing');
	}
</script>
<link rel="stylesheet" href="chat.css">
</head>

<body>
	<div id="wrapper" class="inset">
		<h1>PHP Hookbox Chat</h1>
		<div id="history" class="inset"></div>
		<form onsubmit="doChat(); return false;">
		<input type="text" id="chat_input" class="inset" />
		<input type="submit" id="chat_send" value="send" />
		</form>
	</div>
</body>
