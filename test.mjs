// node test.mjs  — fails loudly if the money math breaks.
import assert from 'node:assert/strict';
import { calcShares, collect, digits, fmtDate, group, money, parseGemini, parseReceipt, roundToSum, setMoneySeparator, shareLabel, sharedByLabel, statedTotal, toCsv, waLink, waNumber } from './split.js';

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

// 2a. One person taking two of a multi-unit line: the same name listed twice.
// The struk's "4 LYCHEE ICE TEA 220.000" is four shares of 55.000, and Nic-Cin
// drank two of them.
{
  const r = calcShares({
    participants: ['Naren', 'Nakata', 'Pampir', 'Nic-Cin'],
    items: [{ name: 'Lychee Ice Tea', amount: 220000, sharedBy: ['Naren', 'Nakata', 'Nic-Cin', 'Nic-Cin'] }],
  });
  assert.deepEqual(r.people.map((p) => p.total), [55000, 55000, 0, 110000]); // Pampir had none
  assert.equal(r.total, 220000);
  // Two shares of one item read as one line, not two.
  const nic = r.people[3];
  assert.equal(nic.lines.length, 1);
  assert.deepEqual(nic.lines[0], { name: 'Lychee Ice Tea', share: 110000, sharedBy: 4, took: 2 });
  assert.equal(shareLabel(nic.lines[0]), '2 of 4');
  assert.equal(shareLabel(r.people[0].lines[0]), '1 of 4'); // Naren took one of the four

  // Service and tax follow the shares, and everything still reconciles exactly.
  const charged = calcShares({
    participants: ['Naren', 'Nic-Cin'],
    items: [{ name: 'Tea', amount: 100000, sharedBy: ['Naren', 'Nic-Cin', 'Nic-Cin'] }],
    servicePct: 5, taxPct: 11,
  });
  assert.equal(charged.people[1].subtotal, 66667); // two of three shares, rounded up
  assert.equal(charged.people.reduce((a, p) => a + p.total, 0), charged.total);
  assert.equal(charged.people.reduce((a, p) => a + p.subtotal, 0), charged.subtotal);
}

// 2a-2. The tally read out for a person or a whole line.
{
  assert.equal(sharedByLabel(['Nic-Cin', 'Nic-Cin', 'Naren']), 'Nic-Cin \u00d72, Naren');
  assert.equal(sharedByLabel(['Naren']), 'Naren');
  assert.equal(sharedByLabel([]), '');
  assert.equal(sharedByLabel(undefined), '');
  assert.equal(shareLabel({ sharedBy: 1, took: 1 }), ''); // nobody else on it: no note at all
}

