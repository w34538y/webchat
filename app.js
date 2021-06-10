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

const socketIO = require("socket.io");
const io = socketIO(server);

app.use(express.static(path.join(__dirname, "src")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(cookieParser());

const PORT = process.env.PORT || 5555;

app.set('views', __dirname+'/src'); //뷰페이지 경로 지정
app.set('view engine', 'ejs'); // 사용할 뷰 템플릿 엔진을 설정에 등록한다.
app.engine('ejs', require('ejs').__express); // ejs 모듈 로드 실패시 불러와줌

app.get("/join", function(req,res){
    res.sendFile(__dirname+'/src/join.html');
});
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

app.get("/login", function(req,res){
    res.sendFile(__dirname+'/src/login.html');
});
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

app.get('/logout', function(req, res){
    res.clearCookie("loginCookie");
    res.redirect('/');
})

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
app.get("/search", function(req,res){
    res.sendFile(__dirname+'/src/search.html');
})
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

server.listen(PORT, () => console.log(`server is running port : ${PORT}`));