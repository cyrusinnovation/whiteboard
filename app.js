
/**
 * Module dependencies.
 */

var express = require('express');
var sio = require('socket.io');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

app.listen(3000);
var currentID = 0;
var io = sio.listen(app)

io.sockets.on('connection', function (socket) {
	socket.userID = ++currentID;
	socket.emit('user count', currentID - 1);
	socket.broadcast.emit('user joined', socket.userID);
	
	socket.on('start drawing', function(xCoord, yCoord, color){
		socket.broadcast.emit('start drawing', xCoord, yCoord, color, socket.userID);
	});
	socket.on('stop drawing', function(){
		socket.broadcast.emit('stop drawing', socket.userID);
	});
	
	socket.on('drawing', function(xCoord, yCoord, color){
	  socket.broadcast.emit('drawing', xCoord, yCoord, color, socket.userID);	
	});
	
	socket.on('disconnect', function() {
		//TODO: remove canvas? not sure....
	})
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
