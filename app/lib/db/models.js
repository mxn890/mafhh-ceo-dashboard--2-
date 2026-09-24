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
  employeeId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  designation: String,
  department: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  assigned_pc: { type: String, default: null }, // PC name if applicable
  shift_timing: String,
  profile_photo: String,

  // Attendance-portal login
  password: { type: String, default: null }, // bcrypt hash; null until seeded
  mustChangePassword: { type: Boolean, default: true },
  attendanceRole: { type: String, enum: ['employee', 'manager'], default: 'employee' },

  // One-time selfie enrollment — faceDescriptor is a 128-length array
  // (face-api.js's face recognition output) used to compare every future
  // check-in/out selfie against. enrollmentPhoto is kept so a manager can
  // see the actual reference photo, not just numbers.
  isEnrolled: { type: Boolean, default: false },
  faceDescriptor: { type: [Number], default: null },
  enrollmentPhoto: { type: String, default: null }, // base64 data URI

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

// One check-in or check-out event
const attendanceEventSchema = new mongoose.Schema({
  time: Date,
  lat: Number,
  lng: Number,
  photo: String, // base64 data URI
  faceMatchDistance: Number, // lower = more similar; null if no enrollment yet to compare against
  faceMatchStatus: { type: String, enum: ['verified', 'needs_review', 'no_face_detected'], default: 'needs_review' },
  locationLabel: { type: String, enum: ['office', 'airport', 'out_of_range', 'not_configured'], default: 'not_configured' },
  distanceMeters: Number,
}, { _id: false });

// Attendance Model — one document per employee per day
const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true }, // matches Employee.employeeId
  employeeName: String,
  date: { type: String, required: true, index: true }, // 'YYYY-MM-DD' in PKT — a plain string keeps per-day uniqueness simple
  checkIn: attendanceEventSchema,
  checkOut: attendanceEventSchema,
  status: { type: String, enum: ['OnTime', 'Late', 'HalfDay', 'Absent', 'Leave'], default: 'Absent' },
  reviewedBy: String, // manager's employeeId, if they manually reviewed/overrode this record
  reviewNote: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Attendance configuration — a single document holding the office/airport
// geofence points and the shift-timing rules, so these can be updated from
// one place (a manager settings screen) instead of being hardcoded.
const attendanceConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'default', unique: true },
  officeLocation: {
    address: String,
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    radiusMeters: { type: Number, default: 150 },
  },
  airportLocation: {
    address: String,
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    radiusMeters: { type: Number, default: 300 },
  },
  shiftRules: {
    startTime: { type: String, default: '09:00' }, // 24h HH:MM, PKT
    lateAfter: { type: String, default: '09:30' },
    halfDayAfter: { type: String, default: '10:00' },
    endTime: { type: String, default: '18:00' },
  },
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
export const AttendanceConfig = mongoose.models.AttendanceConfig || mongoose.model('AttendanceConfig', attendanceConfigSchema);
export const CCTVAlert = mongoose.models.CCTVAlert || mongoose.model('CCTVAlert', cctvAlertSchema);
export const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);

const locationPingSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  lat: Number,
  lng: Number,
  timestamp: { type: Date, default: Date.now, index: true },
});
export const LocationPing = mongoose.models.LocationPing || mongoose.model('LocationPing', locationPingSchema);
