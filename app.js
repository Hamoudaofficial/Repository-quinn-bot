// ═══════════════════════════════════════════════
// js/app.js — المدخل الرئيسي للتطبيق
// ═══════════════════════════════════════════════
import { initLang, t, setLang, getLang } from './i18n.js';
import { User, startPeriodicSave, registerBeforeUnload, startEnergyRegen } from './user.js';
import { getRank, getLevelProgress, xpForNext } from './ranks.js';
import { renderVaultTab }                    from './vault.js';
import { renderExchangeTab, initExchange }   from './exchange.js';
import { renderShopTab }                     from './shop.js';
import { renderLeaderboardTab }              from './leaderboard.js';
import { Gamble }                            from './gamble.js';
import { PulseCheck }                        from './games/pulse-check.js';
import { CipherBreak }                       from './games/cipher-break.js';
import { ChartOracle }                       from './games/chart-oracle.js';
import { RektMiner }                         from './games/rekt-miner.js';
import { WhaleHunt }                         from './games/whale-hunt.js';
import { db }                                from './firebase.js';
import {
  collection, query, orderBy, limit, onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

// ── رابط Gemini AI ───────────────────────────
const GEMINI_KEY = 'AIzaSyD6OJry2vr1oxENsI4Ibkru8oDTdPMEu2Y';
const BOT_LINK   = 'https://t.me/Quinnofficialbot';

// ── مرجع المستخدم (mutable ref) ─────────────
export const userRef = { current: null };
let _activeTab = 'home';

// ══════════════════════════════════════════════
// ENTRY POINT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  initLang();

  // ── تحقق Telegram ─────────────────────────
  if (!window.Telegram?.WebApp) {
    _showTelegramOnly();
    return;
  }

  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0A0F1E');
  tg.setBackgroundColor('#0A0F1E');

  const tgUser = tg.initDataUnsafe?.user || { id:'demo_' + Date.now(), first_name:'Quinn Player' };

  // ── تحميل المستخدم ─────────────────────────
  _showLoadingScreen();
  const user = await User.load(tgUser.id, tgUser);
  if (!user) { _showError('فشل تحميل البيانات'); return; }
  userRef.current = user;

  // ── تحقق من الحظر ─────────────────────────
  if (user.banned) { _showBannedScreen(); return; }

  // ── تهيئة Firebase Market ─────────────────
  await initExchange();

  // ── بدء الأنظمة ───────────────────────────
  startEnergyRegen(userRef, _updateEnergyUI);
  startPeriodicSave(userRef);
  registerBeforeUnload(userRef);

  // ── بناء الواجهة ──────────────────────────
  _hideLoadingScreen();
  _buildHeader(user);
  _buildNav();
  _switchTab('home');
  _startNotificationListener();

  // ── أحداث عامة ───────────────────────────
  document.addEventListener('balanceUpdated',  () => _updateHeader());
  document.addEventListener('userBanned',       () => _showBannedScreen());
  document.addEventListener('refreshTab',  e  => { if (e.detail === _activeTab) _switchTab(_activeTab); });
  document.addEventListener('langChanged',      () => { _buildHeader(userRef.current); _switchTab(_activeTab); });

  // ── إشعار إحالة ───────────────────────────
  const startParam = tg.initDataUnsafe?.start_param;
  if (startParam?.startsWith('ref_')) _handleReferral(startParam.slice(4), user);
  if (startParam?.startsWith('stars_')) _handleStarsPayment(startParam, user);
});

// ══════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════
function _buildHeader(user) {
  const rank = getRank(user.totalTokens);
  document.getElementById('hdr-name').textContent    = user.name;
  document.getElementById('hdr-rank').textContent    = rank.nameAr;
  document.getElementById('hdr-rank').style.color    = rank.color;
  document.getElementById('hdr-balance').textContent = fmtQ(user.tokens);
  document.getElementById('hdr-avatar').textContent  = user.name.charAt(0).toUpperCase();
}

function _updateHeader() {
  const u = userRef.current;
  if (!u) return;
  document.getElementById('hdr-balance').textContent = fmtQ(u.tokens);
}

