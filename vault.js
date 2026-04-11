// ═══════════════════════════════════════════════
// js/vault.js — نظام الخزانة (Staking)
// ═══════════════════════════════════════════════
import { t } from './i18n.js';


const BASE_YIELD     = 0.005;  // 0.5% يومياً
const MAX_YIELD      = 0.0075; // 0.75% مع الولاء
const EARLY_PENALTY  = 0.10;   // 10% عقوبة السحب المبكر
const LOCK_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 أيام

export function renderVaultTab(container, user) {
  const staked       = user.vaultStaked    || 0;
  const lastDeposit  = user.vaultLastDeposit || Date.now();
  const lastClaim    = user.vaultLastClaim   || Date.now();
  const loyaltyMul   = Math.min(user.vaultLoyaltyMul || 1, 1.5);
  const dailyRate    = Math.min(BASE_YIELD * loyaltyMul, MAX_YIELD);
  const pendingMs    = Date.now() - lastClaim;
  const pendingDays  = pendingMs / (24 * 60 * 60 * 1000);
  const pending      = Math.floor(staked * dailyRate * pendingDays);
  const isLocked     = (Date.now() - lastDeposit) < LOCK_PERIOD_MS;
  const unlockIn     = isLocked
    ? Math.ceil((LOCK_PERIOD_MS - (Date.now() - lastDeposit)) / (60 * 60 * 1000))
    : 0;

  container.innerHTML = `
    <div class="vault-hero">
      <div class="vault-icon"><i class="fas fa-vault"></i></div>
      <h2 class="vault-title">${t('vaultTitle')}</h2>
      <p class="vault-desc">${t('vaultDesc')}</p>
    </div>

    <div class="vault-stats-grid">
      <div class="glass-card vault-stat">
        <i class="fas fa-coins stat-icon" style="color:var(--gold)"></i>
        <div class="stat-val" id="v-staked">${fmt(staked)}</div>
        <div class="stat-lbl">${t('staked')}</div>
      </div>
      <div class="glass-card vault-stat">
        <i class="fas fa-percent stat-icon" style="color:var(--cyan)"></i>
        <div class="stat-val">${(dailyRate * 100).toFixed(3)}%</div>
        <div class="stat-lbl">${t('dailyYield')}</div>
      </div>
      <div class="glass-card vault-stat">
        <i class="fas fa-heart stat-icon" style="color:var(--pink)"></i>
        <div class="stat-val">${loyaltyMul.toFixed(2)}x</div>
        <div class="stat-lbl">${t('loyaltyBonus')}</div>
      </div>
      <div class="glass-card vault-stat pending-card">
        <i class="fas fa-clock-rotate-left stat-icon" style="color:var(--green)"></i>
        <div class="stat-val pending-val">${fmt(pending)}</div>
        <div class="stat-lbl">مكافأة معلقة</div>
      </div>
    </div>

    ${isLocked ? `
    <div class="vault-lock-notice glass-card">
      <i class="fas fa-lock"></i>
      <span>مقفل لمدة ${unlockIn} ساعة أخرى — ${t('earlyPenalty')}</span>
    </div>` : ''}

    <div class="vault-actions glass-card">
      <div class="input-row">
        <input type="number" id="vault-amount-input" class="quinn-input" placeholder="الكمية" min="1" max="${user.tokens}">
        <div class="vault-btn-group">
          <button class="btn btn-success" id="vault-deposit-btn">
            <i class="fas fa-arrow-down"></i> ${t('deposit')}
          </button>
          <button class="btn btn-danger" id="vault-withdraw-btn" ${staked === 0 ? 'disabled' : ''}>
            <i class="fas fa-arrow-up"></i> ${t('withdraw')}
          </button>
        </div>
      </div>
      <div class="balance-hint">
        رصيدك: <span class="gold">${fmt(user.tokens)}</span> Quinn
      </div>
    </div>

    <button class="btn btn-primary btn-claim ${pending === 0 ? 'disabled' : ''}" id="vault-claim-btn" ${pending === 0 ? 'disabled' : ''}>
      <i class="fas fa-gift"></i> ${t('claim')} (${fmt(pending)} Quinn)
    </button>

    <div class="vault-info glass-card">
      <div class="info-row"><i class="fas fa-circle-info"></i> العائد الأساسي 0.5% يومياً</div>
      <div class="info-row"><i class="fas fa-circle-info"></i> الولاء يصل لـ 0.75% مع الوقت</div>
      <div class="info-row"><i class="fas fa-circle-info"></i> السحب قبل 7 أيام: خسارة 10%</div>
    </div>
  `;

  // Events
  document.getElementById('vault-deposit-btn')?.addEventListener('click', () => {
    const amount = parseInt(document.getElementById('vault-amount-input').value);
    stake(amount, user);
  });
  document.getElementById('vault-withdraw-btn')?.addEventListener('click', () => {
    const amount = parseInt(document.getElementById('vault-amount-input').value);
    unstake(amount, user, isLocked);
  });
  document.getElementById('vault-claim-btn')?.addEventListener('click', () => {
    claimReward(pending, user);
  });
}

export function stake(amount, user) {
  if (!amount || amount <= 0)     { window.showToast || console.log)('أدخل كمية صحيحة', 'error'); return; }
  if (amount > user.tokens)       { window.showToast || console.log)(t('insufficientBal'), 'error'); return; }

  user.tokens          -= amount;
  user.vaultStaked      = (user.vaultStaked || 0) + amount;
  user.vaultLastDeposit = Date.now();

  // زيادة مضاعف الولاء بمرور الوقت
  const daysSinceLast = (Date.now() - (user.vaultLastDeposit || Date.now())) / 86400000;
  user.vaultLoyaltyMul  = Math.min(1.5, (user.vaultLoyaltyMul || 1) + 0.01 * daysSinceLast);

  user.addTransaction('vault_deposit', amount);
  user.saveToFirebase();
  window.showToast || console.log)(`✅ تم إيداع ${fmt(amount)} Quinn في الخزانة`);
  document.dispatchEvent(new CustomEvent('refreshTab', { detail: 'vault' }));
}

export function unstake(amount, user, isLocked) {
  if (!amount || amount <= 0)         { window.showToast || console.log)('أدخل كمية صحيحة', 'error'); return; }
  if (amount > user.vaultStaked)      { window.showToast || console.log)('الكمية أكبر من المودع', 'error'); return; }

  let actualAmount = amount;
  if (isLocked) {
    const penalty = Math.floor(amount * EARLY_PENALTY);
    actualAmount  = amount - penalty;
    window.showToast || console.log)(`⚠️ خسرت ${fmt(penalty)} Quinn كعقوبة`, 'warning');
  }

  user.vaultStaked -= amount;
  user.tokens      += actualAmount;

  user.addTransaction('vault_withdraw', actualAmount, { penalty: amount - actualAmount });
  user.saveToFirebase();
  window.showToast || console.log)(`✅ تم سحب ${fmt(actualAmount)} Quinn`);
  document.dispatchEvent(new CustomEvent('refreshTab', { detail: 'vault' }));
}

export function claimReward(pending, user) {
  if (pending <= 0) { window.showToast || console.log)('لا توجد مكافأة بعد', 'info'); return; }
  user.gainTokens(pending);
  user.vaultLastClaim = Date.now();
  user.addTransaction('vault_reward', pending);
  user.saveToFirebase();
  window.showToast || console.log)(`🎁 حصلت على ${fmt(pending)} Quinn مكافأة!`);
  document.dispatchEvent(new CustomEvent('refreshTab', { detail: 'vault' }));
}

function fmt(n) {
  n = Math.floor(n || 0);
  if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}
