// ═══════════════════════════════════════════════
// js/user.js — كلاس المستخدم + استراتيجية الحفظ
// ═══════════════════════════════════════════════
import { db }                          from './firebase.js';
import { getRank }                     from './ranks.js';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

const LS_KEY = 'quinn_user_cache';

function genSecureKey() {
  const hex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QNN-${hex()}-${hex()}-${hex()}`;
}

function genWalletId() {
  const hex = () => Math.random().toString(36).substring(2, 5).toUpperCase();
  return `QN-${hex()}-${hex()}`;
}

export class User {
  constructor(data = {}) {
    this.id              = data.id              || null;
    this.name            = data.name            || 'Quinn Player';
    this.username        = data.username        || '';
    this.photoUrl        = data.photoUrl        || '';
    this.tokens          = data.tokens          || 0;
    this.totalTokens     = data.totalTokens     || 0;
    this.clicks          = data.clicks          || 0;
    this.energy          = data.energy          !== undefined ? data.energy : 1000;
    this.maxEnergy       = data.maxEnergy       || 1000;
    this.energyRegen     = data.energyRegen     || 1;   // per second
    this.tapPower        = data.tapPower        || 1;
    this.xp              = data.xp              || 0;
    this.level           = data.level           || 1;
    this.rankId          = data.rankId          || 'dreamer';
    this.passiveIncome   = data.passiveIncome   || 0;
    this.boostActive     = data.boostActive     || null;
    this.boostExpiry     = data.boostExpiry     || 0;
    this.vaultStaked     = data.vaultStaked     || 0;
    this.vaultLastDeposit= data.vaultLastDeposit|| 0;
    this.vaultLastClaim  = data.vaultLastClaim  || 0;
    this.vaultLoyaltyMul = data.vaultLoyaltyMul || 1.0;
    this.goldGrams       = data.goldGrams       || 0;
    this.goldAvgPrice    = data.goldAvgPrice    || 0;
    this.verified        = data.verified        || false;
    this.referralCode    = data.referralCode    || genWalletId();
    this.referrals       = data.referrals       || 0;
    this.secureKey       = data.secureKey       || null;
    this.walletId        = data.walletId        || genWalletId();
    this.transactions    = data.transactions    || [];
    this.banned          = data.banned          || false;
    this.joinDate        = data.joinDate        || Date.now();
    this.lastSeen        = data.lastSeen        || Date.now();
    this.notifications   = data.notifications   || true;

    // Internal
    this._clickBuffer  = 0;
    this._saveDebounce = null;
    this._batchCount   = 0;
    this._dirty        = false;
  }

  // ── Getters ──────────────────────────────
  get rank() { return getRank(this.totalTokens); }

  // ── Static: تحميل بيانات المستخدم ─────────
  static async load(uid, tgUser = {}) {
    if (!uid) return null;

    // Layer 1: local cache أولاً (عرض فوري)
    let cached = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) cached = JSON.parse(raw);
    } catch (_) {}

    const user = cached && cached.id === String(uid)
      ? new User(cached)
      : new User({ id: String(uid), name: tgUser.first_name || 'Quinn Player', username: tgUser.username || '', photoUrl: tgUser.photo_url || '' });

    // Layer 2: Firestore (مزامنة صامتة في الخلفية)
    User._syncFromFirestore(user, uid, tgUser);

    return user;
  }

  static async _syncFromFirestore(user, uid, tgUser) {
    try {
      const snap = await getDoc(doc(db, 'users', String(uid)));
      if (snap.exists()) {
        const data = snap.data();
        if (data.banned) {
          user.banned = true;
          document.dispatchEvent(new CustomEvent('userBanned'));
          return;
        }
        // دمج البيانات (Firestore أولوية)
        Object.assign(user, data);
        user.id = String(uid);
        user.saveLocal();
      } else {
        // مستخدم جديد
        if (!user.secureKey) user.secureKey = genSecureKey();
        user.id = String(uid);
        user.name      = tgUser.first_name || 'Quinn Player';
        user.username  = tgUser.username   || '';
        user.photoUrl  = tgUser.photo_url  || '';
        user.joinDate  = Date.now();
        await user.saveToFirebase(true);
      }
      document.dispatchEvent(new CustomEvent('userLoaded', { detail: user }));
    } catch (err) {
      console.error('[User] Firestore sync failed:', err);
      document.dispatchEvent(new CustomEvent('userLoaded', { detail: user }));
    }
  }

  // ── الحفظ المحلي (Layer 1 - فوري) ─────────
  saveLocal() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this._toPlain()));
    } catch (_) {}
  }

  // ── حفظ Firestore ──────────────────────────
  async saveToFirebase(isNew = false) {
    if (!this.id) return;
    const data = { ...this._toPlain(), lastSeen: serverTimestamp() };
    try {
      if (isNew) {
        await setDoc(doc(db, 'users', this.id), data);
      } else {
        // لا تعدّل secureKey أبداً بعد إنشائه
        const { secureKey: _sk, ...rest } = data;
        await updateDoc(doc(db, 'users', this.id), rest);
      }
      this._dirty = false;
    } catch (err) {
      console.error('[User] Firebase save failed:', err);
      this._dirty = true;
    }
  }

  // ── Batch Save (Layer 3 - كل 20 نقرة) ─────
  _maybeBatchSave() {
    this._batchCount++;
    if (this._batchCount >= 20) {
      this._batchCount = 0;
      this.saveToFirebase();
    }
  }

  // ── Debounce Save (Layer 2 - 300ms) ────────
  _debounceSave() {
    clearTimeout(this._saveDebounce);
    this._saveDebounce = setTimeout(() => this.saveLocal(), 300);
  }

  // ── كسب توكن ───────────────────────────────
  gainTokens(amount) {
    this.tokens      += amount;
    this.totalTokens += amount;
    this.xp          += amount;
    this._dirty       = true;
    this._debounceSave();
    this._maybeBatchSave();
    return this;
  }

  // ── استهلاك طاقة ───────────────────────────
  consumeEnergy(amount = 1) {
    if (this.energy < amount) return false;
    this.energy -= amount;
    this._dirty  = true;
    this._debounceSave();
    return true;
  }

  // ── إضافة معاملة ───────────────────────────
  addTransaction(type, amount, meta = {}) {
    this.transactions.unshift({ type, amount, time: Date.now(), ...meta });
    if (this.transactions.length > 100) this.transactions = this.transactions.slice(0, 100);
  }

  // ── تحويل للكائن العادي ─────────────────────
  _toPlain() {
    const keys = ['id','name','username','photoUrl','tokens','totalTokens','clicks','energy','maxEnergy',
      'energyRegen','tapPower','xp','level','rankId','passiveIncome','boostActive','boostExpiry',
      'vaultStaked','vaultLastDeposit','vaultLastClaim','vaultLoyaltyMul','goldGrams','goldAvgPrice',
      'verified','referralCode','referrals','secureKey','walletId','transactions','banned','joinDate',
      'lastSeen','notifications'];
    const obj = {};
    keys.forEach(k => { obj[k] = this[k]; });
    return obj;
  }
}

// ── Layer 4: Periodic (كل 5 دقائق) ──────────
export function startPeriodicSave(userRef) {
  setInterval(() => {
    if (userRef.current?._dirty) userRef.current.saveToFirebase();
  }, 5 * 60 * 1000);
}

// ── Layer 5 & 6: beforeunload ────────────────
export function registerBeforeUnload(userRef) {
  window.addEventListener('beforeunload', () => {
    const u = userRef.current;
    if (!u || !u._dirty) return;
    const url = `https://firestore.googleapis.com/v1/projects/quinnbot-9f797/databases/(default)/documents/users/${u.id}`;
    navigator.sendBeacon(url, JSON.stringify(u._toPlain()));
  });
}

// ── طاقة تتجدد تلقائياً ─────────────────────
export function startEnergyRegen(userRef, onUpdate) {
  setInterval(() => {
    const u = userRef.current;
    if (!u || u.energy >= u.maxEnergy) return;
    u.energy = Math.min(u.maxEnergy, u.energy + u.energyRegen);
    u._dirty = true;
    onUpdate?.();
  }, 1000);
}
