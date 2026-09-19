# MAFHH CEO Dashboard

Real-time operations dashboard for MAFHH Aviation Pvt Ltd. Centralized monitoring and control hub for all 8 modules of the AI Office Automation system.

## Features

✅ **Module 4 - PC Monitoring**: Real-time employee internet and application tracking
✅ **Employee Management**: Complete employee directory with PC assignments and attendance
✅ **Real-time Alerts**: Live alert feed from all modules
✅ **Responsive Design**: Works on desktop, tablet, and mobile
✅ **Dashboard Framework**: Ready to integrate all modules (1-8)

## Project Structure

```
mafhh-ceo-dashboard/
├── app/
│   ├── api/              # API routes for backend
│   │   ├── auth/         # Authentication endpoints
│   │   ├── employees/    # Employee management
│   │   ├── pc-monitoring/# PC monitoring data
│   │   ├── flights/      # Flight data
│   │   ├── shipments/    # Shipment tracking
│   │   ├── attendance/   # Attendance records
│   │   └── cctv/         # CCTV alerts
│   ├── components/       # React components
│   │   ├── common/       # Shared components (Navigation, MetricCard, AlertFeed)
│   │   ├── module4/      # PC monitoring components
│   │   ├── module5/      # Employee profiles
│   │   ├── module2/      # Flight status
│   │   ├── module3/      # Shipments
│   │   └── module6/      # CCTV
│   ├── lib/              # Utilities and libraries
│   │   ├── db/           # Database models and connection
│   │   ├── auth/         # JWT authentication
│   │   └── utils/        # Helper functions
│   ├── module4/          # Module 4 page
│   ├── employees/        # Employees page
│   ├── layout.jsx        # Root layout
│   ├── page.jsx          # Homepage
│   └── globals.css       # Global styles
├── public/               # Static assets
├── styles/               # Global CSS
├── .env.local            # Environment variables
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── package.json          # Dependencies
└── README.md             # This file
```

## Installation

### 1. Prerequisites
- Node.js 16+ and npm
- MongoDB (local or cloud instance like MongoDB Atlas)

### 2. Clone and Setup

```bash
# Navigate to project directory
cd mafhh-ceo-dashboard

# Install dependencies
npm install

# Create .env.local file with your configuration
# Copy the example from .env.local file in repo
```

### 3. Configure Environment Variables

Edit `.env.local`:

```
MONGODB_URI=mongodb://localhost:27017/mafhh-dashboard
JWT_SECRET=your-secret-key-change-this
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Homepage
- View all key metrics at a glance
- See recent alerts from all modules
- Quick navigation to each module

### Module 4 - PC Monitoring
- Real-time view of all 12 PCs
- Filter by status (All, Active, Idle, Alerts)
- Click on any PC for detailed analysis
- View websites visited, applications used, alerts triggered

### Employees
- Complete employee directory
- PC assignments
- Department information
- Attendance status

### Features Coming Soon
- Module 2: Flight Status Monitoring
- Module 3: Shipment Tracking
- Module 5: Attendance System (GPS + Selfie)
- Module 6: AI CCTV Monitoring
- Module 7: Complete Dashboard Integration
- Module 8: WhatsApp Alert System

## Technology Stack

### Frontend
- **Next.js 14**: React framework
- **React 18**: UI library
- **Tailwind CSS**: Styling
- **Recharts**: Data visualization
- **Socket.io-client**: Real-time updates

### Backend
- **Node.js**: Runtime
- **Express**: API framework (integrated with Next.js)
- **MongoDB**: Database
- **Mongoose**: ODM
- **JWT**: Authentication
- **Bcrypt**: Password hashing

### Utilities
- **Axios**: HTTP client
- **Socket.io**: WebSocket communication

## API Endpoints (To be implemented)

```
# Authentication
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

# Employees
GET    /api/employees
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id

# PC Monitoring
GET    /api/pc-monitoring
GET    /api/pc-monitoring/:pc_id
POST   /api/pc-monitoring
GET    /api/pc-monitoring/:pc_id/report

# And more...
```

## Database Models

### User
- email, password, name, role, phone, createdAt

### Employee
- name, email, phone, designation, department, assigned_pc, shift_timing, status

### PCMonitoring
- pc_id, employee_name, timestamp, current_app, current_website, idle_time, active_time, activity_type, alert_triggered

### Flight
- flight_number, airline, departure, destination, status, eta, delay_minutes, awb_numbers, cargo_weight

### Shipment
- awb, airline, flight_number, weight, status, destination, consignee, tracking_history

### Attendance
- employee_id, date, check_in_time, check_in_location, check_in_photo, check_out_time, status

### CCTVAlert
- camera_id, camera_name, incident_type, timestamp, severity, description, frame_image

### Alert
- type, severity, timestamp, message, module, source_id, read, data

## Development

### Adding a New Component

1. Create file in `app/components/[category]/[ComponentName].jsx`
2. Use Tailwind CSS for styling
3. Import and use in pages

### Adding a New API Route

1. Create file in `app/api/[resource]/route.js`
2. Implement GET, POST, PUT, DELETE handlers
3. Connect to MongoDB models

### Database Operations

```javascript
import connectDB from '@/app/lib/db/connect';
import { Employee } from '@/app/lib/db/models';

async function getEmployee(id) {
  await connectDB();
  const employee = await Employee.findById(id);
  return employee;
}
```

## Performance Tips

- Use Next.js Image component for optimized images
- Implement pagination for large data sets
- Use WebSockets for real-time updates instead of polling
- Cache API responses appropriately
- Optimize MongoDB queries with indexes

## Security

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ HttpOnly secure cookies
- ✅ Input validation
- ✅ Environment variables for secrets

## Deployment

### Vercel (Recommended for Next.js)

```bash
# Connect your GitHub repository to Vercel
# Set environment variables in Vercel dashboard
# Push to main branch - auto deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### "Cannot find module"
- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Restart dev server

### MongoDB connection error
- Verify connection string in `.env.local`
- Ensure MongoDB is running
- Check firewall/network rules

### Styling issues
- Tailwind CSS may need cache clear: `rm -rf .next node_modules`
- Rebuild: `npm run build`

## Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Submit pull request

## License

Internal - MAFHH Aviation Pvt Ltd

## Support

Contact: development@mafhh.com

## Roadmap

- [ ] Week 1: Dashboard Framework + Module 4 (PC Monitoring)
- [ ] Week 2: Module 2 (Flights) + Module 3 (Shipments)
- [ ] Week 3: Module 5 (Attendance) + Module 6 (CCTV)
- [ ] Week 4: Module 7 (Full Integration) + Module 8 (WhatsApp)

---

**Last Updated**: September 2026
**Status**: Active Development
**Version**: 1.0.0
