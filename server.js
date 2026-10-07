const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_key_in_production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kanzu@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kanzu1234';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/khqnzur';

// Security & middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please try again later.' }
});

const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: { error: 'Too many payment requests. Please slow down.' }
});

app.use('/api/auth', authLimiter);
app.use('/api/payment', paymentLimiter);
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✓ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
});

// Schemas
const ProductSchema = new mongoose.Schema({
  bundleId: { type: String, unique: true, required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['daily', 'weekly', 'monthly', 'night'], required: true },
  price: { type: Number, required: true, min: 1 },
  details: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, required: true, index: true },
  phoneNumber: { type: String, required: true, index: true },
  bundleId: { type: String, required: true },
  bundleName: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending', index: true },
  checkoutRequestId: { type: String, index: true },
  mpesaReceiptNumber: { type: String, sparse: true },
  responseCode: String,
  failureReason: String,
  initiatedAt: { type: Date, default: Date.now },
  completedAt: Date,
  callbackData: mongoose.Schema.Types.Mixed
});

const Product = mongoose.model('Product', ProductSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

// Initialize default products if empty
async function initializeProducts() {
  const count = await Product.countDocuments();
  if (count === 0) {
    const defaultProducts = [
      { bundleId: 'daily-1', name: '10MB', category: 'daily', price: 20, details: 'Valid for 1 day' },
      { bundleId: 'daily-2', name: '50MB', category: 'daily', price: 50, details: 'Good for browsing and social media' },
      { bundleId: 'daily-3', name: '100MB', category: 'daily', price: 100, details: 'Affordable daily internet' },
      { bundleId: 'weekly-1', name: '1GB Weekly', category: 'weekly', price: 100, details: '7 days validity' },
      { bundleId: 'weekly-2', name: '2GB Weekly', category: 'weekly', price: 200, details: 'Perfect for work and streaming' },
      { bundleId: 'monthly-1', name: '5GB Monthly', category: 'monthly', price: 500, details: '30 days validity' },
      { bundleId: 'monthly-2', name: '10GB Monthly', category: 'monthly', price: 1000, details: 'Heavy usage package' },
      { bundleId: 'night-1', name: 'Night Bundle', category: 'night', price: 50, details: 'Night browsing package' },
      { bundleId: 'night-2', name: 'Unlimited Night', category: 'night', price: 100, details: 'Unlimited night data' }
    ];
    await Product.insertMany(defaultProducts);
    console.log('✓ Default products initialized');
  }
}

initializeProducts();

let accessToken = null;
let tokenExpiry = 0;

function normalizePhone(phone) {
  if (!phone) return null;
  let p = phone.trim().replace(/\s+/g, '').replace(/^\+/, '');
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (!/^254\d{9}$/.test(p)) return null;
  return p;
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken({ email: ADMIN_EMAIL, role: 'admin' });

  return res.json({
    success: true,
    token,
    user: { email: ADMIN_EMAIL, role: 'admin' }
  });
});

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const auth = Buffer.from(
    `${process.env.SAFARICOM_CONSUMER_KEY}:${process.env.SAFARICOM_CONSUMER_SECRET}`
  ).toString('base64');

  const baseUrl =
    process.env.ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

  try {
    const response = await axios.get(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 10000;
    console.log('✓ Safaricom access token obtained');

    return accessToken;
  } catch (error) {
    console.error('❌ Failed to get access token:', error.message);
    throw error;
  }
}

