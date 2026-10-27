let menuData = [];
let cart = [];

// Загрузка меню при старте
async function loadMenu() {
    const res = await fetch('/api/menu');
    menuData = await res.json();
    
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = '';
    
    menuData.forEach(dish => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `
            <div>
                <strong>${dish.name}</strong><br>
                ${dish.price} ₽ (Осталось: ${dish.stock})
            </div>
            <button class="add-btn" onclick="addToCart(${dish.id})">+</button>
        `;
        menuList.appendChild(div);
    });
}

function addToCart(id) {
    const dish = menuData.find(d => d.id === id);
    if (dish.stock <= 0) return alert('Нет в наличии!');

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id: id, name: dish.name, price: dish.price, quantity: 1 });
    }
    dish.stock--; // Визуальное списание
    renderCart();
    loadMenu(); // Перерисовка остатков
}

function renderCart() {
    const cartDiv = document.getElementById('cart-items');
    cartDiv.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        const p = document.createElement('p');
        p.innerText = `${item.name} x ${item.quantity} = ${item.price * item.quantity} ₽`;
        cartDiv.appendChild(p);
    });
    
    document.getElementById('total-price').innerText = `Итого: ${total} ₽`;
}

async function checkout(paymentMethod) {
    if (cart.length === 0) return alert('Корзина пуста');

    const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            items: cart.map(c => ({ id: c.id, quantity: c.quantity })), 
            paymentMethod 
        })
    });

    const data = await res.json();
    
    if (data.success) {
        document.getElementById('order-details').innerText = 
            `Заказ №${data.order.id} • Сумма: ${data.order.total} ₽ • Статус: ${data.order.status}`;
        document.getElementById('qr-image').src = data.qrCode;
        document.getElementById('qr-modal').classList.remove('hidden');
        
        cart = [];
        renderCart();
        loadMenu();
    } else {
        alert(data.error);
    }
}

function closeModal() {
    document.getElementById('qr-modal').classList.add('hidden');
}

// Инициализация
loadMenu();