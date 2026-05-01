const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const { protect, authorize } = require('../middleware/auth');

// GET /api/reports
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'employee') {
      filter.submittedBy = req.user._id;
    }

    const { page = 1, limit = 20, userId } = req.query;
    if (userId && req.user.role !== 'employee') filter.submittedBy = userId;

    const reports = await Report.find(filter)
      .populate('submittedBy', 'name email role')
      .populate('tasksWorkedOn.task', 'title status')
      .populate('reviewedBy', 'name email')
      .populate('taggedTo', 'name email role')
      .sort('-date')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);
    res.json({ success: true, count: reports.length, total, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('submittedBy', 'name email role')
      .populate('tasksWorkedOn.task', 'title status')
      .populate('reviewedBy', 'name email')
      .populate('taggedTo', 'name email role');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (req.user.role === 'employee' && report.submittedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reports
router.post('/', protect, [
  body('progressDescription').notEmpty().withMessage('Progress description is required'),
  body('date').isISO8601().withMessage('Valid date required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { date, progressDescription, hoursWorked, tasksWorkedOn, taggedTo, selfRating } = req.body;

    const report = await Report.create({
      submittedBy: req.user._id,
      date, progressDescription, hoursWorked,
      tasksWorkedOn: tasksWorkedOn || [],
      taggedTo, selfRating
    });

    const populated = await report.populate('submittedBy', 'name email role');
    res.status(201).json({ success: true, report: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/reports/:id/review
router.put('/:id/review', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    report.status = req.body.status || 'reviewed';
    report.reviewNotes = req.body.reviewNotes;
    if (req.body.managerRatingStars !== undefined) {
      report.managerRatingStars = req.body.managerRatingStars;
    }
    report.reviewedBy = req.user._id;

    await report.save();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (report.submittedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
