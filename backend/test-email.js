/**
 * Quick test — run with: node test-email.js
 * This sends a sample task assignment email to verify credentials work.
 */
require('dotenv').config();
const { sendTaskAssignmentEmail } = require('./utils/emailService');

const mockTask = {
  title: 'Test Task — Email Verification',
  description: 'This is a test email to verify that TaskTrack email notifications are working correctly.',
  priority: 'high',
  deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  assignedTo: {
    name: 'Test Employee',
    email: process.env.EMAIL_USER, // sends test to yourself
    role: 'employee',
  },
  assignedBy: {
    name: 'Admin User',
    email: process.env.EMAIL_USER,
    role: 'admin',
  },
};

console.log(`\nSending test email to: ${process.env.EMAIL_USER}`);
console.log('Please wait...\n');

sendTaskAssignmentEmail(mockTask).then(() => {
  console.log('✅ Test complete! Check your inbox.');
}).catch(err => {
  console.error('❌ Error:', err.message);
});
