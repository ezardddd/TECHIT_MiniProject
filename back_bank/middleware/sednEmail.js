const nodemailer = require('nodemailer');
const setup = require('../db_setup');
require('dotenv').config();

const sendEmail = async (req, res, next) => {
    const { userid } = req.user; // req.user로부터 userid를 가져옵니다.
    const { mongodb } = await setup();

    try {
        const user = await mongodb.collection('user').findOne({ userid: userid });

        if (!user) {
            return res.status(404).json({ msg: '사용자를 찾을 수 없습니다' });
        }

        // 인증 코드 생성
        const authCode = Math.floor(100000 + Math.random() * 900000).toString();
        await mongodb.collection('authCodes').insertOne({ userid: userid, authCode: authCode });

        // 메일 전송
        const email = user.email;
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.MAILTRAP_USER, // 보내는 사람
            to: email, // 사용자 이메일 주소
            subject: '계정 잠금 알림',
            text: `귀하의 이메일 인증 코드는 ${authCode} 입니다.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                next(error); // 에러 처리 미들웨어로 전달
            } else {
                console.log('Email sent: ' + info.response);
                next(); // 다음 미들웨어로 이동
            }
        });
    } catch (err) {
        console.error(err);
        next(err); // 에러 처리 미들웨어로 전달
    }
};

module.exports = sendEmail;
