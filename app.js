const express = require("express");
const http = require("http");
const app = express();
const path = require("path");
const server = http.createServer(app);

const socketIO = require("socket.io");

const io = socketIO(server);

app.use(express.static(path.join(__dirname, "src")));

const PORT = process.env.PORT || 5555;


io.on("connection", (socket)=>{
    console.log("socket.io : 연결이 이루어 졌습니다.")
});

app.listen(PORT, () => console.log(`server is running port : ${PORT}`));