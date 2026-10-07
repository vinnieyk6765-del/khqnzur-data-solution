# KHQNZUR DATA SOLUTION - Production Ready Platform

## 🚀 Complete Web Platform with Real MPESA Integration

This is a **production-ready** web platform for KHQNZUR data bundles with:
- ✅ Real Safaricom Daraja MPESA STK Push integration
- ✅ MongoDB database for persistent data
- ✅ Secure admin dashboard with JWT authentication
- ✅ Complete transaction tracking and analytics
- ✅ Beautiful UI matching your business flyer

---

## 📋 What's Included

### Customer Features
- Browse data bundles by category (Daily, Weekly, Monthly, Night)
- One-click payment via MPESA STK Push
- Real-time payment status updates
- Beautiful, responsive design

### Admin Features
- Secure JWT-based login
- Update bundle prices in real-time
- View all transactions with full details
- Business analytics dashboard
- Revenue tracking

### Backend Features
- Real Safaricom Daraja API integration
- MongoDB database storage
- Callback handling for payment updates
- Rate limiting & security headers
- Production-ready deployment config

---

## 🔧 Quick Setup (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/khqnzur
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/khqnzur

# Get these from https://developer.safaricom.co.ke
SAFARICOM_CONSUMER_KEY=your_key
SAFARICOM_CONSUMER_SECRET=your_secret
SAFARICOM_SHORTCODE=174379
SAFARICOM_PASSKEY=your_passkey
ENVIRONMENT=sandbox  # or production
```

### Step 3: Run the Server
```bash
npm start
```

Then open: **http://localhost:3000**

---

## 🔑 Admin Login Credentials

```
Email: kanzu@gmail.com
Password: kanzu1234
```

---

## 📱 Getting Safaricom Daraja Credentials

### 1. Visit Developer Portal
Go to: https://developer.safaricom.co.ke

### 2. Create Account & App
- Sign up with your email
- Create new app
- Select "Daraja APIs"

### 3. Get Your Credentials
- **Consumer Key**: Copy from app details
- **Consumer Secret**: Copy from app details
- **Business Shortcode**: 174379 (sandbox) or your live shortcode
- **Passkey**: Get from sandbox settings

### 4. Add Callback URL
- Go to app settings
- Add Callback URL: `https://your-domain.com/api/payment/callback`
- For local testing, use ngrok: `https://your-ngrok-url.ngrok-free.app/api/payment/callback`

---

## 🧪 Testing Locally with ngrok

For testing MPESA callbacks:

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL from ngrok
# Update .env:
CALLBACK_URL=https://abc123.ngrok-free.app/api/payment/callback
```

---

## 🗄️ Database Setup

### Option A: Local MongoDB
```bash
# Install MongoDB locally, then:
mongod

# In .env:
MONGODB_URI=mongodb://localhost:27017/khqnzur
```

### Option B: MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Add to .env:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/khqnzur?retryWrites=true&w=majority
```

---

## 📡 Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Customer clicks "Buy Now" on a bundle                        │
│ 2. Enters phone number (0712345678 or 254712345678)             │
│ 3. Frontend sends /api/payment/initiate to backend              │
│ 4. Backend calls Safaricom Daraja STK Push endpoint             │
│ 5. Customer receives payment prompt on their phone              │
│ 6. Customer enters MPESA PIN                                    │
│ 7. Safaricom sends callback to /api/payment/callback            │
│ 8. Backend updates transaction status (completed/failed)        │
│ 9. Admin sees transaction in dashboard                          │
│ 10. Revenue is tracked and analytics updated                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Matching Your Flyer

The website has been styled to match your KHQNZUR branding:
- Deep blue/teal gradient background
- Yellow accent colors for pricing
- Green "Buy Now" buttons
- Clear "BINGWA DEALS" hero section
- "Pata Hata Ukiwa na Okoa!" tagline
- Category filters (Daily, Weekly, Monthly, Night)
- Till number: 54 17 120

---

## 📊 Admin Dashboard Sections

### Pricing Tab
- View all bundles
- Update prices instantly
- Changes reflect immediately for customers

### Transactions Tab
- See all customer payments
- Filter by status (Pending, Completed, Failed)
- View payment details and receipt numbers

### Analytics Tab
- Total transactions count
- Completed payments
- Pending payments
- Total revenue earned

---

## 🚀 Deployment

### Option 1: Render.com (Free Tier)
```bash
# Push to GitHub
git push origin main

# Connect repo to Render
# Set environment variables in Render dashboard
# Deploy
```

### Option 2: Heroku
```bash
heroku create khqnzur-data
heroku config:set MONGODB_URI=your_connection_string
heroku config:set SAFARICOM_CONSUMER_KEY=your_key
# ... set all environment variables
git push heroku main
```

### Option 3: VPS (DigitalOcean/Linode)
```bash
# SSH into server
ssh root@your_server_ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Clone repo
git clone https://github.com/yourusername/khqnzur-data-solution.git
cd khqnzur-data-solution

# Install dependencies
npm install

# Create .env file
nano .env

# Start with PM2
pm2 start server.js --name "khqnzur"
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo apt-get install nginx
# Configure nginx to forward to localhost:3000

# Install SSL certificate (Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET to random 64-char string
- [ ] Change ADMIN_PASSWORD
- [ ] Use HTTPS in production
- [ ] Set ENVIRONMENT=production in .env
- [ ] Restrict CORS origin
- [ ] Enable rate limiting
- [ ] Setup database backups
- [ ] Monitor transaction logs
- [ ] Setup error alerts
- [ ] Regular security audits

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- For Atlas, whitelist your IP

### "Invalid Consumer Key/Secret"
- Verify credentials on Safaricom portal
- Check for whitespace in .env
- Credentials may have expired

### "Callback not received"
- Verify CALLBACK_URL is public HTTPS
- Check firewall allows incoming requests
- Test with ngrok tunnel
- Verify callback endpoint is accessible

### "Phone number rejected"
- Use format: 0712345678 or 254712345678
- Must be exactly 10 digits (without country code)

---

## 📞 Support & Next Steps

The platform is now:
- ✅ Fully functional for customer purchases
- ✅ Connected to real Safaricom MPESA API
- ✅ Database-backed for transaction tracking
- ✅ Admin-controlled pricing
- ✅ Production-ready for deployment

Next improvements:
1. Add SMS notifications for customers
2. Email confirmations for transactions
3. Customer dashboard to view their purchases
4. Refund processing system
5. Monthly subscription plans
6. Mobile app version

---

**KHQNZUR DATA SOLUTION - Pata Hata Ukiwa na Okoa!**

Version: 3.0.0 (Production Ready)
Last Updated: 2026-10-07
License: MIT