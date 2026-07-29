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
    for (const p of tagged) {
      const i = people.indexOf(p);
      weights[i] += each;
      lines[i].push({ name: it.name, share: each, sharedBy: tagged.length });
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

// Thousands separator is a preference: dots (Indonesian) or commas.
let sep = '.';
let locale = 'id-ID';
export const setMoneySeparator = (s) => {
  sep = s === ',' ? ',' : '.';
  locale = sep === ',' ? 'en-US' : 'id-ID';
};
export const money = (n) => new Intl.NumberFormat(locale).format(Math.round(n));

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
