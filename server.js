const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============ SAFARICOM DARAJA CONFIGURATION ============
const SAFARICOM_CONFIG = {
  consumerKey: process.env.SAFARICOM_CONSUMER_KEY,
  consumerSecret: process.env.SAFARICOM_CONSUMER_SECRET,
  shortcode: process.env.SAFARICOM_SHORTCODE,
  passkey: process.env.SAFARICOM_PASSKEY,
  callbackUrl: process.env.CALLBACK_URL,
  sandboxUrl: 'https://sandbox.safaricom.co.ke',
  productionUrl: 'https://api.safaricom.co.ke',
  environment: process.env.ENVIRONMENT || 'sandbox'
};

const baseUrl = SAFARICOM_CONFIG.environment === 'sandbox' 
  ? SAFARICOM_CONFIG.sandboxUrl 
  : SAFARICOM_CONFIG.productionUrl;

// ============ IN-MEMORY DATABASE (Replace with MongoDB in production) ============
let transactions = [];
let products = [
  { id: 'daily-1', name: '10MB', category: 'daily', price: 20, details: 'Valid for 1 day' },
  { id: 'daily-2', name: '50MB', category: 'daily', price: 50, details: 'Good for browsing and social media' },
  { id: 'daily-3', name: '100MB', category: 'daily', price: 100, details: 'Affordable daily internet' },
  { id: 'weekly-1', name: '1GB Weekly', category: 'weekly', price: 100, details: '7 days validity' },
  { id: 'weekly-2', name: '2GB Weekly', category: 'weekly', price: 200, details: 'Perfect for work and streaming' },
  { id: 'monthly-1', name: '5GB Monthly', category: 'monthly', price: 500, details: '30 days validity' },
  { id: 'monthly-2', name: '10GB Monthly', category: 'monthly', price: 1000, details: 'Heavy usage package' },
  { id: 'night-1', name: 'Night Bundle', category: 'night', price: 50, details: 'Night browsing package' },
  { id: 'night-2', name: 'Unlimited Night', category: 'night', price: 100, details: 'Unlimited night data' }
];

// ============ SAFARICOM DARAJA TOKEN MANAGEMENT ============
let accessToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  try {
    // Return cached token if still valid
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }

    const auth = Buffer.from(`${SAFARICOM_CONFIG.consumerKey}:${SAFARICOM_CONFIG.consumerSecret}`).toString('base64');
    
    const response = await axios.get(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 10000; // Refresh 10 seconds before expiry
    
    console.log('✓ Access token generated successfully');
    return accessToken;
  } catch (error) {
    console.error('❌ Error getting access token:', error.response?.data || error.message);
    throw new Error('Failed to get Safaricom access token');
  }
}

// ============ STK PUSH PAYMENT ============
async function initiateStkPush(phoneNumber, amount, bundleId) {
  try {
    const token = await getAccessToken();
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${SAFARICOM_CONFIG.shortcode}${SAFARICOM_CONFIG.passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: SAFARICOM_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: SAFARICOM_CONFIG.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: SAFARICOM_CONFIG.callbackUrl,
      AccountReference: bundleId,
      TransactionDesc: `KHQNZUR Data Bundle - ${bundleId}`
    };

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

    console.log('✓ STK Push initiated:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ STK Push error:', error.response?.data || error.message);
    throw error;
  }
}

