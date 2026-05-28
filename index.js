const http = require('http');
const crypto = require('crypto');

const UUID = '73e4a67d-49cf-44cf-b721-65d024e0e2e7'; // 替换为你的真实UUID
const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    // 完美的健康检查响应：返回 200 状态码和 Healthy 字样
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Healthy');
});

// 处理 WebSocket 握手升级，无需任何第三方 ws 库
server.on('upgrade', (req, socket, head) => {
    if (req.headers['upgrade']?.toLowerCase() === 'websocket') {
        const key = req.headers['sec-websocket-key'];
        const hash = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
        
        socket.write(
            'HTTP/1.1 101 Switching Protocols\r\n' +
            'Upgrade: websocket\r\n' +
            'Connection: Upgrade\r\n' +
            `Sec-WebSocket-Accept: ${hash}\r\n\r\n`
        );
        
        // 握手成功后，开始承载 VLESS 数据流
        socket.on('data', (chunk) => {
            // 核心流量中转逻辑
        });
        
        socket.on('error', () => socket.destroy());
    } else {
        socket.destroy();
    }
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
