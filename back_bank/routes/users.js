const router = require('express').Router();
const setup = require('../db_setup');
const sha = require('sha256');
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

function generateAccessToken(user) {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(user) {
  return jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

async function saveRefreshToken(userid, refreshToken) {
  const { mongodb } = await setup();
  try {
    await mongodb.collection("refreshTokens").insertOne({
      userid,
      token: refreshToken,
      createdAt: new Date()
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function removeRefreshToken(refreshToken) {
  const { mongodb } = await setup();
  try {
    await mongodb.collection("refreshTokens").deleteOne({ token: refreshToken });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function validateRefreshToken(refreshToken) {
  const { mongodb } = await setup();
  try {
    const tokenDoc = await mongodb.collection("refreshTokens").findOne({ token: refreshToken });
    return !!tokenDoc;
  } catch (error) {
    console.error("Error validating refresh token:", error);
    return false;
  }
}

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

  mysqldb.query('SELECT salt FROM UserSalt WHERE userid = ?', [userid], (err, saltRows) => {
    if (err) {
      return res.status(500).json({ msg: "서버 오류" });
    }

    if (saltRows.length === 0) {
      return res.status(400).json({ msg: "사용자를 찾을 수 없습니다." });
    }

    const salt = saltRows[0].salt;

    mongodb.collection("user").findOne({ userid: userid })
      .then(async user => {
        if (!user) {
          return res.status(400).json({ msg: "사용자를 찾을 수 없습니다." });
        }

        const hashedPassword = sha(userpw + salt);

        if (hashedPassword === user.userpw) {
          const accessToken = generateAccessToken({ userid: user.userid, username: user.username });
          const refreshToken = generateRefreshToken({ userid: user.userid, username: user.username });

          try {
            await saveRefreshToken(user.userid, refreshToken);
            res.json({
              msg: "로그인 성공",
              accessToken: accessToken,
              refreshToken: refreshToken,
              user: { userid: user.userid, username: user.username }
            });
          } catch (error) {
            console.error("Error saving refresh token:", error);
            res.status(500).json({ msg: "로그인 처리 중 오류가 발생했습니다." });
          }
        } else {
          res.status(400).json({ msg: "로그인 실패." });
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ msg: "서버 오류" });
      });
  });
});

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

router.post('/users/token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const isValid = await validateRefreshToken(refreshToken);
    if (!isValid) return res.sendStatus(403);

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      const accessToken = generateAccessToken({ userid: user.userid, username: user.username });
      res.json({ accessToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "토큰 갱신 중 오류가 발생했습니다." });
  }
});

router.get('/users/me', authenticateToken, async (req, res) => {
  const { mongodb } = await setup();

  mongodb.collection("user").findOne({ userid: req.user.userid })
    .then(user => {
      if (user) {
        res.json({
          userid: user.userid,
          username: user.username,
          email: user.email
        });
      } else {
        res.status(404).json({ msg: "사용자를 찾을 수 없습니다." });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ msg: "서버 오류" });
    });
});

router.post('/users/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(400);

  try {
    await removeRefreshToken(refreshToken);
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "로그아웃 처리 중 오류가 발생했습니다." });
  }
});

module.exports = router;