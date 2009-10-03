<?php

require_once('database.inc');

session_start();

$channel_name = mysql_real_escape_string($_POST['channel_name']);
$username = $_SESSION['username'];
$payload = mysql_real_escape_string($_POST['payload']);

mysql_query("INSERT INTO logs VALUES ( NULL, '${channel_name}', '${username}', '${payload}' ); ");

print '[true,{}]';

?>