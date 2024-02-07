const express = require('express');
const router = express.Router();

const controller = require('./index.controller');

router.get('/', (req, res) => {
    res.render('index', { pagaName: 'ProjectName' })
})
//!!import

//!!use

module.exports = router;
