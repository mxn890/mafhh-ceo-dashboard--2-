import mongoose from 'mongoose';

// User/CEO Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  role: { type: String, enum: ['admin', 'ceo', 'viewer'], default: 'viewer' },
  phone: String,
  createdAt: { type: Date, default: Date.now },
});

// Employee Model
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  designation: String,
  department: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  assigned_pc: { type: String, default: null }, // PC name if applicable
  shift_timing: String,
  profile_photo: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// PC Monitoring Model
const pcMonitoringSchema = new mongoose.Schema({
  pc_id: { type: String, required: true },
  employee_name: String,
  timestamp: { type: Date, default: Date.now },
  current_app: String,
  current_website: String,
  idle_time: Number, // seconds
  active_time: Number, // seconds
  activity_type: { type: String, enum: ['work', 'non-work', 'idle'], default: 'idle' },
  website_category: String,
  alert_triggered: { type: Boolean, default: false },
  alert_message: String,
  screenshot_url: String,
});

// Daily PC Report Model
const pcDailyReportSchema = new mongoose.Schema({
  pc_id: String,
  employee_name: String,
  date: Date,
  total_active_time: Number,
  total_idle_time: Number,
  top_websites: [{ website: String, duration: Number }],
  top_apps: [{ app: String, duration: Number }],
  non_work_alerts: Number,
  productivity_score: Number,
  report_data: mongoose.Schema.Types.Mixed,
});

// Flight Data Model
const flightSchema = new mongoose.Schema({
  flight_number: String,
  airline: String,
  departure: String,
  destination: String,
  status: { type: String, enum: ['on-time', 'delayed', 'cancelled'], default: 'on-time' },
  eta: Date,
  delay_minutes: Number,
  awb_numbers: [String],
  cargo_weight: Number,
  timestamp: { type: Date, default: Date.now },
});

// Shipment Model
const shipmentSchema = new mongoose.Schema({
  awb: { type: String, unique: true, required: true },
  airline: String,
  flight_number: String,
  weight: Number,
  status: { type: String, enum: ['pending', 'active', 'delayed', 'completed'], default: 'pending' },
  destination: String,
  consignee: String,
  tracking_history: [{ status: String, timestamp: Date }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Attendance Model
const attendanceSchema = new mongoose.Schema({
  employee_id: mongoose.Schema.Types.ObjectId,
  employee_name: String,
  date: Date,
  check_in_time: Date,
  check_in_location: { latitude: Number, longitude: Number },
  check_in_photo: String,
  check_out_time: Date,
  check_out_location: { latitude: Number, longitude: Number },
  check_out_photo: String,
  status: { type: String, enum: ['present', 'absent', 'late', 'early-leave'], default: 'present' },
  createdAt: { type: Date, default: Date.now },
});

// CCTV Alert Model
const cctvAlertSchema = new mongoose.Schema({
  camera_id: String,
  camera_name: String,
  incident_type: { type: String, enum: ['sleeping', 'gathering', 'absence', 'restricted-area'], default: 'absence' },
  timestamp: { type: Date, default: Date.now },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  description: String,
  frame_image: String,
  acknowledged: { type: Boolean, default: false },
});

// Dashboard Alert Model
const alertSchema = new mongoose.Schema({
  type: { type: String, enum: ['flight', 'shipment', 'pc-misuse', 'attendance', 'cctv'], required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
  timestamp: { type: Date, default: Date.now },
  message: String,
  module: Number,
  source_id: String,
  read: { type: Boolean, default: false },
  data: mongoose.Schema.Types.Mixed,
});

// Export models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
export const PCMonitoring = mongoose.models.PCMonitoring || mongoose.model('PCMonitoring', pcMonitoringSchema);
export const PCDailyReport = mongoose.models.PCDailyReport || mongoose.model('PCDailyReport', pcDailyReportSchema);
export const Flight = mongoose.models.Flight || mongoose.model('Flight', flightSchema);
export const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
export const CCTVAlert = mongoose.models.CCTVAlert || mongoose.model('CCTVAlert', cctvAlertSchema);
export const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
