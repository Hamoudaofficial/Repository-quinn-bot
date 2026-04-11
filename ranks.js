// ═══════════════════════════════════════════════
// js/ranks.js — نظام الرتب (50 مستوى)
// ═══════════════════════════════════════════════

export const RANKS = [
  // الحالم   — مستوى 1-5
  { id:'dreamer',    nameAr:'الحالم',    nameEn:'Dreamer',     levels:[1,5],   minTokens:0,        maxTokens:9999,     clickMul:1,    color:'#8B9DC3', icon:'fa-moon',      xpPerLevel:1000  },
  // المستكشف — مستوى 6-10
  { id:'explorer',   nameAr:'المستكشف',  nameEn:'Explorer',    levels:[6,10],  minTokens:10000,    maxTokens:49999,    clickMul:1.5,  color:'#4ECDC4', icon:'fa-compass',   xpPerLevel:2500  },
  // الخيميائي — مستوى 11-15
  { id:'alchemist',  nameAr:'الخيميائي', nameEn:'Alchemist',   levels:[11,15], minTokens:50000,    maxTokens:149999,   clickMul:2,    color:'#45B7D1', icon:'fa-flask',     xpPerLevel:5000  },
  // المنقب   — مستوى 16-20
  { id:'miner',      nameAr:'المنقب',    nameEn:'Miner',       levels:[16,20], minTokens:150000,   maxTokens:399999,   clickMul:3,    color:'#96CEB4', icon:'fa-hammer',    xpPerLevel:10000 },
  // الطاغية  — مستوى 21-25
  { id:'tyrant',     nameAr:'الطاغية',   nameEn:'Tyrant',      levels:[21,25], minTokens:400000,   maxTokens:799999,   clickMul:4,    color:'#FF6B6B', icon:'fa-skull',     xpPerLevel:20000 },
  // الحوت    — مستوى 26-30
  { id:'whale',      nameAr:'الحوت',     nameEn:'Whale',       levels:[26,30], minTokens:800000,   maxTokens:1499999,  clickMul:5,    color:'#A8E6CF', icon:'fa-fish',      xpPerLevel:35000 },
  // المتنور  — مستوى 31-35
  { id:'enlightened',nameAr:'المتنور',   nameEn:'Enlightened', levels:[31,35], minTokens:1500000,  maxTokens:3999999,  clickMul:7,    color:'#DDA0DD', icon:'fa-star',      xpPerLevel:60000 },
  // الأسطورة — مستوى 36-40
  { id:'legend',     nameAr:'الأسطورة',  nameEn:'Legend',      levels:[36,40], minTokens:4000000,  maxTokens:9999999,  clickMul:10,   color:'#FFD700', icon:'fa-crown',     xpPerLevel:100000},
  // Quinn God — مستوى 41-50
  { id:'quinn_god',  nameAr:'Quinn God', nameEn:'Quinn God',   levels:[41,50], minTokens:10000000, maxTokens:Infinity, clickMul:15,   color:'#FF4757', icon:'fa-fire-flame-curved', xpPerLevel:200000},
];

/** يحسب الرتبة بناءً على إجمالي الـ tokens */
export function getRank(totalTokens = 0) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (totalTokens >= r.minTokens) rank = r;
    else break;
  }
  return rank;
}

/** يحسب الرتبة بناءً على رقم المستوى */
export function getRankByLevel(level = 1) {
  for (const r of RANKS) {
    if (level >= r.levels[0] && level <= r.levels[1]) return r;
  }
  return RANKS[RANKS.length - 1];
}

/** يحسب المستوى الكلي (1-50) من XP */
export function getLevelFromXP(totalXP = 0, rank) {
  const r = rank || RANKS[0];
  return Math.min(r.levels[1], r.levels[0] + Math.floor(totalXP / r.xpPerLevel));
}

/** نسبة التقدم نحو المستوى التالي */
export function getLevelProgress(totalXP, rank) {
  const r = rank || RANKS[0];
  const xpInLevel = totalXP % r.xpPerLevel;
  return (xpInLevel / r.xpPerLevel) * 100;
}

/** XP مطلوب للمستوى التالي */
export function xpForNext(rank) {
  return (rank || RANKS[0]).xpPerLevel;
}
