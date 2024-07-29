const express = require('express');
const {
  addExpense,
  getUserExpenses,
  getOverallExpenses,
  downloadBalanceSheet,
} = require('../controllers/expenseController');
const { protect } = require('../authMiddleware');
const router = express.Router();

router.post('/', protect, addExpense);
router.get('/user', protect, getUserExpenses);
router.get('/all', protect, getOverallExpenses);
router.get('/balance-sheet', protect, downloadBalanceSheet);

module.exports = router;
