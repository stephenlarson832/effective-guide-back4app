FROM node:18-alpine
WORKDIR /app
COPY package.json index.js ./
RUN npm install
EXPOSE 8080
CMD ["npm", "start"]
