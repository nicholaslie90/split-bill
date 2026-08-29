// Bill math. Everything is whole rupiah — no cents in IDR.
// The only rule that matters: the sum of what everybody pays must equal the bill total, exactly.

// Round `values` to whole rupiah so that they still add up to `target`.
// Half-up first — .5 and above goes up, below stays put — which is the number
// anyone checking the maths on their own would write down. That can miss the
// target by a rupiah or two, so the residual goes to whoever the rounding
// treated worst; ties go to whoever is listed first.
export function roundToSum(values, target) {
  const out = values.map((v) => Math.round(v));
  let left = target - out.reduce((a, b) => a + b, 0);
  if (!values.length) return out; // nothing to put the residual on
  const step = left >= 0 ? 1 : -1; // step handles negative targets (a net refund)
  const order = values
    .map((v, i) => [(v - out[i]) * step, i]) // how much this value lost to rounding
    .sort((a, b) => (b[0] - a[0]) || step * (a[1] - b[1]))
    .map((e) => e[1]);
  for (let k = 0; left !== 0; k++, left -= step) out[order[k % order.length]] += step;
  return out;
}

// bill: { participants: [name], items: [{name, amount, sharedBy: [name]}],
// `sharedBy` is a tally, not a set: a name listed twice took two of the four
// lychee teas on that line and pays for two. Its length is the number of shares
// the line is cut into, which is what makes the arithmetic fall out unchanged.
//         servicePct, serviceAmt, taxPct, taxAmt, taxOnService, discount, discountPct, roundTo }
// Service, tax and discount each take a percentage, a flat rupiah amount, or both.
export function calcShares(bill) {
  const people = bill.participants ?? [];
  const empty = { people: [], subtotal: 0, service: 0, tax: 0, discount: 0, rounding: 0, total: 0 };
  if (!people.length) return empty;

  // Exact (fractional) item slices per person. These double as the weights
  // for allocating service + tax proportionally.
  const weights = people.map(() => 0);
  const lines = people.map(() => []);
  for (const it of bill.items ?? []) {
    const amount = Number(it.amount) || 0;
    const tagged = (it.sharedBy?.length ? it.sharedBy : people).filter((p) => people.includes(p));
    if (!tagged.length) continue; // item tagged only to people who were since removed
    const each = amount / tagged.length;
    // One line per person per item, however many shares they took — two entries
    // of 55.000 for the same tea is a receipt to argue with, not to read.
    for (const p of new Set(tagged)) {
      const took = tagged.filter((x) => x === p).length;
      lines[people.indexOf(p)].push({ name: it.name, share: each * took, sharedBy: tagged.length, took });
      weights[people.indexOf(p)] += each * took;
    }
  }

  const gross = weights.reduce((a, b) => a + b, 0);
  const svcPct = Number(bill.servicePct) || 0;
  const taxPct = Number(bill.taxPct) || 0;
  const service = (gross * svcPct) / 100 + (Number(bill.serviceAmt) || 0);
  // ID convention: PPN is charged on subtotal + service charge (flat part included). Toggleable.
  const tax = ((gross + (bill.taxOnService === false ? 0 : service)) * taxPct) / 100 + (Number(bill.taxAmt) || 0);

  const subtotal = Math.round(gross);
  const svcTotal = Math.round(service);
  const taxTotal = Math.round(tax);
  const charged = subtotal + svcTotal + taxTotal;
  // Flat per head, not proportional — a Rp 50k voucher is worth the same to everyone.
  // Rupiah and percent stack (10% off *and* a voucher), then cap at the bill so
  // the total can never go negative.
  const off = (Number(bill.discount) || 0) + (charged * (Number(bill.discountPct) || 0)) / 100;
  const discount = Math.min(Math.max(0, Math.round(off)), charged);

  // Pembulatan: shave the total down to a round figure — the tail nobody wants to
  // hand over in coins. Zero when the total already lands on one, so the line only
  // shows up when it's actually doing something.
  const step = Math.max(0, Math.round(Number(bill.roundTo) || 0));
  const rounding = step > 1 ? (charged - discount) % step : 0;

  // Each person's exact, unrounded cut: their slice of the items carries the same
  // slice of service and tax, less an even share of the discount.
  // No items yet -> nobody has a slice, so flat charges split evenly.
  const cut = gross > 0 ? weights.map((w) => w / gross) : weights.map(() => 1 / people.length);
  const parts = cut.map((f) => [
    f * subtotal, f * svcTotal, f * taxTotal,
    -discount / people.length, -rounding / people.length,
  ]);

  // Round the number people actually read — their total — and only then split it
  // back into the lines that explain it. Rounding each column on its own instead
  // lets one person collect the leftover rupiah of the subtotal AND the service
  // AND the tax, which pushed their total up a rupiah while somebody else's fell
  // a rupiah short of the half-up they'd work out by hand.
  const totals = roundToSum(parts.map((r) => r.reduce((a, b) => a + b, 0)), charged - discount - rounding);
  const rows = parts.map((r, i) => roundToSum(r, totals[i]));
  const lineAmts = people.map((_, i) => roundToSum(lines[i].map((l) => l.share), rows[i][0]));

  return {
    people: people.map((name, i) => ({
      name,
      lines: lines[i].map((l, k) => ({ ...l, share: lineAmts[i][k] })),
      subtotal: rows[i][0],
      service: rows[i][1],
      tax: rows[i][2],
      discount: -rows[i][3],
      rounding: -rows[i][4],
      total: totals[i],
    })),
    subtotal,
    service: svcTotal,
    tax: taxTotal,
    discount,
    rounding,
    total: charged - discount - rounding,
  };
}

