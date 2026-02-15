let cart = [];

function toggleMenu(){
  document.getElementById("nav-links").classList.toggle("active");
}

function addToCart(name, price){
  cart.push({name, price});
  updateCart();
}

function updateCart(){
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach(item=>{
    total += item.price;
    cartItems.innerHTML += `<p>${item.name} - ₹${item.price}</p>`;
  });

  cartTotal.innerText = total;
}

function generateInvoice(e){
  e.preventDefault();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(16);
  doc.text("Gaytri Flour Mill & Salt Suppliers", 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text("Customer Details:", 20, y);
  y += 8;

  doc.text("Name: " + document.getElementById("customerName").value, 20, y);
  y += 8;
  doc.text("Phone: " + document.getElementById("customerPhone").value, 20, y);
  y += 8;
  doc.text("Address: " + document.getElementById("customerAddress").value, 20, y);
  y += 10;

  doc.text("Order Summary:", 20, y);
  y += 8;

  let total = 0;

  cart.forEach(item=>{
    doc.text(item.name + " - ₹" + item.price, 20, y);
    total += item.price;
    y += 8;
  });

  y += 5;
  doc.text("Total Amount: ₹" + total, 20, y);

  doc.save("Order_Invoice.pdf");
}
