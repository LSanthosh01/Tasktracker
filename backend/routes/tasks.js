const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendTaskAssignmentEmail } = require('../utils/emailService');

// GET /api/tasks
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'employee') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'manager') {
      filter.$or = [{ assignedBy: req.user._id }, { assignedTo: req.user._id }];
    } else if (req.user.role === 'admin') {
      filter.assignedBy = req.user._id;
    }

    const { status, priority, page = 1, limit = 20 } = req.query;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(filter);
    res.json({ success: true, count: tasks.length, total, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tasks  (supports assigning to multiple employees)
router.post('/', protect, authorize('admin', 'manager'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('assignedTo').notEmpty().withMessage('Assignee is required'),
  body('deadline').isISO8601().withMessage('Valid deadline required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { title, description, assignedTo, deadline, priority, tags } = req.body;

    // Normalise to an array so the same logic handles single & multi-assign
    const assigneeIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    if (assigneeIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one assignee is required' });
    }

    // Validate every assignee
    const assignees = await User.find({ _id: { $in: assigneeIds } });
    if (assignees.length !== assigneeIds.length) {
      return res.status(404).json({ success: false, message: 'One or more assignees not found' });
    }

    for (const assignee of assignees) {
      if (req.user.role === 'manager' && assignee.role !== 'employee') {
        return res.status(403).json({ success: false, message: `Managers can only assign tasks to employees (${assignee.name} is a ${assignee.role})` });
      }
      if (req.user.role === 'admin' && assignee.role === 'admin') {
        return res.status(403).json({ success: false, message: `Cannot assign tasks to another admin (${assignee.name})` });
      }
    }

    // Create one independent task per assignee
    const createdTasks = [];
    for (const id of assigneeIds) {
      const task = await Task.create({
        title, description, assignedBy: req.user._id, assignedTo: id, deadline, priority, tags
      });

      const populated = await task.populate([
        { path: 'assignedBy', select: 'name email role' },
        { path: 'assignedTo', select: 'name email role' }
      ]);

      // Send assignment email (non-blocking — errors logged, not thrown)
      sendTaskAssignmentEmail(populated).catch(err =>
        console.error('[Email] Unhandled error sending assignment email:', err.message)
      );
      createdTasks.push(populated);
    }

    // Return single task for backward-compat, array for multi-assign
    if (createdTasks.length === 1) {
      res.status(201).json({ success: true, task: createdTasks[0] });
    } else {
      res.status(201).json({ success: true, tasks: createdTasks, count: createdTasks.length });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isAssigner = task.assignedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' && task.assignedBy.toString() === req.user._id.toString();

    if (!isAssignee && !isAssigner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    // Employees can only update status and selfRating
    if (req.user.role === 'employee') {
      // Employees cannot set status to 'completed' directly — must be approved
      if (req.body.status && req.body.status === 'completed') {
        return res.status(403).json({ success: false, message: 'Tasks can only be completed after manager/admin approval' });
      }
      if (req.body.status) task.status = req.body.status;
      if (req.body.selfRating !== undefined) task.selfRating = req.body.selfRating;
    } else {
      const { title, description, deadline, status, priority, tags, selfRating } = req.body;
      if (title) task.title = title;
      if (description) task.description = description;
      if (deadline) task.deadline = deadline;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (tags) task.tags = tags;
      if (selfRating !== undefined) task.selfRating = selfRating;
    }

    await task.save();
    const populated = await task.populate([
      { path: 'assignedBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' }
    ]);
    res.json({ success: true, task: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/tasks/:id/review
router.put('/:id/review', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Ensure only the assigner or an admin can review the task
    const isOwner = task.assignedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the assigner or admin can review this task' });
    }

    const { managerRatingStars, managerRatingPercentage, reviewNotes } = req.body;
    
    task.managerRatingStars = managerRatingStars;
    task.managerRatingPercentage = managerRatingPercentage;
    task.reviewNotes = reviewNotes;
    task.status = 'completed'; // Approve task

    await task.save();
    
    const populated = await task.populate([
      { path: 'assignedBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' }
    ]);
    res.json({ success: true, task: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isOwner = task.assignedBy.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'You can only delete tasks you created' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
