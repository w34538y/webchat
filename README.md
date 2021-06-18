App.js – 서버 프로그램
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const app = express();
const path = require("path");
const server = http.createServer(app);
const moment = require("moment");
const mysqlDB = require("mysql");
let cookieParser = require('cookie-parser');
const mysqlDB_conn = mysqlDB.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'chatting',
    password : 'chatting132',
    database : 'chatDB'
});
mysqlDB_conn.connect();
// node.js의 모듈을 불러옴. Express(웹 서버), body-parser, http를 불러와준다. 
// app 변수에 express모듈 함수를 넣어준다. Path 변수에는 경로를 읽어들이는 Path 모듈을 불러 넣어준다. 그리고 서버를 http 모듈을 이용하여 생성해주고 함수인자로 App을 넣어 모듈이 서버에서 돌도록 해준다. 
// moment는 시간 호출 모듈로 현재 시간을 불러오는데 사용, mysql모듈을 불러와서 변수에 넣고 mysql 연동을 준비한다. mysqlDB_conn에 db 연결 설정을 해준 다음 connect()를 해준다. 
// 또한 쿠키를 사용할 것이기에 cookie-parser도 모듈 로드를 해준다.

const socketIO = require("socket.io");
const io = socketIO(server);
// socket.io 모듈을 불러와서 server를 socketIO 변수에 넣어 socket.io 모듈을 이용한다.

