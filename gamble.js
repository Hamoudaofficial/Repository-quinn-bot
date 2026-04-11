// ═══════════════════════════════════════════════
// js/gamble.js — القمار (PvP + AI RTP 95%)
// ═══════════════════════════════════════════════
import { rtdb }      from './firebase.js';
import { t }         from './i18n.js';
const showToast = (m,t) => { try{window.showToast(m,t)}catch(_){console.log(m)} };
import {
  ref, set, get, onValue, remove, push, update, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js';

const LOBBY_PATH   = 'gambling/lobby';
const MATCHES_PATH = 'gambling/matches';
const SEARCH_TIMEOUT_MS = 10000;
const AI_RTP       = 0.95;   // 95% Return To Player

export class Gamble {
  constructor(user) {
    this.user        = user;
    this._lobbyRef   = null;
    this._matchRef   = null;
    this._unsubMatch = null;
    this._sessionWin = 0;   // لحساب RTP
    this._sessionBet = 0;
  }

  renderLobby(container) {
    container.innerHTML = `
      <div class="gamble-hero">
        <i class="fas fa-dice gamble-icon"></i>
        <h2>${t('gamble')}</h2>
        <p class="muted">العب ضد لاعبين حقيقيين أو ضد الذكاء الاصطناعي</p>
      </div>

      <div class="gamble-bet-card glass-card">
        <h3><i class="fas fa-coins"></i> ${t('betAmount')}</h3>
        <div class="bet-input-row">
          <input type="number" id="gamble-bet-input" class="quinn-input"
                 placeholder="0" min="10" max="${this.user.tokens}">
          <div class="quick-bets">
            <button class="btn-quick" data-bet="100">100</button>
            <button class="btn-quick" data-bet="500">500</button>
            <button class="btn-quick" data-bet="1000">1K</button>
            <button class="btn-quick" data-bet="5000">5K</button>
            <button class="btn-quick" data-bet="all">MAX</button>
          </div>
        </div>
        <div class="balance-hint muted">
          رصيدك: <span class="gold">${fmtQ(this.user.tokens)}</span> Quinn
        </div>
      </div>

      <div class="gamble-modes">
        <button class="btn btn-pvp" id="gamble-pvp-btn">
          <i class="fas fa-users"></i> PvP — ضد لاعب حقيقي
        </button>
        <button class="btn btn-ai" id="gamble-ai-btn">
          <i class="fas fa-robot"></i> ضد الذكاء الاصطناعي
        </button>
      </div>

      <div id="gamble-status" class="gamble-status" style="display:none"></div>
      <div id="gamble-arena" class="gamble-arena" style="display:none"></div>`;

    // Quick bets
    container.querySelectorAll('.btn-quick').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.bet === 'all' ? this.user.tokens : parseInt(btn.dataset.bet);
        document.getElementById('gamble-bet-input').value = v;
      });
    });

    document.getElementById('gamble-pvp-btn')?.addEventListener('click',  () => this._startPvP());
    document.getElementById('gamble-ai-btn')?.addEventListener('click',   () => this._startVsAI());
  }

  // ── PvP ─────────────────────────────────────
  async _startPvP() {
    const bet = this._validateBet();
    if (!bet) return;

    this._showStatus('searching', `<i class="fas fa-spinner fa-spin"></i> ${t('pvpWait')}`);

    // البحث عن منافس في اللوبي
    const lobbyRef = ref(rtdb, LOBBY_PATH);
    const snap     = await get(lobbyRef);
    const waiting  = snap.val();

    if (waiting && waiting.userId !== this.user.id) {
      // وجدنا منافس!
      await this._createMatch(waiting, bet);
    } else {
      // ننتظر في اللوبي
      this._lobbyRef = ref(rtdb, `${LOBBY_PATH}/${this.user.id}`);
      await set(this._lobbyRef, {
        userId: this.user.id, name: this.user.name, bet,
        timestamp: Date.now()
      });

      // استماع للمباراة
      const matchRef = ref(rtdb, `${MATCHES_PATH}/${this.user.id}`);
      this._unsubMatch = onValue(matchRef, snap => {
        if (!snap.exists()) return;
        this._joinMatch(snap.val());
      });

      // timeout → invite
      setTimeout(() => {
        if (this._unsubMatch) {
          this._unsubMatch();
          remove(this._lobbyRef);
          this._showInviteOption(bet);
        }
      }, SEARCH_TIMEOUT_MS);
    }
  }

  async _createMatch(waiting, myBet) {
    const matchId = `match_${Date.now()}`;
    const p1Die   = Math.floor(Math.random()*6)+1;
    const p2Die   = Math.floor(Math.random()*6)+1;
    const pot     = waiting.bet + myBet;
    const winner  = p1Die > p2Die ? waiting.userId : p2Die > p1Die ? this.user.id : 'tie';

    const matchData = {
      p1: { userId: waiting.userId, name: waiting.name, bet: waiting.bet, die: p1Die },
      p2: { userId: this.user.id,   name: this.user.name, bet: myBet,     die: p2Die },
      pot, winner, matchId, timestamp: Date.now()
    };

    await remove(ref(rtdb, `${LOBBY_PATH}/${waiting.userId}`));
    await set(ref(rtdb, `${MATCHES_PATH}/${waiting.userId}`), matchData);
    await set(ref(rtdb, `${MATCHES_PATH}/${this.user.id}`), matchData);

    this._handleMatchResult(matchData, p2Die, myBet);
  }

  _joinMatch(data) {
    if (!data || this._unsubMatch === null) return;
    this._unsubMatch();
    this._unsubMatch = null;
    const myDie = data.p1.userId === this.user.id ? data.p1.die : data.p2.die;
    this._handleMatchResult(data, myDie, data.p1.userId === this.user.id ? data.p1.bet : data.p2.bet);
    remove(ref(rtdb, `${MATCHES_PATH}/${this.user.id}`));
  }

  // ── VS AI ────────────────────────────────────
  _startVsAI() {
    const bet = this._validateBet();
    if (!bet) return;
    this._showStatus('matched', '<i class="fas fa-robot"></i> مباراة ضد الذكاء الاصطناعي...');

    setTimeout(() => {
      const myDie  = Math.floor(Math.random()*6)+1;
      let   aiDie  = Math.floor(Math.random()*6)+1;

      // RTP: إذا كان الربح الكلي أكثر من 5% من الرهان نجعل AI يفوز أكثر
      this._sessionBet += bet;
      const rtpSoFar = this._sessionBet > 0 ? this._sessionWin / this._sessionBet : 0;
      if (rtpSoFar > AI_RTP && Math.random() < 0.7) {
        aiDie = Math.min(6, myDie + 1 + Math.floor(Math.random()*2));
      }

      const pot    = bet * 2;
      const winner = myDie > aiDie ? this.user.id : aiDie > myDie ? 'ai' : 'tie';

      const fakeMatch = {
        p1: { userId: this.user.id, name: this.user.name, bet, die: myDie },
        p2: { userId: 'ai', name: 'Quinn AI', bet, die: aiDie },
        pot, winner
      };
      this._handleMatchResult(fakeMatch, myDie, bet);
    }, 1200);
  }

  // ── نتيجة المباراة ───────────────────────────
  _handleMatchResult(match, myDie, myBet) {
    const opponentIsP1 = match.p1.userId !== this.user.id;
    const oppDie       = opponentIsP1 ? match.p1.die : match.p2.die;
    const oppName      = opponentIsP1 ? match.p1.name : match.p2.name;
    const isWin        = match.winner === this.user.id;
    const isTie        = match.winner === 'tie';

    this._showArena(myDie, oppDie, oppName, match.pot);

    setTimeout(() => {
      if (isWin) {
        this.user.tokens += match.pot;
        this._sessionWin += match.pot - myBet;
        this.user.addTransaction('gamble_win', match.pot - myBet, { pot: match.pot });
        showToast(`🏆 ${t('win')} +${fmtQ(match.pot - myBet)} Quinn`);
      } else if (isTie) {
        this.user.tokens += myBet; // استرداد الرهان
        showToast('🤝 تعادل! استرددت رهانك');
      } else {
        this.user.addTransaction('gamble_lose', myBet);
        showToast(`💔 ${t('lose')} -${fmtQ(myBet)} Quinn`);
      }
      this.user.saveToFirebase();
      document.dispatchEvent(new CustomEvent('balanceUpdated'));
    }, 2000);
  }

  _showArena(myDie, oppDie, oppName, pot) {
    const diceFaces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    const arena = document.getElementById('gamble-arena');
    if (!arena) return;
    arena.style.display = 'block';
    arena.innerHTML = `
      <div class="arena-players">
        <div class="arena-player">
          <div class="arena-avatar">${this.user.name.charAt(0)}</div>
          <div class="arena-name">${this.user.name.substring(0,10)}</div>
          <div class="arena-die rolling">${diceFaces[myDie-1]}</div>
          <div class="arena-die-val">${myDie}</div>
        </div>
        <div class="arena-vs">
          <div class="pot-display gold">${fmtQ(pot)}</div>
          <div>VS</div>
        </div>
        <div class="arena-player">
          <div class="arena-avatar">${oppName.charAt(0)}</div>
          <div class="arena-name">${oppName.substring(0,10)}</div>
          <div class="arena-die rolling">${diceFaces[oppDie-1]}</div>
          <div class="arena-die-val">${oppDie}</div>
        </div>
      </div>
      <div class="arena-result ${myDie > oppDie ? 'win' : myDie < oppDie ? 'lose' : 'tie'}">
        ${myDie > oppDie ? t('win') : myDie < oppDie ? t('lose') : '🤝 تعادل!'}
      </div>`;

    setTimeout(() => {
      arena.querySelectorAll('.rolling').forEach(el => el.classList.remove('rolling'));
    }, 800);
  }

  _showStatus(type, html) {
    const el = document.getElementById('gamble-status');
    if (el) { el.style.display = 'block'; el.className = `gamble-status status-${type}`; el.innerHTML = html; }
  }

  _showInviteOption(bet) {
    const link = `https://t.me/Quinnofficialbot?start=duel_${this.user.id}_${bet}`;
    this._showStatus('waiting', `
      <p>لم يُوجد خصم. ادعُ صديقاً!</p>
      <a href="${link}" class="btn btn-primary invite-link">
        <i class="fas fa-telegram"></i> دعوة صديق
      </a>`);
  }

  _validateBet() {
    const bet = parseInt(document.getElementById('gamble-bet-input')?.value) || 0;
    if (bet < 10)             { showToast('الحد الأدنى 10 Quinn', 'error'); return null; }
    if (bet > this.user.tokens) { showToast(t('insufficientBal'), 'error'); return null; }
    this.user.tokens -= bet;
    document.dispatchEvent(new CustomEvent('balanceUpdated'));
    return bet;
  }
}

function fmtQ(n) {
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return (n||0).toLocaleString();
}
