//to connect to the server
const socket = io()

//elements
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#sendLocation')
const $messages = document.querySelector("#messages")

//template
const $messageTemplate = document.querySelector("#message-template").innerHTML
const $locationMessageTemplate = document.querySelector("#location-message-template").innerHTML
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})


const autoscroll = () =>{
    //new message element
    const $newMessage = $messages.lastElementChild
    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight
    
    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (welcome)=>{
    console.log(welcome)
    const html = Mustache.render($messageTemplate, {
        username: welcome.username,
        createdAt: moment(welcome.createdAt).format('h:mm a'),
        message: welcome.text
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
    // var p = document.createElement("p")
    //     p.classList.add('container')
    //     p.textContent = welcome
    //     document.body.appendChild(p)
})

socket.on('locationMessage', (message)=>{
    console.log(message)
    const html = Mustache.render($locationMessageTemplate, {
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm a'),
        message: message.text
    })
    console.log(message)
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
    // const a = document.createElement("a")
    // a.href = message
    // a.appendChild($messages)
})

socket.on('roomData', ({ room, users}) =>{
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    }) 
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    //disable form 
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (response)=>{
        //enable
        $messageFormButton.removeAttribute('disabled', 'disabled')
        $messageFormInput.value = ""
        $messageFormInput.focus()
        console.log(response)
        if(response === "Profanity is not allowed"){
            alert("Profanity is not allowed")
        }
        else if(response === "message delivered"){
            console.log("message delivered")
        }
        else{
            //if none of the others were received, log this
            console.log("I am the receiver")
        }
    })
})

$sendLocation.addEventListener('click',(e)=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    //disable
    $sendLocation.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        console.log(position)
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, ()=>{
            //enable
            $sendLocation.removeAttribute('disabled', 'disabled')
            console.log("location shared")
        })
    })
})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href = '/chat'
    }
})