// ============ QUERY STK PUSH STATUS ============
async function queryStk(businessShortCode, timestamp, password, phoneNumber) {
  try {
    const token = await getAccessToken();

    const payload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: phoneNumber
    };

    const response = await axios.post(
      `${baseUrl}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ STK Query error:', error.response?.data || error.message);
    throw error;
  }
}

// ============ C2B PAYMENT REGISTRATION ============
async function registerC2bUrl() {
  try {
    const token = await getAccessToken();

    const payload = {
      ShortCode: SAFARICOM_CONFIG.shortcode,
      ResponseType: 'Completed',
      ConfirmationURL: `${process.env.API_URL}/api/payment/confirmation`,
      ValidationURL: `${process.env.API_URL}/api/payment/validation`
    };

    const response = await axios.post(
      `${baseUrl}/mpesa/c2b/v1/registerurl`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✓ C2B URLs registered:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ C2B Registration error:', error.response?.data || error.message);
    throw error;
  }
}

// ============ API ENDPOINTS ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'KHQNZUR Data Solution API is running' });
});

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Initiate payment
app.post('/api/payment/initiate', async (req, res) => {
  try {
    const { phoneNumber, bundleId } = req.body;

    if (!phoneNumber || !bundleId) {
      return res.status(400).json({ error: 'Phone number and bundle ID required' });
    }

    // Validate phone number format
    const phoneRegex = /^(254|\+254|0)[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Find product
    const product = products.find(p => p.id === bundleId);
    if (!product) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    // Normalize phone number to 254 format
    let normalizedPhone = phoneNumber.replace(/^0/, '254').replace(/^\+/, '');

    // Initiate STK push
    const stkResponse = await initiateStkPush(normalizedPhone, product.price, bundleId);

    // Store transaction
    const transaction = {
      id: `TXN-${Date.now()}`,
      phoneNumber: normalizedPhone,
      bundleId: bundleId,
      bundleName: product.name,
      amount: product.price,
      status: 'pending',
      checkoutRequestId: stkResponse.CheckoutRequestID,
      timestamp: new Date().toISOString(),
      responseCode: stkResponse.ResponseCode
    };

    transactions.push(transaction);

    res.json({
      success: true,
      message: 'STK push sent successfully',
      transaction: transaction
    });
  } catch (error) {
    res.status(500).json({
      error: 'Payment initiation failed',
      details: error.message
    });
  }
});

// Payment callback from Safaricom
app.post('/api/payment/callback', (req, res) => {
  try {
    const callbackData = req.body;
    console.log('📲 Callback received:', JSON.stringify(callbackData, null, 2));

    // Handle the callback
    if (callbackData.Body.stkCallback.ResultCode === 0) {
      // Payment successful
      const callbackMetadata = callbackData.Body.stkCallback.CallbackMetadata.CallbackMetadataItem;
      
      const transactionData = {
        amount: callbackMetadata.find(item => item.Name === 'Amount').Value,
        mpesaReceiptNumber: callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber').Value,
        phoneNumber: callbackMetadata.find(item => item.Name === 'PhoneNumber').Value,
        transactionDate: callbackMetadata.find(item => item.Name === 'TransactionDate').Value
      };

      // Update transaction status
      const transaction = transactions.find(t => t.id === callbackData.Body.stkCallback.CheckoutRequestID);
      if (transaction) {
        transaction.status = 'completed';
        transaction.mpesaReceiptNumber = transactionData.mpesaReceiptNumber;
        transaction.completedAt = new Date().toISOString();
      }

      console.log('✓ Payment successful:', transactionData);
    } else {
      // Payment failed
      const transaction = transactions.find(t => t.id === callbackData.Body.stkCallback.CheckoutRequestID);
      if (transaction) {
        transaction.status = 'failed';
        transaction.failedAt = new Date().toISOString();
      }

      console.log('❌ Payment failed - Result Code:', callbackData.Body.stkCallback.ResultCode);
    }

    res.json({ ResultCode: 0, ResultDesc: 'Received' });
  } catch (error) {
    console.error('❌ Callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// Payment validation (for C2B)
app.post('/api/payment/validation', (req, res) => {
  try {
    console.log('Validation request:', req.body);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Payment confirmation (for C2B)
app.post('/api/payment/confirmation', (req, res) => {
  try {
    console.log('Confirmation received:', req.body);
    
    // Process the confirmed payment
    const transaction = {
      id: `TXN-${Date.now()}`,
      phoneNumber: req.body.MSISDN,
      amount: req.body.TransAmount,
      status: 'completed',
      mpesaReceiptNumber: req.body.TransID,
      timestamp: new Date().toISOString()
    };

    transactions.push(transaction);
    
    res.json({ ResultCode: 0, ResultDesc: 'Confirmed' });
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(500).json({ error: 'Confirmation failed' });
  }
});

// Get transaction status
app.get('/api/transaction/:id', (req, res) => {
  const transaction = transactions.find(t => t.id === req.params.id);
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  res.json(transaction);
});

// Get all transactions (admin)
app.get('/api/admin/transactions', (req, res) => {
  res.json(transactions);
});

// Update product price (admin)
app.put('/api/admin/product/:id', (req, res) => {
  const { price } = req.body;
  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (price && price > 0) {
    product.price = price;
    res.json({ success: true, product });
  } else {
    res.status(400).json({ error: 'Invalid price' });
  }
});

// Create new product (admin)
app.post('/api/admin/product', (req, res) => {
  const { name, category, price, details } = req.body;

  if (!name || !category || !price || !details) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newProduct = {
    id: `${category}-${products.filter(p => p.category === category).length + 1}`,
    name,
    category,
    price,
    details
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Get transaction history by phone number
app.get('/api/customer/:phone/transactions', (req, res) => {
  const phoneTransactions = transactions.filter(t => t.phoneNumber === req.params.phone);
  res.json(phoneTransactions);
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   KHQNZUR DATA SOLUTION - Backend API                        ║
║   Environment: ${SAFARICOM_CONFIG.environment.toUpperCase().padEnd(52, ' ')}║
║   Server running on: http://localhost:${PORT}                    ║
║   Shortcode: ${SAFARICOM_CONFIG.shortcode.padEnd(50, ' ')}║
╚══════════════════════════════════════════════════════════════╝
  `);

  // Register C2B URLs on startup (if not in sandbox)
  if (SAFARICOM_CONFIG.environment === 'production') {
    registerC2bUrl().catch(err => console.error('Failed to register C2B URLs:', err.message));
  }
});

module.exports = app;