// "Nic-Cin x2, Naren" — the tally read out. Printing a name once per share
// reads as a stutter, and on a four-way line it doesn't fit.
export function sharedByLabel(sharedBy) {
  const tally = new Map();
  for (const p of sharedBy ?? []) tally.set(p, (tally.get(p) ?? 0) + 1);
  return [...tally].map(([p, n]) => (n > 1 ? `${p} \u00d7${n}` : p)).join(', ');
}

// How a person's slice of one item reads: "2 of 4" — their shares out of the
// line's. Empty when nobody else was on the item, so it says nothing then.
export const shareLabel = (line) => (line.sharedBy > 1 ? `${line.took ?? 1} of ${line.sharedBy}` : '');

// The other side of the ledger for whoever fronted the bill ("nalangin"): who
// owes them, and how much they should get back. Their own share stays theirs, so
// `due` plus their own total is always the bill total. People who owe nothing are
// left off the list.
export function collect(result, payer) {
  const owed = result.people.filter((p) => p.name !== payer && p.total !== 0);
  return { owed, due: owed.reduce((a, p) => a + p.total, 0) };
}

// --- receipt photo -> draft item lines --------------------------------------
// Best effort, and that is the whole contract: a struk photo is creased, faded
// and thermal-printed, so this is deliberately conservative. It takes the
// rightmost money-looking number on a line as that line's amount and the text
// before it as the name, and it skips the lines that aren't items — totals, tax,
// service, cash, change — which the app charges through its own fields, so a
// misread there can't quietly double-charge anybody. Whatever it gets wrong the
// user edits; whatever it misses they type.
// The summary block at the foot of the struk. Narrower than NOT_AN_ITEM on
// purpose: "Meja 7" is not an item either, but it's printed in the header and
// must not stop the reading before it starts.
const END_OF_ITEMS = /(sub\s*)?total|servi|charg|ppn|pb\s*[1li|]|pajak|tax|diskon|discount|voucher|pembulatan|rounding|tunai|cash|kembali|change|\d+\s*(items|barang|qty)\b/i;
const NOT_AN_ITEM = /(sub\s*)?total|tunai|cash|kembali|change|ppn|pb\s*1|pajak|tax|servi|diskon|discount|voucher|pembulatan|rounding|bayar|payment|kartu|card|debit|kredit|credit|qris|npwp|terima\s*kasih|thank|kasir|cashier|struk|\bnota\b|receipt|invoice|meja|table|tanggal|date|\d{1,2}\s*[/-]\s*\d{1,2}\s*[/-]|jam|time|\bpax\b|\d+\s*(items|barang|qty)\b|www\.|@/i;
// 59.000 | 59,000 | 1.234.567 | 59000 — with an optional two-decimal tail. The
// space around the separator is OCR's, not the printer's: "165 .000" is one
// number that a crease broke in half, and dropping it loses a whole item line.
const MONEY = String.raw`\d{1,3}(?:\s?[.,]\s?\d{3})+(?:[.,]\d{2})?|\d{3,}(?:[.,]\d{2})?`;
const MONEY_ON_LINE = new RegExp(MONEY, 'g');
// A price sitting at the end of what's left of the name is the unit-price column
// ("2 x Es Teh  5.000  10.000"), not part of what the thing is called.
const UNIT_PRICE = new RegExp(`(?:${MONEY})\\s*$`);

