# Split Bill

Split a restaurant bill by item, then send each person their share on WhatsApp.

**Live:** https://nicholaslie90.github.io/split-bill/

- Tag who shared each item — nobody pays for what they didn't order. Tap a name again to buy them another share of the line: two of the four lychee teas is two taps, and they pay for two.
- Service charge and tax as a percentage, a flat rupiah amount, or both — allocated in proportion to each person's subtotal.
- Discount the same way — but split evenly per head, since a voucher is worth the same to everyone. Capped at the bill total.
- Optionally round the total down to the nearest 100, 500 or 1.000 ("pembulatan"), so nobody hands over coins.
- Amounts group themselves as you type — `59000` becomes `59.000` — with dots or commas to taste. The preference follows through to the summary, the PDF and the WhatsApp message.
- Each person's total is the plain half-up rounding of what they actually owe — `.5` and up goes up, below stays put — and the shares still add up to the bill exactly. Where arithmetic makes both impossible (two shares of exactly `.5`), one person gives a single rupiah rather than the bill going out by one.
- **📷 Scan a receipt** fills in the item lines from the struk — photograph it with the camera right in the page, or pick a photo you already have. Reads on your device by default; add a Gemini key for a near-perfect read at the cost of sending the photo. See the caveat below.
- **PDF** of the whole bill, in one of two settings you pick under the summary. **Organised** packs the figures in tight, for printing and filing; **Beautiful** gives them room, an accent rule, an inked total and a page footer. The same numbers either way, and both lead with a card per person — name and total in one eyeline, the reasons beneath — because that is what the PDF gets opened for. On a phone the share sheet hands it straight to WhatsApp; on desktop it downloads. If you scanned a struk, the photo is on the last page — behind the numbers, so nobody has to scroll past it to find what they owe.
- **Excel** of the same bill, for keeping your own history offline: a CSV with the items, the charges and a row per person, amounts as bare numbers so the columns add up. Opens in Excel, Numbers and Sheets, and stays readable in a text editor.
- **▸ WhatsApp** per person: opens WhatsApp with their itemised share prefilled. Add their phone number to go straight to the chat, or leave it blank and pick the contact in WhatsApp.
- **Transfer to** takes as many accounts as you like — a bank, an e-wallet, a QRIS name. All of them go into every WhatsApp message and the PDF, so people can pay from whatever they actually hold.
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

The scan is a **starting point, not an answer**. A struk is thermal-printed, creased and often photographed at an angle, so check the numbers either way. There are two readers, and which one runs depends on whether you have put a key in the box.

- Opens the camera in the page (`getUserMedia`, back camera where there is one) with a live preview, and grabs a single frame when you press **Take photo**. The stream is stopped the moment the sheet closes. No camera, no permission, or an insecure origin → it falls back to picking a photo, which reads exactly the same way.
- Whichever reader runs, the photo is greyed and cut to 1600px first. A raw 12 MP photo reads as noise.
- Scanned items are **added** to whatever is already there, never replacing it, and are ordinary editable rows.
- The photo is kept with the bill and goes on the **last page of the PDF**, so a number can be checked against the paper it came from. Under the scan button a row always says whether one is attached, with **Add photo** / **Remove photo** beside it — attaching this way stores the photo without reading it, which is what you want when the items are already right and re-scanning would only add them twice. Scanning replaces it, and **Start over** clears it. It is the only large thing in storage, so if it ever won't fit the bill is saved without it and the scan note says so.

### On your phone, by default

[Tesseract.js](https://github.com/naptha/tesseract.js) with Indonesian and English data, in single-column mode. **Nothing is uploaded.** On the test struk it reads eight of the ten lines and mangles two, in about 16 seconds.

- Takes the rightmost amount on a line as that line's total (so a unit-price column is ignored) and the text before it as the name, keeping a quantity when it's more than one.
- **Stops at the charges** — subtotal, service, PPN, discount, rounding, cash, change. Those belong to the app's own fields, so a misread can never quietly double-charge anybody. It shows the printed total when it finds one, purely as a cross-check.
- First scan downloads the engine and language data (~8 MB) and the browser caches it. Nothing loads until you press the button.

### With a Gemini key

Paste a [Gemini API key](https://aistudio.google.com/apikey) into the box under the scan button and the photo goes to `gemini-3.5-flash-lite` instead. On the test struk it reads **all ten lines exactly**, quantities included, in about 3 seconds.

- **The photo leaves your device** when a key is set — that is the whole trade, and the note under the button says so while the key is there. Nothing else about the bill is ever sent.
- The key is kept in `localStorage` on that device alone. It is never part of the bill, so **Start over** does not clear it and no CSV, PDF or WhatsApp message carries it. **Clear** removes it, and an empty box puts you back on Tesseract.
- Never commit a key to this repo. It is public and GitHub Pages serves the source verbatim, so a key in the source is a key published to the world — and Google scans public repos and disables what it finds. The box exists precisely so the key stays off the server.
- The reply is schema-constrained JSON and is still validated before anything becomes an item: amounts must be whole rupiah between 1.000 and 100 juta, names are stripped of control characters and capped, and the list is truncated. A model's answer decides what people pay, so it is treated as untrusted input.

## Notes

- Amounts are whole rupiah. Phone numbers without a country code are assumed Indonesian (`08…` → `+62…`); type `+<code>…` for anywhere else.
- Tax is charged on subtotal + service charge by default (Indonesian convention) — there's a checkbox to turn that off.
- [jsPDF](https://github.com/parallax/jsPDF) and [Tesseract.js](https://github.com/naptha/tesseract.js) are loaded from a CDN at pinned versions with SRI hashes — Tesseract only when you first press scan. Tesseract then fetches its own wasm engine and language data, which SRI can't cover. So PDF export and scanning need a connection; everything else works offline.
- The only thing that ever leaves the device is a receipt photo, and only when you have set a Gemini key. The bill itself — names, amounts, phone numbers — never goes anywhere.
- The CSV starts with `sep=,` so Excel honours the comma whatever the machine's locale says, and a name beginning with `=`, `+`, `-` or `@` is prefixed with `'` so a spreadsheet can't run it as a formula.
