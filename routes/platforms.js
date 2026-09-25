const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM platforms WHERE active = 1').all();
        const platforms = rows.map(r => ({
            id: r.id,
            name: r.name,
            color: r.color,
            textColor: r.text_color,
            deliveryTime: r.delivery_time,
            deliveryFee: r.delivery_fee,
            handlingFee: r.handling_fee,
            freeThreshold: r.free_threshold,
            logoSvg: r.logo_svg
        }));

        res.json({
            success: true,
            platforms: platforms
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id', (req, res) => {
    try {
        const { deliveryFee, handlingFee, freeThreshold, deliveryTime } = req.body;
        const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(req.params.id);
        if (!platform) {
            return res.status(404).json({ success: false, message: 'Platform not found' });
        }

        db.prepare(`
            UPDATE platforms
            SET delivery_fee = COALESCE(?, delivery_fee),
                handling_fee = COALESCE(?, handling_fee),
                free_threshold = COALESCE(?, free_threshold),
                delivery_time = COALESCE(?, delivery_time)
            WHERE id = ?
        `).run(deliveryFee, handlingFee, freeThreshold, deliveryTime, req.params.id);

        res.json({ success: true, message: 'Platform updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
