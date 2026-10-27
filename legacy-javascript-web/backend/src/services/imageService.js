import db from '../db/database.js';

export const GENERIC_FOOD_PLACEHOLDER = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';

// High-resolution verified food image pools for campus mess & Indian cuisine
const FOOD_IMAGE_CATALOG = [
  // Biryani & Rice Dishes
  {
    keywords: ['biryani', 'pulao', 'dum biryani', 'fried rice', 'jeera rice', 'khichdi'],
    images: [
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80'
    ]
  },
  // South Indian: Dosa, Idli, Vada, Uttapam
  {
    keywords: ['dosa', 'masala dosa', 'ghee roast', 'paper dosa', 'uttapam'],
    images: [
      'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1694665435967-ec6b89694200?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    keywords: ['idli', 'vada', 'sambar', 'medu vada', 'idli sambar'],
    images: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80'
    ]
  },
  // Paneer, Curries & Gravies
  {
    keywords: ['paneer', 'butter masala', 'shahi paneer', 'kadai paneer', 'tikka masala', 'curry', 'gravy', 'korma'],
    images: [
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80'
    ]
  },
  // Breads: Roti, Naan, Paratha, Kulcha
  {
    keywords: ['naan', 'roti', 'paratha', 'butter naan', 'tandoori', 'kulcha', 'aloo paratha'],
    images: [
      'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=800&auto=format&fit=crop&q=80'
    ]
  },
  // Dal & Lentils
  {
    keywords: ['dal', 'dal makhani', 'tadka', 'dal tadka', 'chana', 'rajma', 'chole', 'bhature'],
    images: [
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1626777553635-be349e54d8b5?w=800&auto=format&fit=crop&q=80'
    ]
  },
  // Snacks, Samosa, Chaat, Sandwiches, Burgers
  {
    keywords: ['samosa', 'chaat', 'kachori', 'pakora', 'bhaji', 'cutlet', 'tikki'],
    images: [
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    keywords: ['burger', 'sandwich', 'wrap', 'roll', 'frankie', 'grilled', 'toast'],
    images: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80'
    ]
  },
  // Noodles & Pasta
  {
    keywords: ['noodles', 'pasta', 'chowmein', 'hakka', 'macaroni', 'spaghetti'],
    images: [
      'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80'
    ]
  },
  // Breakfast & Light Meals
  {
    keywords: ['poha', 'upma', 'pancakes', 'omelette', 'eggs', 'puri', 'poori'],
    images: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80'
    ]
  },
  // Beverages: Chai, Coffee, Lassi, Juice, Shakes
  {
    keywords: ['tea', 'chai', 'coffee', 'lassi', 'juice', 'shake', 'smoothie', 'beverage', 'drink'],
    images: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80'
    ]
  },
  // Indian Thali & Full Meal
  {
    keywords: ['thali', 'meal', 'platter', 'feast', 'combo', 'dinner', 'lunch'],
    images: [
      'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80'
    ]
  }
];

// Fallbacks by Category
const CATEGORY_FALLBACKS = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop&q=80',
  lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  snacks: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
  dinner: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
  beverages: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80'
};

export const imageService = {
  /**
   * Resolve a high-quality food photo for a dish based on name and category.
   * @param {string} itemName - Name of the dish
   * @param {string} category - Category / meal time
   * @param {number} [variantIndex=0] - Optional variant offset for cycling/refresh
   * @returns {string} Image URL
   */
  resolveDishImage(itemName = '', category = '', variantIndex = 0) {
    const cleanName = (itemName || '').toLowerCase().trim();
    const cleanCategory = (category || '').toLowerCase().trim();

    if (!cleanName && !cleanCategory) {
      return GENERIC_FOOD_PLACEHOLDER;
    }

    // 1. Check keyword catalog matches
    for (const entry of FOOD_IMAGE_CATALOG) {
      const isMatch = entry.keywords.some(kw => 
        cleanName.includes(kw) || cleanCategory.includes(kw)
      );

      if (isMatch && entry.images.length > 0) {
        const idx = Math.abs(variantIndex) % entry.images.length;
        return entry.images[idx];
      }
    }

    // 2. Fall back to Category match
    if (CATEGORY_FALLBACKS[cleanCategory]) {
      return CATEGORY_FALLBACKS[cleanCategory];
    }

    // 3. Global Generic Fallback
    return GENERIC_FOOD_PLACEHOLDER;
  },

  /**
   * Re-fetch and update an auto-fetched image for a dish in the database.
   */
  async refreshDishImage(itemId) {
    const numId = parseInt(itemId, 10);
    const item = await db.get('SELECT item_id, item_name, category, fallback_image_url FROM menu_items WHERE item_id = ?', numId);
    
    if (!item) {
      throw new Error('Menu item not found.');
    }

    // Find current variant index to pick the next one in the pool
    const newImage = this.resolveDishImage(item.item_name, item.category, Math.floor(Math.random() * 5) + 1);

    await db.run(
      'UPDATE menu_items SET fallback_image_url = ? WHERE item_id = ?',
      newImage,
      numId
    );

    return {
      itemId: numId,
      fallbackImageUrl: newImage,
      displayImageUrl: newImage
    };
  }
};
