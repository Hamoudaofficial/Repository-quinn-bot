// ═══════════════════════════════════════════════
// js/games/pulse-check.js — لعبة سرعة رد الفعل
// ═══════════════════════════════════════════════
import { GameBase, showGameResult } from './game-base.js';

export class PulseCheck extends GameBase {
  constructor(container, user) {
    super({ name:'pulse_check', cooldownMs:60000, minReward:200, maxReward:1000, container, user });
    this._phase       = 'wait';  // wait | tap | missed
    this._rounds      = 0;
    this._totalRounds = 5;
    this._scores      = [];
    this._flashTimer  = null;
  }

  onStart() {
    this._rounds = 0; this._scores = [];
    this._render();
    this._nextRound();
  }

  _render() {
    this.container.innerHTML = `
      <div class="game-screen pulse-screen">
        <div class="game-hud">
          <span>الجولة: <strong id="pc-round">1/${this._totalRounds}</strong></span>
          <span>النتيجة: <strong id="pc-score" class="gold">0</strong></span>
        </div>
        <div id="pc-target" class="pc-target wait">
          <i class="fas fa-hand-pointer"></i>
          <div id="pc-msg">استعد...</div>
        </div>
        <div class="pc-history" id="pc-history"></div>
      </div>`;

    document.getElementById('pc-target').addEventListener('click', () => this._onTap());
  }

  _nextRound() {
    if (this._rounds >= this._totalRounds) { this._finish(); return; }
    this._rounds++;
    document.getElementById('pc-round').textContent = `${this._rounds}/${this._totalRounds}`;
    const target = document.getElementById('pc-target');
    if (!target) return;

    // إعادة تعيين
    target.className = 'pc-target wait';
    document.getElementById('pc-msg').textContent = 'انتظر...';
    this._phase = 'wait';

    // تأخير عشوائي بين 1-4 ثانية (صعوبة عالية)
    const delay = 1000 + Math.random() * 3000;
    this._flashTimer = setTimeout(() => {
      if (!this._running) return;
      this._phase   = 'tap';
      this._tapTime = Date.now();
      target.className = 'pc-target ready';
      document.getElementById('pc-msg').textContent = 'اضغط الآن!';

      // نافذة محدودة جداً: 700ms فقط
      this._missTimer = setTimeout(() => {
        if (this._phase === 'tap') {
          this._phase = 'missed';
          this._scores.push(0);
          this._showHistoryEntry(0, 'فاتتك!');
          target.className = 'pc-target missed';
          document.getElementById('pc-msg').textContent = '💨 فاتتك!';
          setTimeout(() => this._nextRound(), 800);
        }
      }, 700);
    }, delay);
  }

  _onTap() {
    if (this._phase === 'wait') {
      // ضغط مبكر — عقوبة
      clearTimeout(this._flashTimer);
      this._scores.push(-100);
      this._showHistoryEntry(-100, 'مبكر!');
      document.getElementById('pc-target').className = 'pc-target early';
      document.getElementById('pc-msg').textContent  = '⚡ مبكر جداً!';
      setTimeout(() => this._nextRound(), 800);
    } else if (this._phase === 'tap') {
      clearTimeout(this._missTimer);
      const ms = Date.now() - this._tapTime;
      this._phase = 'scored';
      // أقل = أفضل، أقصى 700ms
      const pts = Math.max(0, Math.floor(1000 - ms * 1.3));
      this._scores.push(pts);
      this._showHistoryEntry(pts, `${ms}ms`);
      document.getElementById('pc-target').className = 'pc-target scored';
      document.getElementById('pc-msg').textContent  = `${ms}ms — ${pts} نقطة`;
      document.getElementById('pc-score').textContent = this._scores.reduce((a,b) => a+(b>0?b:0),0);
      setTimeout(() => this._nextRound(), 700);
    }
  }

  _showHistoryEntry(pts, label) {
    const hist = document.getElementById('pc-history');
    if (!hist) return;
    const div = document.createElement('div');
    div.className = `pc-hist-entry ${pts > 0 ? 'good' : 'bad'}`;
    div.innerHTML = `<span>${pts > 0 ? '+'+pts : pts}</span><span>${label}</span>`;
    hist.prepend(div);
  }

  _finish() {
    const total     = this._scores.reduce((a, b) => a + Math.max(0, b), 0);
    const maxScore  = this._totalRounds * 1000;
    const scoreNorm = Math.round((total / maxScore) * 100);
    const won       = scoreNorm >= 30;  // يجب ≥30% للفوز
    this.end(won, scoreNorm);
    showGameResult(this.container, won, Math.floor(this.minReward + (this.maxReward - this.minReward) * scoreNorm / 100),
      `مجموع النقاط: ${total} | أداء: ${scoreNorm}%`);
  }

  onEnd() { clearTimeout(this._flashTimer); clearTimeout(this._missTimer); }
}
