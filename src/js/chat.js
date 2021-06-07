"use strict"

const socket = io();

const nickname = document.querySelector("#nickname");
const chatList = document.querySelector(".chatting-list");
const chatInput = document.querySelector(".chatting-input");
const sendButton = document.querySelector(".send-button");
const chattingInput = document.querySelector(".chatting-input");

sendButton.addEventListener("click", ()=> {
    if(document.querySelector(".chatting-input").value != ''){
        const param = {
            name : nickname.value,
            msg : chatInput.value
        }
        socket.emit("chatting", param);
        document.querySelector(".chatting-input").value = '';
    }

});
chattingInput.addEventListener('keyup', (e)=>{
    if(document.querySelector(".chatting-input").value != ''){
        if(e.keyCode === 13){
            const param = {
                name : nickname.value,
                msg : chatInput.value
            }
            socket.emit("chatting", param);
            document.querySelector(".chatting-input").value = '';
        }
    }
});


socket.on("chatting", (data)=>{
    const {name, msg, time } = data;
    const item = new LiModel(name, msg, time);
    item.makeLi();
});

function LiModel(name, msg, time){
    this.name = name;
    this.msg = msg;
    this.time = time;

    this.makeLi = ()=> {
        const li = document.createElement("li");
        li.classList.add(nickname.value === this.name ? "sent" : "recv");
        const dom = `
        <span class="profile">
            <span class="user">${this.name}</span>
            <img class="prof-image" src="https://placeimg.com/50/50/any" alt="any"/>
        </span>
        <span class="message">${this.msg}</span>
        <span class="time">${this.time}</span>`;
        li.innerHTML = dom;
        chatList.appendChild(li);
    }
}