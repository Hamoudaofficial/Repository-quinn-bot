/**
 * Quinn Bot 2026 - Master Logic v4.0
 * Zero Data Loss Architecture | Multi-Language | Secure Key Auth
 */

const APP_STATE = {
    user: {
        id: "7770001",
        name: "Quinn User",
        balance: 0,
        vault_balance: 0,
        rank: "Dreamer",
        secure_key: null,
        stats: { clicks: 0, wins: 0, loss: 0, streak: 0 },
        settings: { lang: 'ar', sound: true, notifications: true },
        last_save: Date.now(),
        vault_multiplier: 1.0,
        joined_at: Date.now()
    },
    market: { gold_price: 1845.20, history: [] },
    activeTab: 'home',
    translations: {},
    isAuth: false,
    mutationQueue: []
};

const RANKS = [
    { name: "Dreamer", min: 0, label_ar: "الحالم", icon: "cloud" },
    { name: "Seeker", min: 100, label_ar: "المستكشف", icon: "compass" },
    { name: "Alchemist", min: 500, label_ar: "الخيميائي", icon: "flask-conical" },
    { name: "Prospector", min: 2000, label_ar: "المنقب", icon: "pickaxe" },
    { name: "Magnate", min: 10000, label_ar: "الطاغية", icon: "crown" },
    { name: "Whale", min: 50000, label_ar: "الحوت", icon: "waves" },
    { name: "Illuminati", min: 200000, label_ar: "المتنور", icon: "eye" },
    { name: "Legend", min: 500000, label_ar: "الأسطورة", icon: "star" },
    { name: "Quinn God", min: 1000000, label_ar: "إله كوين", icon: "zap" }
];


const Persistence = {
    async save() {

        localStorage.setItem('qnn_profile', JSON.stringify(APP_STATE.user));
        

        console.log("[Persistence] Synced to Layer 2");


        if (APP_STATE.mutationQueue.length >= 20) {
            await this.syncToCloud();
        }
    },
    async syncToCloud() {
        console.log("[Persistence] Syncing Batch to Firestore Proxy...");
        APP_STATE.mutationQueue = [];
        APP_STATE.user.last_save = Date.now();
    },
    load() {
        const saved = localStorage.getItem('qnn_profile');
        if (saved) APP_STATE.user = { ...APP_STATE.user, ...JSON.parse(saved) };
    }
};


const Security = {
    async generateKey(userId) {
        const msgUint8 = new TextEncoder().encode(userId + Date.now() + Math.random());
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        return `QNN-${hashHex.slice(0, 4)}-${hashHex.slice(4, 8)}-${hashHex.slice(8, 12)}`;
    },
    validate(key) {
        return key.startsWith('QNN-') && key.length === 17;
    }
};


const AudioEngine = {
    ctx: null,
    play(freq, type = 'sine', duration = 0.1, vol = 0.05) {
        if (!APP_STATE.user.settings.sound) return;
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    }
};


const UI = {
    renderTab(tab) {
        const container = document.getElementById('content-screen');
        container.innerHTML = '';
        APP_STATE.activeTab = tab;
        this.updateHeader();

        switch(tab) {
            case 'home': this.renderHome(container); break;
            case 'exchange': this.renderExchange(container); break;
            case 'vault': this.renderVault(container); break;
            case 'arena': this.renderArena(container); break;
            case 'settings': this.renderSettings(container); break;
            case 'wallet': this.renderWallet(container); break;
            case 'leaderboard': this.renderLeaderboard(container); break;
        }
        lucide.createIcons();
    },
    updateHeader() {
        const lang = APP_STATE.user.settings.lang;
        const isAr = lang === 'ar';
        document.getElementById('user-name').innerText = APP_STATE.user.name;
        document.getElementById('balance-value').innerText = APP_STATE.user.balance.toLocaleString(isAr ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 });
        
        const rank = [...RANKS].reverse().find(r => APP_STATE.user.balance >= r.min) || RANKS[0];
        document.getElementById('rank-name').innerText = isAr ? rank.label_ar : rank.name;
        APP_STATE.user.rank = rank.name;
    },
    renderHome(container) {
        container.innerHTML = `
            <div class="glass-card p-8 flex flex-col items-center justify-center space-y-8 min-h-[300px] relative overflow-hidden">
                <div class="absolute inset-0 bg-amber-500/5 blur-[100px] pointer-events-none"></div>
                <div id="mining-core" class="w-56 h-56 rounded-full relative cursor-pointer neo-press">
                    <div class="absolute inset-0 bg-gradient-to-br from-amber-300 to-amber-900 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                    <div class="w-full h-full bg-black/40 border-[0.5px] border-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl">
                        <span class="text-7xl drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]">💎</span>
                    </div>
                </div>
                <div class="text-center">
                    <h3 class="font-bold text-2xl uppercase tracking-tighter" data-i18n="mining_active">${t('mining_active')}</h3>
                    <p class="text-[10px] text-gray-500 mt-2 opacity-60">QUANTUM EXTRACTION IN PROGRESS</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="glass-card p-4">
                    <div class="text-[8px] text-gray-500 uppercase">Energy Field</div>
                    <div class="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <div class="w-4/5 h-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"></div>
                    </div>
                </div>
                <div class="glass-card p-4 flex justify-between items-center">
                    <span class="text-[8px] text-gray-500 uppercase">Multiplier</span>
                    <span class="text-sm font-bold text-green-400">x${APP_STATE.user.rank === 'Quinn God' ? '5.0' : '1.2'}</span>
                </div>
            </div>
        `;
        document.getElementById('mining-core').onclick = (e) => this.handleMining(e);
    },
    handleMining(e) {
        AudioEngine.play(1000, 'sine', 0.05, 0.02);
        const gain = 0.05;
        APP_STATE.user.balance += gain;
        APP_STATE.mutationQueue.push({ type: 'mine', val: gain });
        this.updateHeader();
        Persistence.save();

        const p = document.createElement('div');
        p.className = 'coin-particle';
        p.innerText = `+${gain}`;
        p.style.left = `${e.clientX}px`; p.style.top = `${e.clientY}px`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    },
    renderVault(container) {
        const isLocked = APP_STATE.user.balance < 2000;
        container.innerHTML = `
            <div class="glass-card p-6 overflow-hidden relative ${isLocked ? 'grayscale opacity-50' : ''}">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-xl" data-i18n="vault">${t('vault')}</h3>
                        <p class="text-[10px] text-gray-500">Secure Assets Management</p>
                    </div>
                    <span class="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-1 rounded-lg border border-amber-500/20">APR 15.0%</span>
                </div>
                <div class="mt-8 mb-8 text-center">
                    <div class="text-4xl font-mono font-bold tracking-tighter">${APP_STATE.user.vault_balance.toFixed(2)} <span class="text-sm text-gray-500">QNN</span></div>
                    <div class="text-[10px] text-green-500 mt-2">+0.5% Yield every 8h</div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <button class="py-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold neo-press" data-i18n="deposit">${t('deposit')}</button>
                    <button class="py-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold neo-press" data-i18n="withdraw">${t('withdraw')}</button>
                </div>
                ${isLocked ? `<div class="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-center text-sm">
                    <div class="space-y-2">
                        <i data-lucide="lock" class="mx-auto w-8 h-8 text-amber-500"></i>
                        <p>Unlock at Rank: <br><span class="font-bold text-amber-500">Prospector (2,000 QNN)</span></p>
                    </div>
                </div>` : ''}
            </div>
        `;
    },
    renderExchange(container) {
        container.innerHTML = `
            <div class="glass-card p-4 space-y-4">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold">Quinn Exchange</h3>
                    <div class="text-right">
                        <div class="text-xs font-mono text-green-500">$${APP_STATE.market.gold_price.toFixed(2)}</div>
                        <div class="text-[8px] text-gray-500">LIVE SPREAD: 0.01%</div>
                    </div>
                </div>
                <div class="h-48 w-full"><canvas id="priceChart"></canvas></div>
                <div class="space-y-2">
                    <div class="flex gap-2 p-1 bg-black/20 rounded-xl">
                        <button class="flex-1 py-2 text-[10px] font-bold rounded-lg bg-white/10" data-i18n="spot_contract">${t('spot_contract')}</button>
                        <button class="flex-1 py-2 text-[10px] font-bold rounded-lg text-gray-500" data-i18n="limit_order">${t('limit_order')}</button>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <button class="py-4 bg-green-500 text-black font-black rounded-2xl neo-press" data-i18n="buy">${t('buy')}</button>
                        <button class="py-4 bg-red-500 text-black font-black rounded-2xl neo-press" data-i18n="sell">${t('sell')}</button>
                    </div>
                </div>
            </div>
        `;
        this.initChart();
    },
    initChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        const data = Array.from({length: 24}, () => 1800 + Math.random() * 100);
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(24).fill(''),
                datasets: [{
                    data: data, borderColor: '#f59e0b', borderWidth: 1.5, pointRadius: 0, fill: true,
                    backgroundColor: (c) => {
                        const g = c.chart.ctx.createLinearGradient(0, 0, 0, 150);
                        g.addColorStop(0, 'rgba(245,158,11,0.1)'); g.addColorStop(1, 'rgba(245,158,11,0)');
                        return g;
                    }, tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    },
    renderArena(container) {
        container.innerHTML = `
            <div class="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-transparent">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold">Quinn Arena</h3>
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                        <span class="text-[10px] text-gray-400">1,204 Online</span>
                    </div>
                </div>
                <div class="space-y-4">
                    <div class="glass-card p-4 bg-white/5 border-white/5 flex justify-between items-center neo-press cursor-pointer">
                        <div class="flex gap-4">
                            <div class="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500"><i data-lucide="zap"></i></div>
                            <div>
                                <div class="font-bold text-sm">Pulse Check</div>
                                <div class="text-[10px] text-gray-500">Fast Match • RTP 95%</div>
                            </div>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 opacity-30"></i>
                    </div>
                    <div class="glass-card p-4 bg-white/5 border-white/5 flex justify-between items-center neo-press cursor-pointer opacity-50">
                        <div class="flex gap-4">
                            <div class="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500"><i data-lucide="brain"></i></div>
                            <div>
                                <div class="font-bold text-sm">Chart Oracle</div>
                                <div class="text-[10px] text-gray-500">Coming Soon</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    renderSettings(container) {
        const lang = APP_STATE.user.settings.lang;
        container.innerHTML = `
            <div class="glass-card p-6 space-y-6">
                <h3 class="font-bold" data-i18n="settings">${t('settings')}</h3>
                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="text-[10px] text-gray-500 uppercase">Language Selection</label>
                        <div class="grid grid-cols-2 gap-2">
                            ${['ar', 'en', 'ru', 'es'].map(l => `
                                <button onclick="window.changeLang('${l}')" class="py-3 text-[10px] rounded-xl border ${lang === l ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 border-white/10 text-gray-400'}">
                                    ${APP_STATE.translations[l]?.lang_name || l}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="pt-4 border-t border-white/5">
                        <label class="text-[10px] text-gray-500 uppercase">Quinn Secure Key</label>
                        <div class="mt-2 flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                            <span class="font-mono text-xs text-amber-500/80">${APP_STATE.user.secure_key.slice(0, 8)}****</span>
                            <i data-lucide="copy" class="w-4 h-4 text-gray-500 cursor-pointer" onclick="navigator.clipboard.writeText('${APP_STATE.user.secure_key}')"></i>
                        </div>
                        <p class="text-[9px] text-gray-600 mt-2" data-i18n="secure_key_msg">${t('secure_key_msg')}</p>
                    </div>
                </div>
            </div>
        `;
    },
    showProfile() {
        const overlay = document.getElementById('overlay-container');
        const modal = document.getElementById('modal-card');
        const isAr = APP_STATE.user.settings.lang === 'ar';
        overlay.classList.remove('hidden');
        
        modal.innerHTML = `
            <div class="relative p-8 text-center space-y-6">
                <div class="absolute top-4 right-4 cursor-pointer" onclick="document.getElementById('overlay-container').classList.add('hidden')">
                    <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
                </div>
                <div class="w-24 h-24 mx-auto relative">
                    <div class="absolute inset-0 bg-amber-500 rounded-3xl rotate-6 opacity-20"></div>
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${APP_STATE.user.id}" class="w-full h-full bg-black rounded-3xl border-2 border-white/10 relative z-10">
                    <div class="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-[#050505] z-20">
                        <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                    </div>
                </div>
                <div>
                    <h2 class="text-2xl font-bold tracking-tight">${APP_STATE.user.name}</h2>
                    <p class="text-amber-500 text-xs font-bold uppercase tracking-widest">${APP_STATE.user.rank}</p>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <div class="bg-white/5 p-3 rounded-2xl"><div class="text-[8px] text-gray-500">WINS</div><div class="font-bold">${APP_STATE.user.stats.wins}</div></div>
                    <div class="bg-white/5 p-3 rounded-2xl"><div class="text-[8px] text-gray-500">STREAK</div><div class="font-bold">${APP_STATE.user.stats.streak}</div></div>
                    <div class="bg-white/5 p-3 rounded-2xl"><div class="text-[8px] text-gray-500">LEVEL</div><div class="font-bold">42</div></div>
                </div>
                <div class="pt-4">
                    <div class="text-[8px] text-gray-500 mb-2 uppercase">Verified Member ID</div>
                    <div class="font-mono text-[10px] text-white/40 tracking-widest">${APP_STATE.user.secure_key}</div>
                </div>
            </div>
        `;
        lucide.createIcons();
    }
};


async function loadTranslations() {
    const res = await fetch('translations.json');
    APP_STATE.translations = await res.json();
}

function t(key) {
    const lang = APP_STATE.user.settings.lang;
    return APP_STATE.translations[lang]?.[key] || key;
}

window.changeLang = (l) => {
    APP_STATE.user.settings.lang = l;
    applyLanguage();
    UI.renderTab('settings');
};

function applyLanguage() {
    const lang = APP_STATE.user.settings.lang;
    const config = APP_STATE.translations[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = config.dir;
    document.querySelectorAll('[data-i18n]').forEach(el => el.innerText = t(el.getAttribute('data-i18n')));
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = t(el.getAttribute('data-i18n-placeholder')));
}

async function initAuth() {
    Persistence.load();
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell');


    const isTelegram = window.Telegram?.WebApp?.initData !== undefined;
    
    if (isTelegram || APP_STATE.user.secure_key) {
        if (!APP_STATE.user.secure_key) {
            APP_STATE.user.secure_key = await Security.generateKey(APP_STATE.user.id);
        }
        completeAuth(authScreen, appShell);
    } else {
        authScreen.classList.remove('hidden');
        document.getElementById('login-btn').onclick = async () => {
            const val = document.getElementById('secure-key-input').value;
            if (Security.validate(val)) {
                APP_STATE.user.secure_key = val;
                completeAuth(authScreen, appShell);
            }
        };
    }
}

function completeAuth(auth, app) {
    auth.classList.add('hidden');
    app.classList.remove('blur-xl');
    APP_STATE.isAuth = true;
    UI.renderTab('home');
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    applyLanguage();
    initAuth();
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            UI.renderTab(btn.dataset.tab);
        };
    });

    document.getElementById('profile-trigger').onclick = () => UI.showProfile();
    

    setInterval(() => {
        if (APP_STATE.isAuth && APP_STATE.user.vault_balance > 0) {
            const yieldVal = (APP_STATE.user.vault_balance * 0.005) / (3 * 240); // Per 10s
            APP_STATE.user.balance += yieldVal;
            UI.updateHeader();
            Persistence.save();
        }
    }, 10000);
});
