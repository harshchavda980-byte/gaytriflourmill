document.addEventListener('DOMContentLoaded', () => {

    // Tab Switching Logic
    const links = document.querySelectorAll('.tab-link');
    const panels = document.querySelectorAll('.panel');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active classes
            links.forEach(l => l.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            // Add active to clicked log
            link.classList.add('active');
            const target = link.getAttribute('data-target');
            document.getElementById(target).classList.add('active');

            // Load specific data depending on tab
            if (target === 'productsPanel') loadProducts();
            if (target === 'messagesPanel') loadMessages();
            if (target === 'ordersPanel') loadOrders();
        });
    });

    // Initial Load for Dashboard Stats
    loadDashboardStats();

    // Setup Add Product Form Listener
    const productForm = document.getElementById('newProductForm');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('name', document.getElementById('prodName').value);
            formData.append('description', document.getElementById('prodDesc').value);
            formData.append('price', document.getElementById('prodPrice').value);
            formData.append('stock_quantity', document.getElementById('prodStock').value);

            const imageFile = document.getElementById('prodImage').files[0];
            if (imageFile) formData.append('image', imageFile);

            try {
                const response = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                    body: formData // Note: no Content-Type header when sending FormData
                });

                const result = await response.json();
                if (response.ok) {
                    alert('Product added successfully!');
                    productForm.reset();
                    toggleAddProductForm(); // Hide form
                    loadProducts(); // Refresh list
                    loadDashboardStats(); // Refresh stats
                } else {
                    alert(result.error || 'Failed to add product');
                }
            } catch (err) {
                console.error(err);
                alert('Server error while adding product');
            }
        });
    }

    // Setup Edit Product Form Listener
    const editForm = document.getElementById('updateProductForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('editProdId').value;
            const formData = new FormData();
            formData.append('name', document.getElementById('editProdName').value);
            formData.append('description', document.getElementById('editProdDesc').value);
            formData.append('price', document.getElementById('editProdPrice').value);
            formData.append('stock_quantity', document.getElementById('editProdStock').value);

            const imageFile = document.getElementById('editProdImage').files[0];
            if (imageFile) formData.append('image', imageFile);

            try {
                const response = await fetch(`/api/products/${id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                    body: formData
                });

                const result = await response.json();
                if (response.ok) {
                    alert('Product updated successfully!');
                    closeEditForm();
                    loadProducts();
                } else {
                    alert(result.error || 'Failed to update product');
                }
            } catch (err) {
                console.error(err);
                alert('Server error while updating product');
            }
        });
    }
});

function toggleAddProductForm() {
    const form = document.getElementById('addProductForm');
    const editForm = document.getElementById('editProductForm');

    if (form.style.display === 'none') {
        form.style.display = 'block';
        editForm.style.display = 'none'; // Hide edit if opening add
    } else {
        form.style.display = 'none';
    }
}

function resetProductForm() {
    document.getElementById('newProductForm').reset();
    document.getElementById('addProductForm').style.display = 'none';
}

function closeEditForm() {
    document.getElementById('updateProductForm').reset();
    document.getElementById('editProductForm').style.display = 'none';
}

async function loadProducts() {
    try {
        const res = await fetch('/api/products', { headers: getAuthHeaders() });
        const products = await res.json();

        const tbody = document.querySelector('#productsTable tbody');
        tbody.innerHTML = '';

        products.forEach(p => {
            const imgHtml = p.image_url ? `<img src="${p.image_url}" class="product-img-preview">` : 'No Image';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${imgHtml}</td>
                <td><strong>${p.name}</strong><br><small>${p.description || ''}</small></td>
                <td>₹${p.price}</td>
                <td>${p.stock_quantity || 0}</td>
                <td>
                    <button class="btn btn-primary" style="background:#f39c12; margin-right:5px; padding: 6px 10px; font-size:12px;" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to load products', err);
    }
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                loadProducts();
                loadDashboardStats();
            } else {
                alert('Failed to delete');
            }
        } catch (err) {
            console.error(err);
        }
    }
}

function editProduct(product) {
    // Populate form fields
    document.getElementById('editProdId').value = product.id;
    document.getElementById('editProdName').value = product.name;
    document.getElementById('editProdDesc').value = product.description || '';
    document.getElementById('editProdPrice').value = product.price;
    document.getElementById('editProdStock').value = product.stock_quantity || 0;

    // Show edit form, hide add form
    document.getElementById('addProductForm').style.display = 'none';
    document.getElementById('editProductForm').style.display = 'block';

    // Scroll to form
    document.getElementById('editProductForm').scrollIntoView({ behavior: 'smooth' });
}

async function loadMessages() {
    try {
        const res = await fetch('/api/contacts', { headers: getAuthHeaders() });
        const messages = await res.json();

        const tbody = document.querySelector('#messagesTable tbody');
        tbody.innerHTML = '';

        messages.forEach(m => {
            const date = new Date(m.created_at).toLocaleDateString();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td>${m.name}</td>
                <td>${m.email}</td>
                <td>${m.phone || '-'}</td>
                <td>${m.message}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to load messages', err);
    }
}

async function loadOrders() {
    try {
        const res = await fetch('/api/orders', { headers: getAuthHeaders() });
        const orders = await res.json();

        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = '';

        orders.forEach(o => {
            const date = new Date(o.created_at).toLocaleDateString();
            const items = JSON.parse(o.items) || [];

            let itemsHtml = '<ul style="margin:0; padding-left:20px;">';
            items.forEach(item => {
                itemsHtml += `<li>${item.product_name || 'Item'} (x${item.quantity})</li>`;
            });
            itemsHtml += '</ul>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td>${o.customer_name}</td>
                <td>${o.customer_phone}<br><small>${o.customer_address || ''}</small></td>
                <td>${itemsHtml}</td>
                <td><strong>₹${o.total_amount}</strong><br><span style="padding:2px 6px; border-radius:4px; font-size:12px; background:#f39c12; color:white;">${o.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to load orders', err);
    }
}

async function loadDashboardStats() {
    try {
        const pRes = await fetch('/api/products', { headers: getAuthHeaders() });
        if (pRes.ok) {
            const pData = await pRes.json();
            document.getElementById('stat-products').innerText = pData.length;
        }

        const mRes = await fetch('/api/contacts', { headers: getAuthHeaders() });
        if (mRes.ok) {
            const mData = await mRes.json();
            document.getElementById('stat-messages').innerText = mData.length;
        }
    } catch (err) {
        console.error('Error loading stats', err);
    }
}
