FROM alpine:latest

# 同时下载 sing-box 和 cloudflared 官方程序
RUN apk add --no-cache wget tar curl supervisor

WORKDIR /app

# 下载 sing-box
RUN wget https://github.com/SagerNet/sing-box/releases/download/v1.10.1/sing-box-1.10.1-linux-amd64.tar.gz && \
    tar -zxvf sing-box-1.10.1-linux-amd64.tar.gz && \
    mv sing-box-1.10.1-linux-amd64/sing-box . && \
    rm -rf sing-box-1.10.1-linux-amd64*

# 下载 cloudflared
RUN wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /app/cloudflared && \
    chmod +x /app/cloudflared

COPY config.json /app/config.json
COPY supervisord.conf /etc/supervisord.conf

# 暴露出端口供本地或CF隧道读取
EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
