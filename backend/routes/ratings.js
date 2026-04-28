const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Rating = require('../models/Rating');
const { protect } = require('../middleware/auth');

// GET /api/ratings - Get ratings for a user
router.get('/', protect, async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = {};
    if (userId) filter.ratedUser = userId;
    else if (req.user.role === 'employee') filter.ratedUser = req.user._id;

    const ratings = await Rating.find(filter)
      .populate('ratedBy', 'name email role')
      .populate('ratedUser', 'name email role')
      .sort('-createdAt');

    // Compute average per user
    const avgPipeline = await Rating.aggregate([
      { $match: userId ? { ratedUser: require('mongoose').Types.ObjectId.createFromHexString(userId) } : {} },
      { $group: { _id: '$ratedUser', avgScore: { $avg: '$score' }, count: { $sum: 1 } } }
    ]);

    res.json({ success: true, ratings, averages: avgPipeline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ratings/summary - Summary of all users
router.get('/summary', protect, async (req, res) => {
  try {
    const summary = await Rating.aggregate([
      {
        $group: {
          _id: '$ratedUser',
          avgScore: { $avg: '$score' },
          totalRatings: { $sum: 1 },
          categories: { $push: { category: '$category', score: '$score' } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          'user.password': 0
        }
      },
      { $sort: { avgScore: -1 } }
    ]);

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ratings
router.post('/', protect, [
  body('ratedUser').notEmpty().withMessage('Rated user is required'),
  body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be 1-5'),
  body('category').isIn(['performance', 'teamwork', 'communication', 'technical', 'overall'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { ratedUser, score, feedback, category } = req.body;

    if (ratedUser === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot rate yourself' });
    }

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const rating = await Rating.findOneAndUpdate(
      { ratedBy: req.user._id, ratedUser, period, category },
      { score, feedback, ratedBy: req.user._id, ratedUser, period, category },
      { upsert: true, new: true, runValidators: true }
    );

    const populated = await rating.populate([
      { path: 'ratedBy', select: 'name email role' },
      { path: 'ratedUser', select: 'name email role' }
    ]);

    res.status(201).json({ success: true, rating: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already rated this user for this period and category' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/ratings/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) return res.status(404).json({ success: false, message: 'Rating not found' });

    if (rating.ratedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Rating.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Rating deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
