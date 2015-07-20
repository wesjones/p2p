function P2P(key, name, user) {
    var peer;
    var connectedPeers = {};
    var myId;
    var intvId;
    var options = {label: name, metadata: user};
    var msgCallback;

    function startPing(intv, initCall) {
        clearInterval(intvId);
        console.log('ping every ' + intv + 's');
        intvId = setInterval(ping, intv * 1000);
        if (initCall) {
            ping();
        }
    }

    function ping() {
        if (!myId) {
            return;
        }
        console.log('ping');
        hb.http.get(
            'http://codeguyz.com/rtc/peer_handshake.php?p=peer_test&id=' + myId,
            function (response) {
                console.log(response);
                // we need to connect to all connections we are not connected to.
                for (var i in response.data) {
                    if (i !== myId && !connectedPeers[i]) {
                        console.log('attempt to connect to ' + i);
                        // start the connection
                        var conn = peer.connect(i, options);
                    }
                }
            },
            function () {
                console.log('failed');
            }
        );
    }

    function send(message) {
        for (var i in connectedPeers) {
            if (connectedPeers.hasOwnProperty(i)) {
                var conns = peer.connections[i];
                for (var j = 0; j < conns.length; j += 1) {
                    conns[j].send(message);
                }
            }
        }
    }

    function connect(ready) {
        if (!peer) {
            peer = new Peer({key: key});
            peer.on('open', function (id) {
                console.log('My peer ID is: ' + id);
                myId = id;
                startPing(10, true);
            });

            // listen on the connection
            peer.on('connection', function (conn) {
                console.log('connected', conn);
                ready && ready();
                conn.on('open', function () {
                    console.log('open');
                    // we made a connection. slow down the ping.
                    startPing(60);
                    if (!connectedPeers[conn.peer]) {
                        connectedPeers[conn.peer] = conn;// we are connected.
                        peer.connect(conn.peer, options);
                    }
                    // Receive messages
                    conn.on('data', function (data) {
                        console.info('Received', data);
                        msgCallback && msgCallback(data);
                    });

                    // Send messages
                    //            conn.send('Hello!');
                    console.log(peer.connections[conn.peer]);
                });
            });
        }
    }

    function onMessage(fn) {
        msgCallback = fn;
    }

    this.connect = connect;
    this.send = send;
    this.onMessage = onMessage;
}