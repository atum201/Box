var _dom = $("<div id='chatapp' class='chat-app'></div>");
var ChatBox = function(payload, state, socket) {
    this.box = {}; // {id:"",type:"group|user",title:"",member:[]}
    this.state = state ||   {
                                show:true,
                                full:true,
                                online:false,
                                new:0,
                                title:"Hãy chat với chúng tôi",
                            };
    var _user = {},
        _start = false,
        MESSAGE_RECEIVER = "supporter_chat",
        MESSAGE_SENDER = "visitor_chat";
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
    var _formatDate = function(date) {
        date = typeof date === 'number' ? new Date(date) : date;
        var ngay = ["Ch&#7911; nh&#7853;t", "Th&#7913; hai", "Th&#7913; ba", "Th&#7913; t&#432;", "Th&#7913; n&#259;m", "Th&#7913; s&aacute;u", "Th&#7913; b&#7843;y"];
        date = date||new Date();
        return ngay[date.getDay()] + ", ng&agrave;y " + date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    };
    var _compareDate = function(d,d2){
        d = typeof d === 'number' ? new Date(d) : d;
        d2 = typeof d2 === 'number' ? new Date(d2) : d2;
        if(d && d2)
            return d.toDateString() === d2.toDateString();
        return true;
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

    var _showContentMessage = function(content){
        return content;
    }
    


    this.box_head = $("<div class=\"live-hd\">"+
                            "<div class=\"pull-left visitor-name\">"+this.state.title+"</div>"+
                            "<div class=\"pull-right\">"+
                                "<a href=\"javascript:void(0)\" class=\"btnclose-min\"><i class=\"fa fa-chevron-down\"></i><i class=\"fa fa-chevron-up\"></i></a>"+
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

    this.displayMessage = function(message){
        var _this = this;
        console.log(message)
        var d = $("<div class=\""+MESSAGE_SENDER+"\"><div class=\"line_message\">"+
                "<div class=\"content_message\">"+message+"</div></div></div>");
        
        _this.box_content_chat.append(d);
        _this.box_content_chat.scrollTop(10000000000);


        // message.time = message.time || new Date() - TIMEOFFSET;
        // var date = _formatDate(message.time);
        
        // var indexDate = _.findIndex(_this.dates, function(d){
        //     return _compareDate(d.date,message.time);
        // });

        // if(indexDate == -1){
        //     var dateDom = $("<time class=\"text-right\">"+date+"</time>");
        //     if(!_.last(_this.dates) || message.time > _.last(_this.dates).date){  
        //         _this.box_content_chat.append(dateDom);
        //         _this.dates.push({date:message.time,dom:dateDom});
        //     }else{
        //         _this.box_content_chat.prepend(dateDom);
        //         _this.dates.splice(0,0,{date:message.time,dom:dateDom});
        //     }
        // }

        // if(!message.dom){// make dom.

        //     message.dom = $("<div class=\"line_message\"><div class=\"content_message\">"+_showContentMessage(message.content)+"</div></div>");
        //     message.dom.dblclick(function(){
        //         alert(new Date(message.time));
        //     });
        // }
        // find index message in messages.
        // var indexMessage = _.findIndex(_this.messages,function(m){
        //                         return m.time > message.time;
        //                     });
        // if( indexMessage == -1){ // new message
        //     if(_.last(_this.messages) && _.last(_this.messages).from == message.from && indexDate !== -1){ 
        //         _.last(_this.messages).dom.after(message.dom);
        //     }else{ // index == -1
        //         // tao 1 domarea message moi
        //         // if(message.from == _user.id){
        //         //     var d = $("<div class=\""+MESSAGE_SENDER+"\"></div>");
        //         //     d.append(message.dom);
        //         //     _this.box_content_chat.append(d);
        //         // }else{
        //             var contact = _callback(GET_CONTACT_BY_ID,message.from);
        //             var d = $("<div class=\""+MESSAGE_RECEIVER+"\">"+
        //                         "<div class=\"avatar\">"+
        //                             "<img src=\""+(contact.avatar || AVATAR_DEFAULT)+"\">"+
        //                         "</div> </div>");
        //             d.append(message.dom);
        //             _this.box_content_chat.append(d);
        //         // }
        //     }
        //     _this.messages.push(message);
        // }
        // else{ // old message 
        //     if(_this.messages[indexMessage].from === message.from && indexDate !== -1){
        //         _this.messages[indexMessage].dom.before(message.dom);
        //     }else{
        //         if(message.from == _user.id){
        //             var d = $("<div class=\""+MESSAGE_SENDER+"\"></div>");
        //             d.append(message.dom);
        //             _this.dates[0].dom.after(d);
        //         }else{
        //             var contact = _callback(GET_CONTACT_BY_ID,message.from);
        //             var d = $("<div class=\""+MESSAGE_RECEIVER+"\">"+
        //                         "<div class=\"avatar\">"+
        //                             "<img src=\""+(contact.avatar || AVATAR_DEFAULT)+"\">"+
        //                         "</div> </div>");
        //             d.append(message.dom);
        //             _this.dates[0].dom.after(d);
        //         }
        //     }
        //     _this.messages.splice(indexMessage,0,message);
        // }
    };

    this.displayMessageContent = function(content){
        var dom = $("<div></div>");
        if(Array.isArray(content)){
            
            content.map(function(c){
                dom.append($("<p>"+c+"</p>"));    
                console.log(dom.html());
            })
            
        }else{
            
            dom = content;
        }
        
        return dom;
    }

    this.displayMessageButton = function(template,index,isIndex){
        var btn = $("<input type=\"button\" class=\"chatai_btn "+template.message.data[index].payload+"\" value=\""+(isIndex?index+1:template.message.data[index].text)+"\"\>");
        btn.css("width",(isIndex?100/template.message.data.length-5:100 )+"%")
        // var btn = "tesst";
        btn.on('click',function(){
            var m = {
                id:template.message.id,
                content:template.message.data[index].payload,
                data:template.message.data,
                type:template.message.type
            };
            var message = {header:template.header,message:m}
            sendMessage(template);
        })
        return btn;
    }   

    this.displayBotMessageTemplate = function(template){
        var _this = this;
        
        var msgs = template.message;

        var dom = $("<div class=\"line_message\"></div>");
        msgs.map(function(message){
            switch(message.type){
                case 'text':
                    dom.append(_this.displayMessageContent(message.content));
                    break;
                case 'buttons':
                    var isIndex = false;
                    message.data.map(function(d){
                        if(!isIndex &&d.length > 50)
                            isIndex = true;
                    })
                    if(isIndex){
                        if(!Array.isArray(message.content)){
                            message.content = [message.content];
                        }
                        message.data.map(function(d,i){
                            message.content.push(i+". "+d);
                        })
                    }
                    dom.append(_this.displayMessageContent(message.content));
                    message.data.map(function(d,i){
                        var temp = {header:template.header,message:message}
                        dom.append(_this.displayMessageButton(temp,i,isIndex))
                    })
                    break;
                default:
                    dom.append(_this.displayMessageContent(message.content));
                    break;
            }
        })
        
        return dom;
    }

    this.displayBotMessage = function(message){ // message = {}
        var _this = this;
        if(message.message.length > 0){
            _this.box_content_chat.append(_this.displayBotMessageTemplate(message));
            _this.box_content_chat.scrollTop(10000000000);    
        }
    };
    this.createMessage = function (content) { // 
        var _this = this;
        payload.message = {"message":{"content":content,"type":"text"}}
        return payload;    
    };
    
    var _setSocket = function(){
        
        socket.on('send_message', function (data) { // data: message. nhan 1 tin nhan truc tuyen.
            var _this = this;

            this_box.displayBotMessage(data);
        });
        
    };

    var sendMessage = function (data) {
        console.log(data);
        socket.emit('request_bot', data);
    }

    this.init = function () {
        var _this = this;
        _this.wrap.append(_this.box_head)
        _this.box_content.append(_this.box_content_top);
        _this.box_content.append(_this.box_content_chat);
        _this.box_content.append(_this.box_content_input);
        
        _this.wrap.append(_this.box_content);
        _this.dom.append(_this.wrap);
        _this.setState();

        var btnToggle = _this.box_head.find("a.btnclose-min");

        btnToggle.on('click',function(){
            _this.state.full = _this.state.full == false;
            _this.setState();
            if(!_start){
                _start = true;
                socket.emit('start_bot',payload);
            }
        });
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
        var btnGui = _this.box_content_input.find("button.btn-submit");
            btnGui.click(function(e) {
                e.preventDefault();
                if (textinput.val() !== '' ) {
                    var data = _this.createMessage(textinput.val());
                    _this.displayMessage(textinput.val(),true);   
                    sendMessage(data);
                    textinput.val("");
                    
                }
            });
        _setSocket();
        return _this;
    };
    return this.init();
};