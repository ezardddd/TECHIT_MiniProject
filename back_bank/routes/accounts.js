const ac = require('express').Router();
const setup = require('../db_setup');
const sha = require('sha256');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const e = require('express');
const { mongodb, mysqldb } = setup();
const express = require('express');
ac.use(express.json());

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;


// Function to generate a random account number
const generateRandomAccountNumber = () => {
    // Example: generate a random 10-digit number
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

//get token function
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
      if (err)
        return res.sendStatus(403);
      req.user = user;
      next();
    });
}

/////////////계정 관리 기능/////////////

//계정 생성
ac.post('/makeAccount',authenticateToken, async(req, res)=>{
    //인증 코드 필요
    console.log(req.body);
    const { mongodb, mysqldb } = await setup();
    let rows = mysqldb.query('INSERT INTO Account VALUES (?,?,?,?,?,?)', [null, req.user.userid, generateRandomAccountNumber(), req.body.accpw, req.body.accAmount, req.body.accType],(err, rows, fields)=>{
        if (err){}
        else{console.log(rows); res.send(rows);}
    })
    //완료시점
    console.log('makeAccount ok')
})

//계정 조회
//개인의 여러 계정을 조회
ac.get('/getAccounts',authenticateToken,async(req, res)=>{
    //인증 코드 필요
    const { mongodb, mysqldb } = await setup();
    let rows = mysqldb.query('select * from Account where userid = ?',[req.user.userid],(err, rows, fields)=>{
        if (err){}
        else{console.log(rows); res.send(rows);}
    })

    //완료시점
    console.log('getAccounts ok')
})

//총액조회
//개인 account들의 amount의 총합 조회
ac.get('/getAmount',async(req, res)=>{
    //인증 코드 필요
    const { mongodb, mysqldb } = await setup();
    let rows = mysqldb.query('select SUM(accAmount) from Account where userid = ?',[req.user.userid],(err, rows, fields)=>{
        if (err){}
        else{console.log(rows); res.send(rows);}
    })

    //완료시점
    console.log('getAmount ok');
})

//계정 조회 - 이미 토큰 검증 후 상황
//개인의 여러 계정 중 하나의 계좌를 조회, accountid 이용
ac.get('/getAccounts/:accountid',async(req, res)=>{
    //인증 코드 필요
    const { mongodb, mysqldb } = await setup();
    let rows = mysqldb.query('select * from Account where accountid = ?',[req.params.accountid],(err, rows, fields)=>{
        if (err){}
        else{console.log(rows); res.send(rows);}
    })

    //완료시점
    console.log('getAccounts ok');
})

//거래 내역 조회
ac.get('/getTransfer',async(req, res)=>{
    //인증 코드 필요
    const { mongodb, mysqldb } = await setup();
    let rows = mysqldb.query('select * from transfers where sendAccNumber = ? OR receiveAccNumber = ?',[req.body.accNumber, req.body.accNumber],(err, rows, fields)=>{
        if (err){}
        else{console.log(rows); res.send(rows);}
    })

    //완료시점
    console.log('getTransfer ok')
})


/////////////이체 기능/////////////

//계좌 비밀번호 인증
ac.get('/getTransfer',authenticateToken,async(req, res)=>{
    //인증 코드 필요

    const { mongodb, mysqldb } = await setup();
    let userAccPw = mysqldb.query('select accpw from transfers where accNumber=?',[req.body.accNumber]);

    //완료시점
    if(userAccPw == req.body.accpw){
        //이체 가능
        
    }else{
        //이체 불가

    }
})

//상대 계좌 확인
ac.get('/getReceiverAccountInfo',authenticateToken,async(req, res)=>{
    //인증 코드 필요

    const { mongodb, mysqldb } = await setup();
    let receiverUserId = mysqldb.query('select userid from account where accNumber=?',[],(err, rows, fields)=>{
        if (err){}
        else{console.log(rows); res.send(rows);}

        //상대 정보 확인
        mongodb.collection("user").findOne({ userid:receiverUserId })
        .then(result=>{
            //완료 시점
        })
        .catch(err=>{console.log(err);})
    })
})

//단순 이체
//플로우 : 유저가 상대계좌확인->계좌비밀번호 확인->이체 진행
//선행 조건 : 내 계좌 중 하나의 계좌 조회, 계좌 비밀번호 인증
//내 계좌 잔고 감소 -> 상대계좌 잔고 증가 -> 거래내역 추가
ac.post('/transfer',authenticateToken,async(req, res)=>{
    //인증 코드 필요
    const { mongodb, mysqldb } = await setup();
    
    mysqldb.beginTransaction((err) => {
        if (err) {
          return mysqldb.rollback(() => {
            throw err;
          });
        }
        
        //내 계좌
        mysqldb.query('UPDATE accounts SET accAmount = accAmount + ? where accNumber = ?', [req.body.money, req.body.sendAccNumber], (err, results) => {
          if (err) {
            return mysqldb.rollback(() => {
              throw err;
            });
          }
      
          //상대 계좌      
          mysqldb.query('UPDATE accounts SET 계좌잔고 = 계좌잔고 + ? where accNumber = ?', [req.body.money, req.body.receiveAccNumber], (err, results) => {
            if (err) {
              return mysqldb.rollback(() => {
                throw err;
              });
            }

            mysqldb.query('select accid from Account where accNumber = ?',[req.body.sendAccNumber],(err, senderAccid) => {
                if (err) {
                  return mysqldb.rollback(() => {
                    throw err;
                  });
                }
                //거래내역 추가
                mysqldb.query('INSERT INTO transfers VALUES (?,?,?,?,NOW(),?)', [null,senderAccid,req.body.sendAccNumber,req.body.receiveAccNumber,req.body.money],(err, rows, fields)=>{
                    if (err) {
                        return mysqldb.rollback(() => {
                        throw err;
                        });
                    }
                    //커밋시점
                    mysqldb.commit((err) => {
                        if (err) {
                            return mysqldb.rollback(() => {
                                throw err;
                            });
                        }
                        console.log('Transaction Completed Successfully.');
                        mysqldb.end();
                    });
                });
            });
          });
        });
    });
})


/////////////펀딩 기능/////////////

//게시물에 펀딩하기
//내 계좌에서 잔고 감소 -> 게시물의 펀딩값에 잔고 증가 -> 거래내역 추가
ac.post('/funding',authenticateToken,async(req, res)=>{
    //인증 코드 필요
    const { mongodb, mysqldb } = await setup();
    mysqldb.beginTransaction((err) => {
        if (err) {
          return mysqldb.rollback(() => {
            throw err;
          });
        }
        //내 계좌
        mysqldb.query('UPDATE accounts SET accAmount = accAmount + ? where accNumber = ?', [req.body.money, req.body.sendAccNumber], (err, results)=>{
            if (err) {
                return mysqldb.rollback(() => {
                    throw err;
                });
            }

        })
    })
})

module.exports = ac;