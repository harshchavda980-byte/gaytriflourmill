const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gaytriflourmill'
});

db.connect((err) => {
    if (err) throw err;
    const query = `
        SELECT o.*, 
        JSON_ARRAYAGG(
            JSON_OBJECT('product_id', oi.product_id, 'product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price)
        ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `;
    db.query(query, (err, results) => {
        console.log(err || "Success");
        process.exit(0);
    });
});
