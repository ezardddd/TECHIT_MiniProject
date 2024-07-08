const router = require('express').Router();
const setup = require('../db_setup');
const sha = require('sha256');
const jwt = require('../utils/jwt_utils');
const authJWT = require('../middleware/authJWT');
const refresh = require('../utils/refresh');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');




router.post('/users/refresh', refresh);

router.post('/users/insertMember', async function (req, res) {
  const { mongodb, mysqldb } = await setup();
  mongodb
    .collection("user")
    .findOne({ userid: req.body.id })
    .then((result) => {
      if (result) {
        res.json({ msg: "가입 실패 : 중복된 아이디입니다" });
      } else {
        const generateSalt = (length = 16) => {
          const crypto = require('crypto');
          return crypto.randomBytes(length).toString('hex');
        };

        const salt = generateSalt();
        console.log(req.body);
        //password 암호화
        req.body.pw = sha(req.body.pw + salt);
        mongodb
          .collection("user")
          .insertOne({
            userid: req.body.id,
            userpw: req.body.pw,
            username: req.body.name,
            email: req.body.email,
            securityQuestion: req.body.securityQuestion,
            securityAnswer: req.body.securityAnswer,
            register_date: new Date(),
          })
          .then((result) => {
            if (result) {
              console.log("회원가입 성공");
              const sql = `INSERT INTO UserSalt(userid, salt) VALUES(?,?)`;
              mysqldb.query(sql, [req.body.id, salt],
                (err, rows, fields) => {
                  if (err) {
                    console.log(err);
                    res.json({ msg: "회원 가입 실패 : 서버 오류" });
                  } else {
                    console.log('salt 저장 성공');
                    res.json({ msg: "회원 가입 되셨습니다" });
                  }
                });
            } else {
              console.log("회원가입 fail");
              res.json({ msg: "회원 가입 실패" });
            }
          })
          .catch((err) => {
            console.log(err);
            res.json({ msg: "회원 가입 실패 : 서버 오류" });
          });
      }
    })
    .catch((err) => {
      res.json({ msg: "회원 가입 실패 : 서버 오류" });
    });
});

router.post('/users/login', async (req, res) => {
  const { mongodb, mysqldb } = await setup();
  const { userid, userpw } = req.body;

  mysqldb.query('SELECT salt FROM UserSalt WHERE userid = ?', [userid], async (err, saltRows) => {
    if (err) {
      return res.status(500).json({ msg: "서버 오류" });
    }

    if (saltRows.length === 0) {
      return res.status(400).json({ msg: "사용자를 찾을 수 없습니다." });
    }

    const salt = saltRows[0].salt;

    try {
      const user = await mongodb.collection("user").findOne({ userid: userid });

      if (!user) {
        return res.status(400).json({ msg: "사용자를 찾을 수 없습니다." });
      }

      const hashedPassword = sha(userpw + salt);

      if (hashedPassword === user.userpw) {
        const accessToken = jwt.sign(user);
        const refreshToken = jwt.refresh();
        const currentTime = new Date();

        await mongodb.collection("refreshTokens").updateOne(
          { userid: user.userid },
          { $set: { token: refreshToken, createdAt: currentTime } },
          { upsert: true }
        );
        // 로그인 성공 시 로그인 시도 횟수를 초기화합니다.
        await mongodb.collection("user").updateOne(
          { userid: userid },
          { $set: { loginAttempts: 0 } }
        );


        res.json({
          msg: "로그인 성공",
          accessToken: accessToken,
          refreshToken: refreshToken,
          user: { userid: user.userid, username: user.username }
        });
      } else {
        res.status(400).json({ msg: "로그인 실패." });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "서버 오류" });
    }
  });
});

router.get('/users/me', authJWT, async (req, res) => {
  const { mongodb } = await setup();

  try {
    const user = await mongodb.collection("user").findOne({ userid: req.userid });
    if (user) {
      res.json({
        userid: user.userid,
        username: user.username,
        email: user.email
      });
    } else {
      res.status(404).json({ msg: "사용자를 찾을 수 없습니다." });
      // 로그인 시도 횟수를 확인합니다.
   let loginAttempts = user.loginAttempts || 0;

   // 로그인 시도 횟수가 5번 이상일 경우 이메일을 보내 로그인을 막습니다.
   if (loginAttempts >= 5) {
     req.user = user;
     return next(); // 다음 미들웨어로 이동 (sendEmail)
   }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "서버 오류" });
  }
   
});

