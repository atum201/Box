var ChatApp = function(user,socket,server){ // tap trung xu ly, dong bo du lieu,
    var _app = this;
    var CHATBOX_SEND_MESSAGE = "sendmessage",
        CHATBOX_VIEW_MESSAGE = "view message",
        CHATBOX_TYPING = "typing message",
        CHATBOX_END_TYPING = "end typing message",
        CHATBOX_CLOSE = "chatbox close",
        CHATBOX_UPDATE_CONTACT = "chatbox update contact",
        
        GET_AVATAR = "get avatar",

        AVATAR_DEFAULT = "/img/male.png",

        SOCKET_SEND_MESSAGE = "socket send message",
        SOCKET_GET_MESSAGE = "socket get message",
        SOCKET_SEND_TYPING = "socket send typing",
        SOCKET_GET_TYPING = "socket get typing",
        SOCKET_SEND_END_TYPING = "socket send end typing",
        SOCKET_GET_END_TYPING = "socket get end typing",
        SOCKET_SEND_CONNECT = "socket send connect",
        SOCKET_GET_CONNECT = "socket get connect",
        SOCKET_SEND_DISCONECT = "socket send disconnect",
        SOCKET_GET_DISCONNECT = "socket get disconnect",
        SOCKET_SEND_READ_MESSAGE = "socket send read message",
        SOCKET_GET_SEND_MESSAGE = "socket get send message",
        SOCKET_SEND_UPDATE_GROUP = "socket send update group",
        SOCKET_GET_UPDATE_GROUP = "socket get update group",
        SOCKET_SEND_UPDATE_USER = "socket send update user",
        SOCKET_GET_UPDATE_USER = "socket get update user", 
        SOCKET_BROADCAST_CONNECT = "socket broadcast connect",
        SOCKET_BROADCAST_DISCONNECT = "socket broadcast disconnect";
    
    var STORAGE_USER = "chat_user", // {userId,id}
        STORAGE_VERSION = "chat_version",
        STORAGE_PHANCAP = "chat_phancap", // luu cay phan cap danh muc
        STORAGE_CONTACT = "chat_contact", // luu tat ca cac contact: gan 2000 contact
        STORAGE_CURRENT = "chat_current", // [{id,type,title,state:{}}]
        STORAGE_RESET = true;
    
    var CHAT_SERVER = server || "";


    var _user = user;
    
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
    var _formatDate = function(date) {
        date = typeof date === 'number' ? new Date(date) : date;
        var ngay = ["Ch&#7911; nh&#7853;t", "Th&#7913; hai", "Th&#7913; ba", "Th&#7913; t&#432;", "Th&#7913; n&#259;m", "Th&#7913; s&aacute;u", "Th&#7913; b&#7843;y"];
        return ngay[date.getDay()] + ", ng&agrave;y " + date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    };
    var _compareDate = function(d,d2){
        d = typeof d === 'number' ? new Date(d) : d;
        d2 = typeof d2 === 'number' ? new Date(d2) : d2;
        return d.toDateString() === d2.toDateString();
    };
    var _localStorage = function(key,object){
        if(!localStorage)
            localStorage = {};
        localStorage[key] = JSON.stringify(object);
    };
    var _get_localStorage = function(key){
        if(!localStorage)
            localStorage = {};
        if(STORAGE_RESET && localStorage[key])
            return JSON.parse(localStorage[key]);
        return undefined;
    };
    var _queryGraphql = function(url,query,variables, callback){//'query={phancap{id,phancap{TenDonViCap1}}}'
        console.log(url,query,variables, callback);
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
        // xhr.setRequestHeader("Accept-Encoding","gzip, deflate");
        xhr.setRequestHeader("Accept-Language","en-US,en;q=0.5");
        xhr.setRequestHeader("Access-Control-Allow-Origin","*");
        xhr.onload = function () {
            callback(xhr.response);
        }
        xhr.send(JSON.stringify({query: query,variables:variables}));
    };
    
    var _loadData = function(user, contacts, online,recently,phancap,friends,groups,callback){ // true/false load thong tin tuong ung.
        var _this = this;
        var query = [];
        if(user){
                    query.push('user(q:\"'+user+'\"){id,userId,nickName,avatar,friends}');
                }
        if(contacts)
            query.push('users(q:\"'+JSON.stringify({query:{},limit:3000}).replace(/"/g, '\\"')+'\"){id,nickName,last,avatar,last}')
        if(online)
            query.push('online');
        // if(recently)
        //     query.push('recently{}');
        if(phancap)
            query.push('phancap{phancap{members {id }, subs {TenDonViCap2, members{id }, subs {TenDonViCap3, members{id }, subs{TenDonViCap4, members{id } } } } } }');
        // if(friends)
        //     query.push('friends{}');
        if(groups)
            query.push('group(user:\"'+user+'\"){id,name,member,creater}')
        _queryGraphql(CHAT_SERVER+"/graphql","{"+query.join()+"}",undefined,function(data){
            // console.log(data);
            callback(data.data);
        })
    };
    
    var _showContentMessage = function(content){
        // Show content message
        return content;
    }
    
    
    var _dom = $("<div id='chatapp' class='chat-app'></div>");
    var ChatBox = function(box, state) {
        this.box = box; // {id:"",type:"group|user",title:"",member:[]}
        this.membertemp = [];
        this.state = state ||   {
                                    show:true,
                                    full:true,
                                    online:false,
                                    new:0,
                                    title:"",
                                };

        this.box_head = $("<div class=\"live-hd\">"+
                                "<div class=\"pull-left visitor-name\">"+this.box.title+"</div>"+
                                "<div class=\"pull-right\">"+
                                    "<a href=\"javascript:void(0)\" class=\"btnclose-min\"><i class=\"fa fa-chevron-down\"></i><i class=\"fa fa-chevron-up\"></i></a>"+
                                    "<a href=\"javascript:void(0)\"><i class=\"fa fa-remove\"></i></a>"+
                                "</div>"+
                                "<div class=\"clearfix\"></div>"+
                            "</div>");
        this.box_content_top = $("<div class=\"live-ct-top\"></div>");
        this.btn_add_contact = $("<a href=\"javascript:void(0)\"><i class=\"fa fa-plus fa-lg\"></i></a>");
        this.btn_info_contact = $("<a href=\"javascript:void(0)\"><i class=\"fa fa-info fa-lg\"></i></a>");
        this.btn_minus_contact = $("<a href=\"javascript:void(0)\"><i class=\"fa fa-minus fa-lg\"></i></a>");
        this.btn_leave_group = $("<a href=\"javascript:void(0)\"><i class=\"fa fa-sign-out fa-lg\"></i></a>");
        this.btn_remove_group = $("<a href=\"javascript:void(0)\"><i class=\"fa fa-remove fa-lg\"></i></a>");
        this.box_content_search = $("<div class=\"live-search\">"+
                                        "<i class=\"fa fa-search\"></i>"+
                                        "<input type=\"text\" placeholder=\"T&igrave;m ki&#7871;m\">"+
                                    "</div>");
        this.box_content_emoticon = $("<div class=\"live-emoticon\"></div>");
        this.emoticon_box = $("<div class=\"emoticon-box\">"+
                                "<div class=\"box-detail\"><span class=\"shortcut\"/></div>"+
                                "<div class=\"box-list\"></div>"+
                            "</div>");
        this.box_content_input = $("<div class=\"live-chat-ft\">"+
                                        "<div class=\"textarea\">"+
                                            "<textarea placeholder=\"Nh&#7853;p n&#7897;i dung\"></textarea>"+
                                        "</div>"+
                                        "<button class=\"btn btn-submit\">G&#7917;i</button>"+
                                        "<a href=\"javascript:void(0)\" class=\"btn btn-attach\" title=\"&#272;&iacute;nh k&egrave;m file\"><i class=\"fa fa-paperclip fa-lg\"></i></a>"+
                                        "<input type=\"file\" class=\"fu\" style=\"display:none\" name=\"fileattach\" multiple/>"+
                                    "</div>");
        this.box_content = $("<div class=\"live-ct\"></div>");
        this.box_content_chat = $("<div class=\"live-chat\"></div>");
        this.box_group_add_user = $("<div class=\"content-adduser\">"+
                                        "<a href=\"javascript:void(0)\" class=\"btn-creategroup\"><i class=\"fa fa-check fa-lg ga\"></i></a>"+
                                        "<a href=\"javascript:void(0)\" class=\"btn-refresh\"><i class=\"fa fa-refresh fa-lg ga\"></i></a>"+
                                        "<a href=\"javascript:void(0)\" class=\"btn-cancel\"><i class=\"fa fa-close fa-lg ga\"></i></a>"+
                                        "<a href=\"javascript:void(0)\" class=\"btn-add\"><i class=\"fa fa-group fa-lg\"></i></a>"+
                                        "<div class=\"content\">"+
                                            "<div class=\"select-box\">"+
                                                "<select class=\"js-multiple\" data-placeholder=\"Th&ecirc;m th&agrave;nh vi&ecirc;n...\" multiple tabindex=\"3\"></select>"+
                                            "</div>"+
                                        "</div>"+
                                    "</div>");
        this.wrap = $("<div class=\"chat-box\"></div>");
        this.dom = $("<div class=\"chat-div\"></div>");


        this.search_btnRefresh = {};
        this.messages = [];// { from: _user.id, toGroup: _this.box.id, content: content };
        this.dates = []; // {date: "", dom: $};
        this._typeEmoticon = "";
        this.setState = function(state){ // set state for object.
            var _this = this;
            _this.state = _.assign(_this.state,state);
            _this.dom.removeClass("hidden");
            if(_this.state.show == false){
                _this.dom.addClass("hidden");
            }
            _this.box_content.removeClass("in");
            _this.box_head.find(".btnclose-min").removeClass("open");
            if(_this.state.full){
                _this.box_content.addClass("in");
                _this.box_head.find(".btnclose-min").addClass("open");
            };
            _this.box_head.find(".online").remove();
            if(_this.state.online){
                _this.box_head.prepend("<span class=\"online pull-left\"></span>")
            }
        };
        this.displayMessage = function(message, scroll){
            var _this = this;
            if(message.idtemp){
                console.log(message);
            }
            message.time = message.time || new Date() - TIMEOFFSET;
            var date = _formatDate(message.time);
            
            var indexDate = _.findIndex(_this.dates, function(d){
                return _compareDate(d.date,message.time);
            });

            if(indexDate == -1){
                var dateDom = $("<time class=\"text-right\">"+date+"</time>");
                if(!_.last(_this.dates) || message.time > _.last(_this.dates).date){  
                    _this.box_content_chat.append(dateDom);
                    _this.dates.push({date:message.time,dom:dateDom});
                }else{
                    _this.box_content_chat.prepend(dateDom);
                    _this.dates.splice(0,0,{date:message.time,dom:dateDom});
                }
            }

            if(!message.dom){// make dom.

                message.dom = $("<div class=\"line_message\"><div class=\"content_message\">"+_showContentMessage(message.content)+"</div></div>");
                message.dom.dblclick(function(){
                    alert(new Date(message.time));
                });
            }
            // find index message in messages.
            var indexMessage = _.findIndex(_this.messages,function(m){
                                    return m.time > message.time;
                                });
            if( indexMessage == -1){ // new message
                if(_.last(_this.messages) && _.last(_this.messages).from == message.from && indexDate !== -1){ 
                    _.last(_this.messages).dom.after(message.dom);
                }else{ // index == -1
                    // tao 1 domarea message moi
                    if(message.from == _user.id){
                        var d = $("<div class=\""+MESSAGE_SENDER+"\"></div>");
                        d.append(message.dom);
                        _this.box_content_chat.append(d);
                    }else{
                        var contact = _callback(GET_CONTACT_BY_ID,message.from);
                        var d = $("<div class=\""+MESSAGE_RECEIVER+"\">"+
                                    "<div class=\"avatar\">"+
                                        "<img src=\""+(contact.avatar || AVATAR_DEFAULT)+"\">"+
                                    "</div> </div>");
                        d.append(message.dom);
                        _this.box_content_chat.append(d);
                    }
                }
                _this.messages.push(message);
            }
            else{ // old message 
                if(_this.messages[indexMessage].from === message.from && indexDate !== -1){
                    _this.messages[indexMessage].dom.before(message.dom);
                }else{
                    if(message.from == _user.id){
                        var d = $("<div class=\""+MESSAGE_SENDER+"\"></div>");
                        d.append(message.dom);
                        _this.dates[0].dom.after(d);
                    }else{
                        var contact = _callback(GET_CONTACT_BY_ID,message.from);
                        var d = $("<div class=\""+MESSAGE_RECEIVER+"\">"+
                                    "<div class=\"avatar\">"+
                                        "<img src=\""+(contact.avatar || AVATAR_DEFAULT)+"\">"+
                                    "</div> </div>");
                        d.append(message.dom);
                        _this.dates[0].dom.after(d);
                    }
                }
                _this.messages.splice(indexMessage,0,message);
            }
            if(scroll){// scroll
                _this.box_content_chat.scrollTop(10000000000);
            }else{
                
            }
        };
        this.scrollMessage = function(messageId){ // calculate offset of message in box_content_chat
        };
        this.createMessage = function (content) { // 
            var _this = this;
            if(_this.box.type == "group")
                return { idtemp: _randomstring(8), from: _user.id, toGroup: _this.box.id, content: content };
            return { idtemp: _randomstring(8), from: _user.id, toUser: _this.box.id, content: content};    
        };
        this.loadMessage = function(messageOld){
            var _this = this;
            var time = undefined;
            var sort = {time : -1};
            if(messageOld){ // load message old. history 
                var date = _.first(_this.messages) ? _.first(_this.messages).time : undefined;
                time = {$lt:date};
            }
            if(_this.box.type == "group"){ // load messages group.
                var query = {query:{ toGroup: _this.box.id},page:0,limit:MESSAGE_LIMIT};
                if(time) 
                    query.query.time = time;
                query.sort = sort;
                var field = "id, content, time, state, from, toGroup"; // full
                _queryGraphql(CHAT_SERVER+"/graphql",'{message(q:\"'+JSON.stringify(query).replace(/"/g, '\\"')+'\"){'+field+'}}',{},function(data){
                    var messages = data.data.message || [];
                    messages.forEach(function(message){
                        message.time = parseInt(message.time);
                        var scroll = messageOld ? false : true;
                        _this.displayMessage(message,scroll);
                    });
                });
            }else{// load messages user
                var query = {query:{ $or:[{toUser:_user.id,from:_this.box.id},{toUser:_this.box.id,from:_user.id}]},page:0,limit:MESSAGE_LIMIT};
                if(time) 
                    query.query.time = time;
                query.sort = sort;
                var field = "id, content, time, state, from, toUser"; // full
                _queryGraphql(CHAT_SERVER+"/graphql",'{message(q:\"'+JSON.stringify(query).replace(/"/g, '\\"')+'\"){'+field+'}}',undefined,function(data){
                    var messages = data.data.message || [];
                    messages.forEach(function(message){
                        message.time = parseInt(message.time);
                        var scroll = messageOld ? false : true;
                        _this.displayMessage(message,scroll);
                    });
                });
            }
        };
        this.updateBox = function(box){
            var _this = this;
            _this.box = _.clone(box);
            _this.box_head.find(".visitor-name").html(_this.box.title);
            if(box.type === "group"){
                _this.search_btnRefresh.click();
            }
        }
        
        this.loadEmoticonBox = function(typeEmoticon){
            var _this = this;
            if(_this._typeEmoticon == typeEmoticon)
                return;
            if(typeEmoticon == "base"){
                var eList = _this.emoticon_box.find(".box-list");
                var eImage = _this.emoticon_box.find(".box-detail").find("img");
                var eShortcut = _this.emoticon_box.find(".shortcut");
                for(var i = 0; i< EMOTICON_BASIC_IMAGE.length;i++){
                    var em = $("<img src=\""+_linkSource("/img/emoticon/"+EMOTICON_BASIC_IMAGE[i]+".png")+"\" class=\"emoticon-item\"/>");
                    em.hover(function(){
                        var el = $(this).attr("src").split('.')[0].split('/');
                        var en = _.indexOf(EMOTICON_BASIC_IMAGE,el[el.length-1]);
                        $(this).css("border","1px solid #3584d1");
                        _this.emoticon_box.find(".box-detail").find("img").remove();
                        _this.emoticon_box.find(".box-detail").prepend(_imgEmoticon(el[el.length-1]));
                        eShortcut.html(EMOTICON_BASIC_SHORTCUT[en]);
                    },function(){
                        $(this).css("border","none");
                    });
                    em.click(function(){
                        var el = $(this).attr("src").split('.')[0].split('/');
                        var en = _.indexOf(EMOTICON_BASIC_IMAGE,el[el.length-1]);
                        var textinput = _this.box_content_input.find("textarea");
                        textinput.val(textinput.val()+EMOTICON_BASIC_SHORTCUT[en]);
                        // _this.emoticon_box.css("opacity",0);
                        _this.emoticon_box.toggle();
                        textinput.focus();
                    });
                    eList.append(em);
                }
                _this._typeEmoticon = typeEmoticon;
            }
        }

        this.init = function () {
            var _this = this;
            _this.wrap.append(_this.box_head)
            _this.box_content.append(_this.box_content_top);
            _this.box_content.append(_this.box_content_chat);
            // _this.box_content.append(_this.box_content_search);
            // _this.box_content.append(_this.box_content_emoticon);
            _this.box_content.append(_this.box_content_input);
            
            _this.btn_info_contact.click(function(){
                _loadUserNameFromId(_this.box.id);
                // window.open('http://thongtinnoibo.mic.gov.vn/Pages/thongtincanhan.aspx?taikhoan=' + _loadUserNameFromId(_this.box.id) + '', 'name', 'height=400,width=600');
            });
            _this.box_content_top.append(_this.btn_info_contact);
            _this.btn_minus_contact.click(function(){
                _updateUser({id:_user.id,contactId:_this.box.id},REMOVE_CONTACT,function(user){
                    _callback(CHATBOX_UPDATE_CONTACT,user);
                    _this.btn_minus_contact.fadeOut(1000);
                    _this.btn_add_contact.fadeIn(1000).css("display","inline-block");
                });
            });
            _this.btn_add_contact.click(function(){
                _updateUser({id:_user.id,contactId:_this.box.id},ADD_CONTACT,function(user){
                    _callback(CHATBOX_UPDATE_CONTACT,user);
                    _this.btn_add_contact.fadeOut(1000);
                    _this.btn_minus_contact.fadeIn(1000).css("display","inline-block");
                });
            });
            _this.box_content_top.append(_this.btn_minus_contact);
            _this.box_content_top.append(_this.btn_add_contact);
            if(_user.friends.indexOf(_this.box.id) !== -1){
                _this.btn_add_contact.css("display","none");
            }else{
                _this.btn_minus_contact.css("display","none");
            }
            

            _this.wrap.append(_this.box_content);
            _this.dom.append(_this.wrap);
            _this.setState();

            _this.box_content_chat.scroll(function(){
                if ($(this).scrollTop() === 0) {
                    _this.loadMessage(true);
                }
            });
            var btnToggle = _this.box_head.find("a.btnclose-min");

            btnToggle.on('click',function(){
                _this.state.full = _this.state.full == false;
                _this.setState();
                _callback(CHATBOX_CLOSE);
            });

            var btnClose = _this.box_head.find("a .fa-remove");

            btnClose.on('click',function(e){
                _this.state.show = false;
                _this.setState();
                _callback(CHATBOX_CLOSE);
            });
            //emoticon
            var emoticonBasic = $("<img src=\""+_linkSource("/img/emoticon/smile.png")+"\" class=\"emotion-bar\" />");
            emoticonBasic.click(function(){
                _this.loadEmoticonBox("base");
                _this.emoticon_box.toggle();
            });
            _this.box_content_emoticon.append(emoticonBasic);
            _this.box_content_emoticon.append(_this.emoticon_box);

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
                        var data = _this.createMessage($(this).val());
                        _callback(CHATBOX_SEND_MESSAGE, data);
                        $(this).val("");
                        console.log(data);
                        _this.displayMessage(data,true);   
                    }
                }
            });
            textinput.focus(function () {
            });


            var fileInput = _this.box_content_input.find('input[type="file"]');
            fileInput.change(function(){
                console.log($(this).prop('files'));
            })
            var btnGui = _this.box_content_input.find("button.btn-submit");
            btnGui.click(function(e) {
                e.preventDefault();
                if (textinput.val() !== '' ) {
                    var data = _this.createMessage(textinput.val());
                    _callback(CHATBOX_SEND_MESSAGE, data);
                    textinput.val("");
                    _this.displayMessage(data,true);   
                }
            });
            var btnFileAttach = _this.box_content_input.find(".btn-attach");
            btnFileAttach.click(function(e){

                fileInput.click();
            });


            _this.loadMessage();
            return _this;
        };
        return this.init();
    };
    var _callback = function(type,data){
        
        if(type === CHATBOX_UPDATE_CONTACT){
            _user = _.assign(_user,data);
            _localStorage(STORAGE_USER,_user);
            _chatContact.loadFriend(_user.friends);
        }
        if(type === CHATCONTACT_SET_STATE){
            _boxs = _.assign(_boxs,{state:data});
            _localStorage(STORAGE_CURRENT,_boxs);
        }
        if (type === CHATBOX_SEND_MESSAGE) { // send 1 message. data = { sender: "", receiver: "", contentmessage: "content" };
            socket.emit(SOCKET_SEND_MESSAGE, data);
        }
        if (type === CHATBOX_CLOSE){
            _showBox();
        }
    };
    var _boxs = _get_localStorage(STORAGE_CURRENT);
    var _version = _get_localStorage(STORAGE_VERSION);
    var _listBox = {}; //{"id": new ChatBox(user,box,callback,state,messages)} box:{id:"",type:"group|user",title:""}
    var _chatContact = {};
    var _receiveMessage = function(message) { // message{id: from,toUser,toGroup,content,state,time}.
        _listBox = _listBox || {};
        
        if(message.from === _user.id){ // tin nhan cua this.user
            if(message.toUser){
                if(_listBox[message.toUser]){ // da co chatBox
                    _listBox[message.toUser].displayMessage(message);
                }else{
                    _listBox[message.toUser] = new ChatBox({id:message.toUser,type:"user"},{show:false, full:true});
                    _dom.append(_listBox[message.toUser].dom);
                    _showBox(message.toUser,false);
                }
            }
            if(message.toGroup){
                if(_listBox[message.toGroup]){
                    _listBox[message.toGroup].displayMessage(message);
                }else{
                    _listBox[message.toGroup] = new ChatBox({id:message.toGroup,type:"group"},{show:false, full:true});
                    _dom.append(_listBox[message.toGroup].dom);
                    _showBox(message.toGroup,false);
                }
            }
        }else if(message.toUser && message.toUser == _user.id){// tin den this.user
            if(_listBox[message.from]){ // da co chatBox
                _listBox[message.from].displayMessage(message);
            }else{
                _listBox[message.from] = new ChatBox({id:message.from,type:"user"},{show:false, full:true});
                _dom.append(_listBox[message.from].dom);
                _showBox(message.from,false);
            }
        }else{// tin nhan den group which this.user join
            if(_listBox[message.toGroup]){
                _listBox[message.toGroup].displayMessage(message);
            }else{
                _listBox[message.toGroup] = new ChatBox({id:message.toGroup,type:"group"},{show:false, full:true});
                _dom.append(_listBox[message.toGroup].dom);
                _showBox(message.toGroup,false);
            }
        }
    };
    var _showBox = function(boxId,priority){
        var count = priority ? 1 : 0;
        _boxs = {time:new Date().getTime(),item:[],state:_chatContact.getState()}; // reset this.boxs
        for(var key in _listBox){
            var show = _listBox[key].state.show;
            if(show && count == 2)
                show = false;
            if(show)
                count ++;
            if(boxId && priority && key == boxId)
                show = true;
            var state = {show:show,online:(_userOnline.indexOf(boxId) !== -1)};
            _listBox[key].setState(state);
            if(_listBox[key].state.show)
                _boxs.item.push(_.assign(_listBox[key].box,{state:_listBox[key].state}));
        }
        if(boxId && count < 2){
            _listBox[boxId].setState({show:true});
            _boxs.item.push(_.assign(_listBox[boxId].box,{state:_listBox[boxId].state}));   
        }
        _localStorage(STORAGE_CURRENT,_boxs);
    };
    var _setSocket = function(){
        socket.on(SOCKET_GET_CONNECT,function(version,time){ // userOnline:["id"]
            if(version != _version){ // load lai contact va phan cap khi co du lieu moi
                _contacts = {};
                _localStorage(STORAGE_VERSION,version);
            }
            TIMEOFFSET = new Date() - time;
        });
        socket.on(SOCKET_BROADCAST_DISCONNECT, function(contactId){
            _contacts[contactId].state = OFFLINE;
            _chatContact.updateContact(contactId);
            if(_listBox[contactId])
                _listBox[contactId].setState({online:false});
        });
        socket.on(SOCKET_BROADCAST_CONNECT,function(contactId){
            _contacts[contactId].state = ONLINE;
            _chatContact.updateContact(contactId);
            if(_listBox[contactId])
                _listBox[contactId].setState({online:true});
        });
        socket.on(SOCKET_GET_MESSAGE, function (data) { // data: message. nhan 1 tin nhan truc tuyen.
            _receiveMessage(data);
        });
        socket.on(SOCKET_GET_UPDATE_GROUP,function(data){
            var i = _.findIndex(_groups,{id:data.id});
            if(i !== -1)
                _groups[i] = _.clone(data);
            else
                _groups.push(data);
            _chatContact.loadNhom(_groups);
            if(_listBox[data.id])
                _listBox[data.id].updateBox({id:data.id,type:"group",title:data.name,member:data.member})
            socket.emit(SOCKET_SEND_UPDATE_GROUP,data.id);
            _showBox();
        });
        socket.on(SOCKET_GET_UPDATE_USER,function(data){

        });
        socket.emit(SOCKET_SEND_CONNECT, _user);
    };
    var _interval;
    var _title;
    var _setTitleBlur = function(title,type){
        _interval = setInterval(function(){ 
            title = _runTitle(title,type);
            document.title = title;
        }, 1000);
    };
    var _runTitle = function(title,type){
        return title.substring(1) + title[0];
    };
    var _clearTitle = function(){
        clearInterval(_interval);
        document.title = _title;
    };
    var _getNameContact = function(fullname){
        return _.last(fullname.trim().split(' '));
    };
    this.dom = _dom;
    this.init = function(){
        var _this = this;      
        _title = document.title;  
        var u = _get_localStorage(STORAGE_USER);
        var state = {full:false,tab:0};
        if(u && u.userId == _user.userId){// check user local.
            _user = u;
            if(_boxs && _boxs.state)
                state = _boxs.state;
            _loadData(_user.userId,undefined,"online",undefined,undefined,"friend","group",function(data){
                // _contacts = _get_localStorage(STORAGE_CONTACT);
                _user = _.assign(_user,data.user);
                _localStorage(STORAGE_USER,_user);
                _userOnline = data.online;
                _groups = data.group;
                _chatContact = new ChatContact(state,_user.nickName);
                _dom.append(_chatContact.dom);
                if(_boxs && (new Date() - _boxs.time) < 9000000){ // load box current. trong khoang thoi gian 15 phut.
                    _boxs.item.forEach(function(box){
                        _listBox[box.id] = new ChatBox(box, box.state);
                        _dom.append(_listBox[box.id].dom);
                    });
                }else{ // qua thoi gian tren thi reset box store.
                    _boxs = {time:new Date().getTime(),item:[],state:{full:false,tab:0}};
                    _localStorage(STORAGE_CURRENT,_boxs);
                }
                _setSocket();
            });
        }else{
            _loadData(_user.userId,"contacts","online","recently","phancap","friend","group",function(data){
                _user = _.assign(_user,data.user);
                _localStorage(STORAGE_USER,_user);
                _contacts = {};
                _app._contacts = {}
                data.users.forEach(function(c){
                    _contacts[c.id] = c;
                    _app._contacts[c.id] = c;
                });
                _localStorage(STORAGE_CONTACT,_contacts);
                _userOnline = data.online;
                _phancap = data.phancap.phancap || {};
                _localStorage(STORAGE_PHANCAP,_phancap);
                _groups = data.group;
                _chatContact = new ChatContact(state,_contacts[_user.id].nickName);
                _dom.append(_chatContact.dom);
                _boxs = {time:new Date().getTime(),item:[],state:{full:false,tab:0}};
                _localStorage(STORAGE_CURRENT,_boxs);
                _setSocket();
            });
        }
        
        $(window).unload(function() {
          _showBox();
        });
        return _this;
    }
    return this.init();
};