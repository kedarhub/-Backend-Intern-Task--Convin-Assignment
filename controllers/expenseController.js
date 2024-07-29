const Expense = require('../models/expense');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');

const addExpense = async (req, res) => {
  const { description, amount, paidBy, participants, splitMethod, splitDetails } = req.body;

  try {
    // Validate required fields
    if (!description || !amount || !paidBy || !participants || !splitMethod || !splitDetails) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate participants array
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Participants must be a non-empty array' });
    }

    // Validate split details array
    if (!Array.isArray(splitDetails) || splitDetails.length === 0) {
      return res.status(400).json({ message: 'Split details must be a non-empty array' });
    }

    // Validate split method
    let splitAmounts = {};
    if (splitMethod === 'equal') {
      const splitAmount = amount / participants.length;
      participants.forEach(userId => {
        splitAmounts[userId] = splitAmount;
      });
    } else if (splitMethod === 'exact') {
      if (splitDetails.length !== participants.length) {
        return res.status(400).json({ message: 'Split details length must match participants length for exact method' });
      }
      splitDetails.forEach(detail => {
        if (detail.amount == null || !participants.includes(detail.userId)) {
          return res.status(400).json({ message: 'Invalid split details for exact method' });
        }
        splitAmounts[detail.userId] = detail.amount;
      });
    } else if (splitMethod === 'percentage') {
      const totalPercentage = splitDetails.reduce((acc, detail) => acc + detail.percentage, 0);
      if (totalPercentage !== 100) {
        return res.status(400).json({ message: 'Total percentage must equal 100' });
      }
      splitDetails.forEach(detail => {
        if (detail.percentage == null || !participants.includes(detail.userId)) {
          return res.status(400).json({ message: 'Invalid split details for percentage method' });
        }
        splitAmounts[detail.userId] = (amount * detail.percentage) / 100;
      });
    } else {
      return res.status(400).json({ message: 'Invalid split method' });
    }

    const expense = await Expense.create({
      description,
      amount,
      paidBy,
      participants,
      splitMethod,
      splitDetails,
      splitAmounts,
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ participants: req.user._id });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOverallExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({});
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const fastcsv = require('fast-csv'); // Ensure this import is present

const downloadBalanceSheet = async (req, res) => {
  try {
    const expenses = await Expense.find().populate('paidBy participants');

    let balanceSheet = {};

    expenses.forEach(expense => {
      const { paidBy, amount, participants } = expense;

      if (!balanceSheet[paidBy._id]) {
        balanceSheet[paidBy._id] = { paid: 0, owed: 0, balance: 0 };
      }
      balanceSheet[paidBy._id].paid += amount;

      let splitAmount = amount / participants.length;
      participants.forEach(participant => {
        if (!balanceSheet[participant._id]) {
          balanceSheet[participant._id] = { paid: 0, owed: 0, balance: 0 };
        }
        balanceSheet[participant._id].owed += splitAmount;
      });
    });

    for (const userId in balanceSheet) {
      balanceSheet[userId].balance = balanceSheet[userId].paid - balanceSheet[userId].owed;
    }

    // Convert balanceSheet object to array for CSV generation
    const balanceSheetArray = Object.keys(balanceSheet).map(userId => ({
      userId,
      paid: balanceSheet[userId].paid,
      owed: balanceSheet[userId].owed,
      balance: balanceSheet[userId].balance
    }));

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment;filename=balance_sheet.csv');

    // Create CSV stream and pipe to response
    fastcsv
      .write(balanceSheetArray, { headers: true })
      .pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports = {
  addExpense,
  getUserExpenses,
  getOverallExpenses,
  downloadBalanceSheet,
};
