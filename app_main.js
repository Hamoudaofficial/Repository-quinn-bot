/**
 * Quinn Bot 2026 - Master Logic v5.0 (Ultimate Build)
 */

const APP_STATE = {
    user: {
        id: "qnn_" + Math.random().toString(36).substr(2, 9),
        name: "Quinn Operative",
        balance: 0,
        vault_balance: 0,
        vault_last_claim: Date.now(),
        vault_multiplier_start: Date.now(),
        secure_key: null,
        stats: { wins: 0, losses: 0, series: 0 },
        settings: { lang: 'ar', theme: 'dark' },
        last_sync: Date.now()
    },
    market: { price: 1845.50, history: [] },
    activeTab: 'home',
    chart: null,
    translations: {},
    isAuth: false
};

const RANKS = [
    { name: "Dreamer", min: 0, label: "الحالم", icon: "cloud", max_vault: 0 },
    { name: "Seeker", min: 100, label: "المستكشف", icon: "compass", max_vault: 0 },
    { name: "Alchemist", min: 500, label: "الخيميائي", icon: "flask-conical", max_vault: 0 },
    { name: "Prospector", min: 2000, label: "المنقب", icon: "pickaxe", max_vault: 100000 },
    { name: "Magnate", min: 10000, label: "الطاغية", icon: "crown", max_vault: 250000 },
    { name: "Whale", min: 50000, label: "الحوت", icon: "waves", max_vault: 500000 },
    { name: "Illuminati", min: 200000, label: "المتنور", icon: "eye", max_vault: 750000 },
    { name: "Legend", min: 500000, label: "الأسطورة", icon: "star", max_vault: 1000000 },
    { name: "Quinn God", min: 1000000, label: "إله كوين", icon: "zap", max_vault: 5000000 }
];

const Persistence = {
    save() {

        localStorage.setItem('qnn_2026_profile', JSON.stringify(APP_STATE.user));

        if (Date.now() - APP_STATE.user.last_sync > 30000) this.cloudSync();
    },
    cloudSync() {
        APP_STATE.user.last_sync = Date.now();
        console.log("Syncing to Firebase Firestore (Optimized)...");
    },
    load() {
        const saved = localStorage.getItem('qnn_2026_profile');
        if (saved) APP_STATE.user = { ...APP_STATE.user, ...JSON.parse(saved) };
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
            case 'wallet': this.renderWallet(container); break;
            case 'leaderboard': this.renderLeaderboard(container); break;
            case 'settings': this.renderSettings(container); break;
        }
        lucide.createIcons();
    },

    updateHeader() {
        const isAr = APP_STATE.user.settings.lang === 'ar';
        const locale = isAr ? 'ar-EG' : 'en-US';
        document.getElementById('user-name').innerText = APP_STATE.user.name;
        document.getElementById('balance-value').innerText = APP_STATE.user.balance.toLocaleString(locale, { minimumFractionDigits: 2 });
        const rank = [...RANKS].reverse().find(r => APP_STATE.user.balance >= r.min) || RANKS[0];
        document.getElementById('rank-name').innerText = isAr ? rank.label : rank.name;
        document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${APP_STATE.user.id}`;
    },

    renderHome(container) {
        container.innerHTML = `
            <div class="glass-card p-10 flex flex-col items-center justify-center space-y-8 min-h-[350px]">
                <div id="mining-orb" class="w-64 h-64 rounded-full relative cursor-pointer neo-press active:scale-95 transition-all">
                    <div class="absolute inset-0 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div class="w-full h-full bg-black/40 border-[0.5px] border-white/20 rounded-full flex items-center justify-center backdrop-blur-2xl shadow-2xl overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent"></div>
                        <span class="text-8xl drop-shadow-2xl">💎</span>
                    </div>
                </div>
                <div class="text-center">
                    <h3 class="font-black text-2xl tracking-tighter" data-i18n="mining_active">QUANTUM MINING</h3>
                    <p class="text-xs text-gray-500 mt-2 uppercase tracking-widest">+0.05 QNN / Pulse</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="glass-card p-4"><p class="text-[9px] text-gray-500">TPS</p><p class="font-bold">1,240.2</p></div>
                <div class="glass-card p-4"><p class="text-[9px] text-gray-500">NODE</p><p class="font-bold">#2026-X</p></div>
            </div>`;
        document.getElementById('mining-orb').onclick = (e) => this.handleMining(e);
    },

    handleMining(e) {
        APP_STATE.user.balance += 0.05;
        this.updateHeader();
        Persistence.save();
        const p = document.createElement('div');
        p.className = 'coin-particle';
        p.innerText = '+0.05';
        p.style.left = `${e.clientX}px`; p.style.top = `${e.clientY}px`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    },

    renderVault(container) {
        const rank = [...RANKS].reverse().find(r => APP_STATE.user.balance >= r.min);
        const isLocked = rank.min < 2000;
        
        container.innerHTML = `
            <div class="glass-card p-6 overflow-hidden relative ${isLocked ? 'grayscale opacity-60' : ''}">
                <div class="flex justify-between items-start mb-8">
                    <div>
                        <h3 class="font-black text-xl">QUINN VAULT</h3>
                        <p class="text-[10px] text-gray-500 uppercase">Passive Income Engine</p>
                    </div>
                    <i data-lucide="landmark" class="text-amber-500"></i>
                </div>
                <div class="text-center py-6">
                    <div class="text-5xl font-black font-mono tracking-tighter text-amber-500">${APP_STATE.user.vault_balance.toFixed(2)}</div>
                    <p class="text-[10px] text-gray-500 mt-1 uppercase">Deposited Capital</p>
                </div>
                <div class="space-y-3">
                    <div class="flex justify-between text-[10px]">
                        <span>Daily Yield</span>
                        <span class="text-green-500 font-bold">0.5% - 1.25%</span>
                    </div>
                    <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full bg-amber-500 w-[40%]"></div>
                    </div>
                    <div class="flex gap-2 pt-4">
                        <button class="flex-1 bg-white text-black py-4 rounded-xl font-bold text-xs">DEPOSIT</button>
                        <button class="flex-1 bg-white/5 border border-white/10 py-4 rounded-xl font-bold text-xs">WITHDRAW</button>
                    </div>
                </div>
                ${isLocked ? `<div class="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                    <i data-lucide="lock" class="w-12 h-12 mb-4 text-amber-500"></i>
                    <p class="font-bold text-sm uppercase">Unlocked at Rank:<br><span class="text-amber-500">Prospector (2,000 QNN)</span></p>
                </div>` : ''}
            </div>`;
    },

    renderExchange(container) {
        container.innerHTML = `
            <div class="glass-card p-6 space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-black text-xl">QUINN EXCHANGE</h3>
                        <p class="text-[10px] text-gray-500 uppercase">Spot Market QNN/USDT</p>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-mono font-bold text-green-500">$${APP_STATE.market.price.toFixed(2)}</div>
                        <div class="text-[9px] text-gray-500">+2.45% (24H)</div>
                    </div>
                </div>
                <div class="h-56 w-full bg-black/20 rounded-2xl relative overflow-hidden border border-white/5">
                    <canvas id="marketChart"></canvas>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <button class="bg-green-600/20 border border-green-500/50 py-4 rounded-2xl font-black text-xs text-green-500">BUY CONTRACT</button>
                    <button class="bg-red-600/20 border border-red-500/50 py-4 rounded-2xl font-black text-xs text-red-500">SELL CONTRACT</button>
                </div>
            </div>`;
        this.initChart();
    },

    initChart() {
        const ctx = document.getElementById('marketChart').getContext('2d');
        const labels = Array.from({length: 20}, (_, i) => `${i}:00`);
        const data = Array.from({length: 20}, () => 1800 + Math.random() * 100);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data,
                    borderColor: '#f59e0b',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    },

    renderArena(container) {
        const games = ["Pulse Check", "Chart Oracle", "Cipher Break", "Rekt Miner", "Quantum Flip", "Node War", "Grid Runner", "Bull Rush", "Hex Match", "Chain Link"];
        container.innerHTML = `
            <div class="space-y-6">
                <div class="glass-card p-6 bg-gradient-to-br from-amber-500/10 to-transparent">
                    <h3 class="font-black text-xl">QUINN ARENA</h3>
                    <p class="text-[10px] text-gray-500 uppercase">PvP Combat & AI Stakes</p>
                    <div class="mt-4 flex items-center gap-2 text-xs font-bold text-amber-500">
                        <span class="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                        142 Players in Lobby
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    ${games.map(g => `
                        <div class="glass-card p-5 aspect-square flex flex-col items-center justify-center text-center space-y-3 neo-press cursor-pointer">
                            <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                                <i data-lucide="zap" class="w-6 h-6 text-amber-500"></i>
                            </div>
                            <div class="font-bold text-[10px] uppercase tracking-tighter">${g}</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    },

    renderSettings(container) {
        container.innerHTML = `
            <div class="glass-card p-6 space-y-8">
                <h3 class="font-black text-xl">CONTROL HUB</h3>
                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="text-[9px] text-gray-500 uppercase">Language / اللغة</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="window.changeLang('ar')" class="py-4 rounded-xl border border-white/5 bg-white/5 text-[10px] font-bold">العربية</button>
                            <button onclick="window.changeLang('en')" class="py-4 rounded-xl border border-white/5 bg-white/5 text-[10px] font-bold">ENGLISH</button>
                        </div>
                    </div>
                    <div class="pt-6 border-t border-white/5 space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-xs">Quantum Notifications</span>
                            <div class="w-10 h-5 bg-amber-500 rounded-full"></div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-xs">Haptic Feedback</span>
                            <div class="w-10 h-5 bg-amber-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    showProfile() {
        const overlay = document.getElementById('overlay-container');
        const modal = document.getElementById('modal-card');
        overlay.classList.remove('hidden');
        
        const rank = [...RANKS].reverse().find(r => APP_STATE.user.balance >= r.min);
        
        modal.innerHTML = `
            <div class="glass-card p-8 text-center relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none"></div>
                <div class="relative z-10 space-y-6">
                    <div class="w-24 h-24 mx-auto rounded-[30px] border-2 border-amber-500 p-1">
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${APP_STATE.user.id}" class="w-full h-full bg-black rounded-[24px]">
                    </div>
                    <div>
                        <h2 class="text-2xl font-black">${APP_STATE.user.name}</h2>
                        <span class="text-amber-500 text-[10px] font-black uppercase tracking-widest">${rank.name}</span>
                    </div>
                    <div class="bg-black/40 p-4 rounded-2xl border border-white/5 text-left">
                        <p class="text-[8px] text-gray-500 uppercase mb-2">Secure Node Key</p>
                        <div class="flex justify-between items-center">
                            <span class="font-mono text-[10px] text-amber-500 truncate mr-4">${APP_STATE.user.secure_key}</span>
                            <i data-lucide="copy" class="w-4 h-4 text-white/40" onclick="navigator.clipboard.writeText('${APP_STATE.user.secure_key}')"></i>
                        </div>
                    </div>
                    <button onclick="document.getElementById('overlay-container').classList.add('hidden')" class="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase">CLOSE ID</button>
                </div>
            </div>`;
        lucide.createIcons();
    }
};

async function initApp() {
    Persistence.load();
    const isTelegram = window.Telegram?.WebApp?.initData !== "";
    
    if (isTelegram) {
        const tg = window.Telegram.WebApp;
        APP_STATE.user.id = tg.initDataUnsafe?.user?.id.toString() || APP_STATE.user.id;
        APP_STATE.user.name = tg.initDataUnsafe?.user?.first_name || APP_STATE.user.name;
        if (!APP_STATE.user.secure_key) APP_STATE.user.secure_key = `QNN-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase();
        completeAuth();
    } else {
        if (APP_STATE.user.secure_key) completeAuth();
        else showGateway();
    }
}

function showGateway() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('login-btn').onclick = () => {
        const key = document.getElementById('secure-key-input').value;
        if (key.length > 8) {
            APP_STATE.user.secure_key = key;
            completeAuth();
        }
    };
}

function completeAuth() {
    document.getElementById('auth-screen').classList.add('hidden');
    const shell = document.getElementById('app-shell');
    shell.classList.remove('blur-2xl', 'pointer-events-none');
    UI.renderTab('home');
}

window.changeLang = (l) => {
    APP_STATE.user.settings.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    UI.renderTab('settings');
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            UI.renderTab(btn.dataset.tab);
        };
    });
    document.getElementById('profile-trigger').onclick = () => UI.showProfile();
});
