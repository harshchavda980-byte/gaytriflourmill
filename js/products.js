let cart = [];

function addToCart(name, price, qtyId) {
    let quantity = parseInt(document.getElementById(qtyId).value);

    let existing = cart.find(item => item.name === name);

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ name, price, quantity });
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

        cartItems.innerHTML += `
            <div>
                ${item.name} (${item.quantity}kg) - ₹${itemTotal}
                <button onclick="removeItem(${index})">❌</button>
            </div>
        `;
    });

    document.getElementById("cart-total").innerText = total;
}

function generateInvoice(e) {
    e.preventDefault();

    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(16);
    doc.text("Gaytri Flour Mill & Salt Suppliers", 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.text("Customer Name: " + document.getElementById("customerName").value, 20, y);
    y += 8;

    doc.text("Phone: " + document.getElementById("customerPhone").value, 20, y);
    y += 8;

    doc.text("Address: " + document.getElementById("customerAddress").value, 20, y);
    y += 12;

    doc.text("Order Details:", 20, y);
    y += 8;

    let total = 0;

    cart.forEach(item => {
        let itemTotal = item.price * item.quantity;
        total += itemTotal;

        doc.text(`${item.name} - ${item.quantity}kg - ₹${itemTotal}`, 20, y);
        y += 8;
    });

    y += 5;
    doc.text("Total Amount: ₹" + total, 20, y);

    doc.save("Gaytri_Order_Invoice.pdf");

    cart = [];
    updateCart();
}
