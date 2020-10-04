const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/messages')
const { addUser, getUser, removeUser, getUsersInRoom} = require('./utils/users')

const app = express()

//to support websockets
const server = http.createServer(app)
const io = socketio(server)
const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, './views'));

app.get('/chat', (req, res)=>{
    res.sendFile(path.join(__dirname, '../public/index.html'))
})

app.get('/chatroom', (req, res)=>{
    res.sendFile(path.join(__dirname, '../public/chat.html'))
})
// app.get('/joinChat', (req, res)=>{
//     res.render('joinChat.ejs')
// })

const welcome = "Welcome!"
io.on('connection', (socket)=>{
  
    socket.on('sendMessage', (message, callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback("message delivered")
    })
    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if(user){
            const text = `${user.username} has left the chat`
            io.to(user.room).emit('message', generateMessage('Admin',text))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })
    //location
    socket.on('sendLocation', (location, callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })
    socket.on('join', ({username, room}, callback)=>{
        const {error, user} = addUser({id: socket.id, username, room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
})

server.listen(port, ()=>{
    console.log("server is up on port", port)
})