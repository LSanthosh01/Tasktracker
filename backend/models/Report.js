const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Report date is required'],
    default: Date.now
  },
  tasksWorkedOn: [{
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    taskTitle: { type: String }
  }],
  progressDescription: {
    type: String,
    required: [true, 'Progress description is required'],
    maxlength: [3000, 'Description cannot exceed 3000 characters']
  },
  hoursWorked: {
    type: Number,
    min: 0,
    max: 24,
    default: 8
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'approved'],
    default: 'submitted'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  taggedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: { type: String },
  selfRating: { type: Number, min: 1, max: 5 },
  managerRatingStars: { type: Number, min: 0, max: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
