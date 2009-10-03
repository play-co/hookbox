<?php

require_once('database.inc');

session_start();

$username = mysql_real_escape_string($_POST['username']);
mysql_query("INSERT INTO users VALUES (NULL, '${username}'); ");

$_SESSION['username'] = $_POST['username'];

header('Location: test.html');

?>