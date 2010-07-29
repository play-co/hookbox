<?php

$HOOKBOX_URL = "http://localhost:8001";
$HOOKBOX_SECRET = 'secret';
$SCRIPT_EXTERNAL_URL = 'http://localhost/graph.php';
$POLL_INTERVAL = 1;
$CHANNEL_NAME = 'graph_data_channel';

function main() {
	global $HOOKBOX_SECRET, $SCRIPT_EXTERNAL_URL, $POLL_INTERVAL, $CHANNEL_NAME;
	$form = array_merge($_GET, $_POST);

	// All callbacks we get will have the "action" form key. If we don't see
	// that key, then return the static page (a user is visiting this script
	// directly in a browser
	if (!in_array("action", array_keys($form))) {
		return static_page();
	}
	// If we see the "action" form key, then hookbox is making a request to our
	// script. Check to secret to make sure the request is from hookbox.
	if ($form["secret"] != $HOOKBOX_SECRET) {
		print("[ false, { \"error\": \"Invalid secret\" } ]");
		return;
	}


	switch($form["action"]) {
		// Allow all users to connect; assign them a random name;
		case "connect":
			$name = uniqid();
			echo "[ true, {\"name\": \"$name\" } ]";
			break;
		// Only allow hookbox to create one channel, specified by $CHANNEL_NAME
		case "create_channel":
			if ($form["channel_name"] == $CHANNEL_NAME) {
				$output = array();
				$output[0] = true;
				$output[1] = array();
				// our channel will acquire data by having hookbox poll this script
				// (and then rebroadcast it to subscribers)
				$output[1]["polling"] = array();
				$output[1]["polling"]["url"] = $SCRIPT_EXTERNAL_URL."?action=poll&secret=".$HOOKBOX_SECRET;
				$output[1]["polling"]["interval"] = $POLL_INTERVAL;
				$output[1]["polling"]["mode"] = "simple";
				// We'll have hookbox store 30 data points
				$output[1]["history_size"] = 30;
				$output[1]["history"] = array();
				// Those 30 data points should start out pre-populated as the value 0.
				for ($i = 0; $i < 30; $i++) {
					$output[1]["history"][$i] = array(0=>"PUBLISH", 1=>array("payload" => 0));
				}
				// returning json: [true, { "polling": { ... }, "history": [ .. ], ... } ]
				print_r(json_encode($output));
			} else {
				$chan = $form["channel_name"];
				echo "[ false, {\"error\": \"Cannot create channel $chan\"} ]";
			}
			break;
		// Let anyone subscribe to that one channel
		case "subscribe":
			echo "[ true, {} ]";
			break;
		// If the server is polling then print out the server load;
		case "poll":
			// NOTE: If you aren't on a system with an uptime command then
			//       try replacing this with some other integer. Perhaps
			//	 something random...
			$cpu_usage = explode(',', substr(exec('uptime'), -14)); 
			print($cpu_usage[0]);
			break;
		case "destroy_channel":
			// By allowing destroy channel we prevent hookbox from polling this
			// script when their are no users watching. On the other hand, we lose
			// the graph's history of the last 30 values...
			echo "[ true, {} ]";
			break;
		// Don't allow any other actions, such as publish 
		default:
			echo "[ false, {} ]";
			break;

	}
}

function static_page() {
	global $HOOKBOX_URL;
	global $CHANNEL_NAME;
	print <<<END
<html>
 <script src="$HOOKBOX_URL/static/hookbox.js"></script>
 <script>
  onload = function() {
   hookbox.logging.get('net.protocols.rtjp').setLevel(hookbox.logging.DEBUG);
   // This setTimeout avoids some loading bar nonsense
   setTimeout(function() {
     conn = hookbox.connect("$HOOKBOX_URL");
     conn.onClose = function() {
        document.body.innerHTML += "Connection Lost, please refresh";
     }
     conn.subscribe("$CHANNEL_NAME");
     conn.onSubscribed = function(channel_name, subscription) {
       function draw() {
         for (var i = 0, datum; datum = subscription.history[i]; ++i) {
            document.getElementById("col" + i).style.height=datum[1].payload;
         }
       } 
       subscription.onPublish = function() {
         draw();
       }
       draw();
     }
   }, 0);
   // setup board
   for (var i = 0; i < 30; ++i ) {
     var s = document.createElement("span");
     s.className = "bar";
     s.id = "col" + i;
     s.style.left = 14* i;
     document.getElementById("graph").appendChild(s);
   }
  }
 </script>
 <style>
  .bar {
     position: absolute;
     bottom: 0;
     width: 10px;
     margin: 2px;
     background: red;
     border: 1px solid black;
  }
  </style>
 <body>
  <h1>Real-time PHP CPU Graph!</h1>
  <div id="graph" style="position: relative; height: 100px; border: 1px solid black; width: 422">
  </div>
 </body>
</html>
END;

}

main();

?>
