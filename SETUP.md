# Quick Start Guide - MAFHH CEO Dashboard

## 🚀 Start Here

This is a **Next.js 14** web application. Follow these steps to get it running locally.

## Step 1: Install Dependencies

```bash
cd mafhh-ceo-dashboard
npm install
```

**Output should look like:**
```
added 250 packages, audited 251 packages in 15s
```

## Step 2: Setup MongoDB

### Option A: Local MongoDB
```bash
# If you have MongoDB installed locally
# Make sure MongoDB service is running

# On Mac:
brew services start mongodb-community

# On Windows:
# Run MongoDB from Services

# Verify it's running:
mongo
# Should connect to mongo shell
```

### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mafhh-dashboard
   ```

## Step 3: Configure Environment

Create/Update `.env.local`:

```
# Database
MONGODB_URI=mongodb://localhost:27017/mafhh-dashboard

# Authentication  
JWT_SECRET=my-super-secret-key-change-in-production
JWT_EXPIRE=7d

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# CEO Details
CEO_NAME=CEO MAFHH
CEO_EMAIL=ceo@mafhh.com
CEO_WHATSAPP=+923001234567
```

## Step 4: Run Development Server

```bash
npm run dev
```

**Output:**
```
> next dev

▲ Next.js 14.0.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 1234ms
```

## Step 5: Open in Browser

Visit: **http://localhost:3000**

You should see the MAFHH CEO Dashboard homepage!

## 📱 What You Can See Now

✅ **Homepage**: Overview with key metrics
✅ **Module 4 - PC Monitoring**: 12 PCs with real-time activity
✅ **Employees**: Complete employee directory
✅ **Navigation**: Easy access to all sections

## 🔧 Common Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check for linting errors
npm run lint
```

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
# Mac:
brew services list

# Windows:
sc query MongoDB

# Solution: Start MongoDB service
```

### "Port 3000 already in use"
```bash
# Use a different port
PORT=3001 npm run dev

# Or kill process using port 3000
# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

## 📚 Project Structure

- `/app` - Next.js app directory (pages, components, API)
- `/app/page.jsx` - Homepage
- `/app/module4/` - PC Monitoring
- `/app/employees/` - Employee Directory
- `/app/components/` - React components
- `/app/lib/` - Database, auth, utilities
- `/styles/` - Global CSS
- `/public/` - Static files

## 🎯 Next Steps

### To Add a New Page:
1. Create folder in `/app/[module-name]/`
2. Create `page.jsx` inside
3. Add link to Navigation component

### To Connect to Database:
```javascript
import connectDB from '@/app/lib/db/connect';
import { Employee } from '@/app/lib/db/models';

async function getEmployees() {
  await connectDB();
  const employees = await Employee.find();
  return employees;
}
```

### To Add an API Route:
1. Create `/app/api/[resource]/route.js`
2. Implement handlers (GET, POST, PUT, DELETE)
3. Call from frontend using fetch/axios

## 📖 Documentation

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **MongoDB**: https://docs.mongodb.com/
- **Mongoose**: https://mongoosejs.com/

## ✅ Checklist

- [ ] MongoDB running
- [ ] `.env.local` configured
- [ ] `npm install` completed
- [ ] `npm run dev` started
- [ ] Browser showing http://localhost:3000
- [ ] Module 4 (PC Monitoring) page loads
- [ ] Employees page loads

## 🎉 Done!

Your MAFHH CEO Dashboard is now running!

**Start building:**
- Add API endpoints
- Connect to real database
- Integrate modules 2-8
- Customize styling
- Deploy to production

---

Need help? Check the main README.md for more information.
