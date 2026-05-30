const http = require('http');
const net = require('net');
const crypto = require('crypto');

// 必须和你在 v2rayN 里填写的 id 一致
const userID = '73e4a67d-49cf-44cf-b721-65d024e0e2e7'; 
const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Healthy');
});

server.on('upgrade', (req, socket, head) => {
    if (req.headers['upgrade']?.toLowerCase() !== 'websocket') {
        socket.destroy();
        return;
    }

    const key = req.headers['sec-websocket-key'];
    const hash = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    
    socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: WebSocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${hash}\r\n\r\n`
    );

    let isFirstChunk = true;
    let remoteSocket = null;

    socket.on('data', (chunk) => {
        if (isFirstChunk) {
            isFirstChunk = false;
            
            // 简单的 VLESS 协议最小化解包（处理协议版本和验证 UUID）
            if (chunk.length < 22) {
                socket.destroy();
                return;
            }
            
            const version = chunk[0];
            const clientUUID = chunk.slice(1, 17).toString('hex');
            const targetUUID = userID.replace(/-/g, '');

            if (clientUUID !== targetUUID) {
                socket.destroy();
                return;
            }

            const addonLen = chunk[17];
            const command = chunk[18 + addonLen]; // 1: TCP, 2: UDP
            const portIndex = 19 + addonLen;
            const targetPort = chunk.readUInt16BE(portIndex);
            const addressType = chunk[portIndex + 2]; // 1: IPv4, 2: Domain, 3: IPv6
            
            let targetHost = '';
            let headerLen = 0;

            if (addressType === 1) { // IPv4
                targetHost = `${chunk[portIndex+3]}.${chunk[portIndex+4]}.${chunk[portIndex+5]}.${chunk[portIndex+6]}`;
                headerLen = portIndex + 7;
            } else if (addressType === 2) { // Domain
                const domainLen = chunk[portIndex + 3];
                targetHost = chunk.slice(portIndex + 4, portIndex + 4 + domainLen).toString();
                headerLen = portIndex + 4 + domainLen;
            } else {
                socket.destroy();
                return;
            }

            // 建立与目标网站的真实 TCP 连接
            remoteSocket = net.connect(targetPort, targetHost, () => {
                // 回应 VLESS 客户端握手成功（1字节版本 + 1字节附加信息长度）
                const response = Buffer.from([version, 0]);
                socket.write(response);
                
                // 发送剩余的握手数据流
                if (chunk.length > headerLen) {
                    remoteSocket.write(chunk.slice(headerLen));
                }
            });

            remoteSocket.on('data', (data) => {
                // 将目标网站返回的数据，打包通过 WebSocket 发回客户端
                const maskHeader = Buffer.alloc(2);
                if (data.length <= 125) {
                    maskHeader[0] = 0x82;
                    maskHeader[1] = data.length;
                    socket.write(Buffer.concat([maskHeader, data]));
                } else if (data.length <= 65535) {
                    const longHeader = Buffer.alloc(4);
                    longHeader[0] = 0x82;
                    longHeader[1] = 126;
                    longHeader.writeUInt16BE(data.length, 2);
                    socket.write(Buffer.concat([longHeader, data]));
                } else {
                    const hugeHeader = Buffer.alloc(10);
                    hugeHeader[0] = 0x82;
                    hugeHeader[1] = 127;
                    hugeHeader.writeBigUInt64BE(BigInt(data.length), 2);
                    socket.write(Buffer.concat([hugeHeader, data]));
                }
            });

            remoteSocket.on('error', () => {
                socket.destroy();
                remoteSocket?.destroy();
            });

            remoteSocket.on('close', () => socket.destroy());
        } else {
            // 后续流量直接转发给目标真实网站
            if (remoteSocket && remoteSocket.writable) {
                remoteSocket.write(chunk);
            }
        }
    });

    socket.on('error', () => {
        remoteSocket?.destroy();
        socket.destroy();
    });
    
    socket.on('close', () => remoteSocket?.destroy());
});

server.listen(port, () => {
    console.log(`VLESS 核心解析服务已在端口 ${port} 上运行`);
});
