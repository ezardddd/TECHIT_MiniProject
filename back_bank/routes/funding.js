const express = require('express');
const router = express.Router();
const setup = require('../db_setup');
const authJWT = require('../middleware/authJWT');
const multer = require('multer');
const path = require('path');
const auth2FA = require('../middleware/auth2FA');

// 파일 업로드를 위한 multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// 펀딩 프로젝트 목록 조회
router.get('/funding/list', async (req, res) => {
  const { mysqldb } = await setup();
  mysqldb.query('SELECT * FROM posts ORDER BY postid DESC', (err, results) => {
    if (err) {
      res.status(500).json({ message: '서버 오류' });
    } else {
      res.json(results);
    }
  });
});

// 펀딩 프로젝트 상세 조회
router.get('/funding/:id', async (req, res) => {
    const { mysqldb, mongodb } = await setup();
    
    mysqldb.query('SELECT * FROM posts WHERE postid = ?', [req.params.id], async (err, results) => {
      if (err) {
        res.status(500).json({ message: '서버 오류' });
      } else if (results.length === 0) {
        res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
      } else {
        const project = results[0];
        try {
          const user = await mongodb.collection("user").findOne({ userid: project.userid });
          project.username = user ? user.username : '알 수 없는 사용자';
          res.json(project);
        } catch (mongoErr) {
          console.error('MongoDB 조회 오류:', mongoErr);
          project.username = '알 수 없는 사용자';
          res.json(project);
        }
      }
    });
  });

// 새 펀딩 프로젝트 생성
router.post('/funding/create', authJWT, upload.single('image'), async (req, res) => {
  const { title, content, goal } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const { mysqldb } = await setup();

  mysqldb.query(
    'INSERT INTO posts (userid, title, content, goal, currentAmount, investorCount, imageUrl) VALUES (?, ?, ?, ?, 0, 0, ?)',
    [req.userid, title, content, goal, imageUrl],
    (err, result) => {
      if (err) {
        res.status(500).json({ message: '서버 오류' });
      } else {
        res.status(201).json({ message: '프로젝트가 생성되었습니다.', postid: result.insertId });
      }
    }
  );
});

//펀딩을 위한 계정 조회
//개인의 여러 계정을 조회
router.get('/funding/:id/getAccounts', authJWT, async(req, res) => {
  const { mongodb, mysqldb } = await setup();
  let rows = mysqldb.query('select * from Account where userid = ? and accType = ?',[req.userid, "funding"],(err, rows, fields)=>{
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

// 펀딩하기
router.post('/funding/:id/invest', authJWT,auth2FA, async (req, res) => {
    const { accid, sendAccNumber, amount, twoFactorToken } = req.body;
    const { mysqldb } = await setup();
  
    if (amount <= 0) {
      return res.status(400).json({ message: '펀딩 금액은 0보다 커야 합니다.' });
    }
  
    try {
      //트랜잭션 시작
        await new Promise((resolve, reject) => {
            mysqldb.beginTransaction(err => {
                if (err) reject(err);
                else resolve();
            });
        });
        
      //펀딩 거래내역 있는지 확인
        let postReceiveAccNumber = "funding-"+req.params.id;
        let alreadyInvestor = mysqldb.query('select * from transfers where receiveAccNumber = ? AND sendAccNumber = ?',[postReceiveAccNumber, sendAccNumber]);

      //거래 내역이 없으면 investorCount 1 추가하면서 금액 추가
        await new Promise((resolve, reject) => {
          if(alreadyInvestor){
            mysqldb.query(
              'UPDATE posts SET currentAmount = currentAmount + ? WHERE postid = ?',
              [amount, req.params.id],
              (err, result) => {
                  if (err) reject(err);
                  else resolve(result);
              }
            );
          }else{
            mysqldb.query(
              'UPDATE posts SET currentAmount = currentAmount + ?, investorCount = investorCount + 1 WHERE postid = ?',
              [amount, req.params.id],
              (err, result) => {
                  if (err) reject(err);
                  else resolve(result);
              }
            );
          }
        });

      //송금자 계좌 잔액 감소
        await new Promise((resolve, reject) => {
          mysqldb.query(
            'UPDATE Account SET accAmount = accAmount - ? WHERE accNumber = ?',
            [amount, sendAccNumber],
            (err, result) => {
                if (err) reject(err);
                else resolve(result);
            }
          );
        });

      //거래내역에 등록
        await new Promise((resolve, reject) => {
          mysqldb.query(
            'insert into transfers (accid, sendAccNumber, recieveAccNumber, transfertime, transfervalue) VALUES (?, ?, ?, NOW(), ?)',
            [accid, sendAccNumber, postReceiveAccNumber, amount],
            (err, result) => {
                if (err) reject(err);
                else resolve(result);
            }
          );
        });

        await new Promise((resolve, reject) => {
            mysqldb.commit(err => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ message: '펀딩에 성공했습니다.' });
    } catch (error) {
        await new Promise(resolve => {
            mysqldb.rollback(() => resolve());
        });
        console.error('펀딩 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;