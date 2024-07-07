const dotenv = require("dotenv").config();
const setup = require("./db_setup");
const express = require("express");
const app = express();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
////////////// body-parser 라이브러리 추가
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());



app.get('/generate', (req, res) => {
    const secret = speakeasy.generateSecret({ length: 20 });
    
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
        res.json({
            secret: secret.base32,
            qr_code: data_url
        });
    });
  });
  
  app.post('/verify', (req, res) => {
    const { token, secret } = req.body;
    console.log(token, secret);
    const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token
    });
  
    if (verified) {
        res.send('Verification successful');
    } else {
        res.send('Verification failed');
    }
  });

  module.exports = google_2fa;