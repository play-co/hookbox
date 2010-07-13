<?php

session_start();

if (empty($_SESSION['username']))
	$_SESSION['username'] =  'guest'.substr(base64_encode(rand(1000000000,9999999999)),0,3);

$return = array();
$return[0] = true;
$return[1]['name'] = $_SESSION['username'];

print_r(json_encode($return));

?>
