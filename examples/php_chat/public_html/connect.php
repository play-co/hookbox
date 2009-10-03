<?php

session_start();


if (empty($_SESSION['username']))
    $_SESSION['username'] =  substr(uniqid('guest'),0,8);

$return = array();
$return[0] = true;
$return[1]['name'] = $_SESSION['username'];


print_r(json_encode($return));

?>