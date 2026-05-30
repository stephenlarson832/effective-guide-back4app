FROM alpine:latest

# 安装必要依赖、supervisor 以及 nodejs
RUN apk add --no-cache wget tar curl supervisor nodejs

WORKDIR /app

# 下载 sing-box
RUN wget https://github.com/SagerNet/sing-box/releases/download/v1.10.1/sing-box-1.10.1-linux-amd64.tar.gz && \
    tar -zxvf sing-box-1.10.1-linux-amd64.tar.gz && \
    mv sing-box-1.10.1-linux-amd64/sing-box . && \
    rm -rf sing-box-1.10.1-linux-amd64*

# 下载 cloudflared
RUN wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /app/cloudflared && \
    chmod +x /app/cloudflared

# 复制配置文件和手写的 JS 服务
COPY config.json /app/config.json
COPY vless_server.js /app/vless_server.js
COPY keepalive.js /app/keepalive.js
COPY supervisord.conf /etc/supervisord.conf

# 暴露端口给 Back4App 平台映射
EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
