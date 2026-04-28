const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  ratedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: [true, 'Rating score is required'],
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  category: {
    type: String,
    enum: ['performance', 'teamwork', 'communication', 'technical', 'overall'],
    default: 'overall'
  },
  period: {
    type: String,
    default: () => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
  }
}, { timestamps: true });

// One rating per rater per user per period per category
ratingSchema.index({ ratedBy: 1, ratedUser: 1, period: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
