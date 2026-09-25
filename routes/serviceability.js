const express = require('express');
const router = express.Router();
const db = require('../db');

// City coordinate lookup table for fast offline / fallback reverse-geocoding
const INDIAN_CITIES = [
    { name: 'Kolkata', pincode: '700001', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
    { name: 'New Delhi', pincode: '110001', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
    { name: 'Mumbai', pincode: '400001', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
    { name: 'Bengaluru', pincode: '560001', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
    { name: 'Hyderabad', pincode: '500001', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
    { name: 'Chennai', pincode: '600001', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
    { name: 'Pune', pincode: '411001', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
    { name: 'Ahmedabad', pincode: '380001', state: 'Gujarat', lat: 23.0225, lon: 72.5714 }
];

function findClosestCity(lat, lon) {
    let closest = INDIAN_CITIES[0];
    let minDistance = Infinity;

    for (const city of INDIAN_CITIES) {
        const dLat = city.lat - lat;
        const dLon = city.lon - lon;
        const dist = Math.sqrt(dLat * dLat + dLon * dLon);
        if (dist < minDistance) {
            minDistance = dist;
            closest = city;
        }
    }
    return closest;
}

// GET /api/serviceability/detect-location
router.get('/detect-location', (req, res) => {
    // Default to New Delhi or first city with active dark stores
    const defaultCity = INDIAN_CITIES[0];
    res.json({
        success: true,
        city: defaultCity.name,
        pincode: defaultCity.pincode,
        state: defaultCity.state,
        area: `${defaultCity.name} Central`,
        serviceablePlatforms: ['Blinkit', 'Zepto', 'BigBasket', 'Flipkart Minutes', 'Instamart']
    });
});

// GET /api/serviceability/reverse-geocode?lat=...&lon=...
router.get('/reverse-geocode', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({ success: false, message: 'Valid lat and lon required' });
        }

        // Try external reverse-geocoding with 2 second timeout and proper User-Agent
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Bachatbasket-App/1.0 (contact: info@bachathub.in)'
                }
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const city = data.address?.city || data.address?.town || data.address?.state_district || 'New Delhi';
                const pincode = data.address?.postcode || '110001';
                const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.road || city;

                return res.json({
                    success: true,
                    city: city,
                    pincode: pincode,
                    area: suburb,
                    formatted: `${suburb}, ${pincode}`,
                    lat,
                    lon
                });
            }
        } catch (fetchErr) {
            // Fallback to closest known Indian city
        }

        const closest = findClosestCity(lat, lon);
        return res.json({
            success: true,
            city: closest.name,
            pincode: closest.pincode,
            area: closest.name,
            formatted: `${closest.name} (${closest.pincode})`,
            lat,
            lon,
            isEstimated: true
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/serviceability/:pincode
router.get('/:pincode', (req, res) => {
    try {
        const pin = req.params.pincode ? req.params.pincode.trim() : '';
        const found = db.prepare('SELECT * FROM pincodes WHERE pincode = ?').get(pin);

        if (found) {
            const platforms = JSON.parse(found.serviceable_platforms);
            return res.json({
                success: true,
                pincode: found.pincode,
                city: found.city,
                state: found.state,
                isServiceable: true,
                serviceablePlatforms: platforms,
                message: `All ${platforms.length} quick-commerce stores are live in ${found.city} (${found.pincode})!`
            });
        }

        if (/^\d{6}$/.test(pin)) {
            const defaultPlatforms = ['Blinkit', 'Zepto', 'BigBasket', 'Flipkart Minutes', 'Instamart'];
            return res.json({
                success: true,
                pincode: pin,
                city: 'Delivery Area',
                state: 'India',
                isServiceable: true,
                serviceablePlatforms: defaultPlatforms,
                message: `Quick-commerce comparison available for pincode ${pin}!`
            });
        }

        res.status(400).json({
            success: false,
            isServiceable: false,
            message: 'Invalid Indian 6-digit pincode'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