// 2c. The struk's own total, typed in instead of the percentages. The
// difference between it and the items is the charge, spread over them in
// proportion — so the same bill comes out the same either way.
{
  const base = { participants: ['A', 'B'],
    items: [{ name: 'x', amount: 100000, sharedBy: ['A'] }, { name: 'y', amount: 100000, sharedBy: ['B'] }] };
  const byPct = calcShares({ ...base, servicePct: 5, taxPct: 11 });
  const byTotal = calcShares({ ...base, billTotal: '233100' });
  assert.equal(byTotal.total, 233100);
  assert.equal(byTotal.subtotal, 200000);
  assert.equal(byTotal.service, 33100); // service and tax as one line: the struk alone knows the split
  assert.equal(byTotal.tax, 0);
  assert.deepEqual(byTotal.people.map((p) => p.total), byPct.people.map((p) => p.total));

  // It wins over the percentages rather than stacking with them.
  assert.equal(calcShares({ ...base, billTotal: '233100', servicePct: 5, taxPct: 11 }).total, 233100);
  // ...and stepping aside is what a blank field means. Zero is a real answer.
  assert.equal(calcShares({ ...base, billTotal: '', servicePct: 5, taxPct: 11 }).total, 233100);
  assert.equal(calcShares({ ...base, billTotal: '0' }).total, 0);
  assert.deepEqual(calcShares({ ...base, billTotal: '0' }).people.map((p) => p.total), [0, 0]);

  // A total under the items is a discount the struk printed: off in proportion,
  // and nobody ends up in credit.
  const under = calcShares({ ...base, billTotal: '180000' });
  assert.equal(under.total, 180000);
  assert.equal(under.service, -20000);
  assert.deepEqual(under.people.map((p) => p.total), [90000, 90000]);

  // Nothing itemised yet: the whole total splits evenly, which is the fastest
  // possible way to split a bill nobody wants to type out.
  const flat = calcShares({ participants: ['A', 'B', 'C'], items: [], billTotal: '300000' });
  assert.deepEqual(flat.people.map((p) => p.total), [100000, 100000, 100000]);

  // A voucher still comes off after it, per head, and the sums still hold.
  const withVoucher = calcShares({ ...base, billTotal: '233100', discount: 33100 });
  assert.equal(withVoucher.total, 200000);
  assert.equal(withVoucher.people.reduce((a, p) => a + p.total, 0), 200000);
  // As does pembulatan.
  const rounded = calcShares({ ...base, billTotal: '233100', roundTo: 1000 });
  assert.equal(rounded.total, 233000);
  assert.equal(rounded.people.reduce((a, p) => a + p.total, 0), 233000);

  // Only a blank field means "use the percentages"; junk and negatives are not
  // a total anybody typed on purpose.
  assert.equal(statedTotal({ billTotal: '233100' }), 233100);
  assert.equal(statedTotal({ billTotal: '0' }), 0);
  assert.equal(statedTotal({ billTotal: '' }), null);
  assert.equal(statedTotal({}), null);
  assert.equal(statedTotal({ billTotal: 'abc' }), null);
  assert.equal(statedTotal({ billTotal: -5 }), null);
}

// 2b. Discount: flat per head, reconciles, capped at the bill — and nobody is
// ever handed money back, so what a small share cannot absorb goes to the rest.
{
  const base = { participants: ['A', 'B', 'C'], items: [{ name: 'x', amount: 300000, sharedBy: ['A'] }] };
  const r = calcShares({ ...base, discount: 30000 });
  assert.equal(r.discount, 30000);
  assert.equal(r.total, 270000);
  // B and C ordered nothing, so there is nothing to take a voucher off: all of
  // it comes off the only bill there is.
  assert.deepEqual(r.people.map((p) => p.discount), [30000, 0, 0]);
  assert.deepEqual(r.people.map((p) => p.total), [270000, 0, 0]);
  assert.equal(r.discountAmong, 1);

  // The everyday case is untouched: everyone can absorb an even share.
  const even = calcShares({ participants: ['A', 'B', 'C'],
    items: [{ name: 'x', amount: 300000, sharedBy: [] }], discount: 30000 });
  assert.deepEqual(even.people.map((p) => p.discount), [10000, 10000, 10000]);
  assert.deepEqual(even.people.map((p) => p.total), [90000, 90000, 90000]);
  assert.equal(even.discountAmong, 3);

  // The real one: a small share absorbs what it can, the remainder spreads.
  // Boya 47.000 (Edi), Da Hong Pao 49.000 (Nic), packaging 2.000 between all
  // three, and a 14.100 voucher. Ana's whole bill is 667.
  const chagee = calcShares({
    participants: ['Edi', 'Nic', 'Ana'],
    items: [
      { name: 'Boya', amount: 47000, sharedBy: ['Edi'] },
      { name: 'Da Hong Pao', amount: 49000, sharedBy: ['Nic'] },
      { name: 'Packaging', amount: 2000, sharedBy: [] },
    ],
    discount: 14100,
  });
  assert.deepEqual(chagee.people.map((p) => p.total), [40950, 42950, 0]);
  assert.deepEqual(chagee.people.map((p) => p.discount), [6717, 6717, 667]);
  assert.equal(chagee.people.reduce((a, p) => a + p.total, 0), chagee.total); // the rule that matters
  // Each column is rounded inside the person it explains, so a column can sit a
  // rupiah off its own headline. What people pay is exact; the reasons are
  // rounded to the rupiah they read.
  assert.ok(Math.abs(chagee.people.reduce((a, p) => a + p.discount, 0) - chagee.discount) <= 1);
  assert.equal(chagee.discountAmong, 3);
  assert.ok(chagee.people.every((p) => p.total >= 0));

  // Pembulatan cannot push anybody under either.
  const shaved = calcShares({ ...base, discount: 299000, roundTo: 1000 });
  assert.ok(shaved.people.every((p) => p.total >= 0), 'rounding never goes below zero');
  assert.equal(shaved.people.reduce((a, p) => a + p.total, 0), shaved.total);

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

// 2d. Rounding the total down to a round figure ("pembulatan").
{
  const base = {
    participants: ['Fav', 'Dwita', 'Titin', 'Fenny'],
    items: [
      { name: 'krapao', amount: 130000, sharedBy: ['Dwita', 'Titin'] },
      { name: 'wings', amount: 49000, sharedBy: ['Fenny'] },
      { name: 'tea', amount: 25000, sharedBy: ['Titin'] },
      { name: 'rice', amount: 7000, sharedBy: ['Fenny'] },
      { name: 'noodle', amount: 59000, sharedBy: ['Fav'] },
    ],
    serviceAmt: 5260, taxAmt: 26300, discount: 40500, // total 261.060
  };
  const r100 = calcShares({ ...base, roundTo: 100 });
  assert.equal(r100.rounding, 60);
  assert.equal(r100.total, 261000);
  assert.equal(r100.people.reduce((a, p) => a + p.total, 0), 261000);
  assert.equal(r100.people.reduce((a, p) => a + p.rounding, 0), 60);
  for (const p of r100.people) {
    assert.equal(p.subtotal + p.service + p.tax - p.discount - p.rounding, p.total);
  }
  assert.equal(calcShares({ ...base, roundTo: 500 }).total, 261000);
  assert.equal(calcShares({ ...base, roundTo: 1000 }).total, 261000);
  // already round -> nothing to shave, so no rounding line at all
  const exact = calcShares({ ...base, discount: 40560, roundTo: 100 });
  assert.equal(exact.total, 261000);
  assert.equal(exact.rounding, 0);
  // off / garbage
  assert.equal(calcShares({ ...base }).rounding, 0);
  assert.equal(calcShares({ ...base, roundTo: 0 }).total, 261060);
  assert.equal(calcShares({ ...base, roundTo: 'x' }).total, 261060);
  assert.equal(calcShares({ ...base, roundTo: -100 }).total, 261060);
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
  // negative target (a net refund) still reconciles
  const a = roundToSum([-333.34, -333.33, -333.33], -1000);
  assert.equal(a.reduce((x, y) => x + y, 0), -1000);
}
assert.deepEqual(roundToSum([3.333, 3.333, 3.333], 10), [4, 3, 3]); // deterministic leftover order
assert.deepEqual(roundToSum([], 0), []);

// 4b. Half-up rounding: .51 rounds up, .49 stays put, and no residual to hand out.
assert.deepEqual(roundToSum([1142.51, 1142.49, 1143], 3428), [1143, 1142, 1143]);
// A .5 tie can't round both ways and still sum to the bill — one has to give,
// and it's the one listed last.
assert.deepEqual(roundToSum([1142.5, 1142.5], 2285), [1143, 1142]);

// 4c. The bug from the field: every share must be the half-up of its exact value
// when the total allows it, never a rupiah over on one person and under on another.
{
  // Kopo Thai, 4 people, service and tax as amounts, Rp 40.500 off.
  const r = calcShares({
    participants: ['Fav', 'Dwita', 'Titin', 'Fenny'],
    items: [
      { name: 'Supreme beef krapao', amount: 130000, sharedBy: ['Dwita', 'Titin'] },
      { name: 'Chicken wings', amount: 49000, sharedBy: ['Fenny'] },
      { name: 'Thai milk tea', amount: 25000, sharedBy: ['Titin'] },
      { name: 'Rice', amount: 7000, sharedBy: ['Fenny'] },
      { name: 'Ko yum noodle', amount: 59000, sharedBy: ['Fav'] },
    ],
    serviceAmt: 5260, taxAmt: 26300, discount: 40500,
  });
  // exact: 55771.44 / 62472.78 / 90395.00 / 52420.78
  assert.deepEqual(r.people.map((p) => p.total), [55771, 62473, 90395, 52421]);
  assert.equal(r.total, 261060);
  for (const p of r.people) {
    assert.equal(p.subtotal + p.service + p.tax - p.discount, p.total, `${p.name} parts must explain the total`);
  }
}
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

// 4d. Money fields: digits in, grouped out, separator follows the preference.
{
  assert.equal(digits('59000'), '59000');
  assert.equal(digits('Rp 59.000'), '59000'); // pasting a formatted amount works
  assert.equal(digits('0059'), '59');         // leading zeros dropped
  assert.equal(digits(''), '');
  assert.equal(digits(undefined), '');
  assert.equal(digits('12,34'), '1234');
  setMoneySeparator('.');
  assert.equal(group('59000'), '59.000');
  assert.equal(group('1234567'), '1.234.567');
  assert.equal(group('999'), '999');
  assert.equal(group(''), '');
  assert.equal(money(1234567), '1.234.567');
  setMoneySeparator(',');
  assert.equal(group('1234567'), '1,234,567');
  assert.equal(money(1234567), '1,234,567');
  assert.equal(group('59000'), '59,000');
  setMoneySeparator('.'); // back to the default for anything after this
  assert.equal(money(1000), '1.000');
}

// 4e. Whoever fronted the bill: what they're owed plus their own share is the
// whole bill, exactly — otherwise they'd be out of pocket or up on the deal.
{
  const r = calcShares({
    participants: ['Fav', 'Dwita', 'Titin', 'Fenny'],
    items: [
      { name: 'krapao', amount: 130000, sharedBy: ['Dwita', 'Titin'] },
      { name: 'wings', amount: 49000, sharedBy: ['Fenny'] },
      { name: 'noodle', amount: 59000, sharedBy: ['Fav'] },
    ],
    servicePct: 5, taxPct: 11, discount: 12345, roundTo: 500,
  });
  for (const payer of r.people) {
    const { owed, due } = collect(r, payer.name);
    assert.equal(due + payer.total, r.total, `${payer.name} fronted it: ${due} + ${payer.total} != ${r.total}`);
    assert.ok(!owed.some((o) => o.name === payer.name), 'the payer never owes themselves');
  }
  // nobody marked -> the whole bill is owed by the four of them
  assert.equal(collect(r, '').due, r.total);
  // People who owe nothing are left off the list. A voucher big enough to wipe
  // the bill leaves everybody at zero rather than anybody in credit: B never
  // ordered anything, so there was nothing of B's for it to come off.
  const voucher = calcShares({ participants: ['A', 'B'], items: [{ name: 'x', amount: 100, sharedBy: ['A'] }], discount: 200 });
  assert.deepEqual(voucher.people.map((p) => p.total), [0, 0]);
  assert.equal(voucher.total, 0);
  assert.deepEqual(collect(voucher, 'A').owed, []);
  assert.equal(collect(voucher, 'A').due, 0);
  const nil = calcShares({ participants: ['A', 'B'], items: [{ name: 'x', amount: 100, sharedBy: ['A'] }] });
  assert.deepEqual(collect(nil, 'A').owed, []); // B ordered nothing, so B is not on the list
}

// 4g. The other layout: a delivery app's order screen, photographed or
// screenshotted. The price is not beside the dish, it is underneath it, with a
// quantity badge above and often a note in between — so a name has to reach
// down to the price that follows it, without ever reaching a charge line.
{
  const { items, total } = parseReceipt(`
    Detail Pesanan
    x1
    Tom Yum Noodle George Pork Belly
    Single +Ramen Noodle +1 +Ramen Egg
    Catatan: telur tolong dibuat matang
    sempurna yah buat ibu hamil, terima kasih
    Rp 79.000
    x1
    Tea (unlimited)
    Rp 17.000
    x1
    Mineral Water - Pristine 400 ml
    Rp 17.000
    x1
    Tom Yum Fried Rice Lv 0-3 +2 +Two Egg
    Catatan: setengah matang telur
    Rp 96.000
    x1
    George Dry Tom Yum Noodle Chicken +0.5
    Rp 65.000
    Subtotal            Rp 274.000
    Service Charge 5%   Rp 13.700
    PB1 10%             Rp 28.770
    Total               Rp 316.470
  `);
  assert.deepEqual(items, [
    // A wrapped name keeps its first line: enough to recognise the dish by, and
    // these get edited by hand anyway.
    { name: 'Tom Yum Noodle George Pork Belly', amount: 79000 },
    { name: 'Tea (unlimited)', amount: 17000 },
    { name: 'Mineral Water - Pristine 400 ml', amount: 17000 },
    { name: 'Tom Yum Fried Rice Lv 0-3 +2 +Two Egg', amount: 96000 },
    { name: 'George Dry Tom Yum Noodle Chicken +0.5', amount: 65000 },
  ]);
  assert.equal(items.reduce((a, i) => a + i.amount, 0), 274000); // the printed subtotal
  assert.equal(total, 316470);
  // The charges are laid out the same way. None of them is a dish.
  assert.deepEqual(parseReceipt('Subtotal\nRp 274.000\nService Charge 5%\nRp 13.700').items, []);
  // A price with nothing above it stays what it is.
  assert.deepEqual(parseReceipt('Rp 79.000').items, []);
}

// 4f. Reading a struk photo. Best effort, but two things must always hold: a
// charge line is never mistaken for an item (that would double-charge it), and
// a number that isn't money is never taken as an amount.
{
  // What OCR actually hands back for an Indonesian receipt: ragged spacing,
  // a qty column, unit price and line total, then the charges.
  const { items, total } = parseReceipt(`
    KOPO THAI
    Jl. Kopo Sayati No. 12
    Tanggal 29/07/2026  18:04
    Kasir: Dewi     Meja 7
    ------------------------------
    1 Supreme beef krapao   130.000
    2 x Es Teh    5.000      10.000
    Chicken wings            49.000
    Rice                      7.000
    Ko yum noodle            59.000
    ------------------------------
    Subtotal                255.000
    Service charge 5%        12.750
    PPN 11%                  29.453
    Diskon                   40.500
    TOTAL                   256.703
    TUNAI                   300.000
    Kembali                  43.297
    Terima kasih!
  `);
  assert.deepEqual(items, [
    { name: 'Supreme beef krapao', amount: 130000 }, // lone qty "1" dropped
    { name: '2x Es Teh', amount: 10000 },            // qty kept, line total not unit price
    { name: 'Chicken wings', amount: 49000 },
    { name: 'Rice', amount: 7000 },
    { name: 'Ko yum noodle', amount: 59000 },
  ]);
  assert.equal(total, 256703); // the printed total, for cross-checking — never an item
  assert.equal(items.reduce((a, i) => a + i.amount, 0), 255000); // matches the printed subtotal

  // Charges, payment and header junk must never arrive as items.
  for (const line of ['Subtotal 255.000', 'Service Charge 12.750', 'PPN 11% 29.453', 'Pajak 1.000',
                      'Diskon 40.500', 'Pembulatan 500', 'TOTAL 256.703', 'Tunai 300.000',
                      'Kembali 43.297', 'Kartu Debit 256.703', 'QRIS 256.703',
                      'Tanggal 29/07/2026', 'Meja 7', 'NPWP 12.345.678.9', 'www.kopothai.co.id',
                      'Receipt No.  #2-6246', '13 Items          Rp 113.000', 'Pax 6']) {
    assert.deepEqual(parseReceipt(line).items, [], `must not read "${line}" as an item`);
  }
  // Amount shapes, and numbers that aren't money.
  assert.deepEqual(parseReceipt('Nasi Goreng 59000').items, [{ name: 'Nasi Goreng', amount: 59000 }]);
  assert.deepEqual(parseReceipt('Nasi Goreng 59.000,00').items, [{ name: 'Nasi Goreng', amount: 59000 }]);
  assert.deepEqual(parseReceipt('Nasi Goreng 59,000').items, [{ name: 'Nasi Goreng', amount: 59000 }]);
  assert.deepEqual(parseReceipt('Nasi Goreng 1.234.567').items, [{ name: 'Nasi Goreng', amount: 1234567 }]);
  assert.deepEqual(parseReceipt('Kerupuk 590').items, []); // under a thousand rupiah: OCR debris, not a price
  // a size in the name is part of the name; only a trailing price column is dropped
  assert.deepEqual(parseReceipt('Sprite 500ml 12.000').items, [{ name: 'Sprite 500ml', amount: 12000 }]);
  assert.deepEqual(parseReceipt('Es Teh 50').items, []);  // too small to be a price
  assert.deepEqual(parseReceipt('Oma Elly 081269705603').items, []); // a phone number is not a price
  assert.deepEqual(parseReceipt('2 x 5.000').items, []);  // no name, so not an item
  assert.deepEqual(parseReceipt('18:04').items, []);
  assert.deepEqual(parseReceipt('').items, []);
  assert.deepEqual(parseReceipt(null).items, []);
  assert.equal(parseReceipt('Nasi Goreng 59.000').total, null); // no printed total to check against
}

// 4f-2. What Tesseract really returns for a struk photographed in someone's hand:
// the background leaves debris on every line and the dish names come out battered.
// Prices are the part that has to survive — and nothing that isn't a dish may get
// through, because a phantom line quietly inflates what everybody owes.
{
  const { items } = parseReceipt(`
    = 081269705603
    . Receipt No.  #2-6246
    DINE IN
    Table D4
    Order Date 29/08/2026 13:17:19 ll
    1 WAGYU CARBONARA FETTUCCINE 165.000
    Vases =| ICE TEA 35.000
    ii 1 STRAWBERRY 50.000
    ' 1 COFFEE OMA 75.000
    1 4 LYCHEE ICE TEA 220.000
    1 LASAGNA AL FORNO 135.000
    \\ + TUNA AGLIO OLIO 150.000
    y\' 1 VANILLA LATTE 65.000
    13 Items R
    service charge Rp 1 243 08
    A, Toe RD 305
  `);
  assert.deepEqual(items.map((i) => i.amount), [165000, 35000, 50000, 75000, 220000, 135000, 150000, 65000]);
  assert.equal(items[0].name, 'WAGYU CARBONARA FETTUCCINE');
  assert.equal(items[4].name, '4 LYCHEE ICE TEA'); // the qty that explains a 220.000 line survives
}

// 4f-3. The charges, once OCR has chewed the labels off them. Reading any of
// these as a dish adds money nobody ordered, so the foot of the struk ends the
// list outright rather than relying on recognising each label.
{
  const { items } = parseReceipt(`
    1 TRUFFLE PIZZA 140.000
    (pUASSICHIRAICRERRE 9.000
    13 Items R
    vice Charg® R 113.000
    Shiota! Pal 1.243.000
    PB | Rp 124.300
    TOTAL Rp 1.367.300
  `);
  assert.deepEqual(items, [
    { name: 'TRUFFLE PIZZA', amount: 140000 },
    { name: '(pUASSICHIRAICRERRE', amount: 9000 }, // a battered name is still a dish
  ]);
  // Header lines look like non-items too, but they must not end the list early.
  assert.equal(parseReceipt('Meja 7\nNasi Goreng 59.000').items.length, 1);
  assert.equal(parseReceipt('Total Items 3\nNasi Goreng 59.000').items.length, 1);
}

// 4h. What Gemini hands back. It reads the struk far better than Tesseract, but
// it is still untrusted input deciding what everybody pays, so the shape, the
// range and the characters all get checked before any of it becomes an item.
{
  // The real reply for the Oma Elly struk: all ten lines, quantities included.
  const { items, total } = parseGemini({
    items: [
      { qty: 1, name: 'WAGYU CARBONARA FETTUCCINE', amount: 165000 },
      { qty: 1, name: 'ICE TEA', amount: 35000 },
      { qty: 4, name: 'LYCHEE ICE TEA', amount: 220000 },
    ],
    subtotal: 1243000, service: 113000, tax: 124300, total: 1367300,
  });
  assert.deepEqual(items, [
    { name: 'WAGYU CARBONARA FETTUCCINE', amount: 165000 }, // a lone qty says nothing
    { name: 'ICE TEA', amount: 35000 },
    { name: '4x LYCHEE ICE TEA', amount: 220000 },          // four teas, four shares to tag
  ]);
  assert.equal(total, 1367300);

  // Nothing outside the range a struk line can hold gets through.
  const junk = parseGemini({ items: [
    { qty: 1, name: 'Free refill', amount: 0 },
    { qty: 1, name: 'Negative', amount: -50000 },
    { qty: 1, name: 'Coins', amount: 590 },
    { qty: 1, name: 'Phone number', amount: 81269705603 },
    { qty: 1, name: 'Not a number', amount: 'lots' },
    { qty: 1, name: '   ', amount: 50000 },       // no name, so not an item
    { qty: 1, amount: 50000 },                    // no name at all
    { qty: 1, name: 'Rounded', amount: 12345.6 }, // whole rupiah only
  ] });
  assert.deepEqual(junk.items, [{ name: 'Rounded', amount: 12346 }]);
  assert.equal(junk.total, null);

  // A name is text, not a payload: control characters would come straight back
  // out in a WhatsApp message, and the length is capped.
  assert.equal(parseGemini({ items: [{ qty: 1, name: 'Es\u0000Teh\nManis', amount: 5000 }] }).items[0].name, 'Es Teh Manis');
  assert.equal(parseGemini({ items: [{ qty: 1, name: 'x'.repeat(500), amount: 5000 }] }).items[0].name.length, 120);
  // An absurd quantity is ignored rather than trusted into the name.
  assert.equal(parseGemini({ items: [{ qty: 100000, name: 'Teh', amount: 5000 }] }).items[0].name, 'Teh');
  assert.equal(parseGemini({ items: [{ qty: 0, name: 'Teh', amount: 5000 }] }).items[0].name, 'Teh');

  // Anything that isn't the expected shape yields nothing, never a throw.
  for (const bad of [null, undefined, {}, { items: null }, { items: 'nope' }, { items: [null, 7, 'x'] }]) {
    assert.deepEqual(parseGemini(bad), { items: [], total: null, service: null, tax: null, discount: null, place: null, date: null }, `must survive ${JSON.stringify(bad)}`);
  }
  // Where and when. Both go straight into fields the user sees, so both are
  // treated the way an item name is: shape first, then whether it is real.
  {
    const g = (extra) => parseGemini({ items: [], ...extra });
    assert.equal(g({ place: '  Warung   Sederhana \n' }).place, 'Warung Sederhana');
    assert.equal(g({ place: 'Sate\u0000Khas' }).place, 'Sate Khas');
    assert.equal(g({ place: 'x'.repeat(500) }).place.length, 80);
    for (const empty of [undefined, null, '', '   ', 7, {}]) {
      assert.equal(g({ place: empty }).place, null, `place ${JSON.stringify(empty)} is nothing`);
    }

    assert.equal(g({ date: '2026-04-03' }).date, '2026-04-03');
    // <input type="date"> takes one shape and shows nothing for the rest, so
    // anything else is dropped rather than passed through to a blank box.
    for (const bad of ['03/04/2026', '3 April 2026', '2026-4-3', '26-04-03', '', null, 7, {}]) {
      assert.equal(g({ date: bad }).date, null, `date ${JSON.stringify(bad)} is not a date`);
    }
    // new Date rolls a day that does not exist forward instead of refusing it.
    assert.equal(g({ date: '2026-02-30' }).date, null);
    assert.equal(g({ date: '2026-13-01' }).date, null);
    // Leap day: real in 2024, not in 2026.
    assert.equal(g({ date: '2024-02-29' }).date, '2024-02-29');
    assert.equal(g({ date: '2026-02-29' }).date, null);
    // A misread that lands centuries away is a misread.
    assert.equal(g({ date: '0026-01-01' }).date, null);
    assert.equal(g({ date: '2200-01-01' }).date, null);
  }

  // A reply longer than any real struk is truncated rather than pasted in whole.
  assert.equal(parseGemini({ items: Array(900).fill({ qty: 1, name: 'Teh', amount: 5000 }) }).items.length, 200);

  // The charges come back as printed. They take a floor of 1, not the items'
  // 1000: five per cent of a small bill really is a few hundred rupiah, and
  // dropping it would quietly under-charge the table.
  {
    const c = parseGemini({ items: [], total: 265734, service: 750, tax: 1650, discount: 500 });
    assert.deepEqual([c.total, c.service, c.tax, c.discount], [265734, 750, 1650, 500]);
    // Zero is "not charged", which is the same as absent — and nonsense is dropped.
    const z = parseGemini({ items: [], service: 0, tax: -5, discount: 'lots' });
    assert.deepEqual([z.service, z.tax, z.discount], [null, null, null]);
    // An item under the floor is still debris.
    assert.equal(parseGemini({ items: [{ qty: 1, name: 'Teh', amount: 900 }] }).items.length, 0);
  }
}

// 4g. The spreadsheet export: whole rupiah as bare numbers so the sheet adds up,
// and nothing a user typed can come back as a formula.
{
  const bill = {
    title: 'Kopo Thai', date: '2026-07-29',
    participants: ['Fav', 'Dwita'], phones: { Fav: '08123456789' }, paidBy: 'Fav',
    items: [{ name: 'krapao', amount: '130000', sharedBy: ['Dwita'] }, { name: 'tea', amount: '10000', sharedBy: [] }],
    pay: [{ bank: 'BCA', acct: '1234567890', name: 'Fav Santoso' }, { bank: 'GoPay', acct: '08123456789', name: '' }],
  };
  const r = calcShares(bill);
  const csv = toCsv(bill, r);
  const rows = csv.split('\r\n');
  assert.equal(rows[0], 'sep=,'); // unquoted, or Excel won't honour it
  assert.equal(rows[1], 'Bill,Kopo Thai');
  assert.ok(rows.includes('krapao,130000,Dwita'));
  assert.ok(rows.includes('tea,10000,everyone'));
  assert.ok(rows.includes(`Total,${r.total}`));
  assert.ok(rows.includes(`Fav,08123456789,yes,${r.people[0].subtotal},0,0,0,0,${r.people[0].total}`));
  assert.ok(rows.includes('Paid up front by,Fav'));
  assert.ok(rows.includes(`Owed back,${collect(r, 'Fav').due}`));
  assert.ok(rows.includes('Transfer to,BCA,1234567890,Fav Santoso'));
  assert.ok(rows.includes(',GoPay,08123456789')); // a second account is its own row
  // An account with nothing typed into it is not a row at all.
  assert.ok(!toCsv({ ...bill, pay: [{ bank: '', acct: '', name: '' }] }, r).includes('Transfer to'));
  // the per-person Total column must add up to the bill's own Total row
  const cols = rows.filter((l) => /^(Fav|Dwita),/.test(l)).map((l) => Number(l.split(',').at(-1)));
  assert.equal(cols.reduce((a, b) => a + b, 0), r.total);

  // A name that would otherwise be run as a formula, and one with a comma/quote.
  const nasty = { ...bill, participants: ['=1+1', 'A,B "the" C'], phones: {}, paidBy: '',
                  items: [{ name: '@SUM(A1)', amount: '5000', sharedBy: [] }] };
  const out = toCsv(nasty, calcShares(nasty));
  assert.ok(out.includes("'=1+1"), 'a leading = is defused');
  assert.ok(out.includes("'@SUM(A1)"), 'a leading @ is defused');
  assert.ok(out.includes('"A,B ""the"" C"'), 'commas and quotes are escaped');
  assert.ok(!out.split('\r\n').some((l) => /^=|,=/.test(l)), 'no cell starts a formula');
  // an empty bill still produces a readable file rather than throwing
  assert.ok(toCsv({}, calcShares({})).startsWith('sep=,\r\nBill,Split Bill'));
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

// 6. Dates read the way people say them, and a blank one stays blank.
assert.equal(fmtDate('2026-07-29'), '29 Jul 2026');
assert.equal(fmtDate('2026-01-01'), '01 Jan 2026'); // no timezone slip onto Dec 31
assert.equal(fmtDate(''), '');
assert.equal(fmtDate(undefined), '');

console.log('ok');

