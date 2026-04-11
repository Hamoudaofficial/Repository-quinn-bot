// ═══════════════════════════════════════════════
// js/exchange.js — سوق الذهب (Quinn Exchange)
// ═══════════════════════════════════════════════
import { db }              from './firebase.js';
import { t }               from './i18n.js';
const showToast = (m,t) => { try{window.showToast(m,t)}catch(_){console.log(m)} };
import {
  doc, onSnapshot, updateDoc, increment, arrayUnion, serverTimestamp, getDoc, setDoc
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

const MARKET_DOC    = 'market/global_gold';
const IMPACT_PER_G  = 0.001;   // تأثير كل غرام على السعر
let   _chart        = null;
let   _unsubscribe  = null;
let   _currentPrice = 100;
let   _priceHistory = [];

export async function initExchange() {
  // تهيئة مستند السوق إن لم يكن موجوداً
  const mRef = doc(db, 'market', 'global_gold');
  const snap  = await getDoc(mRef);
  if (!snap.exists()) {
    await setDoc(mRef, {
      price: 100, openPrice: 100, highPrice: 100, lowPrice: 100,
      volume: 0, lastUpdate: serverTimestamp(),
      priceHistory: [100]
    });
  }
}

export function renderExchangeTab(container, user) {
  container.innerHTML = `
    <div class="exchange-header">
      <div class="price-display">
        <span class="price-label"><i class="fas fa-chart-line"></i> ${t('goldPrice')}</span>
        <span class="price-value gold" id="ex-price">$${_currentPrice.toFixed(2)}</span>
        <span class="price-change" id="ex-change">--</span>
      </div>
      <div class="gold-holding glass-card">
        <i class="fas fa-coins" style="color:var(--gold)"></i>
        <span>${t('myGold')}: <strong id="ex-my-gold">${user.goldGrams.toFixed(4)}g</strong></span>
        <span class="muted">≈ <span id="ex-gold-value">${(user.goldGrams * _currentPrice).toFixed(0)}</span> Quinn</span>
      </div>
    </div>

    <div class="chart-container glass-card">
      <canvas id="gold-chart"></canvas>
    </div>

    <div class="exchange-actions">
      <div class="glass-card action-card">
        <h3 class="action-title green"><i class="fas fa-arrow-trend-up"></i> ${t('buyGold')}</h3>
        <div class="input-with-label">
          <input type="number" id="buy-grams-input" class="quinn-input" placeholder="0.0" step="0.001" min="0.001">
          <span class="input-suffix">${t('grams')}</span>
        </div>
        <div class="cost-preview muted" id="buy-cost-preview">التكلفة: -- Quinn</div>
        <button class="btn btn-success w-full mt" id="ex-buy-btn">
          <i class="fas fa-cart-shopping"></i> ${t('buyGold')}
        </button>
      </div>
      <div class="glass-card action-card">
        <h3 class="action-title red"><i class="fas fa-arrow-trend-down"></i> ${t('sellGold')}</h3>
        <div class="input-with-label">
          <input type="number" id="sell-grams-input" class="quinn-input" placeholder="0.0" step="0.001" min="0.001">
          <span class="input-suffix">${t('grams')}</span>
        </div>
        <div class="revenue-preview muted" id="sell-revenue-preview">ستحصل: -- Quinn</div>
        <button class="btn btn-danger w-full mt" id="ex-sell-btn">
          <i class="fas fa-hand-holding-dollar"></i> ${t('sellGold')}
        </button>
      </div>
    </div>

    <div class="glass-card mt">
      <h3 class="section-title"><i class="fas fa-list"></i> ${t('goldHistory')}</h3>
      <div id="ex-history-list" class="tx-list">
        ${_renderTxHistory(user.transactions?.filter(tx => tx.type?.startsWith('gold')))}
      </div>
    </div>
  `;

  // ربط الأحداث
  _bindExchangeEvents(user);
  // تحميل الرسم البياني
  _loadChart();
  // الاستماع للسعر
  _listenMarket();
}

function _bindExchangeEvents(user) {
  // معاينة التكلفة
  document.getElementById('buy-grams-input')?.addEventListener('input', e => {
    const g = parseFloat(e.target.value) || 0;
    const cost = Math.floor(g * _currentPrice);
    document.getElementById('buy-cost-preview').textContent = `التكلفة: ${fmt(cost)} Quinn`;
  });
  document.getElementById('sell-grams-input')?.addEventListener('input', e => {
    const g = parseFloat(e.target.value) || 0;
    const rev = Math.floor(g * _currentPrice);
    document.getElementById('sell-revenue-preview').textContent = `ستحصل: ${fmt(rev)} Quinn`;
  });
  document.getElementById('ex-buy-btn')?.addEventListener('click', () => {
    const g = parseFloat(document.getElementById('buy-grams-input').value) || 0;
    buyGold(g, user);
  });
  document.getElementById('ex-sell-btn')?.addEventListener('click', () => {
    const g = parseFloat(document.getElementById('sell-grams-input').value) || 0;
    sellGold(g, user);
  });
}

export async function buyGold(grams, user) {
  if (!grams || grams <= 0) { showToast('أدخل كمية صحيحة', 'error'); return; }
  const cost = Math.ceil(grams * _currentPrice);
  if (cost > user.tokens) { showToast(t('insufficientBal'), 'error'); return; }

  user.tokens      -= cost;
  user.goldGrams   += grams;
  user.goldAvgPrice = user.goldGrams > 0
    ? ((user.goldAvgPrice * (user.goldGrams - grams)) + (grams * _currentPrice)) / user.goldGrams
    : _currentPrice;

  user.addTransaction('gold_buy', cost, { grams, price: _currentPrice });
  user.saveToFirebase();

  // رفع السعر
  const newPrice = +((_currentPrice * (1 + grams * IMPACT_PER_G)).toFixed(4));
  await _updateMarketPrice(newPrice, cost);

  showToast(`✅ اشتريت ${grams.toFixed(4)}g ذهب`);
  document.dispatchEvent(new CustomEvent('refreshTab', { detail: 'exchange' }));
}

export async function sellGold(grams, user) {
  if (!grams || grams <= 0)    { showToast('أدخل كمية صحيحة', 'error'); return; }
  if (grams > user.goldGrams)  { showToast('لا تملك كافية من الذهب', 'error'); return; }

  const income = Math.floor(grams * _currentPrice);
  user.goldGrams -= grams;
  user.tokens    += income;

  user.addTransaction('gold_sell', income, { grams, price: _currentPrice });
  user.saveToFirebase();

  // خفض السعر
  const newPrice = +((_currentPrice * (1 - grams * IMPACT_PER_G * 0.8)).toFixed(4));
  await _updateMarketPrice(newPrice, -income);

  showToast(`✅ بعت ${grams.toFixed(4)}g مقابل ${fmt(income)} Quinn`);
  document.dispatchEvent(new CustomEvent('refreshTab', { detail: 'exchange' }));
}

async function _updateMarketPrice(newPrice, volDelta) {
  newPrice = Math.max(10, Math.min(10000, newPrice));
  try {
    await updateDoc(doc(db, 'market', 'global_gold'), {
      price:       newPrice,
      highPrice:   newPrice > _currentPrice ? newPrice : undefined,
      lowPrice:    newPrice < _currentPrice ? newPrice : undefined,
      volume:      increment(Math.abs(volDelta)),
      lastUpdate:  serverTimestamp(),
      priceHistory: arrayUnion(newPrice)
    });
  } catch (_) {}
}

function _listenMarket() {
  if (_unsubscribe) _unsubscribe();
  _unsubscribe = onSnapshot(doc(db, 'market', 'global_gold'), snap => {
    if (!snap.exists()) return;
    const d = snap.data();
    const prevPrice = _currentPrice;
    _currentPrice   = d.price || 100;
    _priceHistory   = (d.priceHistory || [_currentPrice]).slice(-50);

    // تحديث UI
    const priceEl  = document.getElementById('ex-price');
    const changeEl = document.getElementById('ex-change');
    if (priceEl) priceEl.textContent = `$${_currentPrice.toFixed(2)}`;
    if (changeEl) {
      const diff = _currentPrice - prevPrice;
      const pct  = prevPrice ? ((diff / prevPrice) * 100).toFixed(2) : '0.00';
      changeEl.textContent = `${diff >= 0 ? '+' : ''}${pct}%`;
      changeEl.className   = `price-change ${diff >= 0 ? 'green' : 'red'}`;
    }
    _updateChart();
  });
}

function _loadChart() {
  const canvas = document.getElementById('gold-chart');
  if (!canvas || !window.Chart) return;
  if (_chart) { _chart.destroy(); _chart = null; }

  const labels = _priceHistory.map((_, i) => i + 1);
  _chart = new window.Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Gold Price',
        data:  _priceHistory,
        borderColor:     '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.08)',
        borderWidth:     2,
        pointRadius:     0,
        tension:         0.4,
        fill:            true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { grid: { color:'rgba(255,255,255,0.05)' }, ticks: { color:'#aaa', font:{size:10} } }
      },
      animation: { duration: 300 }
    }
  });
}

function _updateChart() {
  if (!_chart) return;
  _chart.data.labels  = _priceHistory.map((_,i) => i+1);
  _chart.data.datasets[0].data = _priceHistory;
  _chart.update('none');
}

function _renderTxHistory(txs = []) {
  if (!txs.length) return '<div class="empty-state"><i class="fas fa-chart-bar"></i><span>لا توجد معاملات</span></div>';
  return txs.slice(0,10).map(tx => `
    <div class="tx-item">
      <i class="fas ${tx.type === 'gold_buy' ? 'fa-arrow-down green' : 'fa-arrow-up red'}"></i>
      <div class="tx-info">
        <span>${tx.type === 'gold_buy' ? 'شراء' : 'بيع'} ${(tx.grams||0).toFixed(4)}g</span>
        <span class="muted">${new Date(tx.time).toLocaleDateString('ar-SA')}</span>
      </div>
      <span class="${tx.type === 'gold_buy' ? 'red' : 'green'}">${tx.type === 'gold_buy' ? '-' : '+'}${fmt(tx.amount)}</span>
    </div>`).join('');
}

function fmt(n) {
  n = Math.floor(n||0);
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return n.toLocaleString();
}