router.post('/users/logout', async (req, res) => {
  console.log(req.headers['refresh'], req.headers['authorization']?.split(' ')[1]);
  try {
    const accessToken = req.headers['authorization']?.split(' ')[1];
    const refreshToken = req.headers['refresh'];

    if (!refreshToken || !accessToken) {
      return res.status(400).json({ msg: "리프레시 토큰과 액세스 토큰이 필요합니다." });
    }

    // JWT 검증 (옵션)
    try {
      jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      console.log("액세스 토큰 만료, 로그아웃 계속 진행");
    }

    // refreshToken을 데이터베이스에서 제거
    const { mongodb } = await setup();
    const result = await mongodb.collection("refreshTokens").deleteOne({ token: refreshToken });

    if (result.deletedCount === 0) {
      return res.status(400).json({ msg: "유효하지 않은 리프레시 토큰입니다." });
    }

    res.status(200).json({ msg: "로그아웃 성공" });
  } catch (error) {
    console.error('로그아웃 에러:', error);
    res.status(500).json({ msg: "서버 오류", error: error.message });
  }
});


//2fa 설정
router.post('/users/setup2fa', authJWT, async (req, res) => {
  const { mongodb } = await setup();
  const secret = speakeasy.generateSecret({ 
    length: 32,
    name: `5조 뱅크:${req.userid}`,
    issuer: 'Group 5 Bank',
    algorithm: 'sha256'
  });

  try {
    await mongodb.collection("user").updateOne(
      { userid: req.userid },
      { $set: { 
        twoFactorSecret: secret.base32,
        twoFactorAlgorithm: 'sha256'
      } }
    );

    const otpauth_url = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `5조 뱅크:${req.userid}`,
      issuer: 'Group 5 Bank',
      algorithm: 'sha256'
    });

    qrcode.toDataURL(otpauth_url, (err, data_url) => {
      if (err) {
        console.error('QR 코드 생성 오류:', err);
        return res.status(500).json({ msg: "QR 코드 생성 오류" });
      }
      res.json({ secret: secret.base32, qr_code: data_url });
    });
  } catch (error) {
    console.error('2FA 설정 오류:', error);
    res.status(500).json({ msg: "서버 오류" });
  }
});

// 기존 2FA 확인 (재설정 전)
router.post('/users/verify2fa', authJWT, async (req, res) => {
  const { token } = req.body;
  const { mongodb } = await setup();

  try {
    const user = await mongodb.collection("user").findOne({ userid: req.userid });

    if (!user.twoFactorSecret) {
      return res.status(400).json({ msg: "2FA가 설정되지 않았습니다.", verified: false });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      algorithm: 'sha256' // 또는 사용자의 알고리즘
    });

    if (verified) {
      res.json({ msg: "2FA 인증 성공", verified: true });
    } else {
      res.status(400).json({ msg: "2FA 인증 실패", verified: false });
    }
  } catch (error) {
    console.error('2FA 확인 오류:', error);
    res.status(500).json({ msg: "서버 오류", verified: false });
  }
});


//2FA 상태 확인
router.get('/users/check2fa', authJWT, async (req, res) => {
  const { mongodb } = await setup();

  try {
    const user = await mongodb.collection("user").findOne({ userid: req.userid });
    
    if (!user) {
      return res.status(404).json({ msg: "사용자를 찾을 수 없습니다." });
    }

    const is2FAEnabled = !!user.twoFactorSecret;
    res.json({ is2FAEnabled });
  } catch (error) {
    console.error('2FA 상태 확인 오류:', error);
    res.status(500).json({ msg: "서버 오류" });
  }
});

router.post('/users/verify-code', async (req, res) => {
  const { mongodb } = await setup();
  const { userid, authCode } = req.body;

  try {
      const record = await mongodb.collection("authCodes").findOne({ userid: userid, authCode: authCode });

      if (!record) {
          return res.status(400).json({ msg: "인증 코드가 올바르지 않습니다." });
      }

      // 인증 코드가 유효한 경우, 필요한 처리를 추가로 수행합니다.
      // 예: 인증 상태 업데이트, 인증 코드 삭제 등
      await mongodb.collection("authCodes").deleteOne({ userid: userid, authCode: authCode });

      return res.json({ msg: "이메일 인증이 완료되었습니다." });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "서버 오류" });
  }
});


module.exports = router;