const router = require('express').Router();
const setup = require('../db_setup');
const sha = require('sha256');

const { mongodb, mysqldb } = setup();






module.exports = router;