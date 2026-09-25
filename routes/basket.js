const express = require('express');
const router = express.Router();
const { optimizeBasket } = require('../optimizer');

router.post('/optimize', (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Array of basket items required' });
        }

        const optimizationResult = optimizeBasket(items);

        res.json({
            success: true,
            optimization: optimizationResult
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
