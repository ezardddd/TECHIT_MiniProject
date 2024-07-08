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

// 펀딩하기
router.post('/funding/:id/invest', authJWT, auth2FA, async (req, res) => {
    const { accountNumber, amount, twoFactorToken } = req.body;
    const projectId = req.params.id;
    const userId = req.userid;
    const { mysqldb } = await setup();

    if (amount <= 0) {
        return res.status(400).json({ message: '펀딩 금액은 0보다 커야 합니다.' });
    }

    mysqldb.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ message: '서버 오류' });
        }

        try {
            // 계좌 잔액 확인
            const [account] = await mysqldb.promise().query(
                'SELECT accAmount FROM Account WHERE accNumber = ? AND userid = ? AND accType = "funding"',
                [accountNumber, userId]
            );

            if (account.length === 0) {
                throw new Error('유효하지 않은 펀딩 계좌입니다.');
            }

            if (account[0].accAmount < amount) {
                throw new Error('잔액이 부족합니다.');
            }

            // 계좌에서 금액 차감
            await mysqldb.promise().query(
                'UPDATE Account SET accAmount = accAmount - ? WHERE accNumber = ?',
                [amount, accountNumber]
            );


            
            // 이미 투자한 사용자인지 확인
            const [existingInvestor] = await mysqldb.promise().query(
                'SELECT * FROM project_investors WHERE project_id = ? AND user_id = ?',
                [projectId, userId]
            );

            let investorCountIncrement = 0;
            if (existingInvestor.length === 0) {
                await mysqldb.promise().query(
                    'INSERT INTO project_investors (project_id, user_id) VALUES (?, ?)',
                    [projectId, userId]
                );
                investorCountIncrement = 1;
            }

            // 프로젝트 업데이트
            await mysqldb.promise().query(
                'UPDATE posts SET currentAmount = currentAmount + ?, investorCount = investorCount + ? WHERE postid = ?',
                [amount, investorCountIncrement, projectId]
            );

            await mysqldb.promise().commit();
            res.json({ message: '펀딩에 성공했습니다.' });
        } catch (error) {
            await mysqldb.promise().rollback();
            console.error('펀딩 오류:', error);
            res.status(400).json({ message: error.message || '펀딩 중 오류가 발생했습니다.' });
        }
    });
});




module.exports = router;