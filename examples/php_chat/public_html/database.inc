<?php

$db_name = "php_chat";
$db_host = 'localhost';
$db_user = 'root';
$dp_pw = '';

$link = mysql_connect($db_host, $db_user, $db_pw);
if (!$link)
{
    die('Unable to connect to mysql: ' . mysql_error());
}
mysql_select_db($db_name);

?>