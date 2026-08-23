import bcrypt from 'bcryptjs';
import db from './database.js';

export async function seedDatabase() {
  console.log('🌱 Starting Database Seeding...');
  const passwordHash = await bcrypt.hash('password123', 10);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const seedTransaction = db.transaction(() => {
    // 1. Clear existing data in correct order
    db.exec(`
      DELETE FROM order_items;
      DELETE FROM transactions;
      DELETE FROM orders;
      DELETE FROM credits;
      DELETE FROM menu_items;
      DELETE FROM students;
      DELETE FROM admins;
    `);

    // 2. Insert Admins and Chef
    const insertAdmin = db.prepare(`
      INSERT INTO admins (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    insertAdmin.run('Admin Sarah Jenkins', 'admin@campus.edu', passwordHash, 'admin');
    insertAdmin.run('Head Chef Marco Rossi', 'chef@campus.edu', passwordHash, 'chef');

    // 3. Insert Students
    const insertStudent = db.prepare(`
      INSERT INTO students (name, email, phone, password_hash, room_number, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const s1 = insertStudent.run('Rohit Sharma', 'student@vitstudent.ac.in', '+91-9876500001', passwordHash, 'Hostel B-302', 'active');
    const s2 = insertStudent.run('Priya Patel', 'priya.patel2023@vitstudent.ac.in', '+91-9876500002', passwordHash, 'Hostel A-108', 'active');
    const s3 = insertStudent.run('Alex Chen', 'alex.chen2024@vitstudent.ac.in', '+91-9876500003', passwordHash, 'Hostel C-214', 'active');
    const s4 = insertStudent.run('Arjun Kumar', 'arjun2025@vitstudent.ac.in', '+91-9876500004', passwordHash, 'Hostel B-105', 'active');

    // 4. Insert Credits for each student (9,000 allowance)
    const insertCredit = db.prepare(`
      INSERT INTO credits (student_id, monthly_limit, used_credits, remaining_credits, month, year)
      VALUES (?, 9000, 0, 9000, ?, ?)
    `);

    const insertTransaction = db.prepare(`
      INSERT INTO transactions (student_id, order_id, amount, transaction_type, balance_after, notes)
      VALUES (?, NULL, 9000, 'MONTHLY_ALLOWANCE', 9000, ?)
    `);

    const studentIds = [s1.lastInsertRowid, s2.lastInsertRowid, s3.lastInsertRowid, s4.lastInsertRowid];
    studentIds.forEach(id => {
      insertCredit.run(id, currentMonth, currentYear);
      insertTransaction.run(id, `Initial credit allocation for ${now.toLocaleString('default', { month: 'long' })} ${currentYear}`);
    });

    // 5. Insert Delicious Menu Items with realistic images & stock
    const insertMenuItem = db.prepare(`
      INSERT INTO menu_items (item_name, category, price, description, image_url, available_quantity, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const items = [
      // Breakfast
      {
        name: 'Crispy Masala Dosa & Sambar',
        category: 'Breakfast',
        price: 90,
        desc: 'Golden thin crepe served with spiced potato filling, lentil sambar, and fresh coconut chutney.',
        img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
        qty: 45
      },
      {
        name: 'Classic Club Sandwich & Fries',
        category: 'Breakfast',
        price: 110,
        desc: 'Triple-decker toasted sandwich with cheese, fresh veggies, lettuce, and golden crisp french fries.',
        img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
        qty: 30
      },
      {
        name: 'Fluffy Pancakes with Maple Syrup',
        category: 'Breakfast',
        price: 95,
        desc: 'Stack of 3 warm buttermilk pancakes drizzled with pure maple syrup and a dollop of butter.',
        img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop&q=80',
        qty: 25
      },
      {
        name: 'Steamed Idli & Vada Combo',
        category: 'Breakfast',
        price: 75,
        desc: 'Two soft steamed rice cakes and one crispy medu vada with spicy tomato & mint chutneys.',
        img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
        qty: 50
      },

      // Lunch
      {
        name: 'Royal Paneer Butter Masala Thali',
        category: 'Lunch',
        price: 180,
        desc: 'Rich paneer in tomato gravy, dal tadka, jeera rice, 2 butter rotis, salad, and sweet gulab jamun.',
        img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
        qty: 60
      },
      {
        name: 'Hyderabadi Dum Biryani Meal',
        category: 'Lunch',
        price: 210,
        desc: 'Fragrant basmati rice slow-cooked with aromatic spices, served with cooling cucumber raita and spicy salan.',
        img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        qty: 40
      },
      {
        name: 'Mediterranean Grilled Wrap',
        category: 'Lunch',
        price: 130,
        desc: 'Grilled veggies, falafel, hummus, tangy pickles, and tahini wrapped in warm flatbread.',
        img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80',
        qty: 35
      },
      {
        name: 'Executive Mess Deluxe Thali',
        category: 'Lunch',
        price: 160,
        desc: 'Special seasonal vegetable curry, yellow dal, steamed rice, 3 rotis, curd, and roasted papad.',
        img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
        qty: 50
      },

      // Snacks
      {
        name: 'Crispy Samosa Platter (2 Pcs)',
        category: 'Snacks',
        price: 50,
        desc: 'Deep-fried golden pastry pockets stuffed with spiced peas and potatoes, served with tamarind chutney.',
        img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
        qty: 60
      },
      {
        name: 'Campus Special Veg Burger',
        category: 'Snacks',
        price: 90,
        desc: 'Crispy herb potato patty, cheddar slice, fresh tomato, crisp lettuce, and signature mess mayo sauce.',
        img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        qty: 40
      },
      {
        name: 'Cheesy Loaded Nachos',
        category: 'Snacks',
        price: 110,
        desc: 'Crunchy tortilla chips smothered with warm cheese sauce, refried beans, jalapenos, and salsa.',
        img: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80',
        qty: 20
      },
      {
        name: 'Paneer Kathi Roll',
        category: 'Snacks',
        price: 100,
        desc: 'Spiced cottage cheese tikka cubes sautéed with bell peppers and rolled in flaky paratha.',
        img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80',
        qty: 30
      },

      // Dinner
      {
        name: 'Creamy Butter Chicken Curry with Naan',
        category: 'Dinner',
        price: 220,
        desc: 'Tender chicken simmered in creamy velvet makhani sauce, paired with 2 garlic butter naans.',
        img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
        qty: 35
      },
      {
        name: 'Dal Makhani & Garlic Naan Feast',
        category: 'Dinner',
        price: 170,
        desc: 'Overnight slow-cooked black lentils in churned butter and cream, served with 2 crispy garlic naans.',
        img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
        qty: 45
      },
      {
        name: 'Wok Tossed Hakka Noodles & Manchurian',
        category: 'Dinner',
        price: 150,
        desc: 'Stir-fried noodles with crunchy vegetables served alongside spicy vegetable manchurian balls in dark gravy.',
        img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
        qty: 40
      },
      {
        name: 'Tandoori Roti with Shahi Korma',
        category: 'Dinner',
        price: 160,
        desc: 'Fragrant royal vegetable korma simmered with cashews, served with 3 clay oven rotis.',
        img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
        qty: 30
      },

      // Beverages
      {
        name: 'Iced Cold Coffee with Ice Cream',
        category: 'Beverages',
        price: 60,
        desc: 'Thick blended espresso shake topped with a scoop of creamy vanilla ice cream and chocolate drizzle.',
        img: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
        qty: 50
      },
      {
        name: 'Special Masala Chai & Cookies',
        category: 'Beverages',
        price: 30,
        desc: 'Freshly brewed aromatic tea infused with ginger, cardamom, and cinnamon, served with 2 butter cookies.',
        img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
        qty: 80
      },
      {
        name: 'Fresh Mango Sweet Lassi',
        category: 'Beverages',
        price: 65,
        desc: 'Thick chilled Punjabi yogurt smoothie blended with sweet Alphonso mango pulp and saffron.',
        img: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80',
        qty: 35
      },
      {
        name: 'Fresh Lemon Mint Cooler',
        category: 'Beverages',
        price: 45,
        desc: 'Refreshing sparkling lemonade infused with crushed mint leaves and black salt.',
        img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
        qty: 40
      }
    ];

    items.forEach(item => {
      insertMenuItem.run(item.name, item.category, item.price, item.desc, item.img, item.qty, 1);
    });

    console.log(`✅ Seeded ${studentIds.length} students, 2 admins/chefs, and ${items.length} menu items.`);
  });

  seedTransaction();
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('🌱 Seeding complete.');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Seeding error:', err);
      process.exit(1);
    });
}
