const createError = require('http-errors');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

var fs = require('fs')

var credentials = {
  key: fs.readFileSync('vnpt.key'),
  cert: fs.readFileSync('vnpt.crt')
}

var server = require('https').Server(credentials,app);
// const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const bodyParser = require('body-parser');
const _ = require('lodash');


require('events').EventEmitter.defaultMaxListeners = 20000;
app.use(cors('*'));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));
         
let endpoint = 'https://chatbot.idg.vnpt.vn/egov/api/v1/client/chat';

let endpointDev = 'https://chatbot.idg.vnpt.vn/egov/api/v1.1/client/chat';

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

io.on('connection', async function (socket) {
    try {

        socket.on('start_bot',function (data) { // {header: {account:"",session:""}, message:{}}
          console.log(socket.id,data)
          if(data.header && data.header.account){
            socket.account = data.header.account;
          }
          socker.push(socket)
          data.header.session = socket.id;
          console.log()
          callApi(endpoint,data).then(res=>{
            console.log(res)
            socket.emit('send_message',{content:res.data});
          })
        })

        socket.on('request_bot',function (data) { // {header: {account:"",session:""}, message:{}}
          data.header.session = socket.id;
          console.log(socket.id, data)
          callApi(endpoint,data).then(res=>{
            console.log(res)
            socket.emit('send_message',{content:res.data});
          })
        })

        socket.on('start_botDev',function (data) { // {header: {account:"",session:""}, message:{}}
          console.log(socket.id,data)
          if(data.header && data.header.account){
            socket.account = data.header.account;
          }
          socker.push(socket)
          data.header.session = socket.id;
          console.log()
          callApi(endpointDev,data).then(res=>{
            console.log(res)
            socket.emit('send_message',{content:res.data});
          })
        })

        socket.on('request_botDev',function (data) { // {header: {account:"",session:""}, message:{}}
          data.header.session = socket.id;
          console.log(socket.id, data)
          callApi(endpointDev,data).then(res=>{
            console.log(res)
            socket.emit('send_message',{content:res.data});
          })
        })

        socket.on('disconnect', function () {
          console.log(socket.id," disconnect");
          _.remove(socker,function(sk){
            return sk.id == socket.id
          });
          console.log(socker.length," disconnect");
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



