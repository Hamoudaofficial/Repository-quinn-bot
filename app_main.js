import { db } from './firebase_config.js';
import { renderTab } from './components.js';
import { initMarket } from './market_engine.js';
import { initGames } from './games_logic.js';
import { initAI } from './ai_engine.js';

const TWA = window.Telegram?.WebApp;

const App = {
    currentTab: 'home',

    init() {
        this.checkSecurity();
        this.loadSequence();
        this.setupNav();
        this.updateHeader();
        
        lucide.createIcons();
        this.switchTab('home');
    },

    checkSecurity() {
        const isTWA = TWA?.initData !== "";
        const isLocal = window.location.hostname === 'localhost';
        
        if (!isTWA && !isLocal) {
            document.getElementById('restriction-screen').classList.remove('hidden');
        } else {
            TWA?.expand();
            TWA?.ready();
        }
    },

    loadSequence() {
        let p = 0;
        const bar = document.getElementById('load-progress');
        const interval = setInterval(() => {
            p += Math.random() * 15;
            bar.style.width = `${Math.min(p, 100)}%`;
            if (p >= 100) {
                clearInterval(interval);
                gsap.to("#loading-screen", { opacity: 0, duration: 0.8, delay: 0.5, onComplete: () => {
                    document.getElementById('loading-screen').remove();
                    document.getElementById('app').style.opacity = '1';
                }});
            }
        }, 100);
    },

    setupNav() {
        const items = document.querySelectorAll('.nav-item');
        const indicator = document.getElementById('nav-indicator');

        items.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                if (tab === this.currentTab) return;
                
                items.forEach(i => i.classList.remove('active'));
                btn.classList.add('active');
                
                const rect = btn.getBoundingClientRect();
                const parent = btn.parentElement.getBoundingClientRect();
                indicator.style.left = `${rect.left - parent.left + (rect.width/2) - 12}px`;
                
                this.switchTab(tab);
            });
        });
    },

    switchTab(tabId) {
        this.currentTab = tabId;
        const container = document.getElementById('tab-content');
        
        gsap.to(container, { opacity: 0, scale: 0.98, duration: 0.2, onComplete: () => {
            container.innerHTML = renderTab(tabId);
            lucide.createIcons();
            
            if (tabId === 'gold') initMarket();
            if (tabId === 'games') initGames();
            if (tabId === 'ai') initAI();

            gsap.to(container, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" });
            this.bindTabEvents(tabId);
        }});
    },

    updateHeader() {
        const bal = db.get('balance');
        document.getElementById('main-balance').innerHTML = `${bal.toFixed(2)} <span class="text-amber-500 text-[10px]">Q</span>`;
        
        if (TWA?.initDataUnsafe?.user) {
            const u = TWA.initDataUnsafe.user;
            document.getElementById('display-name').innerText = u.first_name;
            document.getElementById('user-tier').innerText = `ID: ${u.id % 10000} | ELITE`;
            if (u.photo_url) document.getElementById('user-avatar').src = u.photo_url;
        }
    },

    bindTabEvents(tab) {
        if (tab === 'wallet') {
            document.getElementById('buy-pin-btn')?.addEventListener('click', () => {
                const pin = prompt("أدخل كود الشراء (PIN):");
                if (pin === "2026") {
                    const b = db.get('balance') + 1000;
                    db.update('balance', b);
                    this.updateHeader();
                    alert("تمت إضافة 1000 Quinn!");
                    this.switchTab('wallet');
                }
            });
        }
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
