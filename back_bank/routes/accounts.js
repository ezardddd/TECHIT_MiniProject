const ac = require('express').Router();
const setup = require('../db_setup');
const sha = require('sha256');
const { MongoClient } = require('mongodb');
const authJWT = require('../middleware/authJWT');
const auth2FA = require('../middleware/auth2FA');
const express = require('express');

ac.use(express.json());

// Function to generate a random account number
const generateRandomAccountNumber = () => {
    // Example: generate a random 10-digit number
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

/////////////계정 관리 기능/////////////

//계정 생성
ac.post('/accounts/makeAccount', authJWT, async(req, res) => {
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
ac.get('/accounts/getAccounts', authJWT, async(req, res) => {
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
ac.get('/accounts/getAmount', authJWT, async(req, res) => {
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
ac.get('/accounts/getTransfer', authJWT, async(req, res) => {
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

// 계좌 이체 내역 조회
ac.get('/accounts/getTransferHistory/:accNumber', authJWT, async (req, res) => {
    const { mysqldb } = await setup();
    const { accNumber } = req.params;

    const query = `
        SELECT 
            transferid,
            CASE 
                WHEN sendAccNumber = ? THEN '송금'
                ELSE '입금'
            END AS type,
            CASE 
                WHEN sendAccNumber = ? THEN recieveAccNumber
                ELSE sendAccNumber
            END AS otherAccount,
            transfertime,
            CASE 
                WHEN sendAccNumber = ? THEN -transfervalue
                ELSE transfervalue
            END AS amount
        FROM transfers
        WHERE sendAccNumber = ? OR recieveAccNumber = ?
        ORDER BY transfertime DESC
    `;

    mysqldb.query(query, [accNumber, accNumber, accNumber, accNumber, accNumber], (err, results) => {
        if (err) {
            console.error('이체 내역 조회 오류:', err);
            return res.status(500).json({ msg: "서버 오류" });
        }
        res.json(results);
    });
});

/////////////이체 기능/////////////

//계좌 비밀번호 인증
ac.get('/accounts/getTransfer', authJWT, async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    
    let userAccPw = mysqldb.query('select accpw from transfers where accNumber=?',[req.body.accNumber]);

    if(userAccPw == req.body.accpw){
        res.json({ msg: "계좌 비밀번호 인증 성공" });
    } else {
        res.status(400).json({ msg: "계좌 비밀번호 인증 실패" });
    }
})

//상대 계좌 확인
ac.get('/accounts/getReceiverAccountInfo', authJWT, async(req, res) => {
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
ac.post('/accounts/transfer', authJWT, auth2FA, async(req, res) => {
    const { mysqldb } = await setup();
    
    const { sendAccNumber, receiveAccNumber, amount, accpw } = req.body;
    
    // 금액이 0 이하인 경우 거부
    if (amount <= 0) {
        return res.status(400).json({ msg: "유효하지 않은 금액입니다." });
    }
    
    // 송금자와 수취자 계좌번호가 같은 경우 거부
    if (sendAccNumber === receiveAccNumber) {
        return res.status(400).json({ msg: "자기 자신에게 송금할 수 없습니다." });
    }

    mysqldb.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ msg: "트랜잭션 시작 오류" });
        }
        
        try {
            // 계좌 비밀번호 확인
            const [senderAccount] = await mysqldb.promise().query('SELECT * FROM Account WHERE accNumber = ? AND userid = ?', [sendAccNumber, req.userid]);
            if (senderAccount.length === 0 || senderAccount[0].accpw !== accpw) {
                throw new Error("계좌 정보가 일치하지 않습니다.");
            }
            
            // 잔액 확인
            if (senderAccount[0].accAmount < amount) {
                throw new Error("잔액이 부족합니다.");
            }
            
            // 수취자 계좌 확인
            const [receiverAccount] = await mysqldb.promise().query('SELECT * FROM Account WHERE accNumber = ?', [receiveAccNumber]);
            if (receiverAccount.length === 0) {
                throw new Error("수취자 계좌가 존재하지 않습니다.");
            }
            
            // 송금자 계좌 잔액 감소
            await mysqldb.promise().query('UPDATE Account SET accAmount = accAmount - ? WHERE accNumber = ?', [amount, sendAccNumber]);
            
            // 수취자 계좌 잔액 증가
            await mysqldb.promise().query('UPDATE Account SET accAmount = accAmount + ? WHERE accNumber = ?', [amount, receiveAccNumber]);
            
            // 거래 내역 추가
            await mysqldb.promise().query('INSERT INTO transfers (accid, sendAccNumber, recieveAccNumber, transfertime, transfervalue) VALUES (?, ?, ?, NOW(), ?)',
                [senderAccount[0].accid, sendAccNumber, receiveAccNumber, amount]);
            
            await mysqldb.promise().commit();
            res.json({ msg: "이체 성공" });
        } catch (error) {
            await mysqldb.promise().rollback();
            res.status(400).json({ msg: error.message });
        }
    });
});

//펀딩 계좌 조회

ac.get('/accounts/getFundingAccounts', authJWT, async (req, res) => {
    const { mysqldb } = await setup();
    try {
        const [accounts] = await mysqldb.promise().query(
            'SELECT accNumber, accAmount FROM Account WHERE userid = ? AND accType = "funding"',
            [req.userid]
        );
        res.json(accounts);
    } catch (error) {
        console.error('펀딩 계좌 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


module.exports = ac;