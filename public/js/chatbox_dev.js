var ChatBox = function(payload, state, socket, reload) {
    this.box = {}; // {id:"",type:"group|user",title:"",member:[]}
    this.state = state ||   {show:false };
    var _user = {},
        _start = reload == 1;
    var this_box = this;
    var _locdau = function(str) {
        str = str.toLowerCase();
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        str = str.replace(/^\-+|\-+$/g, "");k
        return str;
    };
    var _randomstring = function(L) {
        var s = '';
        var randomchar = function () {
            var n = Math.floor(Math.random() * 62);
            if (n < 10) return n; //1-10
            if (n < 36) return String.fromCharCode(n + 55); //A-Z
            return String.fromCharCode(n + 61); //a-z
        }
        while (s.length < L) s += randomchar();
        return s;
    };

    var rep_button = [];

    var _showContentMessage = function(content){
        return content;
    }
    this.box_head = $("<div class=\"vs-chat-heading\">"+
                        "<div class=\"top\">"+
                            "<div class=\"name\">"+
                                "<div class=\"avatar\" style=\"background-image: url(img/chat/customer-support.svg);\">"+
                                "</div>"+
                                "<span class=\"title\">Trợ lý thông minh</span>"+
                                "<span class=\"txt\">Hãy để tôi hỗ trợ bạn</span>"+
                            "</div>"+
                            "<div class=\"actions\">"+
                                "<a class=\"btn btn-close -ap icon-cross3\"></a>"+
                            "</div>"+
                        "</div>"+
                    "</div>")
    this.box_content = $("<div  class=\"vs-content-chat\" id=\"listbotchat\"></div>");
    this.box_content_wrap =  $("<div class=\"mess-box\"></div>");
    this.box_content_chat = $("<div class=\"content-chat-box\"></div>");
    this.box_content_input = $("<div class=\"bottom-chat\">"+
                "<div class=\"input-chat\">"+
                    "<textarea class=\"form-control\" placeholder=\"Nhập tin nhắn...\"></textarea> "+
                "</div>"+
            "</div>");
    this.wrap = $("<div class=\"vs-chat-popup -mess\"></div>");
    this.dom = $("<div class='chat-div'>"+
                    "<div class=\"vs-icon-chat\">"+
                        "<img src=\"img/chat/customer-support.svg\">"+
                    "</div>"+
                "</div>");

    this.search_btnRefresh = {};
    this.messages = [];// { from: _user.id, toGroup: _this.box.id, content: content };
    this.dates = []; // {date: "", dom: $};
    
    this.setState = function(state){ // set state for object.

        var _this = this;
        _this.state = _.assign(_this.state,state);
        
        var vs = _this.dom.find('.vs-icon-chat');

        if(_this.state.show){
            vs.addClass("hide-vs");
            _this.wrap.addClass("show");
        }else{
            vs.removeClass("hide-vs");
            _this.wrap.removeClass("show");
        }
    };
    this.displayMessage = function(message){
        var _this = this;
        var last_content = _this.box_content_chat.find(".mess-item:last-child");
        if(last_content.hasClass("-you")){
            last_content.find(".mess-content").append('<div class="mess">'+message+'</div>');
        }else{
            _this.box_content_chat.append("<div class=\"mess-item -you\">"+
                        "<div class=\"mess-content\">"+
                            "<div class=\"mess\">"+message+"</div>"+
                        "</div>"+
                    "</div>")
        }
        _this.box_content_wrap.scrollTop(10000000000);
    };
    this.displayMessageButton = function(template,index){
        var _this = this;

        var btn = $("<div class=\"btn\">"+template.message.data[index].text+"</div>");
        btn.on('click',function(){
            var m = {
                id:template.message.id,
                content:template.message.data[index].payload,
                data:template.message.data,
                type:template.message.type
            };
            var message = {header:template.header,message:m}
            _this.displayMessage(template.message.data[index].text,true);   
            sendMessage(message);
        })
        return btn;
    }
    this.displayBotMessageTemplate = function(template){
        var _this = this;
        var msgs = template.message;
        var dom = [];
        var temp = {};
        var t_temp = 'start';
        msgs.map(function(message){
            switch(message.type){
                case 'buttons':
                    if(t_temp == 'USER'){
                        dom.push(temp);
                        temp = $("<div class=\"mess-item -me\">"+
                                    "<div class=\"avatar\" style=\"background-image: url("+chat_host+"img/chat/customer-support.svg);\">"+
                                    "</div><div class=\"mess-content\"></div></div>");
                        t_temp = 'Bot';
                    }
                    if(t_temp == 'start'){
                        temp = $("<div class=\"mess-item -me\">"+
                                    "<div class=\"avatar\" style=\"background-image: url("+chat_host+"img/chat/customer-support.svg);\">"+
                                    "</div><div class=\"mess-content\"></div></div>");
                        t_temp = 'Bot';
                    }
                    temp.find('.mess-content').append("<div class=\"mess\">"+message.content+"</div>");
                    temp.find('.mess-content').append("<br/>");
                    message.data.map(function(d,i){
                        var t = {header:template.header,message:message}
                        temp.find('.mess-content').append(_this.displayMessageButton(t,i));
                        rep_button.push(d);
                    })
                    t_temp = "Bot";
                    break;
                case 'USER':
                    if(t_temp != 'USER'){// tin nhan trc do la cua bot
                        if(t_temp != 'start') dom.push(temp);
                        temp = $("<div class=\"mess-item -you\">"+
                                        "<div class=\"mess-content\"></div></div>");
                        t_temp = 'USER';
                    }

                    temp.find('.mess-content').append("<div class=\"mess\">"+message.content+"</div>")
                    t_temp = 'USER';
                    break;
                default:
                    if(t_temp == 'USER'){
                        dom.push(temp);
                        temp = $("<div class=\"mess-item -me\">"+
                                    "<div class=\"avatar\" style=\"background-image: url("+chat_host+"img/chat/customer-support.svg);\">"+
                                    "</div><div class=\"mess-content\"></div></div>");
                        t_temp = 'Bot';
                    }
                    if(t_temp == 'start'){
                        temp = $("<div class=\"mess-item -me\">"+
                                    "<div class=\"avatar\" style=\"background-image: url("+chat_host+"img/chat/customer-support.svg);\">"+
                                    "</div><div class=\"mess-content\"></div></div>");
                        t_temp = 'Bot';
                    }
                    var ctn = message.content;
                    for(var i = 0; i< rep_button.length;i++)
                        ctn = ctn == rep_button[i].payload ? rep_button[i].text : ctn;
                    temp.find('.mess-content').append("<div class=\"mess\">"+ctn+"</div>")
                    break;
            }
        })
        dom.push(temp);
        return dom;
    }
    this.displayBotMessage = function(message){ // message = {}
        var _this = this;
        if(message.message.length > 0){
            _this.box_content_chat.append(_this.displayBotMessageTemplate(message));
            _this.box_content_wrap.scrollTop(10000000000);    
        }
    };
    this.createMessage = function (content) { // 
        var _this = this;
        
        payload.message = {"id":"","content":content,"type":"","data":[]}
        return payload;    
    };
    var _setSocket = function(){
        socket.on('send_message', function (data) { // data: message. nhan 1 tin nhan truc tuyen.
            var _this = this;
            console.log(data);
            payload.header = data.header;
            this_box.displayBotMessage(data);
        });
        
    };
    var sendMessage = function (data) {
        socket.emit('request_botDev', data);
    }
    this.init = function () {
        var _this = this;
        _this.wrap.append(_this.box_head)
        _this.box_content_wrap.append(_this.box_content_chat)
        _this.box_content.append(_this.box_content_wrap);
        _this.box_content.append(_this.box_content_input);
        _this.wrap.append(_this.box_content);
        _this.dom.append(_this.wrap);
        _this.setState();
        var vs = _this.dom.find('.vs-icon-chat');
        var wrap_close = _this.box_head.find('.btn-close');
        vs.click(function(){
            _this.setState({show:true});
            setCookie('box_state',true?1:0,10);
            if(!_start){
                _start = true;
                socket.emit('start_botDev',payload);
            }
        });
        wrap_close.click(function(){
            _this.setState({show:false});
            setCookie('box_state',false?1:0,10);
        });
        var box_state = getCookie('box_state');
        if(box_state){
            _this.setState({show:box_state==1});
        }
        if(reload === 1){
            socket.emit('start_botDev',payload);
        }
        var textinput = _this.box_content_input.find("textarea");
        textinput.keydown(function (e) { 
            if (e.keyCode == 13 && e.shiftKey) {
                var html = $(this).val();
                $(this).val(html + "\n");
                e.stopPropagation();
                return;
            }
            if (e.which == 13) {
                e.preventDefault();
                if ($(this).val() !== '' ) {
                    var data = _this.createMessage($(this).val())
                    _this.displayMessage($(this).val(),true);   
                    sendMessage(data);
                    $(this).val("");
                }
            }
        });
        _setSocket();
        return _this;
    };
    return this.init();
};
var reload = 0;
var chat_host = 'https://chatai.vnpt.vn/';
function setCookie(cname,cvalue,exmis) {
  var d = new Date();
  d.setTime(d.getTime() + (exmis*60*1000));
  var expires = "expires=" + d.toGMTString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
function getChatAICookie(name) {
  var user=getCookie(name);
  if (user != "") {
    reload = 1;
    return user;
  } else {
    reload = 0;
    user = Math.random().toString(36).substr(2, 5); 
    setCookie(name, user, 10);
    return user;
  }
}
var socket = io(chat_host);
var userSession = getChatAICookie("chatai");
var payload = {header:{user:userSession},message:{content:reload==0?"/start":"/get_history_msg"}};
var chatapp = new ChatBox(payload,{show:false},socket,reload);
$("body").append(chatapp.dom);