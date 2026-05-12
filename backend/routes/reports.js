const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Helper: get all team member IDs for a given user (admin or manager)
async function getTeamIds(user) {
  if (user.role === 'manager') {
    const members = await User.find({ createdBy: user._id }).select('_id');
    return [user._id, ...members.map(u => u._id)];
  }
  if (user.role === 'admin') {
    // Direct team members created by this admin
    const directMembers = await User.find({ createdBy: user._id }).select('_id role');
    const directManagerIds = directMembers.filter(u => u.role === 'manager').map(u => u._id);
    // Sub-team: employees created by those managers
    const subMembers = directManagerIds.length > 0
      ? await User.find({ createdBy: { $in: directManagerIds } }).select('_id')
      : [];
    return [user._id, ...directMembers.map(u => u._id), ...subMembers.map(u => u._id)];
  }
  return [user._id];
}

// GET /api/reports
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'employee') {
      filter.submittedBy = req.user._id;
    } else {
      // Admin and Manager: scope to their team hierarchy
      const teamIds = await getTeamIds(req.user);
      filter.submittedBy = { $in: teamIds };
    }

    const { page = 1, limit = 20, userId } = req.query;

    // Optional userId filter — only allowed if user is within scope
    if (userId && req.user.role !== 'employee') {
      const mongoose = require('mongoose');
      const targetId = new mongoose.Types.ObjectId(userId);
      const scopedIds = filter.submittedBy.$in || [filter.submittedBy];
      const allowed = scopedIds.some(id => id.toString() === targetId.toString());
      if (allowed) filter.submittedBy = targetId;
    }

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

    if (req.user.role !== 'employee') {
      const teamIds = (await getTeamIds(req.user)).map(id => id.toString());
      if (!teamIds.includes(report.submittedBy._id.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    } else if (report.submittedBy._id.toString() !== req.user._id.toString()) {
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

    const isOwner = report.submittedBy.toString() === req.user._id.toString();

    if (!isOwner) {
      if (req.user.role === 'admin') {
        const teamIds = (await getTeamIds(req.user)).map(id => id.toString());
        if (!teamIds.includes(report.submittedBy.toString())) {
          return res.status(403).json({ success: false, message: 'Not authorized' });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
