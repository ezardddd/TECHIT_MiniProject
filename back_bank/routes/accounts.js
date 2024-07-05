const ac = require('express').Router();
const setup = require('../db_setup');
const sha = require('sha256');
const { MongoClient } = require('mongodb');
const { mongodb, mysqldb } = setup();

ac.post('/makeAccount',(req, res)=>{
    //인증 코드 필요


})

ac.post('/transfer',(req, res)=>{
    //인증 코드 필요

    
})

ac.post('/transfer',(req, res)=>{
    //인증 코드 필요

    
})

module.exports = ac;