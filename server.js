var express     = require('express');
var serveStatic = require('serve-static');
var morgan 		= require('morgan');
var io			= require('socket.io')();
var redis		= require('redis');

var app = express();

app.use(morgan('dev')); // Logger.

app.use(serveStatic('public', {})); // Used to serve static content.

app.get('*', function (req, res, next) {
	res.sendFile(__dirname + '/index.html');
});

var server = app.listen(8080, '127.0.0.1', function () { // TODO export host and port in a config file.
	var host = server.address().address;
	var port = server.address().port;
	console.log('Server running at %s:%s', host, port);
});

var users = [];

var clientRedis = redis.createClient();

clientRedis.on('error', function (err) {
	console.log('Redis DB encoutered an error : ' + err);
});

clientRedis.on('ready', function () {
	console.log('Redis DB ready.');
});

io.on('connection', function (socket) {
	socket.on('sendMessageToServer', function (message) {
		message.timestamp = Date.now();
		io.emit('broadcastMessageToClients', message);
	});

	socket.on('claimPseudo', function (pseudo) {
		// TODO Check if this pseudo is not already taken.
		users.push(pseudo);
		socket.pseudo = pseudo;
		io.emit('updateUsers', users);
	});

	socket.on('disconnect', function () {
		if (socket.pseudo) {
			users.splice(users.indexOf(socket.pseudo), 1);
			io.emit('updateUsers', users);
		}
	});

	console.log('Connection !');
});

io.listen(server);