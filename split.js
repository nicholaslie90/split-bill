// Bill math. Everything is whole rupiah — no cents in IDR.
// The only rule that matters: the sum of what everybody pays must equal the bill total, exactly.

// Hand `total` out across `weights` as integers that sum to exactly `total`.
// Largest-remainder (Hare quota): floor everything, then give the leftover
// units to whoever got robbed hardest by the floor.
export function allocate(total, weights) {
  const n = weights.length;
  if (!n) return [];
  let w = weights;
  if (w.reduce((a, b) => a + b, 0) <= 0) w = w.map(() => 1); // no items yet: split flat charges evenly
  const denom = w.reduce((a, b) => a + b, 0);
  const exact = w.map((x) => (total * x) / denom);
  const out = exact.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const step = left >= 0 ? 1 : -1; // step handles negative totals (discounts)
  const order = exact
    .map((v, i) => [v - Math.floor(v), i])
    .sort((a, b) => (step * (b[0] - a[0])) || a[1] - b[1])
    .map((e) => e[1]);
  for (let k = 0; left !== 0; k++, left -= step) out[order[k % n]] += step;
  return out;
}

// bill: { participants: [name], items: [{name, amount, sharedBy: [name]}],
//         servicePct, serviceAmt, taxPct, taxAmt, taxOnService, discount, discountPct }
// Service, tax and discount each take a percentage, a flat rupiah amount, or both.
export function calcShares(bill) {
  const people = bill.participants ?? [];
  const empty = { people: [], subtotal: 0, service: 0, tax: 0, discount: 0, total: 0 };
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

  const subs = allocate(Math.round(gross), weights);
  const svcs = allocate(Math.round(service), weights);
  const taxes = allocate(Math.round(tax), weights);
  const charged = subs.reduce((a, b) => a + b, 0) + svcs.reduce((a, b) => a + b, 0) + taxes.reduce((a, b) => a + b, 0);
  // Flat per head, not proportional — a Rp 50k voucher is worth the same to everyone.
  // Rupiah and percent stack (10% off *and* a voucher), then cap at the bill so
  // the total can never go negative.
  const off = (Number(bill.discount) || 0) + (charged * (Number(bill.discountPct) || 0)) / 100;
  const discount = Math.min(Math.max(0, Math.round(off)), charged);
  const discs = allocate(discount, people.map(() => 1));

  return {
    people: people.map((name, i) => ({
      name,
      lines: lines[i],
      subtotal: subs[i],
      service: svcs[i],
      tax: taxes[i],
      discount: discs[i],
      total: subs[i] + svcs[i] + taxes[i] - discs[i],
    })),
    subtotal: Math.round(gross),
    service: Math.round(service),
    tax: Math.round(tax),
    discount,
    total: charged - discount,
  };
}

export const money = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n));

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
