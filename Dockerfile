FROM alpine:latest
RUN apk add --no-cache wget tar curl
WORKDIR /app

# 下载 sing-box 官方程序
RUN wget https://github.com/SagerNet/sing-box/releases/download/v1.10.1/sing-box-1.10.1-linux-amd64.tar.gz && \
    tar -zxvf sing-box-1.10.1-linux-amd64.tar.gz && \
    mv sing-box-1.10.1-linux-amd64/sing-box . && \
    rm -rf sing-box-1.10.1-linux-amd64*

COPY config.json .

# Back4App 容器通常需要动态监听端口，我们固定监听 8080 并在平台映射为 443
EXPOSE 8080
CMD ["./sing-box", "run", "-c", "config.json"]
