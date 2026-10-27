const BASE_URL = 'http://127.0.0.1:5050';

async function testFullOrderLifecycle() {
  console.log('🧪 Testing Full Order Lifecycle on Pure PostgreSQL...');

  // 1. Sign in as student
  const loginRes = await fetch(`${BASE_URL}/api/auth-helpers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email: 'student@vitstudent.ac.in', password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('1️⃣ Logged in student:', loginData.user.name, 'Credits:', loginData.user.credits.remaining);
  const token = loginData.token;

  // 2. Fetch menu
  const menuRes = await fetch(`${BASE_URL}/api/menu`);
  const menuData = await menuRes.json();
  const firstItem = menuData.items[0];
  console.log(`2️⃣ Selected Menu Item: ${firstItem.item_name} (Price: ${firstItem.price} credits, Stock: ${firstItem.available_quantity})`);

  // 3. Place order
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Origin': 'http://localhost:3000'
    },
    body: JSON.stringify({
      items: [{ itemId: firstItem.item_id, quantity: 2 }]
    })
  });
  const orderData = await orderRes.json();
  console.log('3️⃣ Order Response Status:', orderRes.status, 'Body:', JSON.stringify(orderData));

  if (orderData.order) {
    console.log('   Placed Order:', orderData.message, 'Remaining Credits:', orderData.order.remainingCredits);

    // 4. Cancel order and verify refund
    const cancelRes = await fetch(`${BASE_URL}/api/orders/${orderData.order.orderId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3000'
      }
    });
    const cancelData = await cancelRes.json();
    console.log('4️⃣ Cancelled Order:', cancelData.message, 'Balance after refund:', cancelData.result?.balanceAfter);
  }

  console.log('✅ PostgreSQL Order Test complete.');
}

testFullOrderLifecycle();
