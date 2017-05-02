var express = require('express');
var app = express();
var path = require('path');
app.use(express.static(path.join(__dirname,"./public")));
app.get('/',function(req,res){
	res.render('index');
});
var server = app.listen(8000,function(){
	console.log("listening on port 8000");

});


// ==== socket.io ====
// https://github.com/socketio/socket.io/blob/master/docs/README.md
var io = require('socket.io').listen(server);
var chatHistory = '';
const decks = {
	animal: ['a','b','c','d','e'],
	event: ['f','g','h','i','j'],
	name: ['karina','allan','trevor'],
	place: ['oregon','washington','california']
}
const currentRooms = {
	currentRooms : [],
	numOfPlayers : 0,

	//remove all clients from room
	destroyAll () {

	},

	//remove single client from room
	removePlayer (){

	},
	//ban client
	banPlayer(){

	},

	get CurrentNumOfPlayers (){
		console.log(`currently connected players: ${this.numOfPlayers}`);
	}

}
const roomIdGenerator = function(roomName){
  min = Math.ceil(100000);
  max = Math.floor(9999999);
  let id = Math.floor(Math.random() * (max - min)) + min ;
  roomName += "(" + id + ")" ;
  return roomName ;
}
io.sockets.on('connection',function(socket){
	++currentRooms.numOfPlayers;
	currentRooms.CurrentNumOfPlayers;

	// assign id immediately! 
	socket.emit('assignID', socket.id);

// ==== BEFORE GAME ====
// =====================

	// Create room
	socket.on('createRoom', (obj) => {
		let roomHash = roomIdGenerator(obj.roomName);
		socket.join(roomHash);
		let socketId = Object.keys(io.sockets.sockets)[Object.keys(io.sockets.sockets).length -1];
		socket.emit('roomCreated',{roomName: roomHash, id: socketId, username: obj.playerName});
	});

	// Join existing room
	socket.on('joinRoom',(obj)=>{
		socket.join(obj.roomName);
		let socketId = Object.keys(io.sockets.sockets)[Object.keys(io.sockets.sockets).length -1];
		console.log(Object.keys(io.sockets.sockets))
		socket.emit('roomJoined', {roomName: obj.roomName, id: socketId, name: obj.name});
		socket.to(obj.roomName).emit('newPlayerJoinedRoom', {roomName: obj.roomName, id: socketId, name: obj.name});
	});

	// send joined player list of already existing players
	socket.on('sendListOfPlayers', (obj) => {
		socket.to(obj.id).emit('getExistingPlayers', {list: obj.list})
	});

	socket.on('playerReadyToPlay',(obj) => {
		socket.to(obj.roomName).emit('playerIsReady', obj);
	});

	socket.on('playerReadyToSpectate',(obj) => {
		socket.to(obj.roomName).emit('playerIsSpectating', obj);
	});





// ==== DURING GAME ====
// =====================

	// send message to other clients letting know game will start soon:
	socket.on('setupGame',(roomName)=>{
		socket.broadcast.in(roomName).emit('settingUpGame', 'Getting ready to start the game!');
	});

	// choose from decks and send back to drawer
	socket.on('getDeck',(data)=>{
		io.in(data.roomName).emit('deckRecieved', decks[Object.keys(decks)[data.deckNumber]]);
	});

	// tell other clients in room to begin countdown timer
	socket.on('beginGame', (data) => {
		socket.broadcast.in(data.roomName).emit('gameBegun',data.cardAn);
	});

	// emit.setup will transfer chatHistory and any setup data for newcomers
	socket.emit('setup', {"chatHistory":chatHistory});

	// once a connection with certain name:
	socket.on('chatUpdate', function(data){
		chatHistory = data.currentChat; // maintain server-side copy of chat for newcomers
		socket.broadcast.emit('chatUpdate', data);
	});

	socket.on('playerDrawing',function(package){
		socket.broadcast.emit('playerStartedDrawing',package);
	});

	socket.on('stopDrawing',function(){
		socket.broadcast.emit('playerStopDrawing');
	});

	//when receive startgame choose who is drawer
	socket.on('startGame',() => {

	});



// ==== AFTER GAME ====
// =====================

	// leave room
	socket.on('leaveRoom',(roomName)=>{
		socket.leave(roomName);
		// socket.emit('chooseAnotherRoom');
	});








//------------------------------------------------------------------------------------------


	socket.on('test',(roomName)=>{
		socket.join(roomName);
		var clients = io.sockets.adapter.rooms[roomName];
		console.log('my clients: ',clients);
		var clientList = Object.keys(io.sockets.sockets);
		io.to(testingThis).emit('messge','object');
	})


// == Helpers
	// send back to connected clients
	socket.emit("identifier_for_message", {})

	// send back to everyone except newly connected
	socket.broadcast.emit("identifier_for_message", {});

	// socket disconect
	socket.on('disconnect',function(){
		--currentRooms.numOfPlayers;
		console.log('LEFT!')
		socket.emit('userDC', {"msg": 'User has left the game.'});
	});
});