// ══════════════════════════════════════════════
// NAV
// ══════════════════════════════════════════════
function _buildNav() {
  const tabs = [
    { id:'home',        icon:'fa-house',           key:'tabHome'        },
    { id:'vault',       icon:'fa-vault',            key:'tabVault'       },
    { id:'exchange',    icon:'fa-chart-line',       key:'tabExchange'    },
    { id:'arena',       icon:'fa-gamepad',          key:'tabArena'       },
    { id:'leaderboard', icon:'fa-trophy',           key:'tabLeaderboard' },
    { id:'profile',     icon:'fa-user-circle',      key:'tabProfile'     },
  ];

  const nav = document.getElementById('bottom-nav');
  nav.innerHTML = tabs.map(tab => `
    <button class="nav-btn" data-tab="${tab.id}" id="nav-${tab.id}">
      <i class="fas ${tab.icon} nav-icon"></i>
      <span class="nav-label" data-i18n="${tab.key}">${t(tab.key)}</span>
    </button>`).join('');

  nav.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => _switchTab(btn.dataset.tab));
  });
}

function _switchTab(tabId) {
  _activeTab = tabId;

  // تحديث nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`nav-${tabId}`)?.classList.add('active');

  // عرض التبويب
  const container = document.getElementById('tab-content');
  container.innerHTML = '';

  const user = userRef.current;
  switch (tabId) {
    case 'home':        _renderHome(container, user); break;
    case 'vault':       renderVaultTab(container, user); break;
    case 'exchange':    renderExchangeTab(container, user); break;
    case 'arena':       _renderArena(container, user); break;
    case 'leaderboard': renderLeaderboardTab(container, user?.id); break;
    case 'profile':     _renderProfile(container, user); break;
  }
}

// ══════════════════════════════════════════════
// HOME TAB
// ══════════════════════════════════════════════
function _renderHome(container, user) {
  const rank = getRank(user.totalTokens);
  container.innerHTML = `
    <div class="home-tab">
      <div class="glass-card home-stats-card">
        <div class="home-stat">
          <i class="fas fa-coins gold"></i>
          <div>
            <div class="stat-big gold" id="home-balance">${fmtQ(user.tokens)}</div>
            <div class="stat-sub muted">Quinn Tokens</div>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="home-stat">
          <i class="fas fa-bolt" style="color:var(--cyan)"></i>
          <div>
            <div class="stat-big" id="home-tap-power">×${user.tapPower}</div>
            <div class="stat-sub muted">${t('perClick')}</div>
          </div>
        </div>
      </div>

      <div class="tap-area" id="tap-area">
        <div class="tap-ring-outer"></div>
        <div class="tap-ring-inner"></div>
        <div class="tap-orb" id="tap-orb">
          <i class="fas fa-coins tap-icon"></i>
        </div>
      </div>

      <div class="energy-section glass-card">
        <div class="energy-header">
          <span><i class="fas fa-bolt"></i> ${t('energy')}</span>
          <span id="energy-text" class="cyan">${user.energy}/${user.maxEnergy}</span>
        </div>
        <div class="energy-bar">
          <div class="energy-fill" id="energy-fill" style="width:${(user.energy/user.maxEnergy)*100}%"></div>
        </div>
      </div>

      <div class="quick-grid">
        <div class="quick-card glass-card" onclick="openTab('vault')">
          <i class="fas fa-vault gold"></i>
          <span>${t('tabVault')}</span>
        </div>
        <div class="quick-card glass-card" onclick="openTab('exchange')">
          <i class="fas fa-chart-line cyan"></i>
          <span>${t('tabExchange')}</span>
        </div>
        <div class="quick-card glass-card" onclick="openTab('arena')">
          <i class="fas fa-gamepad pink"></i>
          <span>${t('tabArena')}</span>
        </div>
        <div class="quick-card glass-card" id="home-shop-btn">
          <i class="fas fa-bag-shopping" style="color:var(--green)"></i>
          <span>${t('shopTitle')}</span>
        </div>
      </div>
    </div>`;

  // Tap logic
  const orb = document.getElementById('tap-orb');
  orb?.addEventListener('click', e => _handleTap(e, user));
  document.getElementById('home-shop-btn')?.addEventListener('click', () => _openShopModal(user));

  // Global openTab
  window.openTab = (id) => _switchTab(id);
}

