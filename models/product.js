const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    addedDate: { type: Date, default: Date.now },
    lastUpdatedDate: { type: Date, default: Date.now },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    description: String,
    image: String,
    sellerName: String,
    totalSold: { type: Number, default: 0 }, // New field to track items sold
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
