const express = require('express');
const router = express.Router();
const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  addComment,
  deleteIssue,
} = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.route('/').get(protect, getIssues).post(protect, adminOnly, createIssue);
router.route('/:id').get(protect, getIssueById).put(protect, updateIssue).delete(protect, adminOnly, deleteIssue);
router.post('/:id/comments', protect, addComment);

module.exports = router;
