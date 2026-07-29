# Split Bill

Split a restaurant bill by item, then send each person their share on WhatsApp.

**Live:** https://nicholaslie90.github.io/split-bill/

- Tag who shared each item — nobody pays for what they didn't order.
- Service charge and tax as a percentage, a flat rupiah amount, or both — allocated in proportion to each person's subtotal.
- Discount the same way — but split evenly per head, since a voucher is worth the same to everyone. Capped at the bill total.
- Optionally round the total down to the nearest 100, 500 or 1.000 ("pembulatan"), so nobody hands over coins.
- Amounts group themselves as you type — `59000` becomes `59.000` — with dots or commas to taste. The preference follows through to the summary, the PDF and the WhatsApp message.
- Each person's total is the plain half-up rounding of what they actually owe — `.5` and up goes up, below stays put — and the shares still add up to the bill exactly. Where arithmetic makes both impossible (two shares of exactly `.5`), one person gives a single rupiah rather than the bill going out by one.
- **📷 Scan a receipt** fills in the item lines from a photo of the struk — see the caveat below, it is best effort.
- **PDF** of the whole bill: on a phone the share sheet hands it straight to WhatsApp; on desktop it downloads.
- **Excel** of the same bill, for keeping your own history offline: a CSV with the items, the charges and a row per person, amounts as bare numbers so the columns add up. Opens in Excel, Numbers and Sheets, and stays readable in a text editor.
- **▸ WhatsApp** per person: opens WhatsApp with their itemised share prefilled. Add their phone number to go straight to the chat, or leave it blank and pick the contact in WhatsApp.
- Tick who paid the whole bill up front ("nalangin") and their message flips around: what they laid out, who owes them, and how much should come back. Everyone else's message names them, so nobody has to ask who to pay. What comes back plus the payer's own share is always the bill exactly.
- No accounts, no server. The bill lives in your browser's `localStorage`.

## Files

| | |
|---|---|
| `index.html` | the whole app — markup, styles, UI logic |
| `split.js` | the money math (item slices, proportional charges, rounding, phone → `wa.me`), plus receipt parsing and the CSV export |
| `test.mjs` | `node test.mjs` — asserts the shares always reconcile |

## Run locally

ES modules need HTTP, so `file://` won't work:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
node test.mjs                 # prints "ok"
```

## Scanning a receipt — best effort

The scan is a **starting point, not an answer**. A struk is thermal-printed, creased and often photographed at an angle, so expect to fix names and check numbers. What it does:

- Reads the photo in your browser with [Tesseract.js](https://github.com/naptha/tesseract.js) — Indonesian language data, and the image is never uploaded anywhere.
- Takes the rightmost amount on a line as that line's total (so a unit-price column is ignored) and the text before it as the name, keeping a quantity when it's more than one.
- **Skips charge lines on purpose** — subtotal, service, PPN, discount, rounding, cash, change. Those belong to the app's own fields, so a misread can never quietly double-charge anybody. It shows the printed total when it finds one, purely as a cross-check.
- Scanned items are **added** to whatever is already there, never replacing it, and are ordinary editable rows.
- First scan downloads the engine and language data (~4 MB) and the browser caches it. Nothing loads until you press the button.

## Notes

- Amounts are whole rupiah. Phone numbers without a country code are assumed Indonesian (`08…` → `+62…`); type `+<code>…` for anywhere else.
- Tax is charged on subtotal + service charge by default (Indonesian convention) — there's a checkbox to turn that off.
- [jsPDF](https://github.com/parallax/jsPDF) and [Tesseract.js](https://github.com/naptha/tesseract.js) are loaded from a CDN at pinned versions with SRI hashes — Tesseract only when you first press scan. Tesseract then fetches its own wasm engine and language data, which SRI can't cover. So PDF export and scanning need a connection; everything else works offline.
- The CSV starts with `sep=,` so Excel honours the comma whatever the machine's locale says, and a name beginning with `=`, `+`, `-` or `@` is prefixed with `'` so a spreadsheet can't run it as a formula.
