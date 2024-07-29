const express = require('express');
const { registerUser, authUser, getAllUsers, getUserDetails } = require('../controllers/userController');
const { protect } = require('../authMiddleware');
const { check } = require('express-validator');
const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('mobile', 'Mobile number is required').not().isEmpty(),
  ],
  registerUser
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  authUser
);

router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserDetails);

module.exports = router;