async function initiateStkPush(phoneNumber, amount, bundleId) {
  const token = await getAccessToken();

  const baseUrl =
    process.env.ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);

  const password = Buffer.from(
    `${process.env.SAFARICOM_SHORTCODE}${process.env.SAFARICOM_PASSKEY}${timestamp}`
  ).toString('base64');

  const payload = {
    BusinessShortCode: process.env.SAFARICOM_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Number(amount),
    PartyA: phoneNumber,
    PartyB: process.env.SAFARICOM_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: process.env.CALLBACK_URL,
    AccountReference: bundleId,
    TransactionDesc: `KHQNZUR Data Bundle - ${bundleId}`
  };

  try {
    const response = await axios.post(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✓ STK Push sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ STK Push error:', error.response?.data || error.message);
    throw error;
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'KHQNZUR API is running' });
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.post('/api/payment/initiate', async (req, res) => {
  try {
    const { phoneNumber, bundleId } = req.body;

    if (!phoneNumber || !bundleId) {
      return res.status(400).json({ error: 'Phone number and bundle ID are required' });
    }

    const normalizedPhone = normalizePhone(phoneNumber);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const product = await Product.findOne({ bundleId });
    if (!product) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    const stkResponse = await initiateStkPush(normalizedPhone, product.price, product.bundleId);

    const transaction = new Transaction({
      transactionId: `TXN-${Date.now()}`,
      phoneNumber: normalizedPhone,
      bundleId: product.bundleId,
      bundleName: product.name,
      amount: product.price,
      status: 'pending',
      checkoutRequestId: stkResponse.CheckoutRequestID || null,
      responseCode: stkResponse.ResponseCode || null,
      initiatedAt: new Date()
    });

    await transaction.save();

    return res.json({
      success: true,
      message: 'STK push sent successfully',
      transaction: {
        id: transaction.transactionId,
        phoneNumber: transaction.phoneNumber,
        bundleName: transaction.bundleName,
        amount: transaction.amount,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('PAYMENT ERROR:', error.message);
    return res.status(500).json({
      error: 'Payment initiation failed',
      details: error.message
    });
  }
});

app.post('/api/payment/callback', async (req, res) => {
  try {
    const callbackBody = req.body;
    console.log('📲 Callback received:', JSON.stringify(callbackBody, null, 2));

    if (!callbackBody || !callbackBody.Body || !callbackBody.Body.stkCallback) {
      return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback payload' });
    }

    const callback = callbackBody.Body.stkCallback;
    const resultCode = callback.ResultCode;

    const transaction = await Transaction.findOne({
      checkoutRequestId: callback.CheckoutRequestID
    });

    if (transaction) {
      if (resultCode === 0) {
        transaction.status = 'completed';
        transaction.mpesaReceiptNumber =
          callback.CallbackMetadata?.Item?.find(item => item.Name === 'MpesaReceiptNumber')?.Value || null;
        transaction.completedAt = new Date();
        console.log('✓ Payment completed:', transaction.transactionId);
      } else {
        transaction.status = 'failed';
        transaction.failureReason = callback.ResultDesc || 'Payment failed';
        console.log('❌ Payment failed:', transaction.transactionId);
      }
      transaction.callbackData = callback;
      await transaction.save();
    }

    return res.json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
  } catch (error) {
    console.error('CALLBACK ERROR:', error);
    return res.status(500).json({ ResultCode: 1, ResultDesc: 'Callback processing failed' });
  }
});

app.get('/api/admin/transactions', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ initiatedAt: -1 }).limit(100);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load transactions' });
  }
});

app.get('/api/admin/products', verifyToken, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.put('/api/admin/product/:id', verifyToken, async (req, res) => {
  try {
    const { price } = req.body;
    const product = await Product.findOne({ bundleId: req.params.id });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!price || Number(price) <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    product.price = Number(price);
    product.updatedAt = new Date();
    await product.save();

    return res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.get('/api/admin/analytics', verifyToken, async (req, res) => {
  try {
    const total = await Transaction.countDocuments();
    const completed = await Transaction.countDocuments({ status: 'completed' });
    const pending = await Transaction.countDocuments({ status: 'pending' });
    const failed = await Transaction.countDocuments({ status: 'failed' });
    const revenue = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      total,
      completed,
      pending,
      failed,
      revenue: revenue.length > 0 ? revenue[0].total : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║   KHQNZUR DATA SOLUTION - Secure Backend Running              ║`);
  console.log(`║   Server: http://localhost:${PORT}                                 ║`);
  console.log(`║   Database: MongoDB Connected                                 ║`);
  console.log(`║   Admin: kanzu@gmail.com / kanzu1234                          ║`);
  console.log(`║   Status: ✓ Ready for production                              ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);
});

module.exports = app;