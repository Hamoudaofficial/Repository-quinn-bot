// ═══════════════════════════════════════════════
// js/shop.js — متجر Quinn (كلمة المرور + النجوم)
// ═══════════════════════════════════════════════
import { t }         from './i18n.js';
const showToast = (m,t) => { try{window.showToast(m,t)}catch(_){console.log(m)} };

const SHOP_PASSWORD = 'T9@xQ#4mL!2vZ$7pR';

// حزم الشراء بكلمة المرور
const PASS_PACKAGES = [
  { id:'p1', label:'حزمة مبتدئ',    quinn:500,     price:'مجاناً مع كلمة المرور', icon:'fa-seedling',   color:'#4ECDC4' },
  { id:'p2', label:'حزمة صغيرة',    quinn:2000,    price:'كلمة المرور',           icon:'fa-star',        color:'#FFD700' },
  { id:'p3', label:'حزمة متوسطة',   quinn:10000,   price:'كلمة المرور',           icon:'fa-gem',         color:'#A78BFA' },
  { id:'p4', label:'حزمة ممتازة',   quinn:50000,   price:'كلمة المرور',           icon:'fa-crown',       color:'#FF6B6B' },
  { id:'p5', label:'حزمة الحوت',    quinn:200000,  price:'كلمة المرور',           icon:'fa-fish',        color:'#06B6D4' },
  { id:'p6', label:'حزمة الأسطورة', quinn:1000000, price:'كلمة المرور',           icon:'fa-fire-flame-curved', color:'#F97316' },
];

// حزم النجوم
const STARS_PACKAGES = [
  { stars:50,   quinn:5,   label:'50 ⭐',  icon:'fa-star', popular:false },
  { stars:100,  quinn:11,  label:'100 ⭐', icon:'fa-star', popular:false },
  { stars:250,  quinn:30,  label:'250 ⭐', icon:'fa-star', popular:true  },
  { stars:500,  quinn:65,  label:'500 ⭐', icon:'fa-star', popular:false },
  { stars:1000, quinn:140, label:'1000 ⭐',icon:'fa-star', popular:false },
];

export function renderPasswordShop(container, user) {
  container.innerHTML = `
    <div class="shop-section">
      <h2 class="section-title"><i class="fas fa-key"></i> ${t('buyWithPass')}</h2>
      <p class="muted shop-desc">اشترِ Quinn مباشرة بكلمة مرور المتجر الخاصة</p>
      <div class="packages-grid">
        ${PASS_PACKAGES.map(p => `
          <div class="package-card glass-card" data-pkg="${p.id}"
               style="--pkg-color:${p.color}">
            <i class="fas ${p.icon} pkg-icon"></i>
            <div class="pkg-quinn">${fmtQ(p.quinn)} Quinn</div>
            <div class="pkg-label">${p.label}</div>
            <button class="btn btn-buy" data-pkg="${p.id}" data-quinn="${p.quinn}">
              <i class="fas fa-shopping-cart"></i> شراء
            </button>
          </div>`).join('')}
      </div>
    </div>`;

  container.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      const quinn = parseInt(btn.dataset.quinn);
      _promptPasswordBuy(quinn, user);
    });
  });
}

export function renderStarsShop(container) {
  container.innerHTML = `
    <div class="shop-section">
      <h2 class="section-title"><i class="fas fa-star" style="color:#FFD700"></i> ${t('buyWithStars')}</h2>
      <p class="muted shop-desc">اشترِ Quinn بنجوم تيليجرام</p>
      <div class="stars-grid">
        ${STARS_PACKAGES.map(p => `
          <div class="stars-card glass-card ${p.popular ? 'popular' : ''}">
            ${p.popular ? '<div class="popular-badge">الأكثر مبيعاً</div>' : ''}
            <div class="stars-amount">${p.label}</div>
            <div class="stars-arrow"><i class="fas fa-arrow-right-long"></i></div>
            <div class="quinn-amount gold">${fmtQ(p.quinn)} Q</div>
            <button class="btn btn-stars" data-stars="${p.stars}" data-quinn="${p.quinn}">
              <i class="fas fa-telegram"></i> شراء عبر تيليجرام
            </button>
          </div>`).join('')}
      </div>
      <div class="stars-note glass-card">
        <i class="fas fa-circle-info"></i>
        لإتمام الشراء بالنجوم، اضغط الزر وسيتم توجيهك لبوت الدفع عبر تيليجرام.
      </div>
    </div>`;

  container.querySelectorAll('.btn-stars').forEach(btn => {
    btn.addEventListener('click', () => {
      const stars = parseInt(btn.dataset.stars);
      const quinn = parseInt(btn.dataset.quinn);
      _handleStarsBuy(stars, quinn);
    });
  });
}

function _promptPasswordBuy(quinn, user) {
  // إنشاء مودال كلمة المرور
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal-box glass-card">
      <div class="modal-header">
        <i class="fas fa-key modal-icon gold"></i>
        <h3>${t('enterPassword')}</h3>
        <button class="modal-close" id="shop-modal-close"><i class="fas fa-xmark"></i></button>
      </div>
      <p class="muted">ستحصل على <strong class="gold">${fmtQ(quinn)} Quinn</strong></p>
      <input type="password" id="shop-password-input" class="quinn-input" placeholder="كلمة المرور" autocomplete="off">
      <div class="modal-actions">
        <button class="btn btn-primary" id="shop-confirm-btn">
          <i class="fas fa-check"></i> ${t('confirm')}
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById('shop-modal-close').addEventListener('click', () => overlay.remove());
  document.getElementById('shop-confirm-btn').addEventListener('click', () => {
    const pass = document.getElementById('shop-password-input').value;
    if (pass === SHOP_PASSWORD) {
      user.gainTokens(quinn);
      user.addTransaction('shop_buy', quinn, { method: 'password' });
      user.saveToFirebase();
      showToast(`✅ تم إضافة ${fmtQ(quinn)} Quinn`);
      overlay.remove();
      document.dispatchEvent(new CustomEvent('balanceUpdated'));
    } else {
      showToast(t('wrongPassword'), 'error');
      document.getElementById('shop-password-input').value = '';
      document.getElementById('shop-password-input').classList.add('shake');
      setTimeout(() => document.getElementById('shop-password-input')?.classList.remove('shake'), 500);
    }
  });

  // ضغط Enter
  document.getElementById('shop-password-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('shop-confirm-btn').click();
  });
}

function _handleStarsBuy(stars, quinn) {
  // في التطبيق الحقيقي هذا يفتح Telegram Stars invoice
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink(`https://t.me/Quinnofficialbot?start=stars_${stars}_${quinn}`);
  } else {
    window.open(`https://t.me/Quinnofficialbot?start=stars_${stars}_${quinn}`, '_blank');
  }
  showToast(`تم توجيهك لشراء ${stars} ⭐`, 'info');
}

// واجهة المتجر الكاملة
export function renderShopTab(container, user) {
  container.innerHTML = `
    <div class="shop-tabs">
      <button class="shop-tab active" data-tab="password">
        <i class="fas fa-key"></i> ${t('buyWithPass')}
      </button>
      <button class="shop-tab" data-tab="stars">
        <i class="fas fa-star"></i> ${t('buyWithStars')}
      </button>
    </div>
    <div id="shop-tab-content"></div>`;

  const content = document.getElementById('shop-tab-content');
  renderPasswordShop(content, user);

  container.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'password') renderPasswordShop(content, user);
      else renderStarsShop(content);
    });
  });
}

function fmtQ(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(0)+'K';
  return n.toLocaleString();
}
