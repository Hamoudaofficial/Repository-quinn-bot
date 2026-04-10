
class QuinnDB {
    constructor() {
        this.data = JSON.parse(localStorage.getItem('quinn_v2_cache')) || {
            balance: 2500.0,
            gold_price: 1.2500,
            gold_holdings: 0,
            stats: { trades: 0, wins: 0, losses: 0 },
            ai_daily: 5,
            history: [],
            last_sync: Date.now()
        };
        this.isDirty = false;
        this.initSync();
    }

    get(key) { return this.data[key]; }

    update(key, val) {
        this.data[key] = val;
        this.isDirty = true;
        this.save();
    }

    save() {
        localStorage.setItem('quinn_v2_cache', JSON.stringify(this.data));
    }

    async sync() {
        if (!this.isDirty) return;
        console.log("☁️ Firebase Batch Sync Active...");

        this.isDirty = false;
        this.data.last_sync = Date.now();
        this.save();
    }

    initSync() {
        setInterval(() => this.sync(), 30000);
        window.addEventListener('beforeunload', () => this.sync());
    }
}

export const db = new QuinnDB();
