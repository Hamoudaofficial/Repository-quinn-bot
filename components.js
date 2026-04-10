import { db } from './firebase_config.js';

export function renderTab(id) {
    const views = {
        home: `
            <div class="space-y-6">
                <div class="glass-card p-6 border-r-4 border-amber-500">
                    <h3 class="text-xl font-black mb-1">نظام كوين 2026</h3>
                    <p class="text-white/40 text-[10px] leading-relaxed">المستقبل المالي بين يديك. تداول، العب، واربح بذكاء اصطناعي فائق.</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="glass-card p-5 flex flex-col items-center gap-2">
                        <div class="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                            <i data-lucide="zap" class="text-amber-500 w-5 h-5"></i>
                        </div>
                        <span class="text-[9px] font-bold text-white/40 uppercase">سرعة المعالجة</span>
                        <span class="text-sm font-black">0.02ms</span>
                    </div>
                    <div class="glass-card p-5 flex flex-col items-center gap-2">
                        <div class="w-10 h-10 bg-violet-500/10 rounded-full flex items-center justify-center">
                            <i data-lucide="shield-check" class="text-violet-500 w-5 h-5"></i>
                        </div>
                        <span class="text-[9px] font-bold text-white/40 uppercase">حماية التشفير</span>
                        <span class="text-sm font-black">AES-256</span>
                    </div>
                </div>

                <div class="glass-card p-4">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-[10px] font-black uppercase text-white/40">آخر العمليات</h4>
                        <i data-lucide="more-horizontal" class="w-4 h-4 text-white/20"></i>
                    </div>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center text-xs">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-500">↑</div>
                                <span>مكافأة يومية</span>
                            </div>
                            <span class="font-bold text-green-400">+10.0 Q</span>
                        </div>
                    </div>
                </div>
            </div>
        `,
        wallet: `
            <div class="space-y-6">
                <div class="wallet-3d">
                    <div class="wallet-inner p-8 flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-start">
                                <p class="text-[9px] font-black opacity-40 uppercase tracking-[0.2em]">Liquid Assets</p>
                                <span class="text-[8px] border border-white/20 px-2 py-0.5 rounded-full uppercase">Main Net</span>
                            </div>
                            <h2 class="text-4xl font-black mt-2 tracking-tighter">${db.get('balance').toFixed(2)} <span class="text-lg opacity-50">Q</span></h2>
                        </div>
                        <div class="flex justify-between items-end">
                            <div class="font-mono text-[7px] opacity-30">TX-HASH: Q2026-X99-F4A</div>
                            <div class="flex -space-x-2">
                                <div class="w-6 h-6 rounded-full bg-amber-500/40 border border-white/10 backdrop-blur-md"></div>
                                <div class="w-6 h-6 rounded-full bg-violet-500/40 border border-white/10 backdrop-blur-md"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                    <button id="buy-pin-btn" class="glass-card p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                        <i data-lucide="credit-card" class="text-amber-500"></i>
                        <span class="text-[8px] font-black uppercase">شراء PIN</span>
                    </button>
                    <button class="glass-card p-4 flex flex-col items-center gap-2">
                        <i data-lucide="arrow-up-right" class="text-blue-500"></i>
                        <span class="text-[8px] font-black uppercase">إرسال</span>
                    </button>
                    <button class="glass-card p-4 flex flex-col items-center gap-2">
                        <i data-lucide="qr-code" class="text-green-500"></i>
                        <span class="text-[8px] font-black uppercase">استلام</span>
                    </button>
                </div>

                <div class="glass-card overflow-hidden">
                    <div class="p-4 border-b border-white/5 bg-white/5">
                        <h4 class="text-[9px] font-black uppercase text-white/60">أصولك الرقمية</h4>
                    </div>
                    <div class="p-4 space-y-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-[10px]">Au</div>
                                <div>
                                    <p class="text-[10px] font-bold">الذهب الرقمي</p>
                                    <p class="text-[8px] text-white/30">${db.get('gold_holdings')} Units</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] font-black">${(db.get('gold_holdings') * db.get('gold_price')).toFixed(2)} Q</p>
                                <p class="text-[8px] text-green-400">+1.2%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        gold: `
            <div class="space-y-6">
                <div class="glass-card p-6">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h3 class="text-xl font-black">سوق الذهب</h3>
                            <p class="text-[9px] text-white/40 uppercase tracking-widest">Real-time Trading</p>
                        </div>
                        <div class="text-right">
                            <div id="gold-current-price" class="text-2xl font-black text-amber-500">${db.get('gold_price').toFixed(4)}</div>
                            <span class="text-[8px] text-green-500 font-bold">+2.45% (24H)</span>
                        </div>
                    </div>
                    <div class="h-40">
                        <canvas id="goldChart"></canvas>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <button id="buy-gold" class="py-5 bg-green-500/10 border border-green-500/30 rounded-3xl text-green-500 font-black text-xs uppercase tracking-widest">Buy Gold</button>
                    <button id="sell-gold" class="py-5 bg-red-500/10 border border-red-500/30 rounded-3xl text-red-500 font-black text-xs uppercase tracking-widest">Sell Gold</button>
                </div>

                <div class="glass-card p-4 text-center">
                    <p class="text-[9px] text-white/30 mb-2 uppercase">مخزونك الحالي</p>
                    <p class="text-xl font-black text-amber-500">${db.get('gold_holdings')} <span class="text-[10px] text-white">UNITS</span></p>
                </div>
            </div>
        `,
        games: `
            <div class="space-y-6">
                <div class="glass-card p-6 bg-gradient-to-br from-violet-600/10 to-transparent">
                    <h3 class="text-lg font-black mb-2">لعبة سيجا 3D (PvP)</h3>
                    <p class="text-xs text-white/50 mb-6 leading-relaxed">تحدى لاعبين حقيقيين في مواجهة استراتيجية. الفائز يأخذ كل شيء.</p>
                    <div class="p-6 bg-black/40 rounded-3xl border border-white/5 mb-6">
                        <div class="sija-grid" id="sija-board">
                            <!-- Cells generated by JS -->
                        </div>
                    </div>
                    <button class="w-full py-4 bg-amber-500 text-black font-black rounded-2xl text-xs uppercase shadow-[0_10px_30px_rgba(245,158,11,0.3)]">بحث عن خصم (50 Q)</button>
                </div>

                <div class="glass-card p-4 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">💣</div>
                        <div>
                            <h4 class="text-xs font-bold">منجم الكوينز</h4>
                            <p class="text-[9px] text-white/40">صعوبة: قصوى | جائزة: 10x</p>
                        </div>
                    </div>
                    <button class="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black">العب</button>
                </div>
            </div>
        `,
        stats: `
            <div class="space-y-6">
                <div class="text-center py-6">
                    <h3 class="text-xl font-black mb-2 uppercase tracking-widest">لوحة المتصدرين</h3>
                    <div class="h-1 w-12 bg-amber-500 mx-auto rounded-full"></div>
                </div>
                
                <div class="space-y-3">
                    <div class="glass-card p-4 flex items-center justify-between border-l-2 border-amber-500">
                        <div class="flex items-center gap-4">
                            <span class="text-lg font-black italic text-amber-500">#1</span>
                            <div class="w-10 h-10 rounded-full bg-white/10"></div>
                            <div>
                                <p class="text-xs font-bold">Ahmed VIP</p>
                                <p class="text-[8px] text-white/40">12.4K Quinn</p>
                            </div>
                        </div>
                        <i data-lucide="crown" class="w-4 h-4 text-amber-500"></i>
                    </div>
                </div>
            </div>
        `,
        ai: `
            <div class="h-full flex flex-col">
                <div class="glass-card p-4 flex items-center gap-4 mb-4">
                    <div class="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center animate-pulse">
                        <i data-lucide="brain-circuit" class="text-black w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-black">مساعد Gemini 1.5 Pro</h3>
                        <p class="text-[8px] text-white/40">5 محاولات يومية متبقية</p>
                    </div>
                </div>

                <div id="ai-messages" class="flex-1 space-y-4 overflow-y-auto mb-4 pr-2 text-[11px]">
                    <div class="bg-white/5 p-4 rounded-2xl border border-white/10 leading-relaxed">
                        مرحباً! أنا ذكاء Quinn الاصطناعي. يمكنني تحليل السوق، إنشاء صور، أو الإجابة على استفساراتك المالية. كيف أخدمك اليوم؟
                    </div>
                </div>

                <div class="relative">
                    <input type="text" id="ai-input" placeholder="اطلب أي شيء من الذكاء الاصطناعي..." class="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 pr-16 text-xs focus:border-amber-500 transition-colors">
                    <button class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-amber-500 text-black rounded-xl flex items-center justify-center">
                        <i data-lucide="mic" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `
    };
    return views[id] || views.home;
}
