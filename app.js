const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const app = express();
const path = require("path");
const server = http.createServer(app);
const moment = require("moment");
const mysqlDB = require("mysql");
var cookieParser = require('cookie-parser');

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
app.engine('ejs', require('ejs').__express);

app.get("/join", function(req,res){
    res.sendFile(__dirname+'/src/join.html');
});
app.post('/join', function(req, res){
    var body = req.body;
    var id = body.id;
    var passwd = body.passwd;
    var nick = body.nickname;
    if(id != '' && passwd != '' && nick != ''){
        var insert_sql = 'INSERT INTO userDB(id,passwd,nickname) VALUES (?,?,?)';
        var param = [id, passwd, nick];
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
    var body = req.body;
    var id = body.id;
    var passwd = body.passwd;
    mysqlDB_conn.query('SELECT * FROM userDB WHERE id=? and passwd=?',[id, passwd], function(err,rows,fields) {
        if(err){
            console.log(err);
        }else{
            if(rows[0] != undefined){
                // res.send('id : ' +rows[0]['id'] + '<br/>' + 'pw : ' + rows[0]['passwd']);
                console.log('login success');
                res.cookie('loginCookie', id);
                res.redirect("/lobby");
                console.log(req.cookies);
            }
            else{
                res.send('<script type="text/javascript">alert("아이디/비밀번호를 확인해주세요!"); history.back();</script>');
            }
        }
    });
});

app.get("/lobby", function(req,res){
    var welcome_id = req.cookies.loginCookie;
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
io.on("connection", (socket)=>{
    socket.on("chatting",(data)=>{
        const {name, msg} = data;
        var insert_sql = 'INSERT INTO chatLog(uname,msg) VALUES (?,?)';
        var param = [name, msg];
        mysqlDB_conn.query(insert_sql, param, function(err,rows,fields) {
            if(err){
              console.log(err);
            }else{
              console.log(rows.insertId);
            }
          });
        io.emit("chatting", {
            name,
            msg,
            time : moment(new Date()).format("hh:mm")

        });
    });
});

server.listen(PORT, () => console.log(`server is running port : ${PORT}`));