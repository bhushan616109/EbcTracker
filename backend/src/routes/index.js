const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/students', require('./students'));
router.use('/dashboard', require('./dashboard'));
router.use('/guardians', require('./guardians'));
router.use('/branches', require('./branches'));

module.exports = router;
