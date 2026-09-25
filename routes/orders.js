const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
    try {
        const {
            userPhone,
            userName,
            items,
            strategy,
            singleAppName,
            singleAppTotal,
            splitAppTotal,
            totalSavings,
            breakdown
        } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({ success: false, message: 'Basket items cannot be empty' });
        }

        const orderId = 'BB-' + Math.floor(100000 + Math.random() * 900000);

        db.prepare(`
            INSERT INTO orders (
                id, user_phone, user_name, items, strategy,
                single_app_name, single_app_total, split_app_total, total_savings,
                breakdown, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            orderId,
            userPhone || 'Guest',
            userName || 'Shopper',
            JSON.stringify(items),
            strategy || 'single',
            singleAppName || 'Blinkit',
            parseFloat(singleAppTotal) || 0,
            parseFloat(splitAppTotal) || 0,
            parseFloat(totalSavings) || 0,
            JSON.stringify(breakdown || {}),
            'Placed'
        );

        res.status(201).json({
            success: true,
            orderId: orderId,
            message: `Order #${orderId} successfully registered with ₹${totalSavings || 0} Bachat savings!`,
            savingsAmount: totalSavings || 0
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/user/:phone', (req, res) => {
    try {
        const orders = db.prepare(`
            SELECT * FROM orders 
            WHERE user_phone = ? 
            ORDER BY created_at DESC
        `).all(req.params.phone);

        const totalSavingsResult = db.prepare(`
            SELECT SUM(total_savings) as cumulativeSavings, COUNT(*) as count 
            FROM orders 
            WHERE user_phone = ?
        `).get(req.params.phone);

        res.json({
            success: true,
            count: orders.length,
            cumulativeSavings: totalSavingsResult.cumulativeSavings || 0,
            orders: orders.map(o => ({
                id: o.id,
                userName: o.user_name,
                userPhone: o.user_phone,
                items: JSON.parse(o.items),
                strategy: o.strategy,
                singleAppName: o.single_app_name,
                singleAppTotal: o.single_app_total,
                splitAppTotal: o.split_app_total,
                totalSavings: o.total_savings,
                breakdown: JSON.parse(o.breakdown || '{}'),
                status: o.status,
                createdAt: o.created_at
            }))
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', (req, res) => {
    try {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({
            success: true,
            order: {
                ...order,
                items: JSON.parse(order.items),
                breakdown: JSON.parse(order.breakdown || '{}')
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
