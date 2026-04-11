// api/webhook.js — Webhook للبوت (يستقبل الدفعات من تيليجرام)
// Set your Telegram webhook to: https://YOUR_APP.vercel.app/api/webhook
// Command: https://api.telegram.org/bot{BOT_TOKEN}/setWebhook?url=https://YOUR_APP.vercel.app/api/webhook

const FIREBASE_PROJECT = 'quinnbot-9f797';
const FIREBASE_KEY     = 'AIzaSyDYyxW9P-_DlOEqK6FCQqqBWo5UFxGnshY';
const FIRESTORE_BASE   = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

const PACKAGES = {
  pay1: { quinn: 1000   },
  pay2: { quinn: 3500   },
  pay3: { quinn: 7000   },
  pay4: { quinn: 15000  },
  pay5: { quinn: 35000  },
  pay6: { quinn: 100000 },
};

// Firestore REST helpers
async function fsGet(path) {
  const r = await fetch(`${FIRESTORE_BASE}/${path}?key=${FIREBASE_KEY}`);
  return r.json();
}
async function fsPatch(path, fields) {
  const keys = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
  const r = await fetch(
    `${FIRESTORE_BASE}/${path}?${keys}&key=${FIREBASE_KEY}`,
    { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ fields }) }
  );
  return r.json();
}
async function fsCreate(collection, fields) {
  const r = await fetch(
    `${FIRESTORE_BASE}/${collection}?key=${FIREBASE_KEY}`,
    { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ fields }) }
  );
  return r.json();
}

function iv(n)  { return { integerValue: String(Math.floor(n || 0)) }; }
function sv(s)  { return { stringValue: String(s || '') }; }
function tv(d)  { return { timestampValue: (d || new Date()).toISOString() }; }

export default async function handler(req, res) {
  // Always return 200 to Telegram so it stops retrying
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error('[Webhook] BOT_TOKEN not set');
    return res.status(200).json({ ok: true });
  }

  const update = req.body;
  if (!update) return res.status(200).json({ ok: true });

  try {
    // ═══ PRE-CHECKOUT QUERY ═══
    if (update.pre_checkout_query) {
      const q = update.pre_checkout_query;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pre_checkout_query_id: q.id, ok: true })
      });
      return res.status(200).json({ ok: true });
    }

    // ═══ SUCCESSFUL PAYMENT ═══
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      let payload;
      try { payload = JSON.parse(payment.invoice_payload); } catch(e) { return res.status(200).json({ ok: true }); }

      const { uid, pkgId } = payload;
      const pkg = PACKAGES[pkgId];
      if (!pkg || !uid) return res.status(200).json({ ok: true });

      // Get current user data
      const userDoc = await fsGet(`users/${uid}`);
      const cur = userDoc.fields || {};
      const curTokens = parseInt(cur.tokens?.integerValue || '0');
      const curTotal  = parseInt(cur.totalTokens?.integerValue || '0');

      // Update tokens
      await fsPatch(`users/${uid}`, {
        tokens:      iv(curTokens + pkg.quinn),
        totalTokens: iv(curTotal  + pkg.quinn),
        lastSeen:    tv(new Date()),
      });

      // Log payment
      await fsCreate('payments', {
        uid:        sv(uid),
        pkgId:      sv(pkgId),
        quinn:      iv(pkg.quinn),
        amount:     iv(payment.total_amount),
        currency:   sv(payment.currency),
        chargeId:   sv(payment.telegram_payment_charge_id),
        createdAt:  tv(new Date()),
      });

      console.log(`[Webhook] Payment success: uid=${uid} pkg=${pkgId} quinn=${pkg.quinn}`);
      return res.status(200).json({ ok: true });
    }

  } catch (err) {
    console.error('[Webhook] Error:', err);
  }

  return res.status(200).json({ ok: true });
}
