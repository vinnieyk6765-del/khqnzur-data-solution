# KHQNZUR Data Solution - Backend API

Complete Node.js + Express backend with real Safaricom Daraja MPESA STK Push integration.

## 🚀 Features

- ✅ Real MPESA STK Push payment processing
- ✅ Safaricom Daraja OAuth token management
- ✅ Transaction tracking and status updates
- ✅ Admin dashboard for price management
- ✅ Payment callback handling
- ✅ C2B payment validation & confirmation
- ✅ MongoDB integration (optional)
- ✅ JWT authentication (ready to implement)

## 📋 Prerequisites

1. **Node.js** (v14 or higher)
2. **Safaricom Daraja Account**
   - Consumer Key
   - Consumer Secret
   - Business Shortcode
   - Passkey
3. **Public URL** for payment callbacks (ngrok for local testing)
4. **MongoDB** (optional, for production)

## 🔧 Installation

### 1. Clone and Install

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Get Safaricom Credentials

Visit [Safaricom Developer Portal](https://developer.safaricom.co.ke)

1. Create an account
2. Create an app
3. Copy your credentials:
   - Consumer Key
   - Consumer Secret
   - Get Business Shortcode: `174379` (test) or your live shortcode
   - Get Passkey from portal

### 3. Configure .env File

```bash
# .env
SAFARICOM_CONSUMER_KEY=your_consumer_key_here
SAFARICOM_CONSUMER_SECRET=your_consumer_secret_here
SAFARICOM_SHORTCODE=174379
SAFARICOM_PASSKEY=your_passkey_here
ENVIRONMENT=sandbox
PORT=3000
CALLBACK_URL=https://your-public-url.com/api/payment/callback
API_URL=http://localhost:3000
```

### 4. Setup Callback URL (Important!)

For Safaricom to send payment confirmations, you need a public URL:

**Option A: Using ngrok (Local Testing)**
```bash
# In another terminal
ngrok http 3000

# Copy the HTTPS URL and add to .env
CALLBACK_URL=https://abc123.ngrok.io/api/payment/callback
```

**Option B: Production Server**
```
CALLBACK_URL=https://yourdomain.com/api/payment/callback
```

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

## 📡 API Endpoints

### Public Endpoints

#### Get All Products
```bash
GET /api/products
```

**Response:**
```json
[
  {
    "id": "daily-1",
    "name": "10MB",
    "category": "daily",
    "price": 20,
    "details": "Valid for 1 day"
  }
]
```

#### Initiate Payment
```bash
POST /api/payment/initiate
Content-Type: application/json

{
  "phoneNumber": "0712345678",
  "bundleId": "daily-1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "STK push sent successfully",
  "transaction": {
    "id": "TXN-1696752000000",
    "phoneNumber": "254712345678",
    "bundleId": "daily-1",
    "bundleName": "10MB",
    "amount": 20,
    "status": "pending",
    "checkoutRequestId": "...",
    "timestamp": "2026-10-07T12:00:00Z"
  }
}
```

#### Get Transaction Status
```bash
GET /api/transaction/:id
```

#### Get Customer Transactions
```bash
GET /api/customer/254712345678/transactions
```

### Admin Endpoints

#### Update Product Price
```bash
PUT /api/admin/product/:id
Content-Type: application/json

{
  "price": 25
}
```

#### Create New Product
```bash
POST /api/admin/product
Content-Type: application/json

{
  "name": "Mega Bundle",
  "category": "monthly",
  "price": 2000,
  "details": "Unlimited data for 30 days"
}
```

#### Get All Transactions
```bash
GET /api/admin/transactions
```

## 🔄 Payment Flow

```
1. Customer enters phone number → /api/payment/initiate
                ↓
2. Backend calls Safaricom Daraja API for STK Push
                ↓
3. Payment prompt appears on customer's phone
                ↓
4. Customer enters MPESA PIN
                ↓
5. Safaricom sends callback → /api/payment/callback
                ↓
6. Backend updates transaction status
                ↓
7. Bundle activated on customer account
```

## 🧪 Testing with Postman

Import this collection:

**POST** `http://localhost:3000/api/payment/initiate`
```json
{
  "phoneNumber": "0712345678",
  "bundleId": "daily-1"
}
```

**Response Status:** Should return 200 with transaction details

### Test Credentials (Sandbox)
- Phone: `0712345678` (format: 0XX or 254XX)
- Any amount works in sandbox
- Check ngrok logs for callback data

## 📊 Database Schema (MongoDB Optional)

### Transaction Collection
```javascript
{
  transactionId: String,      // Unique identifier
  phoneNumber: String,         // Customer phone
  bundleId: String,            // Product ID
  amount: Number,              // Payment amount
  status: String,              // pending, completed, failed
  mpesaReceiptNumber: String,  // Safaricom receipt
  completedAt: Date,           // Payment timestamp
  createdAt: Date,             // Auto timestamp
  updatedAt: Date              // Auto timestamp
}
```

### Product Collection
```javascript
{
  bundleId: String,      // Unique identifier
  name: String,          // Bundle name
  category: String,      // daily, weekly, monthly, night
  price: Number,         // Price in KSh
  details: String,       // Description
  isActive: Boolean,     // Active status
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Best Practices

1. ✅ Never commit `.env` file
2. ✅ Use HTTPS for production
3. ✅ Validate all phone numbers
4. ✅ Hash passwords if using auth
5. ✅ Implement rate limiting
6. ✅ Add CORS restrictions
7. ✅ Validate callback signatures from Safaricom

## 🚨 Common Issues & Solutions

### Issue: "Invalid Consumer Key/Secret"
**Solution:** Check credentials on Safaricom portal, ensure they're not expired

### Issue: "Callback URL not responding"
**Solution:** 
- Ensure ngrok is running
- Check CALLBACK_URL in .env matches ngrok URL
- Verify firewall allows incoming requests

### Issue: "Phone number rejected"
**Solution:** 
- Use format: 0712345678 or 254712345678
- Ensure phone is 10 digits (without country code)

### Issue: Port 3000 already in use
**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

## 📝 Next Steps

1. **Add Frontend Integration:** Connect your React/Vue app
2. **Database Integration:** Add MongoDB connection
3. **Authentication:** Implement JWT for admin auth
4. **Logging:** Add Winston or Pino logging
5. **Rate Limiting:** Prevent abuse with express-rate-limit
6. **Notifications:** Send SMS/Email confirmations
7. **Analytics:** Track payments and sales metrics
8. **Deployment:** Deploy to Heroku, AWS, or DigitalOcean

## 📚 Resources

- [Safaricom Daraja Docs](https://developer.safaricom.co.ke/documentation)
- [Express Documentation](https://expressjs.com/)
- [MPESA API Guide](https://developer.safaricom.co.ke/apis)
- [ngrok Documentation](https://ngrok.com/docs)

## 💬 Support

For issues, create an issue on GitHub or contact support@khqnzur.com

---

**Built with ❤️ for KHQNZUR DATA SOLUTION**
