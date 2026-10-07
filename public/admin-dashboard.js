let authToken = localStorage.getItem('khqnzur_admin_token');
const apiBase = 'http://localhost:3000';

if (!authToken) {
  window.location.href = '/';
}

let products = [];
let transactions = [];

async function loadProducts() {
  try {
    const response = await fetch(`${apiBase}/api/admin/products`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await response.json();
    products = data;
    renderProducts();
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

async function loadTransactions() {
  try {
    const response = await fetch(`${apiBase}/api/admin/transactions`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await response.json();
    transactions = data;
    renderTransactions();
    calculateAnalytics();
  } catch (error) {
    console.error('Error loading transactions:', error);
  }
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = products.map(product => `
    <div class="product-card">
      <h3>${product.name}</h3>
      <div class="product-price">KSh ${product.price}</div>
      <div class="product-details">${product.details}</div>
      <div class="product-actions">
        <button class="btn-edit" onclick="editProduct('${product.id}')">Edit</button>
        <button class="btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderTransactions() {
  const tbody = document.querySelector('.transactions-table tbody');
  tbody.innerHTML = transactions.map(txn => `
    <tr>
      <td>${txn.id}</td>
      <td>${txn.phoneNumber}</td>
      <td>${txn.bundleName}</td>
      <td>KSh ${txn.amount}</td>
      <td><span class="status-badge status-${txn.status}">${txn.status.toUpperCase()}</span></td>
      <td>${new Date(txn.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

function calculateAnalytics() {
  const completed = transactions.filter(t => t.status === 'completed').length;
  const failed = transactions.filter(t => t.status === 'failed').length;
  const revenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  document.getElementById('statTransactions').textContent = transactions.length;
  document.getElementById('statCompleted').textContent = completed;
  document.getElementById('statFailed').textContent = failed;
  document.getElementById('statRevenue').textContent = `KSh ${revenue.toLocaleString()}`;
}

function editProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  document.getElementById('modalTitle').textContent = 'Edit Product';
  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productDetails').value = product.details;

  document.getElementById('productModal').classList.remove('hidden');
}

function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  // Add delete implementation
  alert('Delete functionality - implement backend endpoint');
}

document.getElementById('addProductBtn').addEventListener('click', () => {
  document.getElementById('modalTitle').textContent = 'Add Product';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productModal').classList.remove('hidden');
});

document.getElementById('closeProductModal').addEventListener('click', () => {
  document.getElementById('productModal').classList.add('hidden');
});

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('productId').value;
  const price = Number(document.getElementById('productPrice').value);

  try {
    const response = await fetch(`${apiBase}/api/admin/product/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ price })
    });

    if (!response.ok) throw new Error('Update failed');

    alert('Product updated successfully');
    document.getElementById('productModal').classList.add('hidden');
    loadProducts();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});

document.querySelectorAll('.nav-item').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    button.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(button.getAttribute('data-page')).classList.add('active');

    if (button.getAttribute('data-page') === 'transactions') {
      loadTransactions();
    }
  });
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('khqnzur_admin_token');
  window.location.href = '/';
});

document.getElementById('searchTransactions').addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const tbody = document.querySelector('.transactions-table tbody');
  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    const phone = row.cells[1].textContent.toLowerCase();
    row.style.display = phone.includes(search) ? '' : 'none';
  });
});

loadProducts();
loadTransactions();