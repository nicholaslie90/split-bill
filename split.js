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
// The total the struk printed, when somebody has typed it in. Blank means
// "work it out from the percentages"; zero is a real answer, so only blank
// counts as absent.
export const statedTotal = (bill) => {
  const v = bill?.billTotal;
  if (v === '' || v == null) return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

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
  const subtotal = Math.round(gross);
  const svcPct = Number(bill.servicePct) || 0;
  const taxPct = Number(bill.taxPct) || 0;
  // A struk prints its own total, and typing that is quicker and safer than
  // working out which percentage was charged on what. When it is there, the
  // difference between it and the items is the charge — spread over them in
  // proportion, which is exactly what a service charge and a tax already do,
  // so nothing else about the arithmetic changes. Which part of it was service
  // and which was tax the struk alone can say, so the app doesn't guess: it is
  // one line. The percentage fields step aside while it is filled in.
  const stated = statedTotal(bill);
  const service = stated == null ? (gross * svcPct) / 100 + (Number(bill.serviceAmt) || 0) : stated - subtotal;
  // ID convention: PPN is charged on subtotal + service charge (flat part included). Toggleable.
  const tax = stated == null
    ? ((gross + (bill.taxOnService === false ? 0 : service)) * taxPct) / 100 + (Number(bill.taxAmt) || 0)
    : 0;

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
  const charge = cut.map((f) => f * (subtotal + svcTotal + taxTotal));
  // Evenly, but nobody hands money back: somebody who only had a share of the
  // packaging cannot absorb a fifty-thousand voucher, and the rest of it has to
  // go somewhere. Their bill stops at zero and what they could not take spreads
  // over whoever still has something left to take it off.
  const cutOff = spreadDown(charge, discount);
  const shave = spreadDown(charge.map((c, i) => c - cutOff[i]), rounding);
  const parts = cut.map((f, i) => [
    f * subtotal, f * svcTotal, f * taxTotal, -cutOff[i], -shave[i],
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
    // How many people the discount actually came off. Usually everybody; fewer
    // when it was bigger than somebody's whole share, and then "÷3" would be a
    // lie on the one line people check.
    discountAmong: cutOff.filter((v) => v > 0).length,
    rounding,
    roundingAmong: shave.filter((v) => v > 0).length,
    total: charged - discount - rounding,
  };
}

// Take `total` off `caps` in equal parts, except that no part may be more than
// its cap: whatever one cannot take is shared out again among the rest. Sorted
// smallest first, so the moment a share fits it fits for everyone after it.
// Assumes the caps can hold the total between them, which the bill guarantees:
// the discount is capped at the charges and the rounding at what is left.
function spreadDown(caps, total) {
  const out = caps.map(() => 0);
  const order = caps.map((_, i) => i).sort((a, b) => caps[a] - caps[b]);
  let left = total;
  order.forEach((i, k) => {
    out[i] = Math.min(Math.max(caps[i], 0), left / (order.length - k));
    left -= out[i];
  });
  return out;
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

// --- receipt photo -> Gemini -> draft item lines ------------------------------
// The only reader there is. Its answer is untrusted input like any other: it
// decides what everybody pays, so nothing goes through unchecked. There used to
// be a second reader on the device for when this one could not be reached, and
// it is gone — a struk it misread came back looking exactly like a struk it had
// read, and a wrong number nobody questions is worse than no number at all.
const MAX_ITEMS = 200;      // a struk this long is a catering invoice
const MAX_NAME = 120;
const MAX_PLACE = 80;       // the What / where box stops at 80 too

// A date off a struk goes straight into <input type="date">, which accepts one
// shape and silently shows nothing for anything else. So: the shape, and then
// whether it is a day that exists — new Date rolls 2026-02-30 forward to March
// rather than refusing it, and round-tripping is what catches that. The year
// bound is there because a misread "01-01-26" can come back as year 0026.
const asDate = (v) => {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return null;
  const year = Number(s.slice(0, 4));
  return year >= 2000 && year <= 2100 ? s : null;
};

// Same defusing as an item name: control characters would come straight back
// out in a WhatsApp message, and the box itself stops at 80 characters. Only a
// real string — String(7) is "7" and String({}) is "[object Object]", and
// either would sail into the What / where box looking like a place name.
const asPlace = (v) => (typeof v !== 'string' ? null
  : v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_PLACE) || null);

// The floor is a noise filter, not a rule about money: a dish under a thousand
// rupiah does not exist, so a number that small in the item column is OCR
// debris. A charge is different — five per cent of a 15.000 bill is 750, and
// real — so the charges pass a floor of their own.
const asAmount = (v, min = 1000) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= 100_000_000 ? n : null;
};

export function parseGemini(data) {
  const items = [];
  for (const raw of (Array.isArray(data?.items) ? data.items : []).slice(0, MAX_ITEMS)) {
    const amount = asAmount(raw?.amount);
    if (amount === null) continue;
    // Control characters would come straight back out in a WhatsApp message.
    const name = String(raw?.name ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, MAX_NAME);
    if (!name) continue;
    // Quantity leads the name the same way it does on the struk — a lone "1"
    // says nothing, "4x" explains the amount and tells you how many shares the
    // line is worth splitting into.
    const qty = Math.round(Number(raw?.qty));
    items.push({ name: Number.isFinite(qty) && qty > 1 && qty <= 999 ? `${qty}x ${name}` : name, amount });
  }
  // The charges as printed, not as rates: a struk says "Service Charge 5%" and
  // then the figure it actually charged, and the figure is the one that has to
  // add up. They land in the flat-amount fields, which is why the percentages
  // are cleared when they do — the two are added together, not chosen between.
  const charge = (v) => asAmount(v, 1);
  return {
    items,
    total: asAmount(data?.total),
    service: charge(data?.service),
    tax: charge(data?.tax),
    discount: charge(data?.discount),
    // Where you were and when: the two things on a struk that are not money,
    // and the two the app used to make you type before it would do anything.
    place: asPlace(data?.place),
    date: asDate(data?.date),
  };
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
    [statedTotal(bill) == null ? 'Service charge' : 'Service & tax (from the total)', result.service],
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
