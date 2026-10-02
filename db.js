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
            id: 'sunfeast_dark_fantasy_choco_fills_300g',
            name: 'Sunfeast Dark Fantasy Choco Fills Biscuits (300 g)',
            brand: 'Sunfeast',
            category: 'Snacks',
            unit: '300 g',
            img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 105.0, available: true, delivery_min: 10, url: 'https://blinkit.com/prn/sunfeast-dark-fantasy-choco-fills/prid/3241' },
                'Instamart': { price: 112.0, available: true, delivery_min: 12, url: 'https://www.swiggy.com/instamart/item/sunfeast-dark-fantasy-choco-fills-300-g' },
                'BigBasket': { price: 99.0, available: true, delivery_min: 20, url: 'https://www.bigbasket.com/pd/40005779/sunfeast-dark-fantasy-choco-fills-300-g/' },
                'Zepto': { price: 108.0, available: true, delivery_min: 10, url: 'https://www.zepto.com/pn/sunfeast-dark-fantasy-choco-fills-300g' },
                'Flipkart Minutes': { price: 95.0, available: true, delivery_min: 11, url: 'https://flipkart.com/hyperlocal-grocery-new-ab-at-store' }
            },
            alternatives: ['Oreo Double Stuf 300g - ₹120', 'Hide & Seek Chocolate 300g - ₹90']
        },
        {
            id: 'kurkure_masala_munch_75g',
            name: 'Kurkure Masala Munch Crisps (75 g)',
            brand: 'Kurkure',
            category: 'Snacks',
            unit: '75 g',
            img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 19.0, available: true, delivery_min: 10, url: 'https://blinkit.com/prn/kurkure-masala-munch/prid/5482' },
                'Instamart': { price: 20.0, available: true, delivery_min: 12, url: 'https://www.swiggy.com/instamart/item/kurkure-masala-munch' },
                'BigBasket': { price: 20.0, available: true, delivery_min: 15, url: 'https://www.bigbasket.com/pd/266567/kurkure-namkeen-masala-munch-75-g/' },
                'Zepto': { price: 19.5, available: true, delivery_min: 10, url: 'https://www.zepto.com/pn/kurkure-masala-munch-75g' },
                'Flipkart Minutes': { price: 18.0, available: true, delivery_min: 11, url: 'https://www.flipkart.com/hyperlocal-grocery-new-ab-at-store' }
            },
            alternatives: ["Lay's India's Magic Masala 50g - ₹20", 'Tedhe Medhe Masala Tadka 75g - ₹18']
        },
        {
            id: 'amul_taaza_milk_1l',
            name: 'Amul Taaza Toned Fresh Milk (1 L)',
            brand: 'Amul',
            category: 'Dairy',
            unit: '1 L Pouch',
            img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 54.0, available: true, delivery_min: 10, url: 'https://blinkit.com/prn/amul-taaza-toned-milk/prid/12948' },
                'Instamart': { price: 54.0, available: true, delivery_min: 15, url: 'https://www.swiggy.com/instamart/item/amul-taaza-toned-milk-1-l' },
                'BigBasket': { price: 54.0, available: true, delivery_min: 20, url: 'https://www.bigbasket.com/pd/306926/amul-homogenised-toned-milk-1-l/' },
                'Zepto': { price: 53.0, available: true, delivery_min: 10, url: 'https://www.zepto.com/pn/amul-taaza-toned-milk-1l' },
                'Flipkart Minutes': { price: 53.5, available: true, delivery_min: 12, url: 'https://www.flipkart.com/hyperlocal-grocery-new-ab-at-store' }
            },
            alternatives: ['Mother Dairy Toned Milk 1L - ₹53', 'Country Delight Milk 1L - ₹60']
        },
        {
            id: 'aashirvaad_shudh_chakki_atta_5kg',
            name: 'Aashirvaad Superior MP Whole Wheat Atta (5 kg)',
            brand: 'Aashirvaad',
            category: 'Atta & Rice',
            unit: '5 kg Bag',
            img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 244.0, available: true, delivery_min: 15, url: 'https://blinkit.com/prn/aashirvaad-shudh-chakki-atta/prid/3451' },
                'Instamart': { price: 248.0, available: true, delivery_min: 15, url: 'https://www.swiggy.com/instamart/item/aashirvaad-shudh-chakki-atta-5-kg' },
                'BigBasket': { price: 235.0, available: true, delivery_min: 25, url: 'https://www.bigbasket.com/pd/126906/aashirvaad-atta-whole-wheat-5-kg/' },
                'Zepto': { price: 242.0, available: true, delivery_min: 12, url: 'https://www.zepto.com/pn/aashirvaad-whole-wheat-atta-5kg' },
                'Flipkart Minutes': { price: 232.0, available: true, delivery_min: 14, url: 'https://www.flipkart.com/hyperlocal-grocery-new-ab-at-store' }
            },
            alternatives: ['Fortune Chakki Fresh Atta 5kg - ₹220', 'Pillsbury Atta 5kg - ₹230']
        },
        {
            id: 'fortune_sunflower_oil_1l',
            name: 'Fortune Sunlite Refined Sunflower Oil Pouch (1 L)',
            brand: 'Fortune',
            category: 'Oils & Ghee',
            unit: '1 L Pouch',
            img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 142.0, available: true, delivery_min: 10, url: 'https://blinkit.com/prn/fortune-sunlite-sunflower-oil/prid/8912' },
                'Instamart': { price: 145.0, available: true, delivery_min: 12, url: 'https://www.swiggy.com/instamart/item/fortune-sunlite-sunflower-oil-1-l' },
                'BigBasket': { price: 139.0, available: true, delivery_min: 20, url: 'https://www.bigbasket.com/pd/274145/fortune-sun-lite-sunflower-refined-oil-1-l-pouch/' },
                'Zepto': { price: 140.0, available: true, delivery_min: 10, url: 'https://www.zepto.com/pn/fortune-sunlite-sunflower-oil-1l' },
                'Flipkart Minutes': { price: 137.0, available: true, delivery_min: 12, url: 'https://www.flipkart.com/hyperlocal-grocery-new-ab-at-store' }
            },
            alternatives: ['Saffola Gold Oil 1L - ₹155', 'Dhara Sunflower Oil 1L - ₹132']
        },
        {
            id: 'coca_cola_original_750ml',
            name: 'Coca-Cola Original Taste Soft Drink (750 ml)',
            brand: 'Coca-Cola',
            category: 'Beverages',
            unit: '750 ml Bottle',
            img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 40.0, available: true, delivery_min: 10, url: 'https://blinkit.com/prn/coca-cola-soft-drink/prid/223' },
                'Instamart': { price: 38.0, available: true, delivery_min: 12, url: 'https://www.swiggy.com/instamart/item/coca-cola-cold-drink-750-ml' },
                'BigBasket': { price: 38.0, available: true, delivery_min: 15, url: 'https://www.bigbasket.com/pd/251006/coca-cola-soft-drink-750-ml-bottle/' },
                'Zepto': { price: 40.0, available: true, delivery_min: 10, url: 'https://www.zepto.com/pn/coca-cola-750ml' },
                'Flipkart Minutes': { price: 37.0, available: true, delivery_min: 10, url: 'https://www.flipkart.com/hyperlocal-grocery-new-ab-at-store' }
            },
            alternatives: ['Pepsi 750ml - ₹38', 'Thums Up 750ml - ₹40']
        },
        {
            id: 'tata_salt_iodized_1kg',
            name: 'Tata Salt Vacuum Evaporated Iodised Salt (1 kg)',
            brand: 'Tata',
            category: 'Staples',
            unit: '1 kg',
            img: 'images/salt.jpg',
            prices: {
                'Blinkit': { price: 27.0, available: true, delivery_min: 10, url: 'https://blinkit.com/prn/tata-salt-iodized/prid/1029' },
                'Instamart': { price: 28.0, available: true, delivery_min: 12, url: 'https://www.swiggy.com/instamart/item/tata-salt-iodised-1-kg' },
                'BigBasket': { price: 26.5, available: true, delivery_min: 20, url: 'https://www.bigbasket.com/pd/241600/tata-salt-iodized-1-kg/' },
                'Zepto': { price: 27.0, available: true, delivery_min: 10, url: 'https://www.zepto.com/pn/tata-iodized-salt-1kg' },
                'Flipkart Minutes': { price: 26.0, available: true, delivery_min: 11, url: 'https://www.flipkart.com/hyperlocal-grocery-new-ab-at-store' }
            },
            alternatives: ['Tata Salt Lite 1kg - ₹42', 'Aashirvaad Salt 1kg - ₹26']
        },
        {
            id: 'maggi_2_minute_noodles_70g',
            name: 'Maggi 2-Minute Masala Instant Noodles (70 g)',
            brand: 'Maggi',
            category: 'Snacks',
            unit: 'Pack of 4 (280g)',
            img: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 14.0, available: true, delivery_min: 10, url: 'https://blinkit.com/prn/maggi-2-minute-masala-noodles/prid/403' },
                'Instamart': { price: 14.0, available: true, delivery_min: 12, url: 'https://www.swiggy.com/instamart/item/maggi-2-minute-instant-noodles-70-g' },
                'BigBasket': { price: 13.5, available: true, delivery_min: 15, url: 'https://www.bigbasket.com/pd/266109/maggi-masala-instant-noodles-70-g/' },
                'Zepto': { price: 14.0, available: true, delivery_min: 10, url: 'https://www.zepto.com/pn/maggi-2-minute-noodles-70g' },
                'Flipkart Minutes': { price: 13.0, available: true, delivery_min: 10, url: 'https://www.flipkart.com/hyperlocal-grocery-new-ab-at-store' }
            },
            alternatives: ['Yippee Masala Noodles 280g - ₹48', 'Top Ramen Curry 280g - ₹50']
        },
        {
            id: 'amul_butter_pasteurized_500g',
            name: 'Amul Pasteurized Butter (500 g)',
            brand: 'Amul',
            category: 'Dairy',
            unit: '500 g Block',
            img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 275.0, available: true, delivery_min: 10, url: 'https://blinkit.com/prn/amul-pasteurised-butter/prid/512' },
                'Instamart': { price: 275.0, available: true, delivery_min: 15, url: 'https://www.swiggy.com/instamart/item/amul-pasteurised-butter-500-g' },
                'BigBasket': { price: 269.0, available: true, delivery_min: 25, url: 'https://www.bigbasket.com/pd/104860/amul-butter-pasteurised-500-g/' },
                'Zepto': { price: 275.0, available: true, delivery_min: 10, url: 'https://www.zepto.com/pn/amul-butter-pasteurized-500g' },
                'Flipkart Minutes': { price: 268.0, available: true, delivery_min: 12, url: 'https://www.flipkart.com/hyperlocal-grocery-new-ab-at-store' }
            },
            alternatives: ['Mother Dairy Butter 500g - ₹265', 'Delicious Table Butter 500g - ₹240']
        },
        {
            id: 'lays_india_magic_masala_50g',
            name: "Lay's India's Magic Masala Potato Chips (50 g)",
            brand: "Lay's",
            category: 'Snacks',
            unit: '50 g',
            img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 20.0, available: true, delivery_min: 10, url: 'https://blinkit.com/prn/lays-indias-magic-masala-chips/prid/789' },
                'Instamart': { price: 19.0, available: true, delivery_min: 12, url: 'https://www.swiggy.com/instamart/item/lays-indias-magic-masala-50-g' },
                'BigBasket': { price: 20.0, available: true, delivery_min: 15, url: 'https://www.bigbasket.com/pd/294299/lays-potato-chips-indias-magic-masala-50-g/' },
                'Zepto': { price: 20.0, available: true, delivery_min: 10, url: 'https://www.zepto.com/pn/lays-magic-masala-chips-50g' },
                'Flipkart Minutes': { price: 18.5, available: true, delivery_min: 10, url: 'https://www.flipkart.com/hyperlocal-grocery-new-ab-at-store' }
            },
            alternatives: ['Bingo Mad Angles Achaari Masti 66g - ₹20', 'Pringles Sour Cream 107g - ₹105']
        },
        {
            id: 'surf_excel_easy_wash_detergent_1kg',
            name: 'Surf Excel Easy Wash Detergent Powder (1 kg)',
            brand: 'Surf Excel',
            category: 'Household',
            unit: '1 kg Pouch',
            img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 133.0, available: true, delivery_min: 10, url: 'https://blinkit.com/prn/surf-excel-easy-wash-detergent/prid/6120' },
                'Instamart': { price: 135.0, available: true, delivery_min: 15, url: 'https://www.swiggy.com/instamart/item/surf-excel-easy-wash-powder-1-kg' },
                'BigBasket': { price: 129.0, available: true, delivery_min: 30, url: 'https://www.bigbasket.com/pd/266946/surf-excel-easy-wash-detergent-powder-1-kg/' },
                'Zepto': { price: 134.0, available: true, delivery_min: 12, url: 'https://www.zepto.com/pn/surf-excel-easy-wash-powder-1kg' },
                'Flipkart Minutes': { price: 128.0, available: true, delivery_min: 14, url: 'https://www.flipkart.com/hyperlocal-grocery-new-ab-at-store' }
            },
            alternatives: ['Ariel Matic Front Load 1kg - ₹220', 'Tide Plus Double Power 1kg - ₹115']
        },
        {
            id: 'white_eggs_6s',
            name: 'Farm Fresh White Eggs (Pack of 6)',
            brand: 'Eggoz',
            category: 'Dairy',
            unit: 'Pack of 6',
            img: 'images/white_eggs.jpg',
            prices: {
                'Blinkit': { price: 42.0, available: true },
                'Zepto': { price: 45.0, available: true },
                'BigBasket': { price: 44.0, available: true },
                'Flipkart Minutes': { price: 43.0, available: true },
                'Instamart': { price: 48.0, available: true }
            },
            alternatives: ['Local Brown Eggs Pack of 6 - ₹55', 'Table Eggs Pack of 10 - ₹72']
        },
        {
            id: 'fresh_coriander_100g',
            name: 'Fresh Green Coriander (Dhaniya Patta) (100 g)',
            brand: 'Farm Fresh',
            category: 'Vegetables',
            unit: '100 g Bunch',
            img: 'images/coriander.jpg',
            prices: {
                'Blinkit': { price: 12.0, available: true },
                'Zepto': { price: 10.0, available: true },
                'BigBasket': { price: 8.0, available: true },
                'Flipkart Minutes': { price: 9.0, available: true },
                'Instamart': { price: 11.0, available: true }
            },
            alternatives: ['Fresh Mint Leaves 100g - ₹15', 'Curry Leaves 50g - ₹10']
        },
        {
            id: 'vim_dishwash_500ml',
            name: 'Vim Dishwash Liquid Gel Lemon Fragrance (500 ml)',
            brand: 'Vim',
            category: 'Household',
            unit: '500 ml Bottle',
            img: 'images/vim.jpg',
            prices: {
                'Blinkit': { price: 115.0, available: true },
                'Zepto': { price: 112.0, available: true },
                'BigBasket': { price: 102.0, available: true },
                'Flipkart Minutes': { price: 108.0, available: true },
                'Instamart': { price: 118.0, available: true }
            },
            alternatives: ['Pril Dishwash Liquid 500ml - ₹110', 'Exo Touch Dishwash 500ml - ₹95']
        },
        {
            id: 'dettol_handwash_675ml',
            name: 'Dettol Original Germ Protection Liquid Handwash Refill (675 ml)',
            brand: 'Dettol',
            category: 'Household',
            unit: '675 ml Refill Pack',
            img: 'images/dettol.jpg',
            prices: {
                'Blinkit': { price: 105.0, available: true },
                'Zepto': { price: 102.0, available: true },
                'BigBasket': { price: 95.0, available: true },
                'Flipkart Minutes': { price: 99.0, available: true },
                'Instamart': { price: 92.0, available: true }
            },
            alternatives: ['Lifebuoy Total Handwash Refill 750ml - ₹89', 'Godrej Protekt Handwash 750ml - ₹85']
        },
        {
            id: 'fresh_potato_1kg',
            name: 'Fresh Potato (Aloo / Jyoti) (1 kg)',
            brand: 'Farm Fresh',
            category: 'Vegetables',
            unit: '1 kg',
            img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 24.0, available: true },
                'Zepto': { price: 28.0, available: true },
                'BigBasket': { price: 27.0, available: true },
                'Flipkart Minutes': { price: 26.0, available: true },
                'Instamart': { price: 30.0, available: true }
            },
            alternatives: ['Fresh Onion 1kg - ₹32', 'Fresh Tomato 1kg - ₹26']
        },
        {
            id: 'fresh_onion_1kg',
            name: 'Fresh Red Onion (Pyaaz) (1 kg)',
            brand: 'Farm Fresh',
            category: 'Vegetables',
            unit: '1 kg',
            img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 36.0, available: true },
                'Zepto': { price: 34.0, available: true },
                'BigBasket': { price: 32.0, available: true },
                'Flipkart Minutes': { price: 33.0, available: true },
                'Instamart': { price: 35.0, available: true }
            },
            alternatives: ['Fresh Spring Onion 250g - ₹20', 'Shallots 500g - ₹45']
        },
        {
            id: 'fresh_tomato_1kg',
            name: 'Fresh Hybrid Red Tomatoes (1 kg)',
            brand: 'Farm Fresh',
            category: 'Vegetables',
            unit: '1 kg',
            img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 26.0, available: true },
                'Zepto': { price: 28.0, available: true },
                'BigBasket': { price: 22.0, available: true },
                'Flipkart Minutes': { price: 24.0, available: true },
                'Instamart': { price: 27.0, available: true }
            },
            alternatives: ['Organic Country Tomatoes 1kg - ₹34', 'Cherry Tomatoes 250g - ₹40']
        },
        {
            id: 'amul_masti_dahi_400g',
            name: 'Amul Masti Dahi / Plain Curd (400 g)',
            brand: 'Amul',
            category: 'Dairy',
            unit: '400 g Cup',
            img: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 35.0, available: true },
                'Zepto': { price: 35.0, available: true },
                'BigBasket': { price: 34.0, available: true },
                'Flipkart Minutes': { price: 32.0, available: true },
                'Instamart': { price: 35.0, available: true }
            },
            alternatives: ['Mother Dairy Dahi 400g - ₹35', 'Epigamia Greek Yogurt 90g - ₹50']
        },
        {
            id: 'india_gate_basmati_1kg',
            name: 'India Gate Basmati Rice Feast Rozzana (1 kg)',
            brand: 'India Gate',
            category: 'Atta & Rice',
            unit: '1 kg Bag',
            img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 90.0, available: true },
                'Zepto': { price: 89.0, available: true },
                'BigBasket': { price: 85.0, available: true },
                'Flipkart Minutes': { price: 88.0, available: true },
                'Instamart': { price: 90.0, available: true }
            },
            alternatives: ['Daawat Rozana Super Basmati 1kg - ₹84', 'Fortune Biryani Special 1kg - ₹110']
        },
        {
            id: 'tata_sampann_toor_dal_1kg',
            name: 'Tata Sampann Unpolished Toor Dal (1 kg)',
            brand: 'Tata',
            category: 'Staples',
            unit: '1 kg Bag',
            img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 168.0, available: true },
                'Zepto': { price: 162.0, available: true },
                'BigBasket': { price: 158.0, available: true },
                'Flipkart Minutes': { price: 160.0, available: true },
                'Instamart': { price: 152.0, available: true }
            },
            alternatives: ['Fortune Unpolished Toor Dal 1kg - ₹155', 'Organic Tattva Toor Dal 1kg - ₹180']
        },
        {
            id: 'amul_malai_paneer_200g',
            name: 'Amul Fresh Malai Paneer (200 g)',
            brand: 'Amul',
            category: 'Dairy',
            unit: '200 g Pack',
            img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 90.0, available: true },
                'Zepto': { price: 92.0, available: true },
                'BigBasket': { price: 86.0, available: true },
                'Flipkart Minutes': { price: 84.0, available: true },
                'Instamart': { price: 92.0, available: true }
            },
            alternatives: ['Mother Dairy Paneer 200g - ₹88', 'Milky Mist Paneer 200g - ₹92']
        },
        {
            id: 'chicken_breast_500g',
            name: 'Fresh Boneless Chicken Breast (500 g)',
            brand: 'Fresh Cuts',
            category: 'Meat & Fish',
            unit: '500 g Pack',
            img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 185.0, available: true },
                'Zepto': { price: 180.0, available: true },
                'BigBasket': { price: 175.0, available: true },
                'Flipkart Minutes': { price: 170.0, available: true },
                'Instamart': { price: 190.0, available: true }
            },
            alternatives: ['Chicken Curry Cut with Bone 500g - ₹130', 'Licious Chicken Breast 500g - ₹210']
        },
        {
            id: 'ginger_garlic_paste_100g',
            name: 'Dabur Hommade Ginger Garlic Paste (100 g)',
            brand: 'Dabur',
            category: 'Staples',
            unit: '100 g Pouch',
            img: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 30.0, available: true },
                'Zepto': { price: 29.0, available: true },
                'BigBasket': { price: 28.0, available: true },
                'Flipkart Minutes': { price: 27.0, available: true },
                'Instamart': { price: 30.0, available: true }
            },
            alternatives: ['Smith & Jones Ginger Garlic Paste 100g - ₹25', 'Catch Ginger Garlic Paste 100g - ₹28']
        },
        {
            id: 'everest_garam_masala_100g',
            name: 'Everest Garam Masala Powder (100 g)',
            brand: 'Everest',
            category: 'Staples',
            unit: '100 g Box',
            img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 82.0, available: true },
                'Zepto': { price: 80.0, available: true },
                'BigBasket': { price: 78.0, available: true },
                'Flipkart Minutes': { price: 76.0, available: true },
                'Instamart': { price: 85.0, available: true }
            },
            alternatives: ['MDH Kitchen King Masala 100g - ₹82', 'Catch Super Garam Masala 100g - ₹78']
        },
        {
            id: 'everest_turmeric_100g',
            name: 'Everest Pure Turmeric (Haldi) Powder (100 g)',
            brand: 'Everest',
            category: 'Staples',
            unit: '100 g Box',
            img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 34.0, available: true },
                'Zepto': { price: 32.0, available: true },
                'BigBasket': { price: 30.0, available: true },
                'Flipkart Minutes': { price: 29.0, available: true },
                'Instamart': { price: 35.0, available: true }
            },
            alternatives: ['Tata Sampann Turmeric 100g - ₹36', 'Catch Turmeric Powder 100g - ₹32']
        },
        {
            id: 'everest_kashmiri_chilli_100g',
            name: 'Everest Kashmiri Lal Mirch Powder (100 g)',
            brand: 'Everest',
            category: 'Staples',
            unit: '100 g Box',
            img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 75.0, available: true },
                'Zepto': { price: 74.0, available: true },
                'BigBasket': { price: 72.0, available: true },
                'Flipkart Minutes': { price: 70.0, available: true },
                'Instamart': { price: 78.0, available: true }
            },
            alternatives: ['MDH Deggi Mirch 100g - ₹80', 'Tata Sampann Red Chilli 100g - ₹68']
        },
        {
            id: 'fresh_lemon_4s',
            name: 'Fresh Juicy Yellow Lemons (Nimbu) (Pack of 4)',
            brand: 'Farm Fresh',
            category: 'Vegetables',
            unit: 'Pack of 4',
            img: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=300&auto=format&fit=crop&q=80',
            prices: {
                'Blinkit': { price: 22.0, available: true },
                'Zepto': { price: 20.0, available: true },
                'BigBasket': { price: 18.0, available: true },
                'Flipkart Minutes': { price: 19.0, available: true },
                'Instamart': { price: 16.0, available: true }
            },
            alternatives: ['Fresh Lime 250g - ₹25', 'Organic Lemons Pack of 4 - ₹28']
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
