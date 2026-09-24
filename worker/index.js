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

// Google puts the wait in a RetryInfo detail as "37s" (or "2.5s"); a
// Retry-After header, where there is one, is plain seconds. Neither → null,
// and the page falls back to a minute.
function retryDelay(text, header) {
  let secs = null;
  try {
    const info = JSON.parse(text)?.error?.details?.find((d) => String(d?.['@type']).endsWith('RetryInfo'));
    const m = /^(\d+(?:\.\d+)?)s$/.exec(info?.retryDelay ?? '');
    if (m) secs = Number(m[1]);
  } catch { /* not JSON: fall through to the header */ }
  if (secs == null && /^\d+$/.test(header ?? '')) secs = Number(header);
  return secs == null ? null : Math.min(Math.max(Math.ceil(secs), 1), 86400);
}

// The stand-in for when Gemini is out of quota. Same reading, same words: it has
// no response schema, only a JSON mode, so the shape is spelled out instead —
// and the page checks the answer the same way whichever reader gave it.
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_ASK = `${GEMINI_ASK} Reply with JSON only, in this shape: `
  + '{"items":[{"qty":1,"name":"...","amount":0}],"total":0,"service":0,"tax":0,"discount":0,"place":"...","date":"YYYY-MM-DD"}.';

// Dressed as a Gemini reply, so the page reads both through one door and only
// learns which one answered from `reader`. Null when DeepSeek can't help either.
async function readWithDeepSeek(image, key) {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-flash',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: [
        { type: 'text', text: DEEPSEEK_ASK },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
      ] }],
    }),
  });
  if (!res.ok) { console.error('DeepSeek', res.status, await res.text()); return null; }
  const text = (await res.json())?.choices?.[0]?.message?.content ?? '';
  return { candidates: [{ content: { parts: [{ text }] } }], reader: 'DeepSeek' };
}

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
      return new Response(JSON.stringify({ error: 'Too many scans from here just now. Try again in a minute.', retryAfter: 60 }),
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
      const text = await res.text();
      // The owner's log is where the prose does belong: `wrangler tail`.
      console.error('Gemini', res.status, text);
      // Out of quota: DeepSeek reads this one instead. Nothing is remembered —
      // the next scan asks Gemini first again, so it is back the moment its
      // quota is.
      if (res.status === 429 && env.DEEPSEEK_KEY) {
        const read = await readWithDeepSeek(image, env.DEEPSEEK_KEY).catch((e) => { console.error('DeepSeek', e); return null; });
        if (read) return new Response(JSON.stringify(read), { headers: { ...head, 'Content-Type': 'application/json' } });
      }
      // The one thing in a quota refusal the page may have: how long to wait,
      // as a bare number of seconds, so it can say when to try again.
      const retryAfter = res.status === 429 ? retryDelay(text, res.headers.get('Retry-After')) : null;
      return new Response(JSON.stringify({ error: `The reader refused the photo (${res.status}).`, retryAfter }),
        { status: res.status === 429 ? 429 : 502, headers: { ...head, 'Content-Type': 'application/json' } });
    }
    // The candidate envelope goes back untouched: the page already knows how to
    // read it, and parseGemini is the one place that should.
    return new Response(res.body, { headers: { ...head, 'Content-Type': 'application/json' } });
  },
};
