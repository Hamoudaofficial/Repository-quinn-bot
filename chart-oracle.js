// ═══════════════════════════════════════════════
// js/games/chart-oracle.js — تخمين اتجاه الشارت
// ═══════════════════════════════════════════════
import { GameBase, showGameResult } from './game-base.js';

export class ChartOracle extends GameBase {
  constructor(container, user) {
    super({ name:'chart_oracle', cooldownMs:90000, minReward:250, maxReward:1500, container, user });
    this._rounds    = 0;
    this._maxRounds = 8;
    this._correct   = 0;
    this._prices    = [];
    this._chart     = null;
  }

  onStart() {
    this._rounds = 0; this._correct = 0;
    this._render();
    this._nextRound();
  }

  _render() {
    this.container.innerHTML = `
      <div class="game-screen oracle-screen">
        <div class="game-hud">
          <span>السؤال: <strong id="co-q">1/${this._maxRounds}</strong></span>
          <span>صحيح: <strong id="co-correct" class="gold">0</strong></span>
        </div>
        <div class="oracle-chart-wrap">
          <canvas id="oracle-chart" height="180"></canvas>
        </div>
        <div id="co-question" class="co-question">ماذا سيحدث للسعر؟</div>
        <div class="oracle-btns" id="co-btns">
          <button class="btn co-btn co-up"   id="co-btn-up">
            <i class="fas fa-arrow-trend-up"></i> ارتفاع
          </button>
          <button class="btn co-btn co-down" id="co-btn-down">
            <i class="fas fa-arrow-trend-down"></i> انخفاض
          </button>
        </div>
        <div id="co-timer-bar" class="co-timer-bar">
          <div id="co-timer-fill" class="co-timer-fill"></div>
        </div>
      </div>`;

    document.getElementById('co-btn-up')?.addEventListener('click',   () => this._answer('up'));
    document.getElementById('co-btn-down')?.addEventListener('click', () => this._answer('down'));
  }

  _nextRound() {
    if (this._rounds >= this._maxRounds) { this._finish(); return; }
    this._rounds++;
    document.getElementById('co-q').textContent       = `${this._rounds}/${this._maxRounds}`;
    document.getElementById('co-correct').textContent = this._correct;

    // توليد بيانات تاريخية
    const len = 20;
    this._prices = [100];
    for (let i = 1; i < len; i++) {
      const delta = (Math.random() - 0.5) * 8;
      this._prices.push(+(this._prices[i-1] + delta).toFixed(2));
    }

    // السعر التالي (الحقيقي)
    this._nextPrice = +(this._prices[len-1] + (Math.random() - 0.5) * 10).toFixed(2);
    this._correctDir = this._nextPrice > this._prices[len-1] ? 'up' : 'down';

    this._drawChart(this._prices);
    this._answered = false;

    // مؤقت 5 ثوان فقط
    clearTimeout(this._roundTimer);
    this._startTimer(5, () => {
      if (!this._answered) this._answer('timeout');
    });
  }

  _drawChart(prices) {
    const canvas = document.getElementById('oracle-chart');
    if (!canvas) return;
    if (this._chart) { this._chart.destroy(); this._chart = null; }
    const rising = prices[prices.length-1] > prices[0];
    this._chart = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: prices.map((_,i) => i+1),
        datasets: [{ data: prices, borderColor: rising ? '#00FF88' : '#FF4757', borderWidth:2,
          backgroundColor: rising ? 'rgba(0,255,136,0.05)' : 'rgba(255,71,87,0.05)',
          fill:true, pointRadius:0, tension:0.3 }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{x:{display:false}, y:{display:false}},
        animation:{duration:300}
      }
    });
  }

  _startTimer(sec, onExpire) {
    const fill = document.getElementById('co-timer-fill');
    if (fill) { fill.style.transition='none'; fill.style.width='100%'; }
    setTimeout(() => { if (fill) { fill.style.transition=`width ${sec}s linear`; fill.style.width='0%'; }}, 50);
    this._roundTimer = setTimeout(onExpire, sec * 1000);
  }

  _answer(dir) {
    if (this._answered) return;
    this._answered = true;
    clearTimeout(this._roundTimer);

    const btns = document.getElementById('co-btns');
    const isCorrect = dir === this._correctDir;

    if (isCorrect) this._correct++;

    // إظهار النتيجة
    if (btns) {
      btns.innerHTML = `
        <div class="co-reveal ${isCorrect ? 'correct' : 'wrong'}">
          ${isCorrect ? '✅ صحيح!' : '❌ خطأ!'}
          الإجابة: السعر ${this._correctDir === 'up' ? 'ارتفع' : 'انخفض'} إلى ${this._nextPrice}
        </div>`;
    }

    // رسم السعر التالي
    const newPrices = [...this._prices, this._nextPrice];
    this._drawChart(newPrices);

    setTimeout(() => this._nextRound(), 1200);
  }

  _finish() {
    const score    = Math.round((this._correct / this._maxRounds) * 100);
    const won      = this._correct >= Math.ceil(this._maxRounds * 0.6); // 60% للفوز
    this.end(won, score);
    showGameResult(this.container, won,
      Math.floor(this.minReward + (this.maxReward - this.minReward) * score / 100),
      `${this._correct}/${this._maxRounds} إجابات صحيحة`);
  }

  onEnd() { if(this._chart) this._chart.destroy(); clearTimeout(this._roundTimer); }
}
