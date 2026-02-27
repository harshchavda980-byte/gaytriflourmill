let cart = [];
let productsList = [];

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        productsList = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('dynamic-products-list').innerHTML = '<p style="text-align:center;width:100%;">Failed to load products. Please try again later.</p>';
    }
}

function renderProducts() {
    const container = document.getElementById('dynamic-products-list');
    container.innerHTML = '';

    if (productsList.length === 0) {
        container.innerHTML = '<p style="text-align:center;width:100%;">No products available at the moment.</p>';
        return;
    }

    productsList.forEach(product => {
        const imgPath = product.image_url ? product.image_url : 'images/logo.png';
        const isOutOfStock = product.stock_quantity <= 0;

        const cardHtml = `
            <div class="card">
                <img src="${imgPath}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="prod-desc" style="font-size: 14px; color: #666; margin-bottom: 8px;">${product.description || ''}</p>
                <p>₹${product.price} <small style="color:red;">(${product.stock_quantity || 0} in stock)</small></p>
                
                ${isOutOfStock ? `
                    <p style="color:red; font-weight:bold; margin-top:15px;">Out of Stock</p>
                ` : `
                    <div class="qty-control">
                        <button type="button" onclick="changeQty('qty-${product.id}', -1, ${product.stock_quantity})" class="qty-btn">-</button>
                        <input type="number" id="qty-${product.id}" value="1" min="1" max="${product.stock_quantity}" readonly>
                        <button type="button" onclick="changeQty('qty-${product.id}', 1, ${product.stock_quantity})" class="qty-btn">+</button>
                    </div>
                    <button class="add-cart-btn" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, 'qty-${product.id}', ${product.stock_quantity})">Add to Cart</button>
                `}
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

function changeQty(inputId, change, maxStock) {
    const input = document.getElementById(inputId);
    let currentVal = parseInt(input.value);
    let newVal = currentVal + change;

    // Ensure value doesn't go below 1 or above max stock limits
    if (newVal >= 1 && newVal <= maxStock) {
        input.value = newVal;
    }
}

function addToCart(id, name, price, qtyId, maxStock) {
    let quantity = parseInt(document.getElementById(qtyId).value);

    let existing = cart.find(item => item.id === id);
    let currentCartQty = existing ? existing.quantity : 0;

    if (currentCartQty + quantity > maxStock) {
        alert(`Cannot add more. We only have ${maxStock} units of ${name} in stock.`);
        return;
    }

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id, name, price, quantity });
    }

    updateCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

function updateCart() {
    let cartItems = document.getElementById("cart-items");
    let total = 0;
    cartItems.innerHTML = "";

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        total += itemTotal;

        const row = document.createElement('div');
        row.innerHTML = `
            <span>${item.name} (${item.quantity}) - ₹${itemTotal}</span>
            <button onclick="removeItem(${index})" style="background:red;color:white;border:none;border-radius:3px;cursor:pointer;padding:2px 5px;">❌</button>
        `;
        cartItems.appendChild(row);
    });

    document.getElementById("cart-total").innerText = total;
}

async function generateInvoice(e) {
    e.preventDefault();

    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    const customerName = document.getElementById("customerName").value;
    const customerPhone = document.getElementById("customerPhone").value;
    const customerAddress = document.getElementById("customerAddress").value;
    const totalAmount = parseFloat(document.getElementById("cart-total").innerText);

    // Save order to backend
    const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        total_amount: totalAmount,
        cartItems: cart
    };

    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok) {
            // Generate PDF only if backend save is successful
            createPDF(customerName, customerPhone, customerAddress, totalAmount, result.orderId);
            alert('Order placed successfully!');
            cart = [];
            updateCart();
            document.getElementById("customerName").value = '';
            document.getElementById("customerPhone").value = '';
            document.getElementById("customerAddress").value = '';
            loadProducts(); // Update product list to show new stock
        } else {
            alert(result.error || 'Failed to process order.');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Server error connecting to checkout.');
    }
}

function createPDF(name, phone, address, total, orderId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- Colors ---
    const primaryColor = [139, 0, 0]; // Dark Red/Maroon
    const lightGray = [240, 240, 240];
    const darkGray = [80, 80, 80];

    // --- Header Banner ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("GAYTRI FLOUR MILL", 20, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("& Salt Suppliers", 20, 30);

    doc.setFontSize(20);
    doc.text("INVOICE", pageWidth - 20, 22, { align: "right" });

    doc.setFontSize(10);
    doc.text(`Order: #${orderId}`, pageWidth - 20, 30, { align: "right" });

    // --- Customer Information ---
    doc.setTextColor(0, 0, 0);
    let y = 55;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Billed To:", 20, y);
    y += 7;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(name, 20, y);
    y += 6;
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text("Phone: " + phone, 20, y);
    y += 6;

    const splitAddress = doc.splitTextToSize("Address: " + address, 100);
    doc.text(splitAddress, 20, y);
    y += (splitAddress.length * 6) + 12;

    // --- Table Header ---
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(20, y, pageWidth - 40, 10, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 25, y + 7);
    doc.text("Price", 110, y + 7);
    doc.text("Qty", 145, y + 7);
    doc.text("Total", 185, y + 7, { align: "right" });

    y += 15;

    // --- Table Content ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    cart.forEach(item => {
        let itemTotal = item.price * item.quantity;

        doc.text(item.name, 25, y);
        doc.text(`Rs. ${item.price.toFixed(2)}`, 110, y);
        doc.text(`${item.quantity}`, 145, y);
        doc.text(`Rs. ${itemTotal.toFixed(2)}`, 185, y, { align: "right" });

        // Subtle line separator
        doc.setDrawColor(220, 220, 220);
        doc.line(20, y + 3, pageWidth - 20, y + 3);

        y += 10;

        // Add new page if list gets too long
        if (y > 250) {
            doc.addPage();
            y = 30;
        }
    });

    // --- Total Summary ---
    y += 10;

    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(120, y - 5, 70, 20, 'F');

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Total Amount:", 125, y + 7);

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.text(`Rs. ${total.toFixed(2)}`, 185, y + 7, { align: "right" });

    // --- Footer Notes ---
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Payment Information:", 20, y + 25);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("UPI: gaytriflour@upi", 20, y + 30);
    doc.text("Bank: State Bank of India", 20, y + 35);

    doc.setFontSize(10);
    doc.text("Thank you for your business!", pageWidth / 2, 280, { align: "center" });

    doc.save("Gaytri_Order_" + orderId + ".pdf");
}
