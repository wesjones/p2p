<?php

$file = 'online_peers.txt';
$projectId = $_GET['p'];
$peerId = $_GET['id'];
$time = time();

$json = file_get_contents($file);
$projects = json_decode($json);

if ($projects->$projectId) {
    $projects->$projectId->$peerId = $time;
} else {
    $projects->$projectId = new stdClass();
}
$projects->$projectId->$peerId = time();

// now clean out any old ones.
$old = $time - 60;
foreach($projects as $k=>$v) {
    foreach($v as $vk=>$vv) {
        if (intval($vv) < $old) {
            unset($v->$vk);
        }
    }
}
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
file_put_contents($file, json_encode($projects));
echo json_encode($projects->$projectId);