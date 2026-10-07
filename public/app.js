const API_BASE = 'http://localhost:3000';
let selectedBundle = null;
let adminToken = localStorage.getItem('khqnzur_admin_token');
let allBundles = [];
let allTransactions = [];
let currentFilter = 'all';

// Load bundles on page load
document.addEventListener('DOMContentLoaded', () => {
  loadBundles();
  setupEventListeners();
});

function setupEventListeners() {
  // Admin login
  document.getElementById('adminLoginBtn').addEventListener('click', () => {
    document.getElementById('adminLoginModal').classList.remove('hidden');
  });

  document.getElementById('closeAdminModal').addEventListener('click', () => {
    document.getElementById('adminLoginModal').classList.add('hidden');
  });

  document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);

  // Close purchase modal
  document.getElementById('closePurchaseModal').addEventListener('click', () => {
    document.getElementById('purchaseModal').classList.add('hidden');
  });

  // Purchase form
  document.getElementById('purchaseForm').addEventListener('submit', handlePurchase);

  // Close admin dashboard
  document.getElementById('closeAdminDashboard').addEventListener('click', () => {
    document.getElementById('adminDashboardModal').classList.add('hidden');
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('khqnzur_admin_token');
    adminToken = null;
    document.getElementById('adminDashboardModal').classList.add('hidden');
  });

  // Category filters
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderBundles();
    });
  });

  // Dashboard tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');

      if (tabName === 'pricing') {
        renderPricingTab();
      } else if (tabName === 'transactions') {
        renderTransactionsTab();
      } else if (tabName === 'analytics') {
        renderAnalyticsTab();
      }
    });
  });
}

async function loadBundles() {
  try {
    const response = await fetch(`${API_BASE}/api/products`);
    if (!response.ok) throw new Error('Failed to load bundles');
    allBundles = await response.json();
    renderBundles();
  } catch (error) {
    console.error('Error loading bundles:', error);
    loadDefaultBundles();
  }
}

function loadDefaultBundles() {
  allBundles = [
    { id: 'daily-1', name: '10MB', category: 'daily', price: 20, details: 'Valid for 1 day' },
    { id: 'daily-2', name: '50MB', category: 'daily', price: 50, details: 'Good for browsing' },
    { id: 'daily-3', name: '100MB', category: 'daily', price: 100, details: 'Affordable daily' },
    { id: 'weekly-1', name: '1GB Weekly', category: 'weekly', price: 100, details: '7 days validity' },
    { id: 'weekly-2', name: '2GB Weekly', category: 'weekly', price: 200, details: 'Perfect for work' },
    { id: 'monthly-1', name: '5GB Monthly', category: 'monthly', price: 500, details: '30 days validity' },
    { id: 'monthly-2', name: '10GB Monthly', category: 'monthly', price: 1000, details: 'Heavy usage' },
    { id: 'night-1', name: 'Night Bundle', category: 'night', price: 50, details: 'Night browsing' },
    { id: 'night-2', name: 'Unlimited Night', category: 'night', price: 100, details: 'Unlimited night' }
  ];
  renderBundles();
}

function renderBundles() {
  const grid = document.getElementById('bundlesGrid');
  const filtered = currentFilter === 'all' 
    ? allBundles 
    : allBundles.filter(b => b.category === currentFilter);

  grid.innerHTML = filtered.map(bundle => `
    <div class="bundle-card ${bundle.category}">
      <div class="bundle-category">${bundle.category}</div>
      <div class="bundle-name">${bundle.name}</div>
      <div class="bundle-price">KSh ${bundle.price}</div>
      <div class="bundle-details">${bundle.details}</div>
      <button class="bundle-btn" onclick="openPurchaseModal('${bundle.id}')">Buy Now</button>
    </div>
  `).join('');
}

function openPurchaseModal(bundleId) {
  selectedBundle = allBundles.find(b => b.id === bundleId);
  if (!selectedBundle) return;

  document.getElementById('purchaseBundleName').textContent = selectedBundle.name;
  document.getElementById('purchaseBundlePrice').textContent = `KSh ${selectedBundle.price}`;
  document.getElementById('purchaseBundleDetails').textContent = selectedBundle.details;
  document.getElementById('purchaseError').classList.add('hidden');
  document.getElementById('purchaseSuccess').classList.add('hidden');
  document.getElementById('phoneNumber').value = '';
  document.getElementById('purchaseModal').classList.remove('hidden');
}

