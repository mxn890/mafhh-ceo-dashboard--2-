/**
 * One-time setup: creates the CEO login. Employee records are now seeded
 * by the separate attendance-portal project (they share this same
 * database) — run scripts/seed-employees.js there instead.
 *
 * Usage: node scripts/seed-dashboard.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mafhh-dashboard';

const CEO_EMAIL = 'ceo@mafhhaviations.com';
const CEO_PASSWORD = 'Mafhh@Aviation2026'; // change after first login — see DEPLOY notes

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  role: { type: String, enum: ['admin', 'ceo', 'viewer'], default: 'viewer' },
  phone: String,
  createdAt: { type: Date, default: Date.now },
});

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected:', MONGODB_URI);

  const User = mongoose.models.User || mongoose.model('User', userSchema);

  const hashedPassword = await bcrypt.hash(CEO_PASSWORD, 10);
  await User.findOneAndUpdate(
    { email: CEO_EMAIL },
    { email: CEO_EMAIL, password: hashedPassword, name: 'CEO', role: 'ceo' },
    { upsert: true, new: true }
  );
  console.log(`✅ CEO login ready: ${CEO_EMAIL}`);
  console.log('ℹ️  Employee accounts are seeded separately — run scripts/seed-employees.js in the attendance-portal project.');

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