// "59.000,00" -> 59000. The two-decimal tail only goes if what's left still
// looks like an amount, so a bare "590" stays 590 rather than becoming 5.
const asRupiah = (s) => {
  const trimmed = s.replace(/[.,]\d{2}$/, '');
  return Number((trimmed.replace(/\D/g, '').length >= 3 ? trimmed : s).replace(/\D/g, ''));
};

export function parseReceipt(text) {
  const items = [];
  let total = null;
  let done = false; // past the last dish, into the charges
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    // Every struk prints its dishes first and its charges after, so the first
    // charge line ends the list. Matching each charge by name isn't enough on
    // its own — OCR turns "Service Charge" into "vice Charg®" and "Subtotal"
    // into "Shiota! Pal", and a charge that slips through as an item inflates
    // what everybody owes. One dish has to have been found first, so header
    // noise that happens to read as "total" can't swallow the whole receipt.
    done ||= items.length > 0 && END_OF_ITEMS.test(line);
    const found = line.match(MONEY_ON_LINE);
    if (!found) continue;
    const amount = asRupiah(found[found.length - 1]); // unit price then line total: the line total wins
    // Nothing on a struk costs less than a thousand rupiah, and nothing costs a
    // hundred million: below is a table number or the tail of a misread line,
    // above is the shop's phone number read as one long figure.
    if (amount < 1000 || amount > 100_000_000) continue;
    if (done || NOT_AN_ITEM.test(line)) {
      // The printed total is worth keeping as a cross-check, even though it's
      // not an item. Receipts print SUBTOTAL, then TOTAL, then what was paid.
      if (/\btotals?\b/i.test(line) && !/sub\s*total/i.test(line)) total = amount;
      continue;
    }
    // Quantity leads the line more often than not. Keep it when it's more than
    // one — "2x Es Teh" explains the amount — and drop a lone "1".
    const name = line.slice(0, line.lastIndexOf(found[found.length - 1]))
      .replace(UNIT_PRICE, '')
      .replace(/^(\d+)\s*[xX*]?\s+/, (_, q) => (Number(q) > 1 ? `${q}x ` : ''))
      .replace(/^[\s.,:;*|-]+/, '')
      .replace(/[\s.,:;xX*@=|-]+$/, '')
      .trim();
    if ((name.match(/[a-z]/gi) ?? []).length < 2) continue; // no name = not an item line
    items.push({ name, amount });
  }
  return { items, total };
}

// --- receipt photo -> Gemini -> draft item lines ------------------------------
// A model reads a creased struk far better than Tesseract does, but its answer
// is untrusted input like any other: it decides what everybody pays, so nothing
// goes through unchecked. Same shape out as parseReceipt, so the rest of the
// scan doesn't care which of the two read the photo.
const MAX_ITEMS = 200;      // a struk this long is a catering invoice
const MAX_NAME = 120;

const asAmount = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 1000 && n <= 100_000_000 ? n : null;
};

export function parseGemini(data) {
  const items = [];
  for (const raw of (Array.isArray(data?.items) ? data.items : []).slice(0, MAX_ITEMS)) {
    const amount = asAmount(raw?.amount);
    if (amount === null) continue;
    // Control characters would come straight back out in a WhatsApp message.
    const name = String(raw?.name ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, MAX_NAME);
    if (!name) continue;
    // Quantity leads the name the same way it does on the struk, and the same
    // way parseReceipt writes it — a lone "1" says nothing, "4x" explains the
    // amount and tells you how many shares the line is worth splitting into.
    const qty = Math.round(Number(raw?.qty));
    items.push({ name: Number.isFinite(qty) && qty > 1 && qty <= 999 ? `${qty}x ${name}` : name, amount });
  }
  return { items, total: asAmount(data?.total) };
}

// --- the bill as a spreadsheet ----------------------------------------------
// For keeping your own history offline. CSV because every spreadsheet opens it
// and it stays a plain text file you can read in ten years; the `sep=,` first
// line is what makes Excel respect the comma whatever the machine's locale says.
// Amounts are written as bare numbers, so the columns actually add up in the sheet.
const cell = (v) => {
  if (typeof v === 'number') return String(v);
  const s = String(v ?? '');
  // A leading =, +, - or @ makes a spreadsheet run typed text as a formula. Defuse it.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function toCsv(bill, result) {
  const paidBy = bill.paidBy || '';
  const rows = [
    ['Bill', bill.title?.trim() || 'Split Bill'],
    ['Date', bill.date || ''],
    [],
    ['Item', 'Amount', 'Shared by'],
    ...(bill.items ?? []).map((it) => [
      it.name || 'Item', Number(it.amount) || 0,
      it.sharedBy?.length ? sharedByLabel(it.sharedBy) : 'everyone',
    ]),
    [],
    ['Subtotal', result.subtotal],
    ['Service charge', result.service],
    ['Tax', result.tax],
    ['Discount', -result.discount],
    ['Rounding', -result.rounding],
    ['Total', result.total],
    [],
    ['Person', 'Phone', 'Paid up front', 'Subtotal', 'Service', 'Tax', 'Discount', 'Rounding', 'Total'],
    ...result.people.map((p) => [
      p.name, bill.phones?.[p.name] ?? '', p.name === paidBy ? 'yes' : '',
      p.subtotal, p.service, p.tax, -p.discount, -p.rounding, p.total,
    ]),
    ['All', '', '', result.subtotal, result.service, result.tax, -result.discount, -result.rounding, result.total],
  ];
  if (paidBy) rows.push([], ['Paid up front by', paidBy], ['Owed back', collect(result, paidBy).due]);
  // One row per account, so a sheet with three of them still reads as three.
  const pay = (bill.pay ?? [])
    .map((a) => [a?.bank, a?.acct, a?.name].map((v) => (v ?? '').trim()).filter(Boolean))
    .filter((a) => a.length);
  if (pay.length) rows.push([], ['Transfer to', ...pay[0]], ...pay.slice(1).map((a) => ['', ...a]));
  // `sep=,` has to reach the file unquoted, so it goes in outside the escaping.
  return ['sep=,', ...rows.map((r) => r.map(cell).join(','))].join('\r\n');
}

// Thousands separator is a preference: dots (Indonesian) or commas.
let sep = '.';
let locale = 'id-ID';
export const setMoneySeparator = (s) => {
  sep = s === ',' ? ',' : '.';
  locale = sep === ',' ? 'en-US' : 'id-ID';
};
export const money = (n) => new Intl.NumberFormat(locale).format(Math.round(n));

// yyyy-mm-dd -> "29 Jul 2026". Noon, not midnight, so no timezone can drag the
// date onto the day before. Anything unparseable comes back as the empty string.
export const fmtDate = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// What's typed into a money field -> the whole rupiah behind it, and back out
// grouped for display. Digits only: no cents in IDR, and a decimal point would
// be ambiguous the moment the separator is a dot.
export const digits = (s) => String(s ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
export const group = (s) => digits(s).replace(/\B(?=(\d{3})+(?!\d))/g, sep);

// Optional phone -> the digits wa.me wants, or null (null = let WhatsApp show its contact picker).
// ponytail: assumes Indonesia when there's no country code; type +<code> for anywhere else.
export function waNumber(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const intl = s.startsWith('+');
  let d = s.replace(/\D/g, '');
  if (!intl) {
    if (d.startsWith('0')) d = '62' + d.slice(1);
    else if (!d.startsWith('62')) d = '62' + d;
  }
  return d.length >= 8 ? d : null; // too short to be a real number
}

// Link that opens WhatsApp with the message ready. No number -> contact picker.
export const waLink = (phone, text) =>
  `https://wa.me/${waNumber(phone) ?? ''}?text=${encodeURIComponent(text)}`;
