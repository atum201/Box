const createError = require('http-errors');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const bodyParser = require('body-parser');
const _ = require('lodash');



require('events').EventEmitter.defaultMaxListeners = 20000;
app.use(cors('*'));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));
         
let endpoint = 'https://chatbot.idg.vnpt.vn/egov/api/v1/client/chat';

let callApi = function (
  endpoint,
  data = null
) {
  
  return axios({
    method: "POST",
    url: endpoint,
    data: data,
    headers: {
      "content-type": "application/json;charset=UTF-8"
    }
  }).then(res => {
    return res
  });
}

let socker = [];

let start = 0;
const messages = [
{
  "header":{"user":"","session":"","isLogin":""},
  "message":{"id":"msg_1","content":"Xin chào anh/chị, đây là hệ thống trả lời tự động. Xin vui lòng chọn thông tin anh/chị quan tâm.",
  "data":["Hướng dẫn tra cứu thủ tục hành chính","Tra cứu tình trạng hồ sơ"],"type":"choice","style":""}},
{"header":{"user":"","session":"","isLogin":""},
  "message":{"id":"msg_2","content":["Chúng tôi hỗ trợ 2 dịch vụ:",
                        "1. Hướng dẫn tra cứu thủ tục hành chính","2. Tra cứu tình trạng hồ sơ","Chúng tôi có thể giúp gì cho bạn"],
  "data":[],"type":"text","style":""}},
{"header":{"user":"","session":"","isLogin":""},
  "message":{"id":"msg_3","content":"Bạn muốn chọn ngành nào?",
  "data":["Tư pháp","Ngoại giao"],"type":"choice","style":""}},
{"header":{"user":"","session":"","isLogin":""},
  "message":{"id":"msg_4","content":"Bạn muốn chọn nhóm Thủ tục hành chính nào",
  "data":["Yếu tố nước ngoài","Trong nước","khác"],"type":"choice","style":""}},
{"header":{"user":"","session":"","isLogin":""},
  "message":{"id":"msg_5","content":"Chúng tôi tìm được một vài kết quả sau:",
  "data":["Thủ tục đăng ký khai sinh, kết hợp nhận cha, mẹ, con.",
          "Thủ tục đăng ký khai sinh",
          "Thủ tục đăng ký khai sinh lưu động",
          "Thủ tục đăng ký khai sinh cho người đã có hồ sơ, giấy tờ cá nhân"],"type":"choice","style":""}},
{"header":{"user":"","session":"","isLogin":""},
  "message":{"id":"msg_5","content":["Anh/chị đã chọn \"Thủ tục đăng ký khai sinh lưu động.\"",
                                    "Xin vui lòng chọn thông tin anh/chị đang quan tâm về thủ tục?",
                                    "Để xem CHI TIẾT vui lòng chọn link này []"],
  "data":["Cơ quan thực hiện","Thành phần hồ sơ","Quy trình thực hiện","Lệ phí","Thời gian thực hiện"],
  "type":"choice","style":""}}
]

io.on('connection', async function (socket) {
    try {

        socket.on('start_bot',function (data) { // {header: {account:"",session:""}, message:{}}
          
          start = 0;
          // if(data.header && data.header.account){
          //   socket.account = data.header.account;
          // }
          // socker.push(socket)
          // data.header.session = socket.id;

          let d = messages[0]

          callApi(endpoint,d).then(res=>{
            socket.emit('send_message',res.data);
          })
        })

        socket.on('request_bot',function (data) { // {header: {account:"",session:""}, message:{}}
          // data.header.session = socket.id;
          // let message = data.message;
          // console.log(message);
          // let i = _.findIndex(messages,m=>m.message.id===message.id);

          callApi(endpoint,messages[++start]).then(res=>{
            if(start == 5)
              start =0;
            socket.emit('send_message',res.data);
          })

        })

        socket.on('disconnect', function () {
          _.remove(socker,function(sk){
            return sk.id == socket.id
          });
        });

        socket.on('error', function (error) {
            console.log(error);
        });
    } catch (error) {
        console.log(error.message);
        socket.emit('serverError', { success: false, message: error.message });
    }

});

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});
app.use((req, res, next) => {
    next(createError(404));
});

process.on('uncaughtException', function (err) {
    console.log(err);
});

server.listen(3000, () => console.log('App start'));

process.on('SIGINT', () => { console.log("Bye bye!"); process.exit(); });



