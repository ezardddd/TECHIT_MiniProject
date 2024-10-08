const dotenv = require("dotenv").config();
const setup = require("./db_setup");
const express = require("express");
const fs = require('fs');
const https = require('https');
const router = express.Router();
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');

const options = {
    key: fs.readFileSync("./server.key"),
    cert: fs.readFileSync("./server.cert"),
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cookieParser());

const cors = require('cors')
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://3.14.64.117:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Refresh'],
  exposedHeaders: ['Authorization'],
  credentials: true
}
app.use(cors(corsOptions))

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/', require('./routes/users')); 
app.use('/', require('./routes/funding'));
app.use('/', require('./routes/accounts')); 

https.createServer(options, app).listen(process.env.WEB_PORT, async () => {
    await setup();
    console.log(`${process.env.WEB_PORT} 포트 https 서버 실행 중.. `);
});