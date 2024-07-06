const ac = require('express').Router();
const setup = require('../db_setup');
const sha = require('sha256');
const { MongoClient } = require('mongodb');
const authJWT = require('../middleware/authJWT');
const express = require('express');

ac.use(express.json());

// Function to generate a random account number
const generateRandomAccountNumber = () => {
    // Example: generate a random 10-digit number
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

/////////////계정 관리 기능/////////////

//계정 생성
ac.post('/makeAccount', authJWT, async(req, res) => {
    console.log('Request body:', req.body);
    console.log('User ID:', req.userid);

    if (!req.userid || !req.body.accpw || !req.body.accAmount || !req.body.accType) {
        return res.status(400).json({ msg: "필수 정보가 누락되었습니다" });
    }

    const { mysqldb } = await setup();
    const accNumber = generateRandomAccountNumber();

    mysqldb.query(
        'INSERT INTO Account (userid, accNumber, accpw, accAmount, accType) VALUES (?, ?, ?, ?, ?)', 
        [req.userid, accNumber, req.body.accpw, req.body.accAmount, req.body.accType],
        (err, result) => {
            if (err) {
                console.error('Query error:', err);
                return res.status(500).json({ msg: "서버 오류", error: err.message });
            }
            console.log('Insert result:', result);
            res.status(200).json({ 
                msg: "계좌 생성 성공", 
                data: { 
                    accid: result.insertId,
                    accNumber: accNumber
                }
            });
        }
    );
});

//계정 조회
//개인의 여러 계정을 조회
ac.get('/getAccounts', authJWT, async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    let rows = mysqldb.query('select * from Account where userid = ?',[req.userid],(err, rows, fields)=>{
        if (err){
            res.status(500).json({ msg: "서버 오류" });
        }
        else{
            console.log(rows); 
            res.send(rows);
        }
    })
    console.log('getAccounts ok')
})

//총액조회
//개인 account들의 amount의 총합 조회
ac.get('/getAmount', authJWT, async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    let rows = mysqldb.query('select SUM(accAmount) from Account where userid = ?',[req.userid],(err, rows, fields)=>{
        if (err){
            res.status(500).json({ msg: "서버 오류" });
        }
        else{
            console.log(rows); 
            res.send(rows);
        }
    })
    console.log('getAmount ok');
})

//계정 조회 - 이미 토큰 검증 후 상황
//개인의 여러 계정 중 하나의 계좌를 조회, accountid 이용
ac.get('/getTransfer', authJWT, async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    let rows = mysqldb.query('select * from transfers where sendAccNumber = ? OR receiveAccNumber = ?',[req.body.accNumber, req.body.accNumber],(err, rows, fields)=>{
        if (err){
            res.status(500).json({ msg: "서버 오류" });
        }
        else{
            console.log(rows); 
            res.send(rows);
        }
    })
    console.log('getTransfer ok')
})

//거래 내역 조회
ac.get('/getTransfer', authJWT, async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    let rows = mysqldb.query('select * from transfers where sendAccNumber = ? OR receiveAccNumber = ?',[req.body.accNumber, req.body.accNumber],(err, rows, fields)=>{
        if (err){
            res.status(500).json({ msg: "서버 오류" });
        }
        else{
            console.log(rows); 
            res.send(rows);
        }
    })
    console.log('getTransfer ok')
})


/////////////이체 기능/////////////

//계좌 비밀번호 인증
ac.get('/getTransfer', authJWT, async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    let userAccPw = mysqldb.query('select accpw from transfers where accNumber=?',[req.body.accNumber]);

    if(userAccPw == req.body.accpw){
        res.json({ msg: "계좌 비밀번호 인증 성공" });
    } else {
        res.status(400).json({ msg: "계좌 비밀번호 인증 실패" });
    }
})

//상대 계좌 확인
ac.get('/getReceiverAccountInfo', authJWT, async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    mysqldb.query('select userid from account where accNumber=?',[req.body.accNumber], async (err, rows, fields) => {
        if (err){
            res.status(500).json({ msg: "서버 오류" });
        }
        else{
            const receiverUserId = rows[0].userid;
            try {
                const result = await mongodb.collection("user").findOne({ userid: receiverUserId });
                res.json(result);
            } catch (error) {
                console.log(error);
                res.status(500).json({ msg: "서버 오류" });
            }
        }
    })
})

//단순 이체
//플로우 : 유저가 상대계좌확인->계좌비밀번호 확인->이체 진행
//선행 조건 : 내 계좌 중 하나의 계좌 조회, 계좌 비밀번호 인증
//내 계좌 잔고 감소 -> 상대계좌 잔고 증가 -> 거래내역 추가
ac.post('/transfer', authJWT, async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    
    mysqldb.beginTransaction((err) => {
        if (err) {
          return mysqldb.rollback(() => {
            throw err;
          });
        }
        
        mysqldb.query('UPDATE accounts SET accAmount = accAmount - ? where accNumber = ?', [req.body.money, req.body.sendAccNumber], (err, results) => {
          if (err) {
            return mysqldb.rollback(() => {
              throw err;
            });
          }
      
          mysqldb.query('UPDATE accounts SET accAmount = accAmount + ? where accNumber = ?', [req.body.money, req.body.receiveAccNumber], (err, results) => {
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
                mysqldb.query('INSERT INTO transfers VALUES (?,?,?,?,NOW(),?)', [null,senderAccid[0].accid,req.body.sendAccNumber,req.body.receiveAccNumber,req.body.money],(err, rows, fields)=>{
                    if (err) {
                        return mysqldb.rollback(() => {
                        throw err;
                        });
                    }
                    mysqldb.commit((err) => {
                        if (err) {
                            return mysqldb.rollback(() => {
                                throw err;
                            });
                        }
                        console.log('Transaction Completed Successfully.');
                        res.json({ msg: "이체 성공" });
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
ac.post('/funding', authJWT, async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    mysqldb.beginTransaction((err) => {
        if (err) {
          return mysqldb.rollback(() => {
            throw err;
          });
        }
        mysqldb.query('UPDATE accounts SET accAmount = accAmount - ? where accNumber = ?', [req.body.money, req.body.sendAccNumber], (err, results)=>{
            if (err) {
                return mysqldb.rollback(() => {
                    throw err;
                });
            }
            // 여기에 펀딩 로직을 추가
            // 예: 펀딩 게시물의 모금액 증가, 펀딩 내역 저장 등
            mysqldb.commit((err) => {
                if (err) {
                    return mysqldb.rollback(() => {
                        throw err;
                    });
                }
                console.log('Funding Completed Successfully.');
                res.json({ msg: "펀딩 성공" });
            });
        })
    })
})

module.exports = ac;