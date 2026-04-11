// ═══════════════════════════════════════════════
// js/games/cipher-break.js — لعبة ذاكرة الأرقام
// ═══════════════════════════════════════════════
import { GameBase, showGameResult } from './game-base.js';

export class CipherBreak extends GameBase {
  constructor(container, user) {
    super({ name:'cipher_break', cooldownMs:120000, minReward:300, maxReward:2000, container, user });
    this._sequence   = [];
    this._userInput  = [];
    this._phase      = 'show';  // show | input
    this._round      = 0;
    this._maxRounds  = 6;
  }

  onStart() {
    this._sequence = []; this._userInput = []; this._round = 0;
    this._render();
    this._nextSequence();
  }

  _render() {
    this.container.innerHTML = `
      <div class="game-screen cipher-screen">
        <div class="game-hud">
          <span>الجولة: <strong id="cb-round">1/${this._maxRounds}</strong></span>
          <span>طول: <strong id="cb-len" class="gold">3</strong> أرقام</span>
        </div>
        <div id="cb-display" class="cb-display"></div>
        <div id="cb-numpad" class="cb-numpad" style="display:none">
          ${[1,2,3,4,5,6,7,8,9,0,'✗','✓'].map(n => `
            <button class="cb-key ${n==='✗'?'danger':n==='✓'?'success':''}" data-n="${n}">${n}</button>`).join('')}
        </div>
        <div id="cb-input-display" class="cb-input-display"></div>
        <div class="cb-lives" id="cb-lives">❤️❤️❤️</div>
      </div>`;

    document.getElementById('cb-numpad')?.addEventListener('click', e => {
      const btn = e.target.closest('.cb-key');
      if (!btn) return;
      const n = btn.dataset.n;
      if (n === '✗') this._userInput.pop();
      else if (n === '✓') this._checkInput();
      else this._userInput.push(parseInt(n));
      this._updateInputDisplay();
    });
  }

  _nextSequence() {
    this._round++;
    if (this._round > this._maxRounds) { this.end(true, 100); showGameResult(this.container, true, this.maxReward, `أتممت جميع الجولات!`); return; }

    const len = 2 + this._round;  // 3,4,5,6,7,8 أرقام — يصعب بسرعة
    document.getElementById('cb-round').textContent = `${this._round}/${this._maxRounds}`;
    document.getElementById('cb-len').textContent   = `${len}`;

    // توليد التسلسل
    this._sequence  = Array.from({length:len}, () => Math.floor(Math.random()*10));
    this._userInput = [];
    this._phase     = 'show';

    // عرض الأرقام
    document.getElementById('cb-display').innerHTML = '';
    document.getElementById('cb-numpad').style.display = 'none';

    const display = document.getElementById('cb-display');
    const showTime = Math.max(400, 1200 - this._round * 100); // يتسارع مع الجولات

    // عرض الأرقام واحداً تلو الآخر
    let i = 0;
    display.innerHTML = '<div class="cb-hint">احفظ التسلسل!</div>';
    const showNext = () => {
      if (i >= this._sequence.length) {
        setTimeout(() => this._startInput(), 400);
        return;
      }
      display.innerHTML = `<div class="cb-number animate-pop">${this._sequence[i]}</div>`;
      i++;
      setTimeout(showNext, showTime);
    };
    setTimeout(showNext, 500);
  }

  _startInput() {
    this._phase = 'input';
    document.getElementById('cb-display').innerHTML = '<div class="cb-hint">أدخل التسلسل بالترتيب</div>';
    document.getElementById('cb-numpad').style.display = 'grid';
    this._updateInputDisplay();
  }

  _updateInputDisplay() {
    const el = document.getElementById('cb-input-display');
    if (!el) return;
    el.innerHTML = this._userInput.map(n =>
      `<span class="cb-entered-num">${n}</span>`).join('') || '<span class="muted">--</span>';
  }

  _checkInput() {
    const correct = this._sequence.every((n, i) => n === this._userInput[i])
                    && this._userInput.length === this._sequence.length;

    if (correct) {
      document.getElementById('cb-display').innerHTML = '<div class="cb-hint correct">✅ صحيح!</div>';
    } else {
      // إظهار الإجابة الصحيحة
      document.getElementById('cb-display').innerHTML = `
        <div class="cb-hint wrong">❌ خطأ!</div>
        <div class="cb-correct">${this._sequence.join(' - ')}</div>`;
      // حياة
      const livesEl = document.getElementById('cb-lives');
      if (livesEl && livesEl.textContent.length > 0) {
        livesEl.textContent = livesEl.textContent.slice(0,-2); // إزالة قلب
        if (livesEl.textContent === '') {
          setTimeout(() => { this.end(false, 0); showGameResult(this.container, false, 0, 'نفدت حياتك!'); }, 800);
          return;
        }
      }
    }

    document.getElementById('cb-numpad').style.display = 'none';
    this._userInput = [];
    setTimeout(() => this._nextSequence(), 1000);
  }
}
