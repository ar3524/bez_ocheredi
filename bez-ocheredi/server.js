const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Раздача фронтенда

// Имитация базы данных (в реальности: PostgreSQL)
let menu = [
    { id: 1, name: 'Курица с рисом', price: 190, stock: 15 },
    { id: 2, name: 'Суп куриный', price: 110, stock: 20 },
    { id: 3, name: 'Салат овощной', price: 95, stock: 10 },
    { id: 4, name: 'Морс', price: 65, stock: 30 }
];

let orders = [];
let orderCounter = 1042; // Начальный номер заказа из презентации

// 1. Получить актуальное меню
app.get('/api/menu', (req, res) => {
    res.json(menu);
});

// 2. Создать заказ (с резервированием остатков)
app.post('/api/orders', async (req, res) => {
    const { items, paymentMethod } = req.body; 
    // items = [{ id: 1, quantity: 2 }, ...]

    let total = 0;
    let orderItems = [];

    // Проверка остатков и расчет суммы
    for (const item of items) {
        const dish = menu.find(d => d.id === item.id);
        if (!dish || dish.stock < item.quantity) {
            return res.status(400).json({ error: `Блюда "${dish?.name || 'Неизвестно'}" не хватает на складе` });
        }
    }

    // Резервирование остатков (списание)
    for (const item of items) {
        const dish = menu.find(d => d.id === item.id);
        dish.stock -= item.quantity;
        total += dish.price * item.quantity;
        orderItems.push({ name: dish.name, quantity: item.quantity, price: dish.price });
    }

    // Создание заказа
    const orderId = orderCounter++;
    const newOrder = {
        id: orderId,
        items: orderItems,
        total,
        paymentMethod,
        status: paymentMethod === 'online' ? 'Оплачено' : 'Ожидает оплаты',
        createdAt: new Date()
    };
    orders.push(newOrder);

    // Генерация QR-кода (в реальности: токен с HMAC подписью)
    const qrData = JSON.stringify({ orderId: orderId, sum: total });
    const qrImage = await QRCode.toDataURL(qrData);

    res.json({ 
        success: true, 
        order: newOrder, 
        qrCode: qrImage 
    });
});

// 3. Эмуляция панели столовой (получить все заказы)
app.get('/api/kitchen/orders', (req, res) => {
    res.json(orders);
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});