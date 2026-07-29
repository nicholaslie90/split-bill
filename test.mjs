// node test.mjs  — fails loudly if the money math breaks.
import assert from 'node:assert/strict';
import { allocate, calcShares, waLink, waNumber } from './split.js';

// 1. The example from the brief: equal split per item, nobody pays for what they didn't eat.
{
  const r = calcShares({
    participants: ['Nic', 'Ana', 'Bob'],
    items: [
      { name: 'Nasi Goreng', amount: 120000, sharedBy: ['Nic', 'Ana'] },
      { name: 'Beer x2', amount: 90000, sharedBy: ['Bob'] },
    ],
  });
  assert.deepEqual(r.people.map((p) => p.total), [60000, 60000, 90000]);
  assert.equal(r.total, 210000);
}

// 2. Service + tax, tax charged on top of service (ID default).
{
  const r = calcShares({
    participants: ['A', 'B'],
    items: [{ name: 'x', amount: 200000, sharedBy: [] }], // untagged = everyone
    servicePct: 5,
    taxPct: 11,
  });
  assert.equal(r.subtotal, 200000);
  assert.equal(r.service, 10000);
  assert.equal(r.tax, 23100); // 11% of 210000
  assert.equal(r.total, 233100);
  assert.deepEqual(r.people.map((p) => p.total), [116550, 116550]);
}
{
  const r = calcShares({
    participants: ['A'],
    items: [{ name: 'x', amount: 200000, sharedBy: ['A'] }],
    servicePct: 5,
    taxPct: 11,
    taxOnService: false,
  });
  assert.equal(r.tax, 22000); // 11% of subtotal only
}

// 2b. Discount: flat per head, reconciles, capped at the bill.
{
  const base = { participants: ['A', 'B', 'C'], items: [{ name: 'x', amount: 300000, sharedBy: ['A'] }] };
  const r = calcShares({ ...base, discount: 30000 });
  assert.equal(r.discount, 30000);
  assert.equal(r.total, 270000);
  assert.deepEqual(r.people.map((p) => p.discount), [10000, 10000, 10000]);
  assert.deepEqual(r.people.map((p) => p.total), [290000, -10000, -10000]); // B and C owe nothing but hold a voucher

  // odd amount still sums exactly
  const odd = calcShares({ ...base, discount: 10000 });
  assert.equal(odd.people.reduce((a, p) => a + p.total, 0), odd.total);
  assert.equal(odd.people.reduce((a, p) => a + p.discount, 0), 10000);

  // discount bigger than the bill is capped, never a negative total
  const big = calcShares({ ...base, discount: 999999999 });
  assert.equal(big.total, 0);
  assert.equal(big.discount, 300000);

  // garbage / negative input is ignored
  assert.equal(calcShares({ ...base, discount: -5000 }).total, 300000);
  assert.equal(calcShares({ ...base, discount: 'abc' }).total, 300000);
  assert.equal(calcShares({ ...base }).discount, 0);
  assert.equal(calcShares({ discount: 1000 }).total, 0); // no participants

  // percent discount, on the charged total (subtotal + service + tax)
  const pct = calcShares({ ...base, discountPct: 10 });
  assert.equal(pct.discount, 30000);
  assert.equal(pct.total, 270000);
  const withCharges = calcShares({ ...base, servicePct: 5, taxPct: 11, discountPct: 10 });
  assert.equal(withCharges.discount, Math.round(349650 * 0.1)); // 300000 + 15000 + 34650
  assert.equal(withCharges.total, 349650 - withCharges.discount);
  // rupiah + percent stack, still capped
  assert.equal(calcShares({ ...base, discount: 50000, discountPct: 10 }).discount, 80000);
  assert.equal(calcShares({ ...base, discount: 50000, discountPct: 200 }).total, 0);
  assert.equal(calcShares({ ...base, discountPct: -10 }).discount, 0);
  assert.equal(calcShares({ ...base, discountPct: 'x' }).discount, 0);
  // odd percent still sums exactly per person
  const odd3 = calcShares({ ...base, discountPct: 3.33 });
  assert.equal(odd3.people.reduce((a, p) => a + p.discount, 0), odd3.discount);
  assert.equal(odd3.people.reduce((a, p) => a + p.total, 0), odd3.total);
}

