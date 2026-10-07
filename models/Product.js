const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    bundleId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'night'],
      required: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 1
    },
    details: {
      type: String,
      required: true
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    validity: String, // e.g., "1 day", "7 days", "30 days"
    dataAmount: String, // e.g., "10MB", "1GB"
    validityPeriod: {
      value: Number,
      unit: String // 'day', 'week', 'month'
    }
  },
  {
    timestamps: true,
    collection: 'products'
  }
);

module.exports = mongoose.model('Product', productSchema);
