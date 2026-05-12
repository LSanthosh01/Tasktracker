const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const NEW_PASSWORD = 'Admin@1234'; // ← new password will be set to this

async function resetAdminPassword() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  const User = require('./models/User');

  // List all admin users
  const admins = await User.find({ role: 'admin' }).select('+email +name');
  console.log('👥 Admin accounts found:');
  admins.forEach((a, i) => console.log(`  ${i + 1}. ${a.name} — ${a.email}`));

  if (admins.length === 0) {
    console.log('No admin users found.');
    process.exit(0);
  }

  // Reset password for ALL admins (or change filter to target specific one)
  const hashed = await bcrypt.hash(NEW_PASSWORD, 12);

  for (const admin of admins) {
    await mongoose.connection.collection('users').updateOne(
      { _id: admin._id },
      { $set: { password: hashed } }
    );
    console.log(`\n✅ Password reset for: ${admin.name} (${admin.email})`);
  }

  console.log(`\n🔑 New password for all admins: ${NEW_PASSWORD}`);
  console.log('⚠️  Please delete this file after logging in!\n');
  process.exit(0);
}

resetAdminPassword().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
