# KHQNZUR DATA SOLUTION - Complete Web Platform

A production-ready web platform for KHQNZUR data bundles with Safaricom MPESA STK Push integration.

## Features

✅ **Public Storefront**
- Browse data bundles by category
- No customer login required
- Easy payment via MPESA STK Push
- Responsive design

✅ **Admin Dashboard**
- Secure JWT-based authentication
- Product pricing management
- Transaction monitoring
- Revenue analytics
- Real-time statistics

✅ **Secure Backend**
- Helmet.js for security headers
- Rate limiting on auth & payment endpoints
- JWT token authentication
- CORS protection
- Input validation & normalization

✅ **MPESA Integration**
- Safaricom Daraja STK Push
- Callback handling
- Transaction tracking
- Payment status updates

## Installation

### 1. Prerequisites
- Node.js v14+
- npm/yarn
- Safaricom Daraja credentials (Consumer Key & Secret)

### 2. Setup

```bash
# Clone or download the project
cd khqnzur-data-solution

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 3. Environment Variables

```env
PORT=3000
NODE_ENV=production

# Admin Credentials
ADMIN_EMAIL=kanzu@gmail.com
ADMIN_PASSWORD=kanzu1234
JWT_SECRET=replace_with_random_secret_64_chars_minimum

# Safaricom Daraja
SAFARICOM_CONSUMER_KEY=your_consumer_key
SAFARICOM_CONSUMER_SECRET=your_consumer_secret
SAFARICOM_SHORTCODE=174379
SAFARICOM_PASSKEY=your_passkey
ENVIRONMENT=sandbox  # or production

# Callbacks
CALLBACK_URL=https://your-domain.com/api/payment/callback
API_URL=http://localhost:3000
CLIENT_ORIGIN=http://localhost:3000
```

### 4. Run Locally

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:3000`

## Testing Locally with ngrok

For testing MPESA callbacks locally:

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Start ngrok
ngrok http 3000

# Copy ngrok URL and update .env
CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/payment/callback
```

## Admin Access

1. Click "Admin" button on homepage
2. Login with:
   - Email: `kanzu@gmail.com`
   - Password: `kanzu1234`
3. Access admin dashboard at: `http://localhost:3000/admin-dashboard.html`

### Admin Features

- **Products**: Edit bundle prices
- **Transactions**: View all payment history
- **Analytics**: Revenue & payment metrics

## API Endpoints

### Public
```
GET  /api/health
GET  /api/products
POST /api/payment/initiate
POST /api/payment/callback
```

### Admin (Protected with JWT)
```
POST /api/auth/login
GET  /api/admin/products
GET  /api/admin/transactions
PUT  /api/admin/product/:id
```

## Deployment

### Option 1: Render.com (Free Tier)

1. Push to GitHub
2. Connect repo to Render
3. Set environment variables
4. Deploy

### Option 2: Heroku

```bash
heroku create khqnzur-data
heroku config:set ADMIN_PASSWORD=kanzu1234
heroku config:set SAFARICOM_CONSUMER_KEY=your_key
# ... set all environment variables
git push heroku main
```

### Option 3: VPS (DigitalOcean/Linode)

1. SSH into server
2. Install Node.js
3. Clone repo
4. Run `npm install && npm start`
5. Use PM2 for process management
6. Set up Nginx reverse proxy
7. Install SSL certificate (Let's Encrypt)

## Security Checklist

- [ ] Change JWT_SECRET to random 64-char string
- [ ] Change ADMIN_PASSWORD
- [ ] Use HTTPS in production
- [ ] Enable CORS restrictions
- [ ] Add database (MongoDB/PostgreSQL)
- [ ] Implement request logging
- [ ] Set up monitoring & alerts
- [ ] Regular security audits

## Safaricom Integration

### Getting Credentials

1. Visit https://developer.safaricom.co.ke
2. Create account & app
3. Copy Consumer Key & Secret
4. Get Business Shortcode & Passkey
5. Test in Sandbox mode first
6. Switch to Production when ready

### STK Push Flow

```
Customer → "Buy Now" → Backend /api/payment/initiate
           ↓
Backend → Daraja OAuth → Get Access Token
           ↓
Backend → Daraja STK Push → Safaricom
           ↓
Safaricom → Customer Phone → Payment Prompt
           ↓
Customer → Enter PIN → Safaricom
           ↓
Safaricom → Callback → Backend /api/payment/callback
           ↓
Backend → Update Transaction Status → Success/Failed
```

## Troubleshooting

### "Invalid Consumer Key/Secret"
- Verify credentials on Safaricom portal
- Check for whitespace in .env
- Ensure credentials haven't expired

### "Callback not received"
- Verify CALLBACK_URL is public HTTPS
- Check firewall allows incoming requests
- Test with ngrok tunnel
- Verify callback endpoint is accessible

### "Phone number rejected"
- Use format: 0712345678 or 254712345678
- Ensure exactly 10 digits (without country code)

### "Port 3000 already in use"
```bash
# Find process using port
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

## Next Steps

1. **Database**: Add MongoDB for persistent storage
2. **Email**: Add email notifications for payments
3. **SMS**: Add Nexmo/Twilio for SMS confirmations
4. **Analytics**: Integrate Google Analytics
5. **CDN**: Use Cloudflare for performance
6. **Monitoring**: Add Sentry for error tracking
7. **Testing**: Add Jest test suite

## Support

- Documentation: See BACKEND_README.md
- Issues: Create GitHub issue
- Contact: support@khqnzur.com

---

**Built with ❤️ for KHQNZUR DATA SOLUTION**

Version: 2.0.0 (Production Ready)
Last Updated: 2026-10-07