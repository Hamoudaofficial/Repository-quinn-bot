// api/invoice.js — إنشاء فاتورة دفع تيليجرام
// ENV VARS needed in Vercel:
//   BOT_TOKEN   = your @Quinnofficialbot token
//   USE_LIVE    = "true" for live payments, anything else = test mode

const PROVIDER_TEST = '6073714100:TEST:TG_CjbagwXnbrZA6FihSUy8uwYA';
const PROVIDER_LIVE = '5775769170:LIVE:TG_T0r8iYfufw1PRD3n2manFxUA';

const PACKAGES = {
  pay1: { quinn: 1000,   price: 99,   label: 'Starter — 1,000 Quinn'   },
  pay2: { quinn: 3500,   price: 299,  label: 'Basic — 3,500 Quinn'     },
  pay3: { quinn: 7000,   price: 499,  label: 'Standard — 7,000 Quinn'  },
  pay4: { quinn: 15000,  price: 999,  label: 'Pro — 15,000 Quinn'      },
  pay5: { quinn: 35000,  price: 1999, label: 'Elite — 35,000 Quinn'    },
  pay6: { quinn: 100000, price: 4999, label: 'Legend — 100,000 Quinn'  },
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'BOT_TOKEN not configured. Set it in Vercel environment variables.' });
  }

  const PROVIDER_TOKEN = process.env.USE_LIVE === 'true' ? PROVIDER_LIVE : PROVIDER_TEST;

  const { uid, walletId, pkgId } = req.body || {};

  if (!uid || !pkgId) {
    return res.status(400).json({ error: 'Missing uid or pkgId' });
  }

  const pkg = PACKAGES[pkgId];
  if (!pkg) {
    return res.status(400).json({ error: 'Invalid package ID' });
  }

  try {
    const apiRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:           `Quinn Bot — ${pkg.label}`,
          description:     `احصل على ${pkg.quinn.toLocaleString()} Quinn Token بشكل فوري`,
          payload:         JSON.stringify({ uid, pkgId, walletId, ts: Date.now() }),
          provider_token:  PROVIDER_TOKEN,
          currency:        'USD',
          prices:          [{ label: pkg.label, amount: pkg.price }],
          need_name:            false,
          need_phone_number:    false,
          need_email:           false,
          need_shipping_address:false,
          is_flexible:          false,
          photo_url:       'https://i.imgur.com/placeholder.png',
        })
      }
    );

    const data = await apiRes.json();

    if (!data.ok) {
      console.error('[Invoice] Bot API error:', data);
      return res.status(500).json({ error: data.description || 'Bot API error' });
    }

    return res.json({ url: data.result, pkg });

  } catch (err) {
    console.error('[Invoice] Network error:', err);
    return res.status(500).json({ error: err.message });
  }
}
