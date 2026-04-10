import { db } from './firebase_config.js';

let chartInstance = null;

export function initMarket() {
    const ctx = document.getElementById('goldChart');
    if (!ctx) return;

    const dataPoints = Array.from({length: 12}, () => db.get('gold_price') + (Math.random() - 0.5) * 0.1);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(12).fill(''),
            datasets: [{
                data: dataPoints,
                borderColor: '#f59e0b',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                backgroundColor: 'rgba(245, 158, 11, 0.05)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { 
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: 'rgba(255,255,255,0.2)', font: { size: 8 } }
                }
            }
        }
    });

    setupMarketEvents();
}

function setupMarketEvents() {
    document.getElementById('buy-gold')?.addEventListener('click', () => {
        const cost = db.get('gold_price');
        if (db.get('balance') >= cost) {
            db.update('balance', db.get('balance') - cost);
            db.update('gold_holdings', db.get('gold_holdings') + 1);

            db.update('gold_price', db.get('gold_price') * 1.005);
            updateMarketUI();
        }
    });

    document.getElementById('sell-gold')?.addEventListener('click', () => {
        if (db.get('gold_holdings') > 0) {
            const gain = db.get('gold_price');
            db.update('balance', db.get('balance') + gain);
            db.update('gold_holdings', db.get('gold_holdings') - 1);

            db.update('gold_price', db.get('gold_price') * 0.995);
            updateMarketUI();
        }
    });
}

function updateMarketUI() {
    document.getElementById('gold-current-price').innerText = db.get('gold_price').toFixed(4);

    const appHeaderBal = document.getElementById('main-balance');
    if (appHeaderBal) appHeaderBal.innerHTML = `${db.get('balance').toFixed(2)} <span class="text-amber-500 text-[8px]">Q</span>`;
}