let _tapCombo = 0;
let _comboTimer = null;

function _handleTap(e, user) {
  if (user.energy <= 0) { showToast('⚡ نفدت الطاقة!', 'warning'); return; }

  const tapAmt = user.tapPower;
  user.gainTokens(tapAmt);
  user.consumeEnergy(1);
  user.clicks++;

  // تأثير بصري
  _spawnTapFloat(e.clientX, e.clientY, tapAmt);
  document.getElementById('tap-orb')?.classList.add('tap-pulse');
  setTimeout(() => document.getElementById('tap-orb')?.classList.remove('tap-pulse'), 120);

  // Combo
  _tapCombo++;
  clearTimeout(_comboTimer);
  _comboTimer = setTimeout(() => { _tapCombo = 0; }, 1500);

  if (_tapCombo > 0 && _tapCombo % 20 === 0) {
    showToast(`🔥 كومبو ×${_tapCombo}!`, 'success');
  }

  // تحديث UI
  document.getElementById('home-balance').textContent = fmtQ(user.tokens);
  document.getElementById('hdr-balance').textContent  = fmtQ(user.tokens);
  _updateEnergyUI();
}

function _spawnTapFloat(x, y, val) {
  const el = document.createElement('div');
  el.className = 'tap-float';
  el.textContent = `+${val}`;
  el.style.left  = x + 'px';
  el.style.top   = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function _updateEnergyUI() {
  const u = userRef.current;
  if (!u) return;
  const pct = (u.energy / u.maxEnergy) * 100;
  const fill = document.getElementById('energy-fill');
  const txt  = document.getElementById('energy-text');
  if (fill) fill.style.width = pct + '%';
  if (txt)  txt.textContent  = `${u.energy}/${u.maxEnergy}`;
}

// ══════════════════════════════════════════════
// ARENA TAB
// ══════════════════════════════════════════════
function _renderArena(container, user) {
  container.innerHTML = `
    <div class="arena-tab">
      <h2 class="section-title"><i class="fas fa-gamepad"></i> ${t('arenaTitle')}</h2>

      <div class="arena-section-tabs">
        <button class="section-tab active" data-section="games">
          <i class="fas fa-dice-d20"></i> ${t('games')}
        </button>
        <button class="section-tab" data-section="gamble">
          <i class="fas fa-coins"></i> ${t('gamble')}
        </button>
        <button class="section-tab" data-section="shop">
          <i class="fas fa-bag-shopping"></i> ${t('shopTitle')}
        </button>
      </div>

      <div id="arena-section-content"></div>
    </div>`;

  const sectionContent = document.getElementById('arena-section-content');

  function loadSection(name) {
    container.querySelectorAll('.section-tab').forEach(b => b.classList.remove('active'));
    container.querySelector(`[data-section="${name}"]`)?.classList.add('active');
    sectionContent.innerHTML = '';
    if      (name === 'games')  _renderGames(sectionContent, user);
    else if (name === 'gamble') new Gamble(user).renderLobby(sectionContent);
    else if (name === 'shop')   renderShopTab(sectionContent, user);
  }

  container.querySelectorAll('.section-tab').forEach(btn => {
    btn.addEventListener('click', () => loadSection(btn.dataset.section));
  });

  loadSection('games');
}

const GAMES_LIST = [
  { Class: PulseCheck,   name:'pulse_check',  title:'Pulse Check',  icon:'fa-heart-pulse',    desc:'اضغط عند اللحظة المناسبة',   minRank:'dreamer'    },
  { Class: CipherBreak,  name:'cipher_break', title:'Cipher Break', icon:'fa-brain',           desc:'احفظ التسلسل الرقمي',         minRank:'explorer'   },
  { Class: ChartOracle,  name:'chart_oracle', title:'Chart Oracle', icon:'fa-chart-line',      desc:'توقع اتجاه السعر',            minRank:'alchemist'  },
  { Class: RektMiner,    name:'rekt_miner',   title:'Rekt Miner',   icon:'fa-mountain',        desc:'دمّر الصخور بسرعة',           minRank:'miner'      },
  { Class: WhaleHunt,    name:'whale_hunt',   title:'Whale Hunt',   icon:'fa-fish',            desc:'اصطد الحيتان!',               minRank:'dreamer'    },
];

function _renderGames(container, user) {
  container.innerHTML = `
    <div class="games-list">
      ${GAMES_LIST.map(g => {
        const onCD = _isOnCooldown(g.name);
        const cdSec = _getCooldownSec(g.name);
        return `
          <div class="game-card glass-card">
            <div class="game-card-icon" style="color:var(--gold)">
              <i class="fas ${g.icon}"></i>
            </div>
            <div class="game-card-info">
              <div class="game-card-title">${g.title}</div>
              <div class="game-card-desc muted">${g.desc}</div>
            </div>
            <button class="btn btn-game ${onCD ? 'btn-cooldown' : ''}" data-game="${g.name}"
                    ${onCD ? 'disabled' : ''}>
              ${onCD ? `<i class="fas fa-clock"></i> ${cdSec}ث` : `<i class="fas fa-play"></i> ${t('play')}`}
            </button>
          </div>`;
      }).join('')}
    </div>
    <div id="game-area" class="game-area-container" style="display:none"></div>`;

  container.querySelectorAll('.btn-game:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const gameName = btn.dataset.game;
      const G = GAMES_LIST.find(g => g.name === gameName);
      if (!G) return;
      const gameArea = document.getElementById('game-area');
      gameArea.style.display = 'block';
      gameArea.innerHTML = `
        <div class="game-header">
          <button class="btn-back" id="game-back"><i class="fas fa-arrow-left"></i></button>
          <h3>${G.title}</h3>
        </div>
        <div id="game-container"></div>`;
      document.getElementById('game-back').addEventListener('click', () => {
        gameArea.style.display = 'none';
        _renderGames(container, user);
      });
      const instance = new G.Class(document.getElementById('game-container'), user);
      instance.start();
      document.addEventListener('gameEnded', () => {
        setTimeout(() => {
          gameArea.style.display = 'none';
          _renderGames(container, user);
        }, 3000);
      }, { once: true });
    });
  });
}

function _isOnCooldown(name) {
  const last = parseInt(localStorage.getItem(`quinn_game_cd_${name}`) || '0');
  const cooldowns = { pulse_check:60000, cipher_break:120000, chart_oracle:90000, rekt_miner:60000, whale_hunt:45000 };
  return Date.now() - last < (cooldowns[name] || 60000);
}
function _getCooldownSec(name) {
  const last = parseInt(localStorage.getItem(`quinn_game_cd_${name}`) || '0');
  const cooldowns = { pulse_check:60000, cipher_break:120000, chart_oracle:90000, rekt_miner:60000, whale_hunt:45000 };
  return Math.max(0, Math.ceil(((cooldowns[name] || 60000) - (Date.now() - last)) / 1000));
}

// ══════════════════════════════════════════════
// PROFILE TAB
// ══════════════════════════════════════════════
function _renderProfile(container, user) {
  const rank      = getRank(user.totalTokens);
  const progress  = getLevelProgress(user.xp, rank);
  const xpNeeded  = xpForNext(rank);
  const daysSince = Math.max(1, Math.floor((Date.now() - user.joinDate) / 86400000));

  container.innerHTML = `
    <div class="profile-tab">
      <div class="profile-hero glass-card">
        <div class="profile-avatar-big" style="background:${rank.color}20;border-color:${rank.color}">
          ${user.name.charAt(0).toUpperCase()}
        </div>
        <div class="profile-info">
          <h2>${user.name}</h2>
          <div class="profile-rank" style="color:${rank.color}">
            <i class="fas ${rank.icon}"></i> ${rank.nameAr}
          </div>
          <div class="muted small">${t('level')} ${user.level}</div>
        </div>
        <button class="btn-icon" id="settings-btn"><i class="fas fa-gear"></i></button>
      </div>

      <div class="profile-stats-grid">
        <div class="glass-card pstat"><i class="fas fa-coins gold"></i><div>${fmtQ(user.totalTokens)}</div><div class="muted small">${t('totalEarned')}</div></div>
        <div class="glass-card pstat"><i class="fas fa-mouse-pointer cyan"></i><div>${fmtQ(user.clicks)}</div><div class="muted small">إجمالي النقرات</div></div>
        <div class="glass-card pstat"><i class="fas fa-users pink"></i><div>${user.referrals}</div><div class="muted small">${t('referrals')}</div></div>
        <div class="glass-card pstat"><i class="fas fa-calendar green"></i><div>${daysSince}</div><div class="muted small">يوم منذ الانضمام</div></div>
      </div>

      <div class="glass-card level-card">
        <div class="level-header">
          <span>${t('level')} ${user.level}</span>
          <span class="muted small">${fmtQ(user.xp)} / ${fmtQ(xpNeeded)} XP</span>
        </div>
        <div class="level-bar-bg">
          <div class="level-bar-fill" style="width:${progress}%;background:${rank.color}"></div>
        </div>
        <div class="muted small mt">المستوى التالي: ${rank.nameAr}</div>
      </div>

      <div class="glass-card wallet-card">
        <div class="wallet-header">
          <i class="fas fa-wallet gold"></i>
          <span>معرف المحفظة</span>
          <button class="btn-icon" id="copy-wallet-btn"><i class="fas fa-copy"></i></button>
        </div>
        <div class="wallet-id mono">${user.walletId}</div>
      </div>

      <button class="btn btn-outline invite-btn" id="invite-btn">
        <i class="fas fa-share-nodes"></i> دعوة صديق (رمز: ${user.referralCode})
      </button>

      <div class="glass-card secure-key-card" id="secure-key-section" style="display:none">
        <div class="secure-key-header">
          <i class="fas fa-shield-halved gold"></i>
          <span>${t('secureKey')}</span>
        </div>
        <div class="secure-key-value mono" id="secure-key-val">•••••••••••••••</div>
        <div class="secure-key-warn">${t('secureKeyWarn')}</div>
        <button class="btn btn-sm" id="reveal-key-btn"><i class="fas fa-eye"></i> إظهار المفتاح</button>
      </div>

      <div id="settings-panel" style="display:none" class="glass-card settings-panel">
        <h3><i class="fas fa-gear"></i> ${t('settings')}</h3>
        <div class="setting-row">
          <span>${t('language')}</span>
          <div class="lang-btns">
            ${['ar','en','ru','es'].map(l => `
              <button class="btn-lang ${getLang()===l?'active':''}" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}
          </div>
        </div>
        <div class="setting-row">
          <span>${t('notifications')}</span>
          <div class="toggle ${user.notifications ? 'on' : ''}" id="notif-toggle"></div>
        </div>
        <div class="setting-row">
          <span>مفتاح الاسترداد السري</span>
          <button class="btn btn-sm" id="show-secure-key-settings">عرض</button>
        </div>
      </div>
    </div>`;

  // Events
  document.getElementById('settings-btn')?.addEventListener('click', () => {
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  document.querySelectorAll('.btn-lang').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  document.getElementById('notif-toggle')?.addEventListener('click', function() {
    user.notifications = !user.notifications;
    this.classList.toggle('on');
    user.saveToFirebase();
  });

  document.getElementById('copy-wallet-btn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(user.walletId);
    showToast(t('copied'));
  });

  document.getElementById('invite-btn')?.addEventListener('click', () => {
    const link = `${BOT_LINK}?start=ref_${user.id}`;
    if (window.Telegram?.WebApp) window.Telegram.WebApp.openTelegramLink(link);
    else navigator.clipboard?.writeText(link);
    showToast('تم نسخ رابط الدعوة!');
  });

  document.getElementById('reveal-key-btn')?.addEventListener('click', () => {
    const el = document.getElementById('secure-key-val');
    if (el) el.textContent = user.secureKey || 'لم يتم توليد المفتاح';
  });

  document.getElementById('show-secure-key-settings')?.addEventListener('click', () => {
    const sec = document.getElementById('secure-key-section');
    sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
  });
}

// ══════════════════════════════════════════════
// SHOP MODAL
// ══════════════════════════════════════════════
function _openShopModal(user) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal-box glass-card">
      <div class="modal-header">
        <h3><i class="fas fa-bag-shopping"></i> ${t('shopTitle')}</h3>
        <button class="modal-close" id="shop-modal-close"><i class="fas fa-xmark"></i></button>
      </div>
      <div id="shop-modal-content"></div>
    </div>`;
  document.body.appendChild(overlay);
  renderShopTab(document.getElementById('shop-modal-content'), user);
  document.getElementById('shop-modal-close').addEventListener('click', () => overlay.remove());
}

