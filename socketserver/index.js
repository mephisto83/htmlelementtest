var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util = require('util');
var clients = [];
io.on('connection', function (socket) {
    clients.push(socket.id);
    var clientConnectedMsg = 'User connected ' + util.inspect(socket.id) + ', total: ' + clients.length;
    console.log(clientConnectedMsg);
    socket.on('disconnect', function () {
        clients.pop(socket.id);
        var clientDisconnectedMsg = 'User disconnected ' + util.inspect(socket.id) + ', total: ' + clients.length;
        console.log(clientDisconnectedMsg);
    })
});
http.listen(3000, function () {
    console.log('listening on *:3000');
});
function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}
function sendWind() {
    console.log('Wind sent to user');
    io.emit('new wind', getRandomInRange(0, 360));
}
let index = 0;
function sendObject() {
    console.log('image update');
    let list = ['adrian-swancar-lyhtI3rN1xM-unsplash.jpg', 'bogdan-glisik-GQJt1v5Ln-8-unsplash.jpg', 'ashton-bingham-EQFtEzJGERg-unsplash (1).jpg', 'cristian-s-i6GlzjjUapg-unsplash.jpg']
    io.emit('sendObject', { imgSrc: `D:\\temp\\${list[index % list.length]}` });
    index++;
}
setInterval(sendWind, 3000);
setInterval(sendObject, 5000);