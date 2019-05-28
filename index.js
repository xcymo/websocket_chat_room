import WebSocket from 'ws'
let WebSocketServer = WebSocket.Server

let wss = new WebSocketServer({
    port: 3000
})


let userListConnPool = {}       // 所有聊天室用户的链接池，key:websocket 
let id2key = {}     // 用户的id和对应的信息，包括key，id:userinfo

wss.on('connection', function (ws, req) {
    // console.log(JSON.stringify(req))
    console.log('*******************************')
    ws.on('message', function (message) {
        message = JSON.parse(message)
        // 用户请求登入   
        if (message.type == 1) {
            console.log(`id为${message.userid}，用户名为${message.username}的用户登录了`)
            // 用户第一次发消息时，向链接池保存该链接，并记录用户id对应的链接是哪个
            userListConnPool[req.headers['sec-websocket-key']] = ws
            id2key[message.userid] = {
                username: message.username,
                userid: message.userid,
                key: req.headers['sec-websocket-key']
            }
            // 向所有人告知有人进入了聊天室
            let msg = {
                type: 4,
                username: message.username,
                checkType: 'in'
            }
            sendMsgToAll(msg)

            // 用户登出请求，将该用户的链接从连接池删除
        } else if (message.type == 2) {
            console.log(`id为${message.userid}，用户名为${message.username}的用户退出了`)

            // 向用户发送断开确认
            getWs(message.userid) ? getWs(message.userid).send(JSON.stringify(message)) : ''
            delete userListConnPool[id2key[message.userid].key]
            delete id2key[message.userid]

            // 向所有人告知有人退出了聊天室
            let msg = {
                type: 4,
                username: message.username,
                checkType: 'out'
            }
            sendMsgToAll(msg)

        } else if (message.type == 3) {
            console.log(`${message.username}说：${message.content}`)
            console.log(`id2key.length=${Object.keys(id2key).length}`)
            console.log(`userconn.length=${Object.keys(userListConnPool).length}`)
            // 向所有用户广播消息
            sendMsgToAll(message)
        }
    })
})

// 向所有人发送广播
function sendMsgToAll(message) {
    Object.keys(id2key).forEach(id => {
        userListConnPool[id2key[id].key].send(JSON.stringify(message))
    })
}
// 根据id获取对应用户的ws链接
function getWs(id) {
    if (id2key[id]) {
        return userListConnPool[id2key[id].key]
    }
    return false
}