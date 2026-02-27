require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gaytriflourmill_secret_key_123';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gaytriflourmill_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ', err);
    } else {
        console.log('Connected to MySQL database');

        // Ensure table exists
        const createContactsTable = `
        CREATE TABLE IF NOT EXISTS contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

        const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('user', 'admin') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

        const createProductsTable = `
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            image_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

        const createOrdersTable = `
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_name VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(50) NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

        const createOrderItemsTable = `
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )`;

        db.query(createContactsTable, (err) => {
            if (err) console.error('Error creating contacts table: ', err);
            else console.log('Contacts table ready');
        });

        db.query(createProductsTable, (err) => {
            if (err) console.error('Error creating products table: ', err);
            else console.log('Products table ready');
        });

        db.query(createOrdersTable, (err) => {
            if (err) console.error('Error creating orders table: ', err);
            else {
                console.log('Orders table ready');
                db.query(createOrderItemsTable, (err) => {
                    if (err) console.error('Error creating order_items table: ', err);
                    else console.log('Order Items table ready');
                });
            }
        });

        db.query(createUsersTable, async (err) => {
            if (err) console.error('Error creating users table: ', err);
            else {
                console.log('Users table ready');
                // Seed a default admin if non exists
                db.query("SELECT * FROM users WHERE role = 'admin'", async (err, results) => {
                    if (!err && results.length === 0) {
                        const hashedPW = await bcrypt.hash('admin123', 10);
                        db.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                            ['Administrator', 'admin@example.com', hashedPW, 'admin']);
                    }
                });
            }
        });
        db.query("SHOW COLUMNS FROM products LIKE 'stock_quantity'", (err, results) => {
            if (!err && results.length === 0) {
                db.query("ALTER TABLE products ADD COLUMN stock_quantity INT DEFAULT 0", (err) => {
                    if (err) console.error("Error adding stock_quantity to products:", err);
                    else console.log("Added stock_quantity column to products");
                });
            }
        });

        db.query("SHOW COLUMNS FROM orders LIKE 'customer_address'", (err, results) => {
            if (!err && results.length === 0) {
                db.query("ALTER TABLE orders ADD COLUMN customer_address TEXT", (err) => {
                    if (err) console.error("Error adding customer_address to orders:", err);
                    else console.log("Added customer_address column to orders");
                });
            }
        });

        db.query("SHOW COLUMNS FROM order_items LIKE 'product_name'", (err, results) => {
            if (!err && results.length === 0) {
                db.query("ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255)", (err) => {
                    if (err) console.error("Error adding product_name to order_items:", err);
                    else console.log("Added product_name column to order_items");
                });
            }
        });

        db.query("SHOW COLUMNS FROM orders LIKE 'user_id'", (err, results) => {
            if (!err && results.length === 0) {
                db.query("ALTER TABLE orders ADD COLUMN user_id INT NULL, ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL", (err) => {
                    if (err) console.error("Error adding user_id to orders:", err);
                    else console.log("Added user_id column to orders");
                });
            }
        });
    }
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
// API Endpoint for Contact Form
app.post('/api/contact', (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Save to database
    const query = 'INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)';
    db.query(query, [name, email, phone, message], (err, result) => {
        if (err) {
            console.error('Error inserting into database: ', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Sending to the same user as requested
            subject: `New Contact Form Submission from ${name}`,
            text: `You have received a new message from your website contact form.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage:\n${message}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email: ', error);
                // Even if email fails, we return success because data was saved
                return res.status(200).json({ success: true, message: 'Message saved but email failed to send.' });
            }
            res.status(200).json({ success: true, message: 'Message sent and saved successfully!' });
        });
    });
});

// ==========================================
// AUTHENTICATION API ENDPOINTS
// ==========================================

// Register New User
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        // Check if user already exists
        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error checking email' });

            if (results.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert new user
            db.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
                [name, email, hashedPassword],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Database error creating user' });
                    res.status(201).json({ success: true, message: 'User registered successfully!' });
                });
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login User
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = results[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Create JWT Payload
        const payload = {
            id: user.id,
            name: user.name,
            role: user.role
        };

        // Sign Token
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '7d' }, // Token expires in 7 days
            (err, token) => {
                if (err) throw err;
                res.status(200).json({
                    success: true,
                    token: token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            }
        );
    });
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        // Just for attaching user info optionally on checkout, don't return 401 if it's explicitly allowed to be null
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null; // Token invalid
        } else {
            req.user = user;
        }
        next();
    });
};

// Middleware to require auth strictly
const requireAuth = (req, res, next) => {
    verifyToken(req, res, () => {
        if (!req.user) return res.status(401).json({ error: 'Access Denied: No valid token provided' });
        next();
    });
};

// Middleware to require admin strictly
const requireAdmin = (req, res, next) => {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access Denied: You do not have admin permissions' });
        }
        next();
    });
};

// ==========================================
// ADMIN & PRODUCTS API ENDPOINTS
// ==========================================

// Get all contacts (for Admin Panel)
app.get('/api/contacts', requireAdmin, (req, res) => {
    db.query('SELECT * FROM contacts ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error fetching contacts' });
        res.status(200).json(results);
    });
});

// Get all products
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error fetching products' });
        res.status(200).json(results);
    });
});

// Add a new product (with image upload)
app.post('/api/products', requireAdmin, upload.single('image'), (req, res) => {
    const { name, description, price, stock_quantity } = req.body;
    let image_url = null;

    if (req.file) {
        image_url = '/uploads/' + req.file.filename;
    }

    if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required' });
    }

    const stock = stock_quantity ? parseInt(stock_quantity) : 0;

    const query = 'INSERT INTO products (name, description, price, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, description, price, stock, image_url], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error adding product' });
        res.status(201).json({ success: true, message: 'Product added successfully', id: result.insertId });
    });
});

// Edit an existing product (with optional image upload)
app.put('/api/products/:id', requireAdmin, upload.single('image'), (req, res) => {
    const productId = req.params.id;
    const { name, description, price, stock_quantity } = req.body;
    let image_url = null;
    let query = '';
    let queryParams = [];

    if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required' });
    }

    const stock = stock_quantity ? parseInt(stock_quantity) : 0;

    if (req.file) {
        image_url = '/uploads/' + req.file.filename;
        query = 'UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ?, image_url = ? WHERE id = ?';
        queryParams = [name, description, price, stock, image_url, productId];

        // Delete old image if it exists
        db.query('SELECT image_url FROM products WHERE id = ?', [productId], (err, results) => {
            if (!err && results.length > 0 && results[0].image_url) {
                const oldImagePath = path.join(__dirname, results[0].image_url);
                if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
            }
        });
    } else {
        query = 'UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ? WHERE id = ?';
        queryParams = [name, description, price, stock, productId];
    }

    db.query(query, queryParams, (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error updating product' });
        res.status(200).json({ success: true, message: 'Product updated successfully' });
    });
});

// Delete a product
app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const productId = req.params.id;

    // First get the product to delete the image file if it exists
    db.query('SELECT image_url FROM products WHERE id = ?', [productId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length > 0 && results[0].image_url) {
            const imagePath = path.join(__dirname, results[0].image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Delete the file
            }
        }

        // Delete from database
        db.query('DELETE FROM products WHERE id = ?', [productId], (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error deleting product' });
            res.status(200).json({ success: true, message: 'Product deleted successfully' });
        });
    });
});

// Checkout / Place Order
app.post('/api/checkout', verifyToken, (req, res) => {
    const { customer_name, customer_phone, customer_address, total_amount, cartItems } = req.body;
    const user_id = req.user ? req.user.id : null; // Link order if user is logged in

    if (!customer_name || !customer_phone || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: 'Missing required order information' });
    }

    // Start transaction
    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ error: 'Transaction error' });

        // Insert Order
        const orderQuery = 'INSERT INTO orders (customer_name, customer_phone, customer_address, total_amount, status, user_id) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(orderQuery, [customer_name, customer_phone, customer_address, total_amount, 'Pending', user_id], (err, orderResult) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ error: 'Failed to create order' });
                });
            }

            const orderId = orderResult.insertId;

            // Insert Order Items
            const itemsQuery = 'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES ?';
            const values = cartItems.map(item => [orderId, item.id, item.name, item.quantity, item.price]);

            db.query(itemsQuery, [values], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Failed to add order items' });
                    });
                }

                // Decrement stock for each item
                let updateErrors = false;
                let queriesCompleted = 0;

                cartItems.forEach(item => {
                    db.query('UPDATE products SET stock_quantity = GREATEST(stock_quantity - ?, 0) WHERE id = ?', [item.quantity, item.id], (err) => {
                        if (err) updateErrors = true;

                        queriesCompleted++;
                        if (queriesCompleted === cartItems.length) {
                            if (updateErrors) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Failed to update stock' });
                                });
                            }

                            // Commit transaction
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ error: 'Failed to commit order' });
                                    });
                                }
                                res.status(200).json({ success: true, message: 'Order placed successfully', orderId: orderId });
                            });
                        }
                    });
                });
            });
        });
    });
});

// Get all orders (for Admin Panel)
app.get('/api/orders', requireAdmin, (req, res) => {
    const query = `
        SELECT o.*, 
               oi.product_id, 
               oi.product_name, 
               oi.quantity, 
               oi.price as item_price
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        ORDER BY o.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ error: 'Database error fetching orders' });
        }

        // Group items by order in JavaScript since JSON_ARRAYAGG is not supported in this MySQL version
        const ordersMap = new Map();

        results.forEach(row => {
            if (!ordersMap.has(row.id)) {
                ordersMap.set(row.id, {
                    id: row.id,
                    customer_name: row.customer_name,
                    customer_phone: row.customer_phone,
                    customer_address: row.customer_address,
                    total_amount: row.total_amount,
                    status: row.status,
                    created_at: row.created_at,
                    items: []
                });
            }

            if (row.product_id) { // Ensure there is an item
                ordersMap.get(row.id).items.push({
                    product_id: row.product_id,
                    product_name: row.product_name,
                    quantity: row.quantity,
                    price: row.item_price
                });
            }
        });

        // Convert Map to array, items is now an array of objects
        // However, admin.js expects o.items to be a JSON string. So we stringify it.
        const finalOrders = Array.from(ordersMap.values()).map(o => {
            o.items = JSON.stringify(o.items);
            return o;
        });

        res.status(200).json(finalOrders);
    });
});

// Get user specific orders (for User Profile)
app.get('/api/user/orders', requireAuth, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT o.*, 
               oi.product_id, 
               oi.product_name, 
               oi.quantity, 
               oi.price as item_price
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user orders:', err);
            return res.status(500).json({ error: 'Database error fetching your orders' });
        }

        const ordersMap = new Map();

        results.forEach(row => {
            if (!ordersMap.has(row.id)) {
                ordersMap.set(row.id, {
                    id: row.id,
                    total_amount: row.total_amount,
                    status: row.status,
                    created_at: row.created_at,
                    items: []
                });
            }

            if (row.product_id) {
                ordersMap.get(row.id).items.push({
                    product_id: row.product_id,
                    product_name: row.product_name,
                    quantity: row.quantity,
                    price: row.item_price
                });
            }
        });

        const finalOrders = Array.from(ordersMap.values()).map(o => {
            o.items = JSON.stringify(o.items);
            return o;
        });

        res.status(200).json(finalOrders);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
