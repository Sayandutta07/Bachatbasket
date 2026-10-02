const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
});

app.use('/api/products', require('./routes/products'));
app.use('/api/platforms', require('./routes/platforms'));
app.use('/api/basket', require('./routes/basket'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/serviceability', require('./routes/serviceability'));

app.get('/api/status', (req, res) => {
    res.json({
        name: 'Bachatbasket Backend Engine',
        status: 'online',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname)));

app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message
    });
});

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Bachatbasket Backend Server running on http://localhost:${PORT}`);
    console.log(`🛒 Quick-Commerce Comparison & Basket Optimizer Ready`);
    console.log(`📡 API Status: http://localhost:${PORT}/api/status`);
    console.log(`====================================================`);
});

module.exports = app;
