const express = require('express');
const router = express.Router();
const { register, login, forgotPassword,resetPasswordPage, resetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', resetPasswordPage);
router.post('/reset-password', resetPassword);

module.exports = router;
