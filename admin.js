// ═══════════════════════════════════════════════
// js/admin.js — لوحة تحكم المسؤول
// ═══════════════════════════════════════════════
import { db } from './firebase.js';
import {
  collection, getDocs, doc, updateDoc, addDoc, query, orderBy, limit,
  serverTimestamp, increment, getDoc, setDoc
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

const ADMIN_PASS = 'T9@xQ#4mL!2vZ$7pR';
let   _authenticated = false;
let   _allUsers = [];

// ── تهيئة لوحة التحكم ───────────────────────
export function initAdmin() {
  document.getElementById('admin-login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const pass = document.getElementById('admin-pass-input').value;
    if (pass === ADMIN_PASS) {
      _authenticated = true;
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('dashboard').style.display    = 'block';
      await _loadDashboard();
    } else {
      document.getElementById('login-error').textContent = '❌ كلمة مرور خاطئة';
      document.getElementById('admin-pass-input').value = '';
    }
  });
}

// ── تحميل لوحة التحكم ───────────────────────
async function _loadDashboard() {
  await Promise.all([_loadStats(), _loadUsers(), _loadGoldPrice()]);
  _bindAdminEvents();
}

async function _loadStats() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    let totalUsers = 0, totalTokens = 0, totalGold = 0;
    snap.forEach(d => {
      totalUsers++;
      totalTokens += d.data().totalTokens || 0;
      totalGold   += d.data().goldGrams   || 0;
    });
    document.getElementById('stat-users').textContent  = totalUsers.toLocaleString();
    document.getElementById('stat-tokens').textContent = fmtQ(totalTokens);
    document.getElementById('stat-gold').textContent   = totalGold.toFixed(4) + 'g';
  } catch (err) {
    console.error('Stats error:', err);
  }
}

async function _loadUsers() {
  try {
    const q    = query(collection(db, 'users'), orderBy('totalTokens', 'desc'), limit(50));
    const snap = await getDocs(q);
    _allUsers  = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    _renderUsersTable(_allUsers);
  } catch (err) {
    console.error('Users error:', err);
  }
}

function _renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  tbody.innerHTML = users.map(u => `
    <tr class="${u.banned ? 'banned-row' : ''}">
      <td>${u.name || '--'}</td>
      <td class="mono">${u.id}</td>
      <td class="gold">${fmtQ(u.totalTokens || 0)}</td>
      <td><span class="badge ${u.banned ? 'badge-banned' : 'badge-active'}">${u.banned ? '🔴 محظور' : '🟢 نشط'}</span></td>
      <td class="actions-cell">
        <button class="btn-sm btn-send"   data-uid="${u.id}" data-name="${u.name}">إرسال</button>
        <button class="btn-sm ${u.banned ? 'btn-unban' : 'btn-ban'}"
                data-uid="${u.id}" data-banned="${u.banned}">${u.banned ? 'فك الحظر' : 'حظر'}</button>
      </td>
    </tr>`).join('');

  // Events
  tbody.querySelectorAll('.btn-send').forEach(btn => {
    btn.addEventListener('click', () => _promptSendTokens(btn.dataset.uid, btn.dataset.name));
  });
  tbody.querySelectorAll('.btn-ban, .btn-unban').forEach(btn => {
    btn.addEventListener('click', () => _toggleBan(btn.dataset.uid, btn.dataset.banned === 'true'));
  });
}

async function _loadGoldPrice() {
  try {
    const snap = await getDoc(doc(db, 'market', 'global_gold'));
    if (snap.exists()) {
      document.getElementById('gold-price-input').value = snap.data().price?.toFixed(2) || 100;
    }
  } catch (_) {}
}

function _bindAdminEvents() {
  // بحث المستخدمين
  document.getElementById('user-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = _allUsers.filter(u =>
      u.name?.toLowerCase().includes(q) || u.id?.toLowerCase().includes(q));
    _renderUsersTable(filtered);
  });

  // إرسال إشعار عام
  document.getElementById('send-notif-btn')?.addEventListener('click', async () => {
    const msg = document.getElementById('notif-input')?.value?.trim();
    if (!msg) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        message: msg, timestamp: serverTimestamp(), readBy: []
      });
      document.getElementById('notif-input').value = '';
      _showAdminToast('✅ تم إرسال الإشعار لجميع المستخدمين');
    } catch (err) {
      _showAdminToast('❌ خطأ في الإرسال: ' + err.message);
    }
  });

  // تحديث سعر الذهب
  document.getElementById('update-gold-btn')?.addEventListener('click', async () => {
    const price = parseFloat(document.getElementById('gold-price-input')?.value);
    if (!price || price <= 0) { _showAdminToast('❌ أدخل سعراً صحيحاً'); return; }
    try {
      await setDoc(doc(db, 'market', 'global_gold'), {
        price, lastUpdate: serverTimestamp()
      }, { merge: true });
      _showAdminToast(`✅ تم تحديث سعر الذهب إلى $${price}`);
    } catch (err) {
      _showAdminToast('❌ خطأ: ' + err.message);
    }
  });

  // تحديث البيانات
  document.getElementById('refresh-btn')?.addEventListener('click', _loadDashboard);

  // تصفير مستخدم
  document.getElementById('users-tbody')?.addEventListener('click', async e => {
    const target = e.target;
    if (target.classList.contains('btn-reset')) {
      const uid = target.dataset.uid;
      if (confirm(`هل أنت متأكد من تصفير ${uid}?`)) {
        await updateDoc(doc(db, 'users', uid), { tokens:0, totalTokens:0, xp:0, level:1 });
        _showAdminToast('✅ تم تصفير المستخدم');
        _loadUsers();
      }
    }
  });
}

async function _promptSendTokens(uid, name) {
  const amount = parseInt(prompt(`كم Quinn تريد إرسال لـ ${name}?`));
  if (!amount || amount <= 0) return;
  try {
    await updateDoc(doc(db, 'users', uid), {
      tokens:      increment(amount),
      totalTokens: increment(amount)
    });
    _showAdminToast(`✅ تم إرسال ${fmtQ(amount)} Quinn لـ ${name}`);
  } catch (err) {
    _showAdminToast('❌ ' + err.message);
  }
}

async function _toggleBan(uid, isBanned) {
  if (!confirm(isBanned ? `فك حظر ${uid}?` : `حظر ${uid}?`)) return;
  try {
    await updateDoc(doc(db, 'users', uid), { banned: !isBanned });
    _showAdminToast(isBanned ? '✅ تم فك الحظر' : '✅ تم الحظر');
    await _loadUsers();
  } catch (err) {
    _showAdminToast('❌ ' + err.message);
  }
}

function _showAdminToast(msg) {
  const toast = document.getElementById('admin-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function fmtQ(n) {
  if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return (n||0).toLocaleString();
}

// تهيئة تلقائية
document.addEventListener('DOMContentLoaded', initAdmin);
