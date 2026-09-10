// A receipt reader, not a Gemini relay.
//
// The key lives here as a secret binding so it never reaches the browser. That
// makes this endpoint the thing worth abusing instead: it holds a key anyone
// would like to spend. So it takes an image and nothing else — the prompt and
// the schema are ours, below — and a caller who wants a general-purpose model
// out of it gets a receipt reading instead.
//
// The prompt and schema are a deliberate copy of the pair in index.html, which
// the bring-your-own-key path still posts straight to Google. Change one and
// change the other; two readings of the same struk should not differ by which
// door they came through.

const ALLOWED = new Set(['https://nicholaslie90.github.io']);

// A struk at 0.85 JPEG is a couple of hundred KB; base64 adds a third. Anything
// past this is not a receipt, and there is no reason to pay Google to look.
const MAX_IMAGE = 4 * 1024 * 1024;

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';
const GEMINI_ASK = [
  'Read this Indonesian restaurant receipt (struk).',
  'Return every ordered line item exactly as printed, with its quantity and its line total in whole rupiah.',
  'Do not return service charge, tax, subtotal, discount or total as items — they have fields of their own.',
  'Fill those fields with the figures the struk actually charged, in whole rupiah, not the percentages beside them:',
  'service is the service charge (also printed as "Service", "SC" or "Servis");',
  'tax is the government tax ("PPN", "PB1", "Pajak", "Tax");',
  'discount is any amount taken off ("Diskon", "Discount", "Potongan", "Voucher"), as a positive number;',
  'total is the final figure at the foot of the struk.',
  'place is the name of the restaurant, cafe or shop printed at the head of the struk — the trading name alone, not its address, branch code, tagline or tax number.',
  'date is the date on the struk as YYYY-MM-DD.',
  'Indonesian receipts write dates day first, so 03/04/2026 and 03-04-26 are both 2026-04-03, never 3 March.',
  'Leave a field out when the struk does not print it. Never invent or calculate one.',
].join(' ');
const AMOUNT = { type: 'integer' };
const GEMINI_CONFIG = {
  temperature: 0,
  responseMimeType: 'application/json',
  responseSchema: {
    type: 'object',
    properties: {
      items: { type: 'array', items: { type: 'object',
        properties: { qty: { type: 'integer' }, name: { type: 'string' }, amount: AMOUNT },
        required: ['qty', 'name', 'amount'] } },
      total: AMOUNT,
      service: AMOUNT,
      tax: AMOUNT,
      discount: AMOUNT,
      place: { type: 'string' },
      date: { type: 'string' },
    },
    required: ['items'],
  },
};

const cors = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'Content-Type',
  // Without this a cache could hand one origin's allow header to another.
  Vary: 'Origin',
});

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') ?? '';
    // An Origin header is trivially forged with curl, so this is a speed bump
    // for casual embedding, not a security boundary. The rate limit below is
    // the part that actually holds when someone means it.
    if (!ALLOWED.has(origin)) return new Response('Not allowed here.', { status: 403 });
    const head = cors(origin);

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: { ...head, 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
    }
    if (req.method !== 'POST') return new Response('POST only.', { status: 405, headers: head });

    // Per IP, per the window set in wrangler.toml. A phone on CGNAT shares an
    // address with its neighbours, so the limit is loose enough that a real
    // table splitting a real bill never meets it.
    const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
    const { success } = await env.SCAN_LIMIT.limit({ key: ip });
    if (!success) {
      return new Response(JSON.stringify({ error: 'Too many scans from here just now. Try again in a minute.' }),
        { status: 429, headers: { ...head, 'Content-Type': 'application/json' } });
    }

    let image;
    try { ({ image } = await req.json()); } catch { image = null; }
    if (typeof image !== 'string' || !image) {
      return new Response(JSON.stringify({ error: 'Send {"image": "<base64 jpeg>"}.' }),
        { status: 400, headers: { ...head, 'Content-Type': 'application/json' } });
    }
    if (image.length > MAX_IMAGE) {
      return new Response(JSON.stringify({ error: 'That photo is too large to read.' }),
        { status: 413, headers: { ...head, 'Content-Type': 'application/json' } });
    }

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
      body: JSON.stringify({
        generationConfig: GEMINI_CONFIG,
        contents: [{ parts: [{ text: GEMINI_ASK }, { inline_data: { mime_type: 'image/jpeg', data: image } }] }],
      }),
    });

    // Google's own message can name the key, the project or the quota — none of
    // which is the browser's business. The status is; the prose is not.
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `The reader refused the photo (${res.status}).` }),
        { status: res.status === 429 ? 429 : 502, headers: { ...head, 'Content-Type': 'application/json' } });
    }
    // The candidate envelope goes back untouched: the page already knows how to
    // read it, and parseGemini is the one place that should.
    return new Response(res.body, { headers: { ...head, 'Content-Type': 'application/json' } });
  },
};