// 2c. Service and tax as flat rupiah amounts, alongside or instead of the percentages.
{
  const base = { participants: ['A', 'B'], items: [{ name: 'x', amount: 200000, sharedBy: [] }] };
  const flat = calcShares({ ...base, serviceAmt: 15000, taxAmt: 5000 });
  assert.equal(flat.service, 15000);
  assert.equal(flat.tax, 5000);
  assert.equal(flat.total, 220000);

  // flat service is taxed like a service charge should be
  const mixed = calcShares({ ...base, serviceAmt: 20000, taxPct: 11 });
  assert.equal(mixed.tax, 24200); // 11% of 220000
  assert.equal(calcShares({ ...base, serviceAmt: 20000, taxPct: 11, taxOnService: false }).tax, 22000);

  // percent and amount stack
  const both = calcShares({ ...base, servicePct: 5, serviceAmt: 5000, taxPct: 10, taxAmt: 1000 });
  assert.equal(both.service, 15000); // 10000 + 5000
  assert.equal(both.tax, 22500); // 10% of 215000 + 1000
  assert.equal(both.total, 237500);
  assert.equal(both.people.reduce((a, p) => a + p.total, 0), both.total);

  // garbage ignored
  assert.equal(calcShares({ ...base, serviceAmt: 'x', taxAmt: null }).total, 200000);
}

// 3. Reconciliation under nasty rounding: shares must always sum to the total.
for (const n of [3, 6, 7, 11]) {
  for (const amount of [10000, 33333, 1, 99999]) {
    const people = Array.from({ length: n }, (_, i) => `p${i}`);
    const r = calcShares({
      participants: people,
      items: [
        { name: 'shared', amount, sharedBy: [] },
        { name: 'solo', amount: 7777, sharedBy: ['p0'] },
      ],
      servicePct: 5,
      taxPct: 11,
      discount: amount % 7 ? 1234 : 0,
    });
    const sum = r.people.reduce((a, p) => a + p.total, 0);
    assert.equal(sum, r.total, `n=${n} amount=${amount}: ${sum} != ${r.total}`);
    assert.equal(r.total, r.subtotal + r.service + r.tax - r.discount);
    assert.ok(r.people[0].total > r.people[1].total, 'solo item must land on p0 only');
  }
}

// 4. Edge cases that shouldn't throw or leak money.
assert.equal(calcShares({}).total, 0);
assert.equal(calcShares({ participants: ['A'], items: [] }).total, 0);
{
  // charges with no items: split evenly instead of dividing by zero
  const r = calcShares({ participants: ['A', 'B'], items: [], servicePct: 5, taxPct: 11 });
  assert.equal(r.total, 0);
  // item tagged to a removed participant is dropped, not silently charged to someone else
  const g = calcShares({ participants: ['A'], items: [{ name: 'ghost', amount: 500, sharedBy: ['Zed'] }] });
  assert.equal(g.total, 0);
}
{
  // negative total (discount) still reconciles
  const a = allocate(-1000, [1, 1, 1]);
  assert.equal(a.reduce((x, y) => x + y, 0), -1000);
}
assert.deepEqual(allocate(10, [1, 1, 1]), [4, 3, 3]); // deterministic leftover order

// 4b. Half-up rounding: .51 rounds up, .49 stays put.
assert.deepEqual(allocate(3428, [1142.51, 1142.49, 1143]), [1143, 1142, 1143]);
// A .5 tie can't round both ways and still sum to the bill — one has to give.
assert.deepEqual(allocate(2285, [1, 1]), [1143, 1142]);
{
  // Item lines must add up to the subtotal they explain, for everyone, always.
  for (const amount of [2285, 1142.51, 33333, 7, 99999]) {
    const r = calcShares({
      participants: ['A', 'B', 'C'],
      items: [
        { name: 'shared', amount, sharedBy: [] },
        { name: 'pair', amount: amount / 3, sharedBy: ['A', 'B'] },
        { name: 'solo', amount: 1234.56, sharedBy: ['C'] },
      ],
      servicePct: 5, taxPct: 11,
    });
    for (const p of r.people) {
      const lines = p.lines.reduce((a, l) => a + l.share, 0);
      assert.equal(lines, p.subtotal, `${p.name} lines ${lines} != subtotal ${p.subtotal} (amount ${amount})`);
      assert.ok(p.lines.every((l) => Number.isInteger(l.share)), 'lines are whole rupiah');
    }
    assert.equal(r.people.reduce((a, p) => a + p.total, 0), r.total);
  }
}

// 5. Optional phone number -> wa.me digits. Blank/garbage must fall back to the contact picker.
assert.equal(waNumber('08123456789'), '628123456789');
assert.equal(waNumber('+62 812-3456-789'), '628123456789');
assert.equal(waNumber('628123456789'), '628123456789');
assert.equal(waNumber('8123456789'), '628123456789');
assert.equal(waNumber('+1 (415) 555-0134'), '14155550134');
assert.equal(waNumber(''), null);
assert.equal(waNumber('  '), null);
assert.equal(waNumber(undefined), null);
assert.equal(waNumber('123'), null); // too short
assert.ok(waLink('08123456789', 'hi').startsWith('https://wa.me/628123456789?text=hi'));
assert.ok(waLink('', 'a b').startsWith('https://wa.me/?text=a%20b')); // no number = picker

console.log('ok');

