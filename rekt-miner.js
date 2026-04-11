// ═══════════════════════════════════════════════
// js/games/rekt-miner.js — تدمير الصخور
// ═══════════════════════════════════════════════
import { GameBase, showGameResult } from './game-base.js';

const ROCKS_TO_WIN  = 15;
const TIME_LIMIT    = 20;   // 20 ثانية فقط!

export class RektMiner extends GameBase {
  constructor(container, user) {
    super({ name:'rekt_miner', cooldownMs:60000, minReward:150, maxReward:800, container, user });
    this._rocksLeft = ROCKS_TO_WIN;
    this._timeLeft  = TIME_LIMIT;
    this._currentHP = 5;
    this._maxHP     = 5;
  }

  onStart() {
    this._rocksLeft = ROCKS_TO_WIN;
    this._timeLeft  = TIME_LIMIT;
    this._render();
    this._spawnRock();
    this.startTick(1000);
  }

  onTick() {
    this._timeLeft--;
    const el = document.getElementById('rm-timer');
    if (el) {
      el.textContent = this._timeLeft;
      el.style.color = this._timeLeft <= 5 ? 'var(--red)' : '';
    }
    if (this._timeLeft <= 0) {
      this.end(false, 0);
      showGameResult(this.container, false, 0, `دمرت ${ROCKS_TO_WIN - this._rocksLeft}/${ROCKS_TO_WIN} صخور`);
    }
  }

  _render() {
    this.container.innerHTML = `
      <div class="game-screen miner-screen">
        <div class="game-hud">
          <span>⏱ <strong id="rm-timer" class="red">${this._timeLeft}</strong>ث</span>
          <span>الصخور: <strong id="rm-rocks" class="gold">${ROCKS_TO_WIN}</strong></span>
        </div>
        <div class="miner-arena" id="miner-arena">
          <div id="miner-rock-zone" class="miner-rock-zone"></div>
        </div>
        <div class="miner-hint muted">اضغط على الصخرة لتدميرها!</div>
      </div>`;
  }

  _spawnRock() {
    if (!this._running || this._rocksLeft <= 0) return;
    const zone = document.getElementById('miner-rock-zone');
    if (!zone) return;

    // صعوبة تتصاعد
    const level     = Math.min(5, Math.ceil((ROCKS_TO_WIN - this._rocksLeft + 1) / 3));
    this._maxHP     = level;
    this._currentHP = level;

    const sizes = ['sm','md','lg','xl'];
    const size  = sizes[Math.min(level-1, 3)];

    zone.innerHTML = `
      <div class="miner-rock ${size}" id="active-rock">
        <div class="rock-hp-bar">
          <div class="rock-hp-fill" id="rock-hp" style="width:100%"></div>
        </div>
        <i class="fas fa-mountain rock-icon"></i>
        <div class="rock-hp-text" id="rock-hp-text">${this._currentHP}/${this._maxHP}</div>
      </div>`;

    document.getElementById('active-rock')?.addEventListener('click', e => {
      this._hitRock(e);
    });
  }

  _hitRock(e) {
    if (!this._running) return;
    this._currentHP--;

    // تأثير بصري
    const rock = document.getElementById('active-rock');
    if (rock) {
      rock.classList.add('hit-anim');
      setTimeout(() => rock?.classList.remove('hit-anim'), 150);
    }

    // تحديث HP
    const pct = (this._currentHP / this._maxHP) * 100;
    const hpEl = document.getElementById('rock-hp');
    const hpTxt = document.getElementById('rock-hp-text');
    if (hpEl)  hpEl.style.width  = pct + '%';
    if (hpTxt) hpTxt.textContent = `${this._currentHP}/${this._maxHP}`;

    // تأثير شظايا
    this._spawnParticle(e.clientX, e.clientY);

    if (this._currentHP <= 0) {
      this._rocksLeft--;
      document.getElementById('rm-rocks').textContent = this._rocksLeft;

      if (this._rocksLeft <= 0) {
        clearInterval(this._tickTimer);
        const score  = Math.round((this._timeLeft / TIME_LIMIT) * 100);
        this.end(true, score);
        showGameResult(this.container, true,
          Math.floor(this.minReward + (this.maxReward - this.minReward) * score / 100),
          `وقت متبقي: ${this._timeLeft} ثانية`);
      } else {
        const zone = document.getElementById('miner-rock-zone');
        if (zone) zone.innerHTML = '<div class="rock-explode">💥</div>';
        setTimeout(() => this._spawnRock(), 400);
      }
    }
  }

  _spawnParticle(x, y) {
    for (let i = 0; i < 4; i++) {
      const p = document.createElement('div');
      p.className = 'rock-particle';
      p.style.cssText = `left:${x}px;top:${y}px;
        --dx:${(Math.random()-0.5)*60}px;
        --dy:${-(30+Math.random()*50)}px;`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 600);
    }
  }
}
