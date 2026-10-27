import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

export async function seedPostgres() {
  if (!process.env.DATABASE_URL) return;

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    const checkItems = await client.query('SELECT COUNT(*) as count FROM menu_items');
    if (parseInt(checkItems.rows[0].count, 10) > 0) {
      console.log('✅ Neon DB already has menu items.');
      return;
    }

    console.log('🌱 Seeding initial menu items and demo users into Neon PostgreSQL...');
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash('password123', 10);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Insert Admin and Chef (Loaded from ADMIN_EMAIL & CHEF_EMAIL environment variables)
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@campus.internal').trim().toLowerCase();
    const chefEmail = (process.env.CHEF_EMAIL || 'chef@campus.internal').trim().toLowerCase();
    await client.query(`
      INSERT INTO admins (name, email, password_hash, role)
      VALUES 
        ('Admin Sarah Jenkins', $2, $1, 'admin'),
        ('Head Chef Marco Rossi', $3, $1, 'chef')
      ON CONFLICT (email) DO NOTHING
    `, [passwordHash, adminEmail, chefEmail]);

    // Insert Demo Students
    const studentRes = await client.query(`
      INSERT INTO students (name, email, phone, password_hash, room_number, status)
      VALUES 
        ('Rohit Sharma', 'student@vitstudent.ac.in', '+91-9876500001', $1, 'Hostel B-302', 'active'),
        ('Priya Patel', 'priya.patel2023@vitstudent.ac.in', '+91-9876500002', $1, 'Hostel A-108', 'active'),
        ('Alex Chen', 'alex.chen2024@vitstudent.ac.in', '+91-9876500003', $1, 'Hostel C-214', 'active')
      ON CONFLICT (email) DO NOTHING
      RETURNING student_id
    `, [passwordHash]);

    // Insert 9,000 credit allowances
    const studentsList = await client.query('SELECT student_id FROM students');
    for (const s of studentsList.rows) {
      await client.query(`
        INSERT INTO credits (student_id, monthly_limit, used_credits, remaining_credits, month, year)
        VALUES ($1, 9000, 0, 9000, $2, $3)
        ON CONFLICT (student_id, month, year) DO NOTHING
      `, [s.student_id, currentMonth, currentYear]);

      await client.query(`
        INSERT INTO transactions (student_id, order_id, amount, transaction_type, balance_after, notes)
        VALUES ($1, NULL, 9000, 'MONTHLY_ALLOWANCE', 9000, 'Initial 9,000 Monthly Credit Allowance')
      `, [s.student_id]);
    }

    // Insert 20 Menu Items
    const items = [
      ['Crispy Masala Dosa & Sambar', 'Breakfast', 90, 'Golden thin crepe served with spiced potato filling, lentil sambar, and fresh coconut chutney.', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80', 45],
      ['Classic Club Sandwich & Fries', 'Breakfast', 110, 'Triple-decker toasted sandwich with cheese, fresh veggies, lettuce, and golden crisp french fries.', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80', 30],
      ['Fluffy Pancakes with Maple Syrup', 'Breakfast', 95, 'Stack of 3 warm buttermilk pancakes drizzled with pure maple syrup and a dollop of butter.', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop&q=80', 25],
      ['Steamed Idli & Vada Combo', 'Breakfast', 75, 'Two soft steamed rice cakes and one crispy medu vada with spicy tomato & mint chutneys.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', 50],
      ['Royal Paneer Butter Masala Thali', 'Lunch', 180, 'Rich paneer in tomato gravy, dal tadka, jeera rice, 2 butter rotis, salad, and sweet gulab jamun.', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80', 60],
      ['Hyderabadi Dum Biryani Meal', 'Lunch', 210, 'Fragrant basmati rice slow-cooked with aromatic spices, served with cooling cucumber raita and spicy salan.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80', 40],
      ['Mediterranean Grilled Wrap', 'Lunch', 130, 'Grilled veggies, falafel, hummus, tangy pickles, and tahini wrapped in warm flatbread.', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80', 35],
      ['Executive Mess Deluxe Thali', 'Lunch', 160, 'Special seasonal vegetable curry, yellow dal, steamed rice, 3 rotis, curd, and roasted papad.', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80', 50],
      ['Crispy Samosa Platter (2 Pcs)', 'Snacks', 50, 'Deep-fried golden pastry pockets stuffed with spiced peas and potatoes, served with tamarind chutney.', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', 60],
      ['Campus Special Veg Burger', 'Snacks', 90, 'Crispy herb potato patty, cheddar slice, fresh tomato, crisp lettuce, and signature mess mayo sauce.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', 40],
      ['Cheesy Loaded Nachos', 'Snacks', 110, 'Crunchy tortilla chips smothered with warm cheese sauce, refried beans, jalapenos, and salsa.', 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80', 20],
      ['Paneer Kathi Roll', 'Snacks', 100, 'Spiced cottage cheese tikka cubes sautéed with bell peppers and rolled in flaky paratha.', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80', 30],
      ['Creamy Butter Chicken Curry with Naan', 'Dinner', 220, 'Tender chicken simmered in creamy velvet makhani sauce, paired with 2 garlic butter naans.', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80', 35],
      ['Dal Makhani & Garlic Naan Feast', 'Dinner', 170, 'Overnight slow-cooked black lentils in churned butter and cream, served with 2 crispy garlic naans.', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80', 45],
      ['Wok Tossed Hakka Noodles & Manchurian', 'Dinner', 150, 'Stir-fried noodles with crunchy vegetables served alongside spicy vegetable manchurian balls in dark gravy.', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80', 40],
      ['Tandoori Roti with Shahi Korma', 'Dinner', 160, 'Fragrant royal vegetable korma simmered with cashews, served with 3 clay oven rotis.', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80', 30],
      ['Iced Cold Coffee with Ice Cream', 'Beverages', 60, 'Thick blended espresso shake topped with a scoop of creamy vanilla ice cream and chocolate drizzle.', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80', 50],
      ['Special Masala Chai & Cookies', 'Beverages', 30, 'Freshly brewed aromatic tea infused with ginger, cardamom, and cinnamon, served with 2 butter cookies.', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', 80],
      ['Fresh Mango Sweet Lassi', 'Beverages', 65, 'Thick chilled Punjabi yogurt smoothie blended with sweet Alphonso mango pulp and saffron.', 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80', 35],
      ['Fresh Lemon Mint Cooler', 'Beverages', 45, 'Refreshing sparkling lemonade infused with crushed mint leaves and black salt.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80', 40]
    ];

    for (const [name, cat, price, desc, img, qty] of items) {
      await client.query(`
        INSERT INTO menu_items (item_name, category, price, description, image_url, available_quantity, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, 1)
      `, [name, cat, price, desc, img, qty]);
    }

    await client.query('COMMIT');
    console.log(`✅ Seeded ${items.length} dishes into Neon PostgreSQL!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding Neon error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed_postgres.js')) {
  seedPostgres().then(() => process.exit(0));
}