// ══════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════
function _startNotificationListener() {
  const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(1));
  let _firstLoad = true;
  onSnapshot(q, snap => {
    if (_firstLoad) { _firstLoad = false; return; }
    snap.docChanges().forEach(change => {
      if (change.type === 'added') {
        const data = change.doc.data();
        showToast(`🔔 ${data.message}`, 'info');
        _showNotificationBadge();
      }
    });
  });
}

function _showNotificationBadge() {
  const badge = document.getElementById('notif-badge');
  if (badge) badge.style.display = 'block';
}

// ══════════════════════════════════════════════
// REFERRAL
// ══════════════════════════════════════════════
async function _handleReferral(referrerId, user) {
  if (user.referredBy || user.id === referrerId) return;
  try {
    const { doc, updateDoc, increment: inc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
    user.referredBy = referrerId;
    user.gainTokens(1000);  // مكافأة المُحال
    user.addTransaction('referral_bonus', 1000, { from: referrerId });
    await updateDoc(doc(db, 'users', referrerId), {
      referrals: inc(1),
      tokens:    inc(5000),
      totalTokens: inc(5000)
    });
    user.saveToFirebase();
    showToast('🎁 حصلت على 1000 Quinn كمكافأة إحالة!');
  } catch (err) { console.error('Referral error:', err); }
}

async function _handleStarsPayment(param, user) {
  const parts = param.split('_');
  const quinn = parseInt(parts[2] || 0);
  if (quinn > 0) {
    user.gainTokens(quinn);
    user.addTransaction('stars_purchase', quinn);
    user.saveToFirebase();
    showToast(`⭐ تم إضافة ${quinn} Quinn من النجوم!`);
  }
}

// ══════════════════════════════════════════════
// GEMINI AI ASSISTANT
// ══════════════════════════════════════════════
export async function askGemini(prompt) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `أنت مساعد ذكي في تطبيق Quinn Bot. أجب بالعربية بشكل مختصر. ${prompt}` }] }]
        })
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'لم أستطع الإجابة.';
  } catch (err) {
    return 'خطأ في الاتصال بـ Gemini.';
  }
}

