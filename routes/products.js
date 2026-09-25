const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    try {
        const { search, category, brand, sort } = req.query;

        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category && category !== 'All') {
            query += ' AND category = ?';
            params.push(category);
        }

        if (brand && brand !== 'All') {
            query += ' AND brand = ?';
            params.push(brand);
        }

        if (search) {
            query += ' AND (name LIKE ? OR brand LIKE ? OR category LIKE ?)';
            const term = `%${search.trim()}%`;
            params.push(term, term, term);
        }

        const rows = db.prepare(query).all(...params);

        const products = rows.map(r => {
            const prices = JSON.parse(r.prices);
            const alternatives = JSON.parse(r.alternatives);

            let minPrice = Infinity;
            let minPlatform = '';
            let maxPrice = -Infinity;
            let maxPlatform = '';

            Object.keys(prices).forEach(p => {
                const price = prices[p].price;
                if (price < minPrice) {
                    minPrice = price;
                    minPlatform = p;
                }
                if (price > maxPrice) {
                    maxPrice = price;
                    maxPlatform = p;
                }
            });

            return {
                id: r.id,
                name: r.name,
                brand: r.brand,
                category: r.category,
                unit: r.unit,
                img: r.img,
                prices: prices,
                alternatives: alternatives,
                minPrice: minPrice === Infinity ? 0 : minPrice,
                minPlatform: minPlatform,
                maxPrice: maxPrice === -Infinity ? 0 : maxPrice,
                maxPlatform: maxPlatform,
                maxSavings: Math.max(0, maxPrice - minPrice)
            };
        });

        if (sort === 'price_asc') {
            products.sort((a, b) => a.minPrice - b.minPrice);
        } else if (sort === 'price_desc') {
            products.sort((a, b) => b.minPrice - a.minPrice);
        } else if (sort === 'savings_desc') {
            products.sort((a, b) => b.maxSavings - a.maxSavings);
        }

        res.json({
            success: true,
            count: products.length,
            products: products
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/categories', (req, res) => {
    try {
        const rows = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
        res.json({
            success: true,
            categories: rows.map(r => r.category)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/brands', (req, res) => {
    try {
        const rows = db.prepare('SELECT DISTINCT brand FROM products ORDER BY brand').all();
        res.json({
            success: true,
            brands: rows.map(r => r.brand)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', (req, res) => {
    try {
        const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
        if (!row) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const prices = JSON.parse(row.prices);
        const alternatives = JSON.parse(row.alternatives);

        let minPrice = Infinity;
        let minPlatform = '';
        let maxPrice = -Infinity;

        Object.keys(prices).forEach(p => {
            const price = prices[p].price;
            if (price < minPrice) {
                minPrice = price;
                minPlatform = p;
            }
            if (price > maxPrice) {
                maxPrice = price;
            }
        });

        res.json({
            success: true,
            product: {
                id: row.id,
                name: row.name,
                brand: row.brand,
                category: row.category,
                unit: row.unit,
                img: row.img,
                prices: prices,
                alternatives: alternatives,
                minPrice: minPrice,
                minPlatform: minPlatform,
                maxPrice: maxPrice,
                maxSavings: Math.max(0, maxPrice - minPrice)
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', (req, res) => {
    try {
        const { name, brand, category, unit, img, prices, alternatives } = req.body;
        if (!name || !brand || !category) {
            return res.status(400).json({ success: false, message: 'Name, brand, and category are required' });
        }

        const id = 'p' + Date.now();
        const pricesObj = prices || {
            'Blinkit': { price: 30, available: true },
            'Zepto': { price: 30, available: true },
            'BigBasket': { price: 28, available: true },
            'Flipkart Minutes': { price: 29, available: true },
            'Instamart': { price: 30, available: true }
        };

        db.prepare(`
            INSERT INTO products (id, name, brand, category, unit, img, prices, alternatives)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            name,
            brand,
            category,
            unit || '1 Pack',
            img || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
            JSON.stringify(pricesObj),
            JSON.stringify(alternatives || [])
        );

        res.status(201).json({ success: true, message: 'Product added successfully', id });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
