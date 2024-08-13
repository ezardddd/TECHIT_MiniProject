const {MongoClient} = require('mongodb');
const mysql = require('mysql2');

let mongodb;
let mysqldb;

const setup = async () => {
    if(mongodb && mysqldb){
        return {mongodb, mysqldb};
    }
    try {
        const mongoDbUrl = process.env.MONGODB_URL;
        const mongoConn = await MongoClient.connect(mongoDbUrl);
        mongodb = mongoConn.db(process.env.MONGODB_DB);
        console.log("MongoDB 접속 성공");
        
        mysqldb = mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            port: process.env.MYSQL_PORT,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB,
            charset: 'utf8mb4'
        });

        console.log("MySQL 접속 성공");

        return {mongodb, mysqldb};
    } catch(err) {
        console.error("DB 접속 실패", err);
        if (err.name === 'MongoServerSelectionError') {
            console.error("MongoDB 서버에 연결할 수 없습니다. 서버 주소와 포트를 확인하세요.");
        }
        if (err.code === 'ECONNREFUSED') {
            console.error("데이터베이스 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.");
        }
        throw err;
    }
};

module.exports = setup;