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
                logo_svg: `<img src="images/blinkit.png" alt="Blinkit" class="w-8 h-8 rounded-lg object-contain shadow-xs">`
            },
            {
                id: 'Zepto',
                name: 'Zepto',
                color: '#7C3AED',
                text_color: '#FFFFFF',
                delivery_time: '8 mins',
                delivery_fee: 15,
                handling_fee: 4,
                free_threshold: 199,
                logo_svg: `<img src="images/zepto.png" alt="Zepto" class="w-8 h-8 rounded-lg object-contain shadow-xs">`
            },
            {
                id: 'BigBasket',
                name: 'BigBasket',
                color: '#84CC16',
                text_color: '#000000',
                delivery_time: '15 mins',
                delivery_fee: 15,
                handling_fee: 3,
                free_threshold: 199,
                logo_svg: `<img src="images/bigbasket.png" alt="BigBasket" class="w-8 h-8 rounded-lg object-contain bg-white shadow-xs">`
            },
            {
                id: 'Flipkart Minutes',
                name: 'Flipkart Minutes',
                color: '#2563EB',
                text_color: '#FFFFFF',
                delivery_time: '12 mins',
                delivery_fee: 15,
                handling_fee: 3,
                free_threshold: 199,
                logo_svg: `<img src="images/flipkart.svg" alt="Flipkart Minutes" class="w-8 h-8 rounded-lg object-contain shadow-xs">`
            },
            {
                id: 'Instamart',
                name: 'Swiggy Instamart',
                color: '#FC8019',
                text_color: '#FFFFFF',
                delivery_time: '11 mins',
                delivery_fee: 15,
                handling_fee: 4,
                free_threshold: 199,
                logo_svg: `<img src="images/instamart.png" alt="Instamart" class="w-8 h-8 rounded-lg object-contain shadow-xs">`
            }
        ];

        for (const p of initialPlatforms) {
            insertPlatform.run(p.id, p.name, p.color, p.text_color, p.delivery_time, p.delivery_fee, p.handling_fee, p.free_threshold, p.logo_svg);
        }
    }

    const insertProduct = db.prepare(`
        INSERT OR REPLACE INTO products (id, name, brand, category, unit, img, prices, alternatives)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialProducts = [
        {
            id: 'bb_kurkure',
            name: 'Kurkure Masala Munch Crisps (75 g)',
            brand: 'Kurkure',
            category: 'Snacks',
            unit: '75 g',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/5482a.jpg',
            prices: {
                'Blinkit': { price: 18.5, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Flipkart Minutes': { price: 19.5, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 19.5, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 20, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 20, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: ['Tedhe Medhe Masala Tadka 75g - â‚¹18']
        },
        {
            id: 'bb_dark_fantasy',
            name: 'Sunfeast Dark Fantasy Choco Fills Biscuits',
            brand: 'Sunfeast',
            category: 'Snacks',
            unit: '300 g',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/160a.jpg',
            prices: {
                'BigBasket': { price: 92, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 96, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 102, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 105, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Instamart': { price: 108, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: ['Parle Hide & Seek (300 g) - â‚¹90']
        },
        {
            id: 'bb_lays_magic_masala',
            name: 'Lay\'s India\'s Magic Masala Potato Chips',
            brand: 'Lay\'s',
            category: 'Snacks',
            unit: '50 g',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/240092a.jpg',
            prices: {
                'Flipkart Minutes': { price: 18, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 19, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 20, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 20, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 20, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_maggi_noodles',
            name: 'Maggi 2-Minute Masala Instant Noodles',
            brand: 'Maggi',
            category: 'Snacks',
            unit: '420 g (6 Pack)',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/13813a.jpg',
            prices: {
                'Zepto': { price: 84, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 86, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 87, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 88, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 90, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: ['Yippee Magic Masala Noodles 420g - â‚¹80']
        },
        {
            id: 'bb_oreo_biscuits',
            name: 'Cadbury Oreo Vanilla Cream Biscuits',
            brand: 'Cadbury',
            category: 'Snacks',
            unit: '120 g',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/12739a.jpg',
            prices: {
                'Instamart': { price: 28, available: true, delivery_min: 11, url: 'https://www.instamart.com' },
                'Flipkart Minutes': { price: 29, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 30, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 30, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 30, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_bingo_mad_angles',
            name: 'Bingo! Mad Angles Mmmm Masala Crisps',
            brand: 'Bingo',
            category: 'Snacks',
            unit: '66 g',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/16879a.jpg',
            prices: {
                'Flipkart Minutes': { price: 18, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 19, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 20, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 20, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 20, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_parle_g',
            name: 'Parle-G Gold Original Glucose Biscuits',
            brand: 'Parle',
            category: 'Snacks',
            unit: '1 kg Saver Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/483606a.jpg',
            prices: {
                'BigBasket': { price: 110, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 112, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 115, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 118, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 120, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_haldiram_bhujia',
            name: 'Haldiram\'s Nagpur Aloo Bhujia Namkeen',
            brand: 'Haldiram\'s',
            category: 'Snacks',
            unit: '400 g',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/40118a.jpg',
            prices: {
                'Flipkart Minutes': { price: 98, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 102, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 105, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 108, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 110, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_amul_taaza',
            name: 'Amul Taaza Toned Fresh Milk',
            brand: 'Amul',
            category: 'Dairy',
            unit: '1 L Pouch',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/19512a.jpg',
            prices: {
                'Zepto': { price: 52, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 53.5, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 54, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 54, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 54.5, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: ['Mother Dairy Toned Milk 1L - â‚¹53']
        },
        {
            id: 'bb_amul_butter',
            name: 'Amul Pasteurised Salted Butter',
            brand: 'Amul',
            category: 'Dairy',
            unit: '500 g Block',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/160a.jpg',
            prices: {
                'Flipkart Minutes': { price: 268, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 270, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Blinkit': { price: 275, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 275, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Instamart': { price: 276, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_amul_cheese_slices',
            name: 'Amul Processed Cheese Slices',
            brand: 'Amul',
            category: 'Dairy',
            unit: '200 g (10 Slices)',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/19504a.jpg',
            prices: {
                'Instamart': { price: 130, available: true, delivery_min: 11, url: 'https://www.instamart.com' },
                'Flipkart Minutes': { price: 132, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 135, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 138, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 140, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_amul_masti_dahi',
            name: 'Amul Masti Dahi Pouch',
            brand: 'Amul',
            category: 'Dairy',
            unit: '400 g Pouch',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/19448a.jpg',
            prices: {
                'Zepto': { price: 33, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 34, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Flipkart Minutes': { price: 34.5, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 35, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 35, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_brown_bread',
            name: 'Modern Whole Wheat Brown Bread',
            brand: 'Modern',
            category: 'Dairy',
            unit: '400 g Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/35889a.jpg',
            prices: {
                'Flipkart Minutes': { price: 38, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 40, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 40, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 42, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 42, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_amul_paneer',
            name: 'Amul Fresh Malai Paneer',
            brand: 'Amul',
            category: 'Dairy',
            unit: '200 g Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/19460a.jpg',
            prices: {
                'BigBasket': { price: 88, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 89, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 90, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 92, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 95, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_epigamia_yogurt',
            name: 'Epigamia Greek Yogurt Blueberries',
            brand: 'Epigamia',
            category: 'Dairy',
            unit: '85 g Cup',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/368817a.jpg',
            prices: {
                'Zepto': { price: 54, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 55, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 58, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 60, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 60, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_mother_dairy_milk',
            name: 'Mother Dairy Cow Fresh Milk',
            brand: 'Mother Dairy',
            category: 'Dairy',
            unit: '500 ml Pouch',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/19520a.jpg',
            prices: {
                'Flipkart Minutes': { price: 27, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 28, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 28, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 29, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 29, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_aashirvaad_atta',
            name: 'Aashirvaad Shuddh Chakki Whole Wheat Atta',
            brand: 'Aashirvaad',
            category: 'Atta & Rice',
            unit: '5 kg Bag',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/10515a.jpg',
            prices: {
                'Flipkart Minutes': { price: 236, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 239, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Blinkit': { price: 242, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 245, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Instamart': { price: 248, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: ['Fortune Chakki Fresh Atta 5kg - â‚¹220']
        },
        {
            id: 'bb_fortune_basmati',
            name: 'Fortune Everyday Special Basmati Rice',
            brand: 'Fortune',
            category: 'Atta & Rice',
            unit: '5 kg Bag',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/240092a.jpg',
            prices: {
                'BigBasket': { price: 355, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 358, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 362, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 365, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 370, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_tata_sampann_dal',
            name: 'Tata Sampann Unpolished Toor / Arhar Dal',
            brand: 'Tata',
            category: 'Atta & Rice',
            unit: '1 kg Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102874a.jpg',
            prices: {
                'Flipkart Minutes': { price: 162, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 165, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 168, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 170, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 172, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_tata_salt',
            name: 'Tata Salt Vacuum Evaporated Iodised Salt',
            brand: 'Tata',
            category: 'Atta & Rice',
            unit: '1 kg Pouch',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/160a.jpg',
            prices: {
                'Zepto': { price: 26, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 26.5, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 27, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 27, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 28, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_madhur_sugar',
            name: 'Madhur Pure & Hygienic Sugar',
            brand: 'Madhur',
            category: 'Atta & Rice',
            unit: '1 kg Pouch',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/10507a.jpg',
            prices: {
                'Flipkart Minutes': { price: 54, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 56, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 56, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 58, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 58, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_rajma_chitra',
            name: 'Tata Sampann Rajma Chitra (Red Kidney Beans)',
            brand: 'Tata',
            category: 'Atta & Rice',
            unit: '500 g Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/116238a.jpg',
            prices: {
                'BigBasket': { price: 88, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 90, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 92, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 95, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 96, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_moong_dal',
            name: 'Tata Sampann Unpolished Yellow Moong Dal',
            brand: 'Tata',
            category: 'Atta & Rice',
            unit: '500 g Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102876a.jpg',
            prices: {
                'Zepto': { price: 72, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 74, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 76, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 78, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 80, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_kabuli_chana',
            name: 'Organic Tattva Kabuli Chana (White Chickpeas)',
            brand: 'Organic Tattva',
            category: 'Atta & Rice',
            unit: '500 g Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/439697a.jpg',
            prices: {
                'Flipkart Minutes': { price: 84, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 86, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Blinkit': { price: 88, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 90, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Instamart': { price: 92, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_fortune_sunflower',
            name: 'Fortune Sunlite Refined Sunflower Oil',
            brand: 'Fortune',
            category: 'Oils & Ghee',
            unit: '1 L Pouch',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/12795a.jpg',
            prices: {
                'Flipkart Minutes': { price: 138, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 140, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 142, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 145, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 145, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_fortune_mustard',
            name: 'Fortune Kachi Ghani Pure Mustard Oil',
            brand: 'Fortune',
            category: 'Oils & Ghee',
            unit: '1 L Pet Bottle',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/12792a.jpg',
            prices: {
                'BigBasket': { price: 152, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 154, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 158, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 160, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Instamart': { price: 162, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_amul_ghee',
            name: 'Amul Pure Cow Ghee Tin',
            brand: 'Amul',
            category: 'Oils & Ghee',
            unit: '1 L Tin',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/19515a.jpg',
            prices: {
                'Zepto': { price: 590, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 595, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 605, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 610, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 615, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_mdh_turmeric',
            name: 'MDH Deggi Mirch & Turmeric Powder Combo',
            brand: 'MDH',
            category: 'Oils & Ghee',
            unit: '100 g Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102868a.jpg',
            prices: {
                'Flipkart Minutes': { price: 72, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 75, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 76, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 78, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 80, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_catch_turmeric',
            name: 'Catch Haldi Powder (Turmeric Powder)',
            brand: 'Catch',
            category: 'Oils & Ghee',
            unit: '200 g Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/122008a.jpg',
            prices: {
                'Zepto': { price: 48, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 50, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 52, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 54, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 55, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_everest_garam_masala',
            name: 'Everest Garam Masala Powder',
            brand: 'Everest',
            category: 'Oils & Ghee',
            unit: '100 g Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102870a.jpg',
            prices: {
                'Flipkart Minutes': { price: 82, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 84, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Zepto': { price: 85, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 88, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 90, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_saffola_gold',
            name: 'Saffola Gold Refined Cooking Oil',
            brand: 'Saffola',
            category: 'Oils & Ghee',
            unit: '1 L Pouch',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/12798a.jpg',
            prices: {
                'BigBasket': { price: 158, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 160, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 164, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 168, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 170, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_potato_jyoti',
            name: 'Fresh Potato (Aloo / Jyoti)',
            brand: 'Fresh Produce',
            category: 'Vegetables',
            unit: '1 kg',
            img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 24, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 25, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 26, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 26, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Instamart': { price: 28, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_onion_red',
            name: 'Fresh Red Onion (Pyaz)',
            brand: 'Fresh Produce',
            category: 'Vegetables',
            unit: '1 kg',
            img: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Zepto': { price: 32, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 33, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 35, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 36, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 38, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_tomato_hybrid',
            name: 'Fresh Tomato Hybrid (Tamatar)',
            brand: 'Fresh Produce',
            category: 'Vegetables',
            unit: '1 kg',
            img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Flipkart Minutes': { price: 26, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 28, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Zepto': { price: 29, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 30, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 32, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_green_chilli',
            name: 'Fresh Green Chilli (Hari Mirch)',
            brand: 'Fresh Produce',
            category: 'Vegetables',
            unit: '100 g',
            img: 'https://images.unsplash.com/photo-1627916607164-7b20241db935?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Zepto': { price: 10, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 12, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Flipkart Minutes': { price: 12, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 14, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 15, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_coriander_leaves',
            name: 'Fresh Coriander Leaves (Dhania)',
            brand: 'Fresh Produce',
            category: 'Vegetables',
            unit: '100 g Bunch',
            img: 'https://images.unsplash.com/photo-1588879460405-5607b1d44cb2?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Flipkart Minutes': { price: 14, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 15, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Zepto': { price: 16, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 18, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 20, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_ginger',
            name: 'Fresh Ginger (Adrak)',
            brand: 'Fresh Produce',
            category: 'Vegetables',
            unit: '250 g',
            img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Zepto': { price: 22, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 25, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Flipkart Minutes': { price: 25, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 28, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 30, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_robusta_banana',
            name: 'Fresh Robusta Banana',
            brand: 'Fresh Produce',
            category: 'Vegetables',
            unit: '6 pcs',
            img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Flipkart Minutes': { price: 36, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 38, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Blinkit': { price: 40, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 42, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Instamart': { price: 45, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_shimla_apple',
            name: 'Fresh Shimla Royal Apple',
            brand: 'Fresh Produce',
            category: 'Vegetables',
            unit: '4 pcs (~500g)',
            img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Zepto': { price: 110, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 112, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 114, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 118, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 120, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_coca_cola',
            name: 'Coca-Cola Soft Drink Bottle',
            brand: 'Coca-Cola',
            category: 'Beverages',
            unit: '750 ml Bottle',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/274a.jpg',
            prices: {
                'Flipkart Minutes': { price: 38, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 40, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 40, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 40, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 40, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_thums_up',
            name: 'Thums Up Charged Soft Drink',
            brand: 'Thums Up',
            category: 'Beverages',
            unit: '750 ml Bottle',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/275a.jpg',
            prices: {
                'Zepto': { price: 38, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 39, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 40, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 40, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 40, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_tata_tea_gold',
            name: 'Tata Tea Gold Premium Leaf Tea',
            brand: 'Tata Tea',
            category: 'Beverages',
            unit: '500 g Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/10512a.jpg',
            prices: {
                'BigBasket': { price: 295, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 298, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 305, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 310, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 315, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_nescafe_classic',
            name: 'Nescafe Classic Instant Coffee Jar',
            brand: 'Nescafe',
            category: 'Beverages',
            unit: '100 g Jar',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102878a.jpg',
            prices: {
                'Flipkart Minutes': { price: 320, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 325, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 330, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 335, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 340, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_real_mixed_fruit',
            name: 'Real Fruit Power Mixed Fruit Juice',
            brand: 'Real',
            category: 'Beverages',
            unit: '1 L Tetrapack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/11548a.jpg',
            prices: {
                'Zepto': { price: 105, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 108, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 112, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 115, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 115, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_red_bull',
            name: 'Red Bull Energy Drink Can',
            brand: 'Red Bull',
            category: 'Beverages',
            unit: '250 ml Can',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/279a.jpg',
            prices: {
                'Flipkart Minutes': { price: 120, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 125, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 125, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'BigBasket': { price: 125, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 125, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_sprite',
            name: 'Sprite Lemon-Lime Flavored Soft Drink',
            brand: 'Sprite',
            category: 'Beverages',
            unit: '750 ml Bottle',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/276a.jpg',
            prices: {
                'BigBasket': { price: 38, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 39, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 40, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 40, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 40, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_surf_excel',
            name: 'Surf Excel Easy Wash Detergent Powder',
            brand: 'Surf Excel',
            category: 'Household',
            unit: '1 kg Pouch',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/6120a.jpg',
            prices: {
                'Flipkart Minutes': { price: 126, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 129, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Blinkit': { price: 133, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Zepto': { price: 134, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Instamart': { price: 135, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_vim_dishwash',
            name: 'Vim Dishwash Gel Lemon Bottle',
            brand: 'Vim',
            category: 'Household',
            unit: '500 ml Bottle',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/483608a.jpg',
            prices: {
                'Zepto': { price: 102, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 105, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 110, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 112, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 115, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_harpic_power',
            name: 'Harpic Power Plus Toilet Cleaner Original',
            brand: 'Harpic',
            category: 'Household',
            unit: '1 L Bottle',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102880a.jpg',
            prices: {
                'BigBasket': { price: 180, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 182, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 185, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 190, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 195, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_colin_cleaner',
            name: 'Colin Glass & Surface Cleaner Spray',
            brand: 'Colin',
            category: 'Household',
            unit: '500 ml Bottle',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102882a.jpg',
            prices: {
                'Flipkart Minutes': { price: 98, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 100, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 105, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 108, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 110, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_good_knight',
            name: 'Good Knight Gold Flash Liquid Refill',
            brand: 'Good Knight',
            category: 'Household',
            unit: '45 ml (Pack of 2)',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102884a.jpg',
            prices: {
                'Zepto': { price: 142, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 145, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 148, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 150, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 152, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_lizol_disinfectant',
            name: 'Lizol Disinfectant Floor Cleaner Citrus',
            brand: 'Lizol',
            category: 'Household',
            unit: '1 L Bottle',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102886a.jpg',
            prices: {
                'BigBasket': { price: 192, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 195, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 198, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 204, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 208, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_comfort_after_wash',
            name: 'Comfort After Wash Morning Fresh Fabric Conditioner',
            brand: 'Comfort',
            category: 'Household',
            unit: '860 ml Bottle',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102888a.jpg',
            prices: {
                'Flipkart Minutes': { price: 215, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 218, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 224, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 228, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 230, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_dettol_soap',
            name: 'Dettol Original Bathing Soap Bar',
            brand: 'Dettol',
            category: 'Personal Care',
            unit: '125 g (Pack of 4)',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/483610a.jpg',
            prices: {
                'Zepto': { price: 168, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 170, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 175, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 178, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 180, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_colgate_strong_teeth',
            name: 'Colgate Strong Teeth Dental Cream Toothpaste',
            brand: 'Colgate',
            category: 'Personal Care',
            unit: '500 g Saver Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102890a.jpg',
            prices: {
                'Flipkart Minutes': { price: 198, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 202, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Zepto': { price: 205, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 210, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 215, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_head_shoulders',
            name: 'Head & Shoulders Anti-Dandruff Smooth Shampoo',
            brand: 'Head & Shoulders',
            category: 'Personal Care',
            unit: '650 ml Bottle',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102892a.jpg',
            prices: {
                'BigBasket': { price: 440, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 445, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 450, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 460, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 465, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_nivea_body_lotion',
            name: 'Nivea Body Lotion Express Hydration',
            brand: 'Nivea',
            category: 'Personal Care',
            unit: '400 ml Bottle',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102894a.jpg',
            prices: {
                'Zepto': { price: 310, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 315, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 325, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 330, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 335, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_dove_soap',
            name: 'Dove Cream Beauty Bathing Bar',
            brand: 'Dove',
            category: 'Personal Care',
            unit: '125 g (Pack of 3)',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102896a.jpg',
            prices: {
                'Flipkart Minutes': { price: 190, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 195, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Zepto': { price: 198, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 204, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 210, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_gillette_foam',
            name: 'Gillette Foamy Regular Shaving Foam',
            brand: 'Gillette',
            category: 'Personal Care',
            unit: '200 g Can',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102898a.jpg',
            prices: {
                'Zepto': { price: 140, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 142, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 145, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 148, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 150, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_whisper_choice',
            name: 'Whisper Choice Wings Sanitary Pads',
            brand: 'Whisper',
            category: 'Personal Care',
            unit: '20 Pads Pack',
            img: 'https://cdn.grofers.com/app/images/products/sliding_image/102900a.jpg',
            prices: {
                'Flipkart Minutes': { price: 98, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 100, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Zepto': { price: 102, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 105, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 108, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_white_eggs_6',
            name: 'Fresh Table White Eggs (6 pcs)',
            brand: 'Farm Fresh',
            category: 'Meat & Eggs',
            unit: '6 pcs Pack',
            img: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Flipkart Minutes': { price: 40, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 42, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 45, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 46, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 48, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_white_eggs_30',
            name: 'Fresh Table White Eggs Tray (30 pcs)',
            brand: 'Farm Fresh',
            category: 'Meat & Eggs',
            unit: '30 pcs Tray',
            img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80',
            prices: {
                'BigBasket': { price: 198, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Flipkart Minutes': { price: 200, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Zepto': { price: 205, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 210, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 215, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_chicken_breast',
            name: 'Fresh Boneless Chicken Breast',
            brand: 'Fresh Farm',
            category: 'Meat & Eggs',
            unit: '500 g Pack',
            img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Zepto': { price: 165, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Flipkart Minutes': { price: 168, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'Blinkit': { price: 175, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'BigBasket': { price: 180, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Instamart': { price: 185, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
        },
        {
            id: 'bb_chicken_curry_cut',
            name: 'Fresh Skinless Chicken Curry Cut',
            brand: 'Fresh Farm',
            category: 'Meat & Eggs',
            unit: '500 g Pack',
            img: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Flipkart Minutes': { price: 142, available: true, delivery_min: 12, url: 'https://www.flipkart.com' },
                'BigBasket': { price: 145, available: true, delivery_min: 15, url: 'https://www.bigbasket.com' },
                'Zepto': { price: 148, available: true, delivery_min: 8, url: 'https://www.zepto.com' },
                'Blinkit': { price: 152, available: true, delivery_min: 10, url: 'https://www.blinkit.com' },
                'Instamart': { price: 155, available: true, delivery_min: 11, url: 'https://www.instamart.com' }
            },
            alternatives: []
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