app.use(express.static(path.join(__dirname, "src")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(cookieParser());
// express 모듈이 파일을 읽어들일 경로를 지정해준다. __dirname은 실행 위치의 경로이며 그 뒤에 추가 경로를 붙여준다. 그리고 bodyparser.json()을 통해서 json 형태로 바디에서 넘어오는 데이터를 변환해준다.

const PORT = process.env.PORT || 5555;
// 포트번호를 지정한다. 기본 포트를 사용하거나 5555번을 사용하는데 여기서 5555번을 사용한다. 

app.set('views', __dirname+'/src'); //뷰페이지 경로 지정
app.set('view engine', 'ejs'); // 사용할 뷰 템플릿 엔진을 설정에 등록한다.
app.engine('ejs', require('ejs').__express); // ejs 모듈 로드 실패시 다시 불러와줌

app.get("/join", function(req,res){
    res.sendFile(__dirname+'/src/join.html');
});
// 회원가입 페이지 연결 시 join.html 페이지를 불러와 이동시켜 줌

app.post('/join', function(req, res){
    let body = req.body;
    let id = body.id;
    let passwd = body.passwd;
    let nick = body.nickname;
    if(id != '' && passwd != '' && nick != ''){
        let insert_sql = 'INSERT INTO userDB(id,passwd,nickname) VALUES (?,?,?)';
        let param = [id, passwd, nick];
        mysqlDB_conn.query(insert_sql, param, function(err,rows,fields) {
            if(err){
            console.log(err);
            }else{
            console.log(rows.insertId);
            res.send('<script type="text/javascript">alert("가입을 환영합니다!"); location.href="/login";</script>');
            }
        });
    }
});
// 회원가입 작성을 완료하여 가입하기 버튼을 누르면 post방식으로 전송되어 서버에서 요청받은 body의 id, passwd, nick을 받아 와서 이것을 DB에 저장시켜준다. If문을 통해 에러가 발생하면 콘솔에 에러 메시지를 알려주고 데이터 베이스에 삽입 된 과정이 정상이라면 가입을 환영하는 알림을 띄워준 뒤 로그인 페이지로 이동시켜준다.

app.get("/login", function(req,res){
    res.sendFile(__dirname+'/src/login.html');
});
// 로그인 페이지를 연결할 시 login.html을 보내주어 띄운다. 

app.post('/login', function(req, res){
    let body = req.body;
    let id = body.id;
    let passwd = body.passwd;
    mysqlDB_conn.query('SELECT * FROM userDB WHERE id=? and passwd=?',[id, passwd], function(err,rows,fields) {
        if(err){
            console.log(err);
        }else{
            if(rows[0] != undefined){
                console.log('login success');
                res.cookie('loginCookie', id);
                res.redirect("/lobby");
            }
            else{
                res.send('<script type="text/javascript">alert("아이디/비밀번호를 확인해주세요!"); history.back();</script>');
            }
        }
    });
});
// 로그인 페이지에서 아이디, 비밀번호를 입력하면 가입처럼 요청받은 body의 아이디와 비밀번호를 넘겨받는다. 이때 sql db에 접속해서 데이터가 일치하는지 확인을 하는데 만약 에러가 날 경우 에러 메시지를 콘솔에 띄워주고 일치하면 다시 If문을 한번 더 활용하는데 이것은 아이디가 일치할 경우 와 일치하지 않는 경우 두가지로 나눈다. 일치하는 경우라면 rows에 값이 있기에 if문을 실행하여 콘솔에 로그인 성공 메시지를 띄우고 쿠키에 로그인한 정보를 저장하여 로그인 세션을 유지시켜준다. 그리고 로비로 이동시켜준다. 만약 일치하지 않는다면 아이디/비밀번호를 확인해달라는 알림을 띄운 후 로그인창으로 뒤로가기 시켜준다.  

app.get('/logout', function(req, res){
    res.clearCookie("loginCookie");
    res.redirect('/');
});
// 로그아웃 버튼이 눌리면 로그인 할때 사용한 쿠키를 clearCookie를 통해 제거해주고 홈페이지로 이동시켜준다. 

app.get("/lobby", function(req,res){
    let welcome_id = req.cookies.loginCookie;
    mysqlDB_conn.query('SELECT nickname FROM userDB WHERE id=?',[welcome_id], function(err,rows,fields) {
        if(err){
            console.log(err);
        }else{
            if(rows[0] != undefined){
                res.render('lobby',{nick: rows[0].nickname});
            }
        }
    });
});
// 로비에 입장을 하게 되면 쿠키의 아이디를 넘겨받아서 DB에서 닉네임을 추출하여 lobby 페이지에 키-값 형태로 닉네임을 넘겨준다. 그리고 lobby.html을 렌더링 해준다. 

app.get("/search", function(req,res){
    res.sendFile(__dirname+'/src/search.html');
});
// 채팅 로그 검색 버튼을 누르면 search 페이지로 이동되며, 이때 서버에서 search.html 페이지를 보내준다. 

app.post("/result", function(req, res){
    let search_index = req.body.search;
    console.log(search_index);
    mysqlDB_conn.query('SELECT uname, msg, time FROM chatlog WHERE roomname=?',[search_index], function(err,rows,fields) {
        if(err){
            console.log(err);
        }else{
            if(rows[0] != undefined){
                let array = [];
                for(let i = 0; i < rows.length; i++){
                    array[i] = {nick: rows[i].uname, msg: rows[i].msg, time: rows[i].time};
                }
                console.log(array);
                res.render('resultpage', {list: array});
            }
        }
    });
});
// 채팅 로그 검색 페이지에서 post 방식으로 검색 요청이 넘어오면 body의 search 값을 넘겨 받은 뒤에 sql db에서 해당 하는 방 이름 값에 맞는 대화 내역을 불러온다. 정상적으로 불러와지면 array 배열에 닉네임, 메시지, 전송시간 값들을 객체 배열 형태로 반복문으로 담아준다. 그리고 이것을 resultpage에 list라는 키와 array라는 값으로 넘겨준다. 그러면 이 값이 테이블에 렌더링 되어 하나씩 나온다. 

app.get("/withdraw", function(req, res){
    let id = req.cookies.loginCookie;
    mysqlDB_conn.query('SELECT nickname FROM userDB WHERE id=?',[id], function(err,rows,fields) {
        if(err){
            console.log(err);
        }else{
            if(rows[0] != undefined){
                mysqlDB_conn.query('DELETE FROM chatlog WHERE uname=?',[rows[0].nickname], function() {
                });
            }
        }
    });
    mysqlDB_conn.query('DELETE FROM userDB WHERE id=?',[id], function() {
        res.send('<script type="text/javascript">alert("탈퇴처리 되었습니다!"); window.location.href="/";</script>');
    });
});
// 회원 탈퇴 기능이다. 회원 탈퇴 버튼을 누르면 쿠키의 아이디 값을 읽어들이는데 이것으로 우선 DB에서 닉네임을 찾아온다. 그리고 그 닉네임에 해당하는 채팅 내역을 DB에서 Delete 시켜주는데 아까 위에서 찾아온 닉네임 값을 인자로 넣어준다. 그러면 채팅 내역이 삭제 된다. 그 후 userDB에서 아까 불러온 id를 값으로 넣어주어 유저 정보를 삭제한다. 그 후 탈퇴 처리가 되었다는 알림을 띄워주고 홈페이지로 이동시켜준다. 

io.on("connection", function(socket){
    socket.on("sendChat",(data)=>{
        const {nick, msg, room} = data;
        socket.join(data.room); 
        io.to(data.room).emit('chatting', {
            nick, msg, time: moment(new Date()).format("hh:mm"), room
        });
        // sql로 채팅 내역 저장하기 
        var insert_sql = 'INSERT INTO chatLog(uname,msg,roomname) VALUES (?,?,?)';
        var param = [nick, msg, room];
        mysqlDB_conn.query(insert_sql, param, function(err,rows,fields) {
            if(err){
              console.log(err);
            }else{
              console.log(rows.insertId);
            }
          });
    });

});
// 여기서 소켓으로 연결되어 서버와 클라이언트가 통신한다. sendChat이라는 신호를 받으면 넘어온 데이터를 Nick, msg, room으로 쪼개는데 이때 room은 대화방의 이름이며 해당 대화방에 있는 사람들 끼리 대화를 할 수 있도록 Socket.join(room)을 해준다. 그러면 해당 대화방에 접속이 되며 io.to(data.room).emit()을 통해서 해당 방에 메시지가 전달된다. 전달 되는 내용은 nick, msg, time이며 닉네임, 메시지 시간이 전송되는데 시간은 아까 로드한 Moment 모듈을 이용한다. 형식은 moment(new Data()).format(“hh:mm”)으로 지정해주었다. 

이 부분에서 싱글 스레드로 작동하게 되는데 내부에서는 자동적으로 멀티 스레드를 구성하여 처리를 도와준다. Non-blocking 방식으로 비동기로 작동하며 이것을 통해 작업을 여러개 동시에 처리할 수 있다. 

server.listen(PORT, () => console.log(`server is running port : ${PORT}`));
// 이 부분은 서버의 리스닝 포트를 설정하여주고 콜백함수를 통해 서버가 구동될때 서버의 포트를 확인시켜준다. 



chat.js – 채팅 구현 프로그램
"use strict"

const nickname = document.querySelector(".nickname");
const socket = io();
const afk = document.querySelector(".afk");
const chatList = document.querySelector(".chatting-list");
const chatInput = document.querySelector(".chatting-input");
const sendButton = document.querySelector(".send-button");
const chattingInput = document.querySelector(".chatting-input");
const room = document.querySelector(".roomname");
// 쿼리 셀럭터를 통해서 채팅창의 인풋들을 가져와 준다. 

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
// 전송버튼을 눌렀을때 이벤트를 지정한다. 만약 채팅 입력창이 비어있지 않다면 param으로 nick, msg, room 정보를 담아서 보내고 이것을 소켓에 emit시켜준다. Emit 할때는 sendChat 값으로 보내야 서버와 일치 된다. Param 값도 같이 넘겨준다. 
그리고 입력창을 빈칸으로 만들어준다. 

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
// 여기는 전송버튼과 기능이 같지만 채팅 입력창에서 엔터를 쳤을때 전송을 하는 함수이다. 

socket.on("chatting", function(data){
    const {nick, msg, time, room } = data;
    console.log(data);
    document.getElementById('Headerchat').innerHTML = room;
    const item = new LiModel(nick, msg, time);
    item.makeLi();
});
// 소켓을 통해 데이터를 주고 받는 함수이다. 메시지 데이터를 읽어 들이며 방 이름을 바꿔주고 읽어들인 메시지를 item.makeLi()를 이용해서 채팅창에 렌더링 해준다 

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
// Li 모델을 만들어 주는 함수이다. 읽어들인 닉네임, 메시지, 시간을 li 태그 안에 넣어서 모양을 만들어주고 이것을 ul 리스트 안에 추가를 해준다. 

afk.addEventListener("click", function(event){
    const li = document.createElement("li");
    if(event.target.checked)  {
        li.innerHTML = `${nickname.value}님이 자리를 비웠습니다!`;
    }else {
        li.innerHTML = `${nickname.value}님이 자리를 돌아왔습니다!`;
    }
    chatList.appendChild(li);
})
// 이부분은 자리비움 상태 표시로 체크박스를 누르면 자리를 비웠다는 알림과 돌아왔다는 알림을 렌더링 해준다. makeLi와 유사한 구조를 가지고 있다. 






추가 기능 목록


-	1:1 및 다중 채팅을 하이브리드로 구현
-	자리비움 기능 구현 
-	채팅 내용 검색 구현 
-	회원 탈퇴와 동시에 채팅 내역 삭제 기능 구현



습득한 기술

-	자바스크립트와 Node.JS를 이용한 서버 구축과 DB 연동 
-	채팅 UI 구현 
-	소켓 통신을 이용한 실시간 웹 서비스 제공
-	소켓을 이용하여 서버와 클라이언트간의 통신 환경 구축 
-	Node.JS의 각종 모듈 사용 방법 
-	프론트엔드와 백엔드 지식



소감

이번 기말과제 프로젝트를 통해서 직접 웹 서버를 구축하고 소켓 통신을 이용해서 실시간으로 채팅 서비스를 만들어보면서 Node.js라는 프레임워크와 자바스크립트 그리고 HTML 구조에 대해서 더 많은 이해를 하게 되었고, DB 연동을 통해서 데이터 저장을 실제로 해봄으로써 실제 웹 서비스의 구조를 간략하게나마 이해할 수 있었다. 이로 인하여 본인이 현재 지향중인 프론트엔드 개발에 대해서 더 심도 깊은 이해와 실전 연습을 했다고 느끼고 있으며, 서버를 구축하면서 백엔드 개발에 대해서도 어느 정도 흥미를 가지게 되었다. 


향후 응용 분야 
-	실시간 상담 서비스
-	설치 없는 편리한 다중 채팅프로그램 시스템 
