// ═══════════════════════════════════════════════
// js/leaderboard.js — المتصدرون
// ═══════════════════════════════════════════════
import { db }        from './firebase.js';
import { t }         from './i18n.js';
import { getRank }   from './ranks.js';
import {
  collection, query, orderBy, limit, getDocs
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

const CACHE_KEY = 'quinn_lb_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 دقائق

export async function fetchTopPlayers(n = 50) {
  // تحقق من الـ cache
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    if (c.ts && Date.now() - c.ts < CACHE_TTL && c.data) return c.data;
  } catch (_) {}

  try {
    const q = query(collection(db, 'users'), orderBy('totalTokens', 'desc'), limit(n));
    const snap = await getDocs(q);
    const players = snap.docs.map((d, i) => ({
      rank: i + 1,
      id:        d.id,
      name:      d.data().name || 'Unknown',
      username:  d.data().username || '',
      tokens:    d.data().totalTokens || 0,
      level:     d.data().level || 1,
      rankId:    d.data().rankId || 'dreamer',
      photoUrl:  d.data().photoUrl || '',
      verified:  d.data().verified || false,
    }));
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: players }));
    return players;
  } catch (err) {
    console.error('[LB] fetch failed:', err);
    return [];
  }
}

export function renderLeaderboardTab(container, currentUserId) {
  container.innerHTML = `
    <div class="lb-header">
      <h2 class="section-title"><i class="fas fa-trophy"></i> ${t('tabLeaderboard')}</h2>
    </div>
    <div id="lb-podium" class="lb-podium"></div>
    <div id="lb-list" class="lb-list glass-card">
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i> ${t('loading')}
      </div>
    </div>
    <div id="lb-my-rank" class="lb-my-rank glass-card" style="display:none">
      <i class="fas fa-user-circle"></i>
      <span>ترتيبك: <strong class="gold" id="lb-my-rank-val">--</strong></span>
    </div>`;

  fetchTopPlayers(50).then(players => {
    renderPodium(document.getElementById('lb-podium'), players.slice(0, 3));
    renderList(document.getElementById('lb-list'), players, currentUserId);

    // ترتيبي
    const myIdx = players.findIndex(p => p.id === String(currentUserId));
    if (myIdx !== -1) {
      document.getElementById('lb-my-rank').style.display = 'flex';
      document.getElementById('lb-my-rank-val').textContent = `#${myIdx + 1}`;
    }
  });
}

export function renderPodium(container, top3) {
  if (!container || !top3.length) return;
  const medals = ['gold','silver','bronze'];
  const positions = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]  // ترتيب المنصة: 2،1،3
    : top3;
  const podiumHeights = ['60px','80px','50px'];

  container.innerHTML = `
    <div class="podium">
      ${positions.map((p, i) => p ? `
        <div class="podium-step ${medals[i === 0 ? 1 : i === 1 ? 0 : 2]}">
          <div class="podium-avatar">${p.name.charAt(0).toUpperCase()}</div>
          <div class="podium-name">${p.name.substring(0,10)}</div>
          <div class="podium-tokens">${fmtQ(p.tokens)}</div>
          <div class="podium-base" style="height:${podiumHeights[i]}">
            ${i === 1 ? '🥇' : i === 0 ? '🥈' : '🥉'}
          </div>
        </div>` : '').join('')}
    </div>`;
}

export function renderList(container, players, myId) {
  if (!container) return;
  if (!players.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><span>لا يوجد لاعبون بعد</span></div>';
    return;
  }
  const r = getRank;
  container.innerHTML = players.map(p => `
    <div class="lb-item ${p.id === String(myId) ? 'lb-me' : ''}">
      <div class="lb-rank-num ${p.rank <= 3 ? ['gold','silver','bronze'][p.rank-1] : ''}">#${p.rank}</div>
      <div class="lb-avatar-circle" style="background:${r(p.tokens).color}20;border-color:${r(p.tokens).color}">
        ${p.name.charAt(0).toUpperCase()}
      </div>
      <div class="lb-user-info">
        <div class="lb-name">${p.name} ${p.verified ? '<i class="fas fa-circle-check" style="color:var(--cyan)"></i>' : ''}</div>
        <div class="lb-rank-name muted">${r(p.tokens).nameAr}</div>
      </div>
      <div class="lb-tokens gold">${fmtQ(p.tokens)}</div>
    </div>`).join('');
}

function fmtQ(n) {
  if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return (n||0).toLocaleString();
}
