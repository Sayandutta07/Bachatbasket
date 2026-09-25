const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/login-or-register', (req, res) => {
    try {
        const { name, phone, address, pincode, city } = req.body;
        if (!phone || !phone.trim()) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const cleanPhone = phone.trim();
        const existing = db.prepare('SELECT * FROM users WHERE phone = ?').get(cleanPhone);

        if (existing) {
            db.prepare(`
                UPDATE users 
                SET name = COALESCE(?, name),
                    address = COALESCE(?, address),
                    pincode = COALESCE(?, pincode),
                    city = COALESCE(?, city),
                    updated_at = CURRENT_TIMESTAMP
                WHERE phone = ?
            `).run(name || null, address || null, pincode || null, city || null, cleanPhone);

            const updated = db.prepare('SELECT * FROM users WHERE phone = ?').get(cleanPhone);
            return res.json({
                success: true,
                message: 'Welcome back! Profile updated.',
                user: updated
            });
        }

        const userId = 'usr_' + Date.now();
        db.prepare(`
            INSERT INTO users (id, phone, name, address, pincode, city)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, cleanPhone, name || 'Bachat Shopper', address || '', pincode || '110001', city || 'New Delhi');

        const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        res.status(201).json({
            success: true,
            message: 'User registered successfully!',
            user: newUser
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/profile/:phone', (req, res) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(req.params.phone);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const orders = db.prepare('SELECT * FROM orders WHERE user_phone = ? ORDER BY created_at DESC LIMIT 10').all(req.params.phone);
        const totalSavedRow = db.prepare('SELECT SUM(total_savings) as allTimeSavings, COUNT(*) as orderCount FROM orders WHERE user_phone = ?').get(req.params.phone);

        res.json({
            success: true,
            user: user,
            stats: {
                totalOrders: totalSavedRow.orderCount || 0,
                allTimeSavings: totalSavedRow.allTimeSavings || 0
            },
            recentOrders: orders.map(o => ({
                id: o.id,
                strategy: o.strategy,
                singleAppName: o.single_app_name,
                singleAppTotal: o.single_app_total,
                splitAppTotal: o.split_app_total,
                totalSavings: o.total_savings,
                status: o.status,
                createdAt: o.created_at,
                items: JSON.parse(o.items)
            }))
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/profile', (req, res) => {
    try {
        const { phone, address, pincode, city, name } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        db.prepare(`
            UPDATE users
            SET address = COALESCE(?, address),
                pincode = COALESCE(?, pincode),
                city = COALESCE(?, city),
                name = COALESCE(?, name),
                updated_at = CURRENT_TIMESTAMP
            WHERE phone = ?
        `).run(address, pincode, city, name, phone);

        const updated = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
        res.json({ success: true, message: 'Profile updated successfully', user: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
