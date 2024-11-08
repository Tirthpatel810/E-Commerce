const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// const jwtSecret = process.env.JWT_SECRET || '6ba20578b47f66d63d8e103261dff6ee8520721be791bba5fe2390b1a1110c80378867853bd9803db71849930b37353ae5c7518ae1e7a11831bcfdfd92a4f2b9';
const dbURI = 'mongodb://localhost:27017/ecommdb';

mongoose.connect(dbURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));

// User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    phone: String,
    address: String,
    password: { type: String, required: true },
    role: String
});

const User = mongoose.model('User', userSchema);

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { username, email, phone, address, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        username,
        email,
        phone,
        address,
        password: hashedPassword,
        role
    });

    try {
        await newUser.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(500).send('Error registering user');
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).send('User not found');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid password');

    // const token = jwt.sign({ userId: user._id, username: user.username }, jwtSecret);
    res.send({user});
});

const Product = require('./models/product');

// Get products by seller name
app.get('/api/products', async (req, res) => {
    const { sellerName } = req.query;
    try {
        const products = await Product.find({ sellerName });
        res.json(products);
    } catch (error) {
        res.status(500).send('Error fetching products');
    }
});

// Add new product
app.post('/api/products', async (req, res) => {
    const newProductData = req.body;
    try {
        const newProduct = new Product(newProductData);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).send('Error adding product');
    }
});

// Update existing product
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).send('Error updating product');
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Product.findByIdAndDelete(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).send('Error deleting product');
    }
});

app.get('/api/popular-products', async (req, res) => {
    try {
        const topProducts = await Product.find().sort({ totalSold: -1 }).limit(3);
        res.json(topProducts);
    } catch (error) {
        console.error('Error fetching popular products:', error);
        res.status(500).send('Error fetching popular products');
    }
});

app.get('/api/getproducts', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).send('Error fetching products');
    }
});

const Cart = require('./models/cart');
app.post('/api/saveCart', async (req, res) => {
    try {
        const { cart } = req.body;
        const { userId } = req.body;
        let existingCart = await Cart.findOne({ userId });

        if (existingCart) {
            existingCart.items = cart.map(item => ({
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
                total: item.total,
            }));
            await existingCart.save();
        } else {
            const newCart = new Cart({
                userId,
                items: cart.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.total,
                })),
            });
            await newCart.save();
        }
        res.status(200).json({ message: 'Cart saved successfully' });
    } catch (error) {
        console.error("Error saving cart:", error);
        res.status(500).json({ message: 'Error saving cart' });
    }
});
app.get('/api/getCart/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const cart = await Cart.findOne({ userId }).populate('items.productId', 'productName price'); // Populate product details if necessary

        if (cart) {
            res.status(200).json(cart.items);
        } else {
            res.status(404).json({ message: 'Cart not found' });
        }
    } catch (error) {
        console.error("Error fetching cart data:", error);
        res.status(500).json({ message: 'Error fetching cart data' });
    }
});
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});