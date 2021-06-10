"use strict"

const nickname = document.querySelector(".nickname");
const socket = io();
const afk = document.querySelector(".afk");
const chatList = document.querySelector(".chatting-list");
const chatInput = document.querySelector(".chatting-input");
const sendButton = document.querySelector(".send-button");
const chattingInput = document.querySelector(".chatting-input");
const room = document.querySelector(".roomname");

sendButton.addEventListener("click", function(){
    if(document.querySelector(".chatting-input").value != ''){
        const param = {
            nick : nickname.value,
            msg : chatInput.value,
            room : room.value
        }
        socket.emit("sendChat", param);
        document.querySelector(".chatting-input").value = '';
    }

});
chattingInput.addEventListener('keyup', function(e){
    if(document.querySelector(".chatting-input").value != ''){
        if(e.keyCode === 13){
            const param = {
                nick : nickname.value,
                msg : chatInput.value,
                room : room.value
            }
            socket.emit("sendChat", param);
            document.querySelector(".chatting-input").value = '';
        }
    }
});


socket.on("chatting", function(data){
    const {nick, msg, time, room } = data;
    console.log(data);
    document.getElementById('Headerchat').innerHTML = room;
    const item = new LiModel(nick, msg, time);
    item.makeLi();
});

function LiModel(nick, msg, time){
    console.log(nick)
    this.nick = nick;
    this.msg = msg;
    this.time = time;
    console.log(this.name);
    this.makeLi = ()=> {
        const li = document.createElement("li");
        li.classList.add(nickname.value === this.nick ? "sent" : "recv");
        const dom = `
        <span class="profile">
            <span class="user">${this.nick}</span>
            <img class="prof-image" src="https://placeimg.com/50/50/any" alt="any"/>
        </span>
        <span class="message">${this.msg}</span>
        <span class="time">${this.time}</span>`;
        li.innerHTML = dom;
        chatList.appendChild(li);
    }
}

afk.addEventListener("click", function(event){
    const li = document.createElement("li");
    if(event.target.checked)  {
        li.innerHTML = `${nickname.value}님이 자리를 비웠습니다!`;
    }else {
        li.innerHTML = `${nickname.value}님이 자리를 돌아왔습니다!`;
    }
    chatList.appendChild(li);
})