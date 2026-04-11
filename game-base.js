// ═══════════════════════════════════════════════
// js/games/game-base.js — الكلاس الأساسي للألعاب
// ═══════════════════════════════════════════════
const showToast = (m,t) => { try{window.showToast(m,t)}catch(_){console.log(m)} };

export class GameBase {
  constructor(opts = {}) {
    this.name        = opts.name        || 'Game';
    this.cooldownMs  = opts.cooldownMs  || 30000;   // 30ث cooldown
    this.minReward   = opts.minReward   || 100;
    this.maxReward   = opts.maxReward   || 500;
    this.minRankId   = opts.minRankId   || 'dreamer';
    this.container   = opts.container   || null;
    this.user        = opts.user        || null;
    this._tickTimer  = null;
    this._running    = false;
  }

  // ── تحقق من cooldown ──────────────────────────
  isOnCooldown() {
    const ls_key = `quinn_game_cd_${this.name}`;
    const last   = parseInt(localStorage.getItem(ls_key) || '0');
    return Date.now() - last < this.cooldownMs;
  }

  getCooldownSec() {
    const ls_key = `quinn_game_cd_${this.name}`;
    const last   = parseInt(localStorage.getItem(ls_key) || '0');
    return Math.max(0, Math.ceil((this.cooldownMs - (Date.now() - last)) / 1000));
  }

  _setCooldown() {
    localStorage.setItem(`quinn_game_cd_${this.name}`, String(Date.now()));
  }

  // ── واجهة البدء ───────────────────────────────
  start() {
    if (this.isOnCooldown()) {
      showToast(`⏳ يمكنك اللعب بعد ${this.getCooldownSec()} ثانية`, 'info');
      return false;
    }
    this._running = true;
    this.onStart();
    return true;
  }

  // ── نهاية اللعبة ─────────────────────────────
  end(won, score = 0) {
    this._running = false;
    clearInterval(this._tickTimer);
    this._setCooldown();

    const reward = won ? Math.floor(this.minReward + (this.maxReward - this.minReward) * (score / 100)) : 0;

    if (won && reward > 0) {
      this.user.gainTokens(reward);
      this.user.addTransaction('game_reward', reward, { game: this.name });
      this.user.saveToFirebase();
      document.dispatchEvent(new CustomEvent('balanceUpdated'));
      showToast(`🏆 فزت! +${reward} Quinn`);
    } else if (!won) {
      showToast('💔 خسرت — لا مكافأة', 'error');
    }

    this.onEnd(won, reward);
    document.dispatchEvent(new CustomEvent('gameEnded', { detail: { won, reward, game: this.name } }));
  }

  startTick(intervalMs = 1000) {
    this._tickTimer = setInterval(() => {
      if (this._running) this.onTick();
    }, intervalMs);
  }

  // ── يجب تنفيذها في الكلاس الوارث ─────────────
  onStart()       { throw new Error('onStart() not implemented'); }
  onEnd(won, rew) {}
  onTick()        {}
}

// ── مساعد: عرض شاشة نتيجة اللعبة ─────────────
export function showGameResult(container, won, reward, details = '') {
  container.innerHTML = `
    <div class="game-result ${won ? 'win' : 'lose'}">
      <div class="result-icon">${won ? '🏆' : '💔'}</div>
      <h2>${won ? '🎉 فزت!' : '😞 خسرت!'}</h2>
      ${details ? `<p class="result-details">${details}</p>` : ''}
      ${won && reward > 0 ? `
        <div class="reward-box">
          <i class="fas fa-coins gold"></i>
          <span class="reward-val gold">+${reward} Quinn</span>
        </div>` : '<p class="muted">لا مكافأة للخسارة</p>'}
    </div>`;
}
