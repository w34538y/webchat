const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const app = express();
const path = require("path");
const server = http.createServer(app);
const moment = require("moment");
const mysqlDB = require("mysql");
let cookieParser = require('cookie-parser');
// 모듈 로드. 의존성에 기록되어있음. 

const mysqlDB_conn = mysqlDB.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'chatting',
    password : 'chatting132',
    database : 'chatDB'
});
mysqlDB_conn.connect();
// DB 연결을 위한 연결 정보 부분과 연결

const socketIO = require("socket.io");
const io = socketIO(server);
// socket.io에 대한 모듈 로드와 socket.io를 활용한 서버 구축

app.use(express.static(path.join(__dirname, "src"))); // 서버가 사용할 기본 파일 경로 설정 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(cookieParser());
// 바디와 쿠키를 파싱하기 위한 설정

const PORT = process.env.PORT || 5555; // 포트 설정

app.set('views', __dirname+'/src'); //뷰페이지 경로 지정
app.set('view engine', 'ejs'); // 사용할 뷰 템플릿 엔진을 설정에 등록한다.
app.engine('ejs', require('ejs').__express); // ejs 모듈 로드 실패시 불러와줌

app.get("/join", function(req,res){
    res.sendFile(__dirname+'/src/join.html'); // 회원가입 홈페이지 호출시 join 파일 송신 
});

app.post('/join', function(req, res){
    // 회원가입 정보를 post로 넘길때 작동 

    let body = req.body;
    let id = body.id;
    let passwd = body.passwd;
    let nick = body.nickname;
    // 회원가입 페이지의 요소들이 보내온 값들을 변수에 저장

    if(id != '' && passwd != '' && nick != ''){
        let insert_sql = 'INSERT INTO userDB(id,passwd,nickname) VALUES (?,?,?)';
        let param = [id, passwd, nick];
        // DB에 Insert하여 저장하는 절차, 아이디, 비밀번호, 닉네임 입력 
        mysqlDB_conn.query(insert_sql, param, function(err,rows,fields) {
            if(err){
                console.log(err);
                // 에러 발생시 콘솔 로그에 에러 내용 표시
            }else{
                console.log(rows.insertId);
                res.send('<script type="text/javascript">alert("가입을 환영합니다!"); location.href="/login";</script>');
                // 회원 가입 성공시 알림을 띄워주고 로그인 페이지로 이동 
            }
        });
    }
});

app.get("/login", function(req,res){
    res.sendFile(__dirname+'/src/login.html'); // 로그인 홈페이지 호출시 login 파일 송신 
});
app.post('/login', function(req, res){
    // 로그인 정보를 Post로 넘길때 작동

    let body = req.body;
    let id = body.id;
    let passwd = body.passwd;
    // 로그인 페이지의 요소들이 보내온 값들을 변수에 저장 

    mysqlDB_conn.query('SELECT * FROM userDB WHERE id=? and passwd=?',[id, passwd], function(err,rows,fields) {
        // 로그인 정보를 db에서 select 쿼리문으로 찾는다. 
        if(err){
            console.log(err); // 에러 발생시 콘솔로그에 에러 내역 보여주기
        }else{
            // 에러 미발생 
            if(rows[0] != undefined){
                // 로그인 데이터가 일치하는 경우
                console.log('login success');
                res.cookie('loginCookie', id); // 로그인 정보로 쿠키를 만들어줌 
                res.redirect("/lobby"); // 로그인 후 로비로 이동시켜준다. 
            }
            else{
                // 로그인 데이터가 일치하지 않는 경우 
                res.send('<script type="text/javascript">alert("아이디/비밀번호를 확인해주세요!"); history.back();</script>'); // 아이디/비밀번호 확인 팝업을 띄우고 로그인 페이지로 복귀 
            }
        }
    });
});

app.get('/logout', function(req, res){
    // 로그아웃 버튼 처리 
    res.clearCookie("loginCookie"); // 로그인 쿠키 정보를 초기화 시켜준다. 
    res.redirect('/'); // 홈페이지로 이동
});

app.get("/lobby", function(req,res){
    // 로비에 입장했을 때 작동 
    let welcome_id = req.cookies.loginCookie; // 브라우저의 쿠키로 부터 로그인된 정보의 id를 가져와 변수에 넣음 
    mysqlDB_conn.query('SELECT nickname FROM userDB WHERE id=?',[welcome_id], function(err,rows,fields) {
        // 쿼리문을 통해서 DB에서 해당 아이디가 갖는 닉네임을 가져온다. 
        if(err){
            console.log(err); // 에러 발생시 콘솔 로그에 에러 출력 
        }else{
            if(rows[0] != undefined){
                res.render('lobby',{nick: rows[0].nickname}); // 정보가 있다면 로비에 nick이라는 키로 가져온 데이터의 닉네임만 뽑아서 보내 준다. 
            }
        }
    });
});

app.get("/search", function(req,res){
    res.sendFile(__dirname+'/src/search.html'); // 채팅 내역 검색 페이지 연결시 search 파일 전송
})
app.post("/result", function(req, res){
    // search 페이지에서 결과 찾기를 하면 result 페이지로 넘어가 결과를 보여주는 작동
    let search_index = req.body.search; // 검색 내용을 search 페이지에서 받아온다. 
    console.log(search_index);
    mysqlDB_conn.query('SELECT uname, msg, time FROM chatlog WHERE roomname=?',[search_index], function(err,rows,fields) {
        // 채팅 방 이름으로 검색하면 메시지, 닉네임, 시간을 DB로 부터 불러온다. 
        if(err){
            console.log(err); // 에러 발생시 콘솔 로그에 에러 출력 
        }else{
            if(rows[0] != undefined){
                let array = []; // DB에서 불러온 데이터를 넣기 위한 배열
                for(let i = 0; i < rows.length; i++){
                    array[i] = {nick: rows[i].uname, msg: rows[i].msg, time: rows[i].time}; // 배열에 DB로 부터 불러온 rows의 길이만큼 데이터를 넣어준다.
                }
                console.log(array);
                res.render('resultpage', {list: array}); // list를 키로 갖고 array를 값으로 resultpage에 렌더링 해준다. 
            }
        }
    });
});

app.get("/withdraw", function(req, res){
    // 회원 탈퇴 버튼 클릭시 작동
    let id = req.cookies.loginCookie; // 로그인된 쿠키 정보를 가져온다. 
    mysqlDB_conn.query('SELECT nickname FROM userDB WHERE id=?',[id], function(err,rows,fields) {
        // 쿼리문을 통해 DB에 있는 닉네임을 불러온다. 
        if(err){
            console.log(err); // 에러 발생시 콘솔 로그에 에러 출력 
        }else{
            if(rows[0] != undefined){
                mysqlDB_conn.query('DELETE FROM chatlog WHERE uname=?',[rows[0].nickname], function() {}); // 해당 유저의 채팅 내역을 닉네임 검색을 바탕으로 삭제해준다. 
            }
        }
    });
    mysqlDB_conn.query('DELETE FROM userDB WHERE id=?',[id], function() {
        // 회원 탈퇴 처리를 위해서 DB에서 회원 정보를 삭제한다. 
        res.send('<script type="text/javascript">alert("탈퇴처리 되었습니다!"); window.location.href="/";</script>'); // 삭제후 alert로 탈퇴 통보후 홈페이지로 이동
    });
});

io.on("connection", function(socket){
    // 소켓에 연결될때 작동 
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