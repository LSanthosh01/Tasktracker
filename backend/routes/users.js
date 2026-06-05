const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Report = require('../models/Report');
const { protect, authorize, generateToken } = require('../middleware/auth');

const getTenantFilter = async (user) => {
  let adminId;
  if (user.role === 'admin') {
    adminId = user._id;
  } else if (user.role === 'manager') {
    adminId = user.createdBy;
  } else if (user.role === 'employee') {
    const creator = await User.findById(user.createdBy);
    if (creator && creator.role === 'manager') {
      adminId = creator.createdBy;
    } else {
      adminId = user.createdBy;
    }
  }

  const managers = await User.find({ createdBy: adminId, role: 'manager' }).select('_id');
  const managerIds = managers.map(m => m._id);

  return {
    $or: [
      { _id: adminId },
      { createdBy: adminId },
      { createdBy: { $in: managerIds } }
    ]
  };
};

// GET /api/users/stats - Get user statistics (all roles count)
router.get('/stats/overview', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    let filter;
    if (req.user.role === 'manager') {
      filter = { createdBy: req.user._id, role: 'employee' };
    } else {
      filter = await getTenantFilter(req.user);
    }
    
    const stats = {
      admin: await User.countDocuments({ $and: [filter, { role: 'admin' }] }),
      manager: await User.countDocuments({ $and: [filter, { role: 'manager' }] }),
      employee: await User.countDocuments({ $and: [filter, { role: 'employee' }] }),
      total: await User.countDocuments(filter)
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/managers - Get all managers
router.get('/managers', protect, async (req, res) => {
  try {
    const baseFilter = await getTenantFilter(req.user);
    const filter = { ...baseFilter, role: 'manager', isActive: true };

    const managers = await User.find(filter).select('name email _id');
    res.json({ success: true, managers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/taggable - Get users taggable for reports
router.get('/taggable', protect, async (req, res) => {
  try {
    let filter = { isActive: true };
    
    if (req.user.role === 'manager') {
      if (req.user.createdBy) {
        filter._id = req.user.createdBy;
        filter.role = 'admin';
      } else {
        const firstAdmin = await User.findOne({ role: 'admin', isActive: true }).select('_id');
        if (firstAdmin) {
          filter._id = firstAdmin._id;
          filter.role = 'admin';
        } else {
          return res.json({ success: true, users: [] });
        }
      }
    } else {
      const baseFilter = await getTenantFilter(req.user);
      filter = { ...baseFilter, isActive: true, role: 'manager' };
    }

    const taggable = await User.find(filter).select('name email _id role');
    res.json({ success: true, users: taggable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users - Get all users (admin/manager)
router.get('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    let filter;
    if (req.user.role === 'manager') {
      filter = { createdBy: req.user._id, role: 'employee' };
    } else {
      filter = await getTenantFilter(req.user);
    }
    const users = await User.find(filter).sort('-createdAt');
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users - Create user
router.post('/', protect, authorize('admin', 'manager'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Minimum 6 characters'),
  body('role').isIn(['admin', 'manager', 'employee']).withMessage('Invalid role')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name, email, password, role, department } = req.body;

    // Manager can only create employees
    if (req.user.role === 'manager' && role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Managers can only create employees' });
    }
    // Admin cannot create another admin via this route
    if (req.user.role === 'admin' && role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot create another admin' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, department, createdBy: req.user._id });
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { name, department, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.user.role === 'manager' && user.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Managers can only update employees' });
    }

    if (name) user.name = name;
    if (department !== undefined) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    if (req.user.role === 'manager' && user.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Managers can only delete employees' });
    }

    // Delete related reports
    await Report.deleteMany({ submittedBy: req.params.id });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
