const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'bachatbasket.db');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS platforms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT,
            text_color TEXT DEFAULT '#FFFFFF',
            delivery_time TEXT,
            delivery_fee REAL DEFAULT 0,
            handling_fee REAL DEFAULT 0,
            free_threshold REAL DEFAULT 0,
            logo_svg TEXT,
            active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            brand TEXT NOT NULL,
            category TEXT NOT NULL,
            unit TEXT NOT NULL,
            img TEXT NOT NULL,
            prices TEXT NOT NULL,
            alternatives TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            phone TEXT UNIQUE,
            name TEXT,
            address TEXT,
            pincode TEXT,
            city TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_phone TEXT,
            user_name TEXT,
            items TEXT NOT NULL,
            strategy TEXT NOT NULL,
            single_app_name TEXT,
            single_app_total REAL,
            split_app_total REAL,
            total_savings REAL,
            breakdown TEXT,
            status TEXT DEFAULT 'Placed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pincodes (
            pincode TEXT PRIMARY KEY,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            serviceable_platforms TEXT NOT NULL
        );
    `);

    seedInitialData();
}

function seedInitialData() {
    const platformCount = db.prepare('SELECT COUNT(*) as count FROM platforms').get().count;
    if (platformCount === 0) {
        const insertPlatform = db.prepare(`
            INSERT INTO platforms (id, name, color, text_color, delivery_time, delivery_fee, handling_fee, free_threshold, logo_svg, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `);

        const initialPlatforms = [
            {
                id: 'Blinkit',
                name: 'Blinkit',
                color: '#F7C400',
                text_color: '#000000',
                delivery_time: '10 mins',
                delivery_fee: 15,
                handling_fee: 4,
                free_threshold: 199,
                logo_svg: `<div class="w-8 h-8 rounded-lg bg-[#F7C400] flex items-center justify-center font-black text-black text-xs shadow-xs">B</div>`
            },
            {
                id: 'Zepto',
                name: 'Zepto',
                color: '#7C3AED',
                text_color: '#FFFFFF',
                delivery_time: '8 mins',
                delivery_fee: 15,
                handling_fee: 5,
                free_threshold: 149,
                logo_svg: `<div class="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center font-black text-white text-xs shadow-xs">Z</div>`
            },
            {
                id: 'BigBasket',
                name: 'BigBasket',
                color: '#84CC16',
                text_color: '#000000',
                delivery_time: '15-20 mins',
                delivery_fee: 20,
                handling_fee: 2,
                free_threshold: 299,
                logo_svg: `<div class="w-8 h-8 rounded-lg bg-[#84CC16] flex items-center justify-center font-black text-black text-xs shadow-xs">BB</div>`
            },
            {
                id: 'Flipkart Minutes',
                name: 'Flipkart Minutes',
                color: '#2563EB',
                text_color: '#FFFFFF',
                delivery_time: '12 mins',
                delivery_fee: 10,
                handling_fee: 3,
                free_threshold: 99,
                logo_svg: `<div class="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center font-black text-white text-xs shadow-xs">FK</div>`
            },
            {
                id: 'Instamart',
                name: 'Swiggy Instamart',
                color: '#FC8019',
                text_color: '#FFFFFF',
                delivery_time: '11 mins',
                delivery_fee: 15,
                handling_fee: 5,
                free_threshold: 199,
                logo_svg: `<div class="w-8 h-8 rounded-lg bg-[#FC8019] flex items-center justify-center font-black text-white text-xs shadow-xs">SW</div>`
            }
        ];

        for (const p of initialPlatforms) {
            insertPlatform.run(p.id, p.name, p.color, p.text_color, p.delivery_time, p.delivery_fee, p.handling_fee, p.free_threshold, p.logo_svg);
        }
    }

    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    if (productCount === 0) {
        const insertProduct = db.prepare(`
            INSERT INTO products (id, name, brand, category, unit, img, prices, alternatives)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const initialProducts = [
            {
                id: 'p0',
                name: 'Fresh Potato (Aloo)',
                brand: 'Farm Fresh',
                category: 'Vegetables',
                unit: '1 kg',
                img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 28, available: true },
                    'Zepto': { price: 30, available: true },
                    'BigBasket': { price: 25, available: true },
                    'Flipkart Minutes': { price: 27, available: true },
                    'Instamart': { price: 29, available: true }
                },
                alternatives: ['Fresh Onion 1kg - ₹32', 'Fresh Tomato 1kg - ₹26']
            },
            {
                id: 'p1',
                name: 'Amul Taaza Toned Milk',
                brand: 'Amul',
                category: 'Dairy',
                unit: '1 L',
                img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 54, available: true },
                    'Zepto': { price: 54, available: true },
                    'BigBasket': { price: 53, available: true },
                    'Flipkart Minutes': { price: 54, available: true },
                    'Instamart': { price: 55, available: true }
                },
                alternatives: ['Mother Dairy Toned Milk 1L - ₹53', 'Country Delight Milk 1L - ₹60']
            },
            {
                id: 'p2',
                name: 'Maggi 2-Minute Masala Noodles',
                brand: 'Nestle',
                category: 'Snacks',
                unit: 'Pack of 4 (280g)',
                img: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 58, available: true },
                    'Zepto': { price: 56, available: true },
                    'BigBasket': { price: 55, available: true },
                    'Flipkart Minutes': { price: 54, available: true },
                    'Instamart': { price: 58, available: true }
                },
                alternatives: ['Yippee Masala Noodles 280g - ₹48', 'Top Ramen Curry 280g - ₹50']
            },
            {
                id: 'p3',
                name: 'Fortune Sunlite Sunflower Oil',
                brand: 'Fortune',
                category: 'Oils & Ghee',
                unit: '1 L Pouch',
                img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 142, available: true },
                    'Zepto': { price: 139, available: true },
                    'BigBasket': { price: 135, available: true },
                    'Flipkart Minutes': { price: 138, available: true },
                    'Instamart': { price: 145, available: true }
                },
                alternatives: ['Saffola Gold Oil 1L - ₹155', 'Dhara Sunflower Oil 1L - ₹132']
            },
            {
                id: 'p4',
                name: 'Farm Fresh White Eggs',
                brand: 'Eggoz',
                category: 'Dairy & Eggs',
                unit: 'Pack of 6',
                img: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 48, available: true },
                    'Zepto': { price: 46, available: true },
                    'BigBasket': { price: 44, available: true },
                    'Flipkart Minutes': { price: 45, available: true },
                    'Instamart': { price: 49, available: true }
                },
                alternatives: ['Local Brown Eggs Pack of 6 - ₹55', 'Table Eggs Pack of 10 - ₹72']
            },
            {
                id: 'p5',
                name: 'Aashirvaad Shuddh Chakki Atta',
                brand: 'Aashirvaad',
                category: 'Atta & Rice',
                unit: '5 kg',
                img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 245, available: true },
                    'Zepto': { price: 240, available: true },
                    'BigBasket': { price: 232, available: true },
                    'Flipkart Minutes': { price: 235, available: true },
                    'Instamart': { price: 248, available: true }
                },
                alternatives: ['Fortune Chakki Fresh Atta 5kg - ₹220', 'Pillsbury Atta 5kg - ₹230']
            },
            {
                id: 'p6',
                name: 'Amul Pasteurised Butter',
                brand: 'Amul',
                category: 'Dairy',
                unit: '100 g',
                img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 58, available: true },
                    'Zepto': { price: 58, available: true },
                    'BigBasket': { price: 56, available: true },
                    'Flipkart Minutes': { price: 58, available: true },
                    'Instamart': { price: 58, available: true }
                },
                alternatives: ['Mother Dairy Butter 100g - ₹56', 'Delicious Table Butter 100g - ₹52']
            },
            {
                id: 'p7',
                name: 'Coca-Cola Original Taste',
                brand: 'Coca-Cola',
                category: 'Beverages',
                unit: '750 ml Bottle',
                img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 40, available: true },
                    'Zepto': { price: 38, available: true },
                    'BigBasket': { price: 38, available: true },
                    'Flipkart Minutes': { price: 37, available: true },
                    'Instamart': { price: 40, available: true }
                },
                alternatives: ['Pepsi 750ml - ₹38', 'Thums Up 750ml - ₹40']
            },
            {
                id: 'p8',
                name: 'Fresh Red Onion (Pyaaz)',
                brand: 'Farm Fresh',
                category: 'Vegetables',
                unit: '1 kg',
                img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 36, available: true },
                    'Zepto': { price: 34, available: true },
                    'BigBasket': { price: 32, available: true },
                    'Flipkart Minutes': { price: 33, available: true },
                    'Instamart': { price: 35, available: true }
                },
                alternatives: ['Fresh Spring Onion 250g - ₹20', 'Shallots 500g - ₹45']
            },
            {
                id: 'p9',
                name: 'India Gate Basmati Rice Feast Rozzana',
                brand: 'India Gate',
                category: 'Atta & Rice',
                unit: '1 kg',
                img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 92, available: true },
                    'Zepto': { price: 89, available: true },
                    'BigBasket': { price: 85, available: true },
                    'Flipkart Minutes': { price: 88, available: true },
                    'Instamart': { price: 90, available: true }
                },
                alternatives: ['Daawat Rozana Super Basmati 1kg - ₹84', 'Fortune Biryani Special 1kg - ₹110']
            },
            {
                id: 'p10',
                name: 'Tata Salt Vacuum Evaporated Iodised',
                brand: 'Tata',
                category: 'Staples',
                unit: '1 kg',
                img: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 28, available: true },
                    'Zepto': { price: 28, available: true },
                    'BigBasket': { price: 27, available: true },
                    'Flipkart Minutes': { price: 27, available: true },
                    'Instamart': { price: 28, available: true }
                },
                alternatives: ['Tata Salt Lite 1kg - ₹42', 'Aashirvaad Salt 1kg - ₹26']
            },
            {
                id: 'p11',
                name: 'Mother Dairy Classic Curd (Dahi)',
                brand: 'Mother Dairy',
                category: 'Dairy',
                unit: '400 g Cup',
                img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80',
                prices: {
                    'Blinkit': { price: 35, available: true },
                    'Zepto': { price: 35, available: true },
                    'BigBasket': { price: 34, available: true },
                    'Flipkart Minutes': { price: 35, available: true },
                    'Instamart': { price: 35, available: true }
                },
                alternatives: ['Amul Masti Dahi 400g - ₹35', 'Epigamia Greek Yogurt 90g - ₹50']
            }
        ];

        for (const p of initialProducts) {
            insertProduct.run(
                p.id,
                p.name,
                p.brand,
                p.category,
                p.unit,
                p.img,
                JSON.stringify(p.prices),
                JSON.stringify(p.alternatives)
            );
        }
    }

    const pincodeCount = db.prepare('SELECT COUNT(*) as count FROM pincodes').get().count;
    if (pincodeCount === 0) {
        const insertPin = db.prepare(`
            INSERT INTO pincodes (pincode, city, state, serviceable_platforms)
            VALUES (?, ?, ?, ?)
        `);

        const initialPins = [
            { pincode: '110001', city: 'New Delhi', state: 'Delhi', platforms: ['Blinkit', 'Zepto', 'BigBasket', 'Flipkart Minutes', 'Instamart'] },
            { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', platforms: ['Blinkit', 'Zepto', 'BigBasket', 'Flipkart Minutes', 'Instamart'] },
            { pincode: '560001', city: 'Bengaluru', state: 'Karnataka', platforms: ['Blinkit', 'Zepto', 'BigBasket', 'Flipkart Minutes', 'Instamart'] },
            { pincode: '700001', city: 'Kolkata', state: 'West Bengal', platforms: ['Blinkit', 'Zepto', 'BigBasket', 'Instamart'] },
            { pincode: '500001', city: 'Hyderabad', state: 'Telangana', platforms: ['Blinkit', 'Zepto', 'BigBasket', 'Flipkart Minutes', 'Instamart'] },
            { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu', platforms: ['Zepto', 'BigBasket', 'Instamart'] }
        ];

        for (const pin of initialPins) {
            insertPin.run(pin.pincode, pin.city, pin.state, JSON.stringify(pin.platforms));
        }
    }
}

initDatabase();

module.exports = db;
