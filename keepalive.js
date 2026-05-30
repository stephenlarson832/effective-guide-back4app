const https = require('https');

// ================= 配置区 =================
// 填入你 Back4App 或者是 Cloudflare Tunnel 绑定映射后的公网 HTTPS 域名
const APP_URL = 'https://b4a.stephenlarson.de5.net/chat'; 
// ==========================================

console.log("[保活系统] 定时器已成功加载...");

setInterval(() => {
    if (!APP_URL.includes('your-cloudflare-or-b4a-domain')) {
        console.log(`[保活系统] ${new Date().toISOString()} 正在发送保活 Ping -> ${APP_URL}`);
        
        https.get(APP_URL, (res) => {
            console.log(`[保活系统] 收到响应状态码: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error(`[保活系统] 请求失败: ${err.message}`);
        });
    } else {
        console.warn("[保活系统] 警告：请在 keepalive.js 中配置你真实的 APP_URL 域名！");
    }
}, 10 * 60 * 1000); // 每 10 分钟自动请求一次
