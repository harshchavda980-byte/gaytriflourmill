document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);

    // Populate Sidebar Info
    document.getElementById('userNameSidebar').innerText = user.name;
    document.getElementById('userAvatar').innerText = user.name.charAt(0).toUpperCase();

    // Fetch Orders
    fetchUserOrders();
});

async function fetchUserOrders() {
    const container = document.getElementById('ordersContainer');

    try {
        const response = await fetch('/api/user/orders', {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            // Token expired or invalid
            logoutUser();
            return;
        }

        const orders = await response.json();

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <img src="https://via.placeholder.com/150x150?text=No+Orders" alt="No Orders" style="margin-bottom:20px; border-radius:50%; opacity:0.5;">
                    <h3>No Orders Yet</h3>
                    <p>Looks like you haven't made any purchases.</p>
                    <a href="products.html" class="btn" style="display:inline-block; margin-top:15px;">Start Shopping</a>
                </div>
            `;
            return;
        }

        let html = '';
        orders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            let itemsHtml = '<ul class="order-items">';
            JSON.parse(order.items).forEach(item => {
                itemsHtml += `
                    <li>
                        <span>${item.product_name} x ${item.quantity}</span>
                        <span>₹${parseFloat(item.price).toFixed(2)}</span>
                    </li>
                `;
            });
            itemsHtml += '</ul>';

            html += `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <strong>Order ID:</strong> #${order.id}<br>
                            <span style="font-size:12px;">Placed on ${date}</span>
                        </div>
                        <div class="order-status">
                            ${order.status}
                        </div>
                    </div>
                    ${itemsHtml}
                    <div class="order-total">
                        Total: ₹${parseFloat(order.total_amount).toFixed(2)}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error('Error fetching orders:', err);
        container.innerHTML = '<p style="color:red;">Failed to load orders. Please try again later.</p>';
    }
}
