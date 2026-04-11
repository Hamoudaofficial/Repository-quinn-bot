// ═══════════════════════════════════════════════
// js/games/whale-hunt.js — صيد الحيتان (نقر سريع)
// ═══════════════════════════════════════════════
import { GameBase, showGameResult } from './game-base.js';

const TIME_LIMIT = 15;
const WHALES_TO_WIN = 10;

export class WhaleHunt extends GameBase {
  constructor(container, user) {
    super({ name:'whale_hunt', cooldownMs:45000, minReward:200, maxReward:1200, container, user });
    this._caught    = 0;
    this._missed    = 0;
    this._timeLeft  = TIME_LIMIT;
    this._activeWhales = new Set();
    this._spawnTimer   = null;
  }

  onStart() {
    this._caught = 0; this._missed = 0; this._timeLeft = TIME_LIMIT;
    this._render();
    this.startTick(1000);
    this._startSpawning();
  }

  _render() {
    this.container.innerHTML = `
      <div class="game-screen whale-screen">
        <div class="game-hud">
          <span>⏱ <strong id="wh-timer" class="red">${this._timeLeft}</strong>ث</span>
          <span>🐋 <strong id="wh-caught" class="gold">0</strong>/${WHALES_TO_WIN}</span>
        </div>
        <div class="whale-ocean" id="whale-ocean">
          <div class="ocean-bg"></div>
        </div>
        <div class="game-hud mt">
          <span class="muted">فاتك: <span id="wh-missed" class="red">0</span></span>
          <span class="muted">اضغط على الحيتان!</span>
        </div>
      </div>`;
  }

  onTick() {
    this._timeLeft--;
    const el = document.getElementById('wh-timer');
    if (el) el.textContent = this._timeLeft;
    if (this._timeLeft <= 0) {
      this._endGame();
    }
  }

  _startSpawning() {
    const spawn = () => {
      if (!this._running) return;
      this._spawnWhale();
      const delay = Math.max(400, 1200 - this._caught * 50); // يسرع مع الصيد
      this._spawnTimer = setTimeout(spawn, delay);
    };
    this._spawnTimer = setTimeout(spawn, 600);
  }

  _spawnWhale() {
    const ocean = document.getElementById('whale-ocean');
    if (!ocean) return;

    const id     = `whale_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const types  = [
      { icon:'🐋', pts:1,  dur:2000, size:56 },
      { icon:'🐬', pts:2,  dur:1500, size:44 },
      { icon:'🦈', pts:3,  dur:1000, size:48 },
      { icon:'💎', pts:5,  dur:800,  size:36 },
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    const x = 10 + Math.random() * 75;
    const y = 10 + Math.random() * 70;

    const el = document.createElement('div');
    el.id        = id;
    el.className = 'whale-target';
    el.innerHTML = `<span>${type.icon}</span>`;
    el.style.cssText = `left:${x}%;top:${y}%;width:${type.size}px;height:${type.size}px;font-size:${type.size*0.6}px;`;
    el.style.animationDuration = `${type.dur}ms`;

    ocean.appendChild(el);
    this._activeWhales.add(id);

    el.addEventListener('click', () => this._catchWhale(el, id, type.pts));

    // يختفي بعد المدة
    setTimeout(() => {
      if (this._activeWhales.has(id)) {
        this._activeWhales.delete(id);
        el.remove();
        this._missed++;
        const missedEl = document.getElementById('wh-missed');
        if (missedEl) missedEl.textContent = this._missed;

        // إذا فاتت 5 حيتان متتالية — خسارة
        if (this._missed >= 5 && this._caught < 3) {
          this._endGame(true);  // خسارة إجبارية
        }
      }
    }, type.dur);
  }

  _catchWhale(el, id, pts) {
    if (!this._running || !this._activeWhales.has(id)) return;
    this._activeWhales.delete(id);
    this._caught += pts;

    el.classList.add('whale-caught');
    const scoreEl = document.getElementById('wh-caught');
    if (scoreEl) scoreEl.textContent = this._caught;

    setTimeout(() => el.remove(), 300);

    if (this._caught >= WHALES_TO_WIN) {
      this._endGame();
    }
  }

  _endGame(forceLoss = false) {
    clearTimeout(this._spawnTimer);
    const won   = !forceLoss && this._caught >= WHALES_TO_WIN;
    const score = Math.round(Math.min(100, (this._caught / WHALES_TO_WIN) * 100));
    this.end(won, score);
    showGameResult(this.container, won,
      won ? Math.floor(this.minReward + (this.maxReward - this.minReward) * score / 100) : 0,
      `اصطدت: ${this._caught} | فاتك: ${this._missed}`);
  }

  onEnd() { clearTimeout(this._spawnTimer); }
}