// ══════════════════════════════════════════════
// HELPER SCREENS
// ══════════════════════════════════════════════
function _showTelegramOnly() {
  document.body.innerHTML = `
    <div class="tg-only-screen">
      <i class="fas fa-telegram tg-icon"></i>
      <h2>${t('tgOnly')}</h2>
      <a href="${BOT_LINK}" class="btn btn-primary">${t('openBot')}</a>
    </div>`;
}

function _showBannedScreen() {
  document.body.innerHTML = `
    <div class="banned-screen">
      <i class="fas fa-ban banned-icon"></i>
      <h2>${t('banned')}</h2>
      <a href="https://t.me/Quinnofficialbot" class="btn btn-outline">تواصل مع الدعم</a>
    </div>`;
}

function _showLoadingScreen() {
  document.body.innerHTML += `
    <div id="loading-screen" class="loading-screen">
      <div class="loader-orb"></div>
      <div class="loader-text">Quinn Bot</div>
      <div class="loader-sub muted">2026</div>
    </div>`;
}

function _hideLoadingScreen() {
  document.getElementById('loading-screen')?.remove();
}

function _showError(msg) {
  document.body.innerHTML = `<div class="error-screen"><i class="fas fa-triangle-exclamation"></i><p>${msg}</p></div>`;
}

// ══════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════
let _toastTimer = null;
export function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();
  clearTimeout(_toastTimer);

  const el = document.createElement('div');
  el.className = `toast-msg toast-${type}`;
  el.innerHTML = msg;
  document.body.appendChild(el);

  _toastTimer = setTimeout(() => el.remove(), 3000);
}

// ══════════════════════════════════════════════
// FORMAT
// ══════════════════════════════════════════════
function fmtQ(n) {
  n = Math.floor(n || 0);
  if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return n.toLocaleString();
}
// Export showToast for cross-module use
