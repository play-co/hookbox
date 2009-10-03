<?php

require_once('database.inc');

$return = array();
$return[0] = false;
$return[1] = array();

$channel_name = mysql_real_escape_string($_POST['channel_name']);
$result = mysql_query("SELECT * FROM channels WHERE channel_name = '${channel_name}';");
$result = mysql_fetch_row($result);
if (empty($result))
{
    $return[1]['error'] = 'Channel does not exist.';
}
else
{
    $return[0] = true;
    $return[1]['history_size'] = 5;
    $return[1]['reflective'] = true;
}

print_r(json_encode($return));

?>