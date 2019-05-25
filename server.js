'use strict';

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WebSocketServer = _ws2.default.Server;

var wss = new WebSocketServer({
    port: 3000
});

var userListConnPool = {}; // 所有聊天室用户的链接池，key:websocket
var id2key = {}; // 用户的id和对应的信息，包括key，id:userinfo

wss.on('connection', function (ws, req) {
    // console.log(JSON.stringify(req))
    console.log('*******************************');
    ws.on('message', function (message) {
        message = JSON.parse(message);
        // 用户请求登入   
        if (message.type == 1) {
            console.log('id\u4E3A' + message.userid + '\uFF0C\u7528\u6237\u540D\u4E3A' + message.username + '\u7684\u7528\u6237\u767B\u5F55\u4E86');
            // 用户第一次发消息时，向链接池保存该链接，并记录用户id对应的链接是哪个
            userListConnPool[req.headers['sec-websocket-key']] = ws;
            id2key[message.userid] = {
                username: message.username,
                userid: message.userid,
                key: req.headers['sec-websocket-key']
                // 向所有人告知有人进入了聊天室
            };var msg = {
                type: 4,
                username: message.username,
                checkType: 'in'
            };
            sendMsgToAll(msg);

            // 用户登出请求，将该用户的链接从连接池删除
        } else if (message.type == 2) {
            console.log('id\u4E3A' + message.userid + '\uFF0C\u7528\u6237\u540D\u4E3A' + message.username + '\u7684\u7528\u6237\u9000\u51FA\u4E86');

            // 向用户发送断开确认
            getWs(message.userid) ? getWs(message.userid).send(JSON.stringify(message)) : '';
            delete userListConnPool[id2key[message.userid].key];
            delete id2key[message.userid];

            // 向所有人告知有人退出了聊天室
            var _msg = {
                type: 4,
                username: message.username,
                checkType: 'out'
            };
            sendMsgToAll(_msg);
        } else if (message.type == 3) {
            console.log(message.username + '\u8BF4\uFF1A' + message.content);
            console.log('id2key.length=' + Object.keys(id2key).length);
            console.log('userconn.length=' + Object.keys(userListConnPool).length);
            // 向所有用户广播消息
            sendMsgToAll(message);
        }
    });
});

// 向所有人发送广播
function sendMsgToAll(message) {
    Object.keys(id2key).forEach(function (id) {
        userListConnPool[id2key[id].key].send(JSON.stringify(message));
    });
}
// 根据id获取对应用户的ws链接
function getWs(id) {
    if (id2key[id]) {
        return userListConnPool[id2key[id].key];
    }
    return false;
}