async function handlePurchase(e) {
  e.preventDefault();
  if (!selectedBundle) return;

  const phone = document.getElementById('phoneNumber').value.trim();
  const phoneRegex = /^(0|\+254|254)[0-9]{9}$/;

  if (!phoneRegex.test(phone)) {
    document.getElementById('purchaseError').textContent = 'Please enter a valid Kenyan phone number';
    document.getElementById('purchaseError').classList.remove('hidden');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/payment/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phone,
        bundleId: selectedBundle.id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Payment initiation failed');
    }

    document.getElementById('purchaseSuccess').textContent = '✓ Payment prompt sent! Check your phone and enter your MPESA PIN';
    document.getElementById('purchaseSuccess').classList.remove('hidden');
    document.getElementById('purchaseError').classList.add('hidden');

    setTimeout(() => {
      document.getElementById('purchaseModal').classList.add('hidden');
    }, 2000);
  } catch (error) {
    document.getElementById('purchaseError').textContent = `Error: ${error.message}`;
    document.getElementById('purchaseError').classList.remove('hidden');
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();

  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const errorEl = document.getElementById('loginError');

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    adminToken = data.token;
    localStorage.setItem('khqnzur_admin_token', adminToken);

    document.getElementById('adminLoginModal').classList.add('hidden');
    document.getElementById('adminDashboardModal').classList.remove('hidden');
    document.getElementById('adminLoginForm').reset();
    errorEl.classList.add('hidden');

    loadTransactions();
    renderPricingTab();
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.remove('hidden');
  }
}

async function loadTransactions() {
  if (!adminToken) return;

  try {
    const response = await fetch(`${API_BASE}/api/admin/transactions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!response.ok) throw new Error('Failed to load transactions');
    allTransactions = await response.json();
  } catch (error) {
    console.error('Error loading transactions:', error);
  }
}

function renderPricingTab() {
  const grid = document.getElementById('pricingGrid');
  grid.innerHTML = allBundles.map(bundle => `
    <div class="pricing-item">
      <h4>${bundle.name}</h4>
      <input type="number" id="price-${bundle.id}" value="${bundle.price}" min="1" />
      <button class="btn-update" onclick="updatePrice('${bundle.id}')">Update</button>
    </div>
  `).join('');
}

async function updatePrice(bundleId) {
  if (!adminToken) return;

  const price = document.getElementById(`price-${bundleId}`).value;
  if (!price || price <= 0) {
    alert('Please enter a valid price');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/admin/product/${bundleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ price: Number(price) })
    });

    if (!response.ok) throw new Error('Failed to update price');

    const updated = allBundles.find(b => b.id === bundleId);
    if (updated) updated.price = Number(price);
    renderBundles();
    alert('Price updated successfully!');
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

function renderTransactionsTab() {
  const tbody = document.querySelector('.transactions-table tbody');
  tbody.innerHTML = allTransactions.map(txn => `
    <tr>
      <td>${txn.phoneNumber || 'N/A'}</td>
      <td>${txn.bundleName || 'N/A'}</td>
      <td>KSh ${txn.amount}</td>
      <td><span class="status-badge status-${txn.status}">${txn.status.toUpperCase()}</span></td>
      <td>${new Date(txn.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

function renderAnalyticsTab() {
  const total = allTransactions.length;
  const completed = allTransactions.filter(t => t.status === 'completed').length;
  const pending = allTransactions.filter(t => t.status === 'pending').length;
  const revenue = allTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statCompleted').textContent = completed;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statRevenue').textContent = `KSh ${revenue.toLocaleString()}`;
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.id === 'adminLoginModal') {
    document.getElementById('adminLoginModal').classList.add('hidden');
  }
  if (e.target.id === 'purchaseModal') {
    document.getElementById('purchaseModal').classList.add('hidden');
  }
  if (e.target.id === 'adminDashboardModal') {
    document.getElementById('adminDashboardModal').classList.add('hidden');
  }
});