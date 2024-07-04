const dotenv = require("dotenv").config();
const setup = require("./db_setup");
const express = require("express");
const fs = require('fs');
const https = require('https');
const router = express.Router();
const bodyParser = require("body-parser");

const app = express();

const options = {
    key: fs.readFileSync("./server.key"),
    cert: fs.readFileSync("./server.cert"),
};


app.use(bodyParser.urlencoded({ extended: true }));
// app.use('/', require('./routes/posts')); // 펀딩 게시물 관련
// app.use('/', require('./routes/accounts')); // 계좌, 이체 관련
app.use('/', require('./routes/users')); //로그인 & 보안-인증 관련

app.use(express.json())

const cors = require('cors')
const corsOptions = {
  origin: 'https://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))

app.get('/', (req, res) => {
    res.send('Hello World!');
  });

https.createServer(options, app).listen(process.env.WEB_PORT, async () => {
    await setup();
    console.log(`${process.env.WEB_PORT} 포트 https 서버 실행 중.. `);
});