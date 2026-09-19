/**
 * One-time setup: creates the CEO login and loads the real employee
 * roster (from MAFHH_Attendance_Requirements.docx) into the dashboard's
 * own database. Safe to re-run — it updates the CEO user in place and
 * upserts each employee by their MAFHH-### id, so nothing is duplicated.
 *
 * Usage: node scripts/seed-dashboard.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mafhh-dashboard';

const CEO_EMAIL = 'ceo@mafhhaviations.com';
const CEO_PASSWORD = 'Mafhh@Aviation2026'; // change after first login — see DEPLOY notes

// From MAFHH_Attendance_Requirements.docx — real roster, real shifts.
const EMPLOYEES = [
  { id: 'MAFHH-001', name: 'Mudassar Abid', department: 'Operations', shift: '9AM - 6PM' },
  { id: 'MAFHH-002', name: 'Faisal Akhter', department: 'Operations', shift: '10AM – 6:30PM' },
  { id: 'MAFHH-003', name: 'Yousaf Aslam', department: 'Operations', shift: '9AM - 6PM' },
  { id: 'MAFHH-004', name: 'Ahmed Naeem', department: 'Operations', shift: '9AM - 6PM' },
  { id: 'MAFHH-005', name: 'Sabir Imran', department: 'Documentations', shift: '9AM - 6PM' },
  { id: 'MAFHH-006', name: 'Nasir Khan', department: 'Documentations', shift: '10AM – 6:30PM' },
  { id: 'MAFHH-007', name: 'Zeeshan Ali', department: 'Documentations', shift: '9AM - 6PM' },
  { id: 'MAFHH-008', name: 'Khalid Nadeem', department: 'Documentations', shift: '9AM - 6PM' },
  { id: 'MAFHH-009', name: 'Amjad Ashraf', department: 'Custom Clearance', shift: '9AM - 6PM' },
  { id: 'MAFHH-010', name: 'Furqan Ahmad', department: 'Custom Clearance', shift: '9AM - 6PM' },
  { id: 'MAFHH-011', name: 'Khalid Masood', department: 'Custom Clearance', shift: '9AM - 6PM' },
  { id: 'MAFHH-012', name: 'Zaheer Rafique', department: 'Custom Clearance', shift: '9AM - 6PM' },
  { id: 'MAFHH-013', name: 'Umair Ali', department: 'Custom Clearance', shift: '9AM - 6PM' },
  { id: 'MAFHH-014', name: 'Hassam Fareed', department: 'Custom Clearance', shift: '9AM - 6PM' },
  { id: 'MAFHH-015', name: 'M. Zohaib', department: 'Custom Clearance', shift: '9AM - 6PM' },
  { id: 'MAFHH-016', name: 'Hamza Khan', department: 'Custom Clearance', shift: '9PM - 6AM' },
  { id: 'MAFHH-017', name: 'Aamar Mahmood', department: 'Finance', shift: '9AM - 6PM' },
  { id: 'MAFHH-018', name: 'Mahboob Alam', department: 'Finance', shift: '9AM - 6PM' },
  { id: 'MAFHH-019', name: 'Ejaz Ahmad', department: 'Quarantine Dep', shift: '9AM - 6PM' },
  { id: 'MAFHH-020', name: 'Irfan Dastagir', department: 'Quarantine Dep', shift: '9AM - 6PM' },
  { id: 'MAFHH-021', name: 'Siddique', department: 'Rider', shift: '9AM - 6PM' },
  { id: 'MAFHH-022', name: 'Chaand Ali', department: 'Office Boy', shift: '10AM - 7PM' },
  { id: 'MAFHH-023', name: 'Atif', department: 'Office Boy', shift: '8AM - 5PM' },
  { id: 'MAFHH-024', name: 'Irfan Ahmad', department: 'Security', shift: '7AM - 7PM' },
  { id: 'MAFHH-025', name: 'Sana ullah', department: 'Driver', shift: '7AM - 7PM' },
  { id: 'MAFHH-026', name: 'Sada Hussain', department: 'Driver', shift: '7AM - 7PM' },
  { id: 'MAFHH-027', name: 'Kamran Noor', department: 'Sales', shift: '9AM - 6PM' },
];

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  role: { type: String, enum: ['admin', 'ceo', 'viewer'], default: 'viewer' },
  phone: String,
  createdAt: { type: Date, default: Date.now },
});
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  designation: String,
  department: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  assigned_pc: { type: String, default: null },
  shift_timing: String,
  profile_photo: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected:', MONGODB_URI);

  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

  const hashedPassword = await bcrypt.hash(CEO_PASSWORD, 10);
  await User.findOneAndUpdate(
    { email: CEO_EMAIL },
    { email: CEO_EMAIL, password: hashedPassword, name: 'CEO', role: 'ceo' },
    { upsert: true, new: true }
  );
  console.log(`✅ CEO login ready: ${CEO_EMAIL}`);

  let created = 0, updated = 0;
  for (const emp of EMPLOYEES) {
    const result = await Employee.findOneAndUpdate(
      { employeeId: emp.id },
      {
        employeeId: emp.id,
        name: emp.name,
        department: emp.department,
        shift_timing: emp.shift,
        status: 'active',
        updatedAt: new Date(),
      },
      { upsert: true, new: true, rawResult: true }
    );
    if (result.lastErrorObject?.updatedExisting) updated++; else created++;
  }
  console.log(`✅ Employees: ${created} created, ${updated} updated (${EMPLOYEES.length} total)`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
