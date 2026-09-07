# Split Bill

Split a restaurant bill by item, then send each person their share on WhatsApp.

**Live:** https://nicholaslie90.github.io/split-bill/

- Tag who shared each item — nobody pays for what they didn't order. Tap a name again to buy them another share of the line: two of the four lychee teas is two taps, and they pay for two.
- **Type the total off the struk** and the charges work themselves out: the difference between it and your items is spread across them in proportion, which is exactly what a service charge and a PPN do. One line, *Service & tax*, because only the struk knows which part was which. It wins over the percentage fields while it has a figure in it, and clearing it hands the work straight back to them. A total *under* the items is the discount the struk printed, taken off the same way. With no items at all it is simply the bill split evenly, which is the fastest way to settle up over something nobody wants to type out.
- Service charge and tax as a percentage, a flat rupiah amount, or both — allocated in proportion to each person's subtotal.
- Discount the same way — but split evenly per head, since a voucher is worth the same to everyone. Capped at the bill total, and nobody's share ever goes below zero: someone who only had a share of the packaging can't absorb a 50k voucher, so what they can't take comes off whoever still has something left to take it off. The line reads `Discount (÷2)` when that happens, not `÷3`.
- Optionally round the total down to the nearest 100, 500 or 1.000 ("pembulatan"), so nobody hands over coins.
- Amounts group themselves as you type — `59000` becomes `59.000` — with dots or commas to taste. The preference follows through to the summary, the PDF and the WhatsApp message.
- Each person's total is the plain half-up rounding of what they actually owe — `.5` and up goes up, below stays put — and the shares still add up to the bill exactly. Where arithmetic makes both impossible (two shares of exactly `.5`), one person gives a single rupiah rather than the bill going out by one.
- **📷 Scan a receipt** fills in the item lines *and the charges* from the struk — photograph it with the camera right in the page, or pick a photo you already have. Reads on your device by default; add a Gemini key for a near-perfect read at the cost of sending the photo. With a key it also takes the **service charge, tax and discount** as printed — so one read leaves nothing to type but who was at the table and who ate what. The figures land in the flat-amount fields and the percentages are cleared as they do: the two are added together, not chosen between, so 5% left standing beside a service charge read off the paper would charge the table twice. Where the struk prints only a total, that goes in instead and the charges fall out of the difference. Either way the note says which figures it read, and whether they add up to the total on the paper. The photo you scanned **is** the struk photo — attached before the reading is even attempted, so a refused key or a dead connection costs you the reading but never the picture, and a thumbnail of it sits beside the line that says so. While a read is running there is a bar under the buttons: the real figure when the on-device scanner reports one, and a sweeping band when there is nothing to report — the post to Gemini answers all at once — rather than a number nobody measured. See the caveat below.
- **PDF** of the whole bill, on **one long page** rather than a stack of A4s — this gets read on a phone, where scrolling is free and a page break in the middle of a card is not. Two settings, asked for at the moment you want one — pressing **Save PDF**, or the send button with the paperclip, opens a sheet with both: **Organised** packs the figures in tight, for printing and filing; **Beautiful** gives them room, an accent rule, an inked total and a footer. Whatever you picked last time leads, so it is usually the same tap in the same place. The same numbers either way, and both lead with a card per person — name and total in one eyeline, the reasons beneath — because that is what the PDF gets opened for. If you scanned a struk, the photo is at the foot, behind the numbers, at full width.
- **Excel** of the same bill, for keeping your own history offline: a CSV with the items, the charges and a row per person, amounts as bare numbers so the columns add up. Opens in Excel, Numbers and Sheets, and stays readable in a text editor.
- **Two buttons per person.** The WhatsApp mark on its own opens WhatsApp with their itemised share prefilled — add their phone number to land straight in the chat, or leave it blank and pick the contact there. The mark with a paperclip sends the same message *and* the bill as a PDF: WhatsApp will only take a file through the OS share sheet, and it drops a document's caption on the way, so the message goes to the clipboard at the same moment, ready to paste under the file. Where no file can be shared — a desktop browser — the second button copies the message instead, which is how you send from WhatsApp Web.
- A **tick** stays beside anyone already sent to, with *Sent 3 of 5* above the list, because a five-person chase is easy to lose your place in. Tapping the tick takes it back.
- **Tag by dragging.** Tapping a name tags it and tapping again buys another share of the line, as before. Dragging sideways across the chips paints instead: the chip your finger goes down on sets the direction — off it turns people on, on it turns them off — and every chip it crosses takes that same state. Four people shared the pizza in one swipe. Only the sideways gesture is taken; pulling the page up through a wall of chips still scrolls it.
- **One drawn icon set.** The theme switch wears the sun, the moon and a half-lit circle for Auto — the same idea as the mark in the corner, and the same idea as the setting; on a narrow phone the labels step aside and the marks carry it alone, the words staying as each button's accessible name. Every other button that carries a mark carries one from the same set — 24-unit box, two-unit stroke, round caps — so a screenful of them reads as one hand rather than a pile of found glyphs. The camera on *Scan a receipt* replaces an emoji that was whatever font the phone happened to have, and every ✕ is now drawn rather than typed. The words are still the accessible name; the mark is `aria-hidden` and only leads the eye to the right button in a column of them.
- **The Gemini key gets a box of its own**: the key in front of it, an eye that reveals what you pasted — a key you cannot read is a key you cannot check — and a cross that appears only once there is something to take back. One border round all three, because they are one control.
- **Enter carries you forward.** In the participants, the items and the transfer accounts, Enter moves along the row and then down into the row below — and at the foot of a list it makes the row that is not there yet and puts the cursor in it. A struk of fifteen lines goes in without a thumb ever leaving the keyboard; on an empty row Enter simply puts the keyboard away. The running figure in the **Items** and **Participants** headings moves as you type, so a mistyped zero is caught a few pixels above the box it was typed in rather than at the foot of the page.
- **Transfer to** takes as many accounts as you like — a bank, an e-wallet, a QRIS name. All of them go into every WhatsApp message and the PDF, so people can pay from whatever they actually hold.
- Tick who paid the whole bill up front ("nalangin") and their message flips around: what they laid out, who owes them, and how much should come back. Everyone else's message names them, so nobody has to ask who to pay. What comes back plus the payer's own share is always the bill exactly.
- **Three movements, not eight equal cards.** What the bill is at the top and the shelf of old bills at the foot give up their cards and sit on the page itself; the four sections you actually type into stay shoulder to shoulder as the peers they are; and **Who pays what** gets the room, an accent heading and the only figure on the page bigger than the total — because a single person's share is what actually gets sent.
- **The bar** carries the bill you are in, and the whole shelf under it. The picker drops open a list of every bill you have made, newest first, each with its date, its head count and what it came to; tapping one swaps to it — whatever was open goes back on the shelf on the way past, so switching never costs you anything — and the cross beside a bill deletes it without opening it first. **+ New bill** is at the foot of that list, and **Clear** beside the picker empties the bill you are in without touching any of the others. Nothing about bills lives at the bottom of the page any more.
- **Save as file** writes the bill itself as `.json`, and **Open a file…** reads one back: that is how a bill moves to another phone, and the only copy of it that outlives this browser. A file is treated as untrusted like anything else — it goes through the same normalising every stored bill does.
- No accounts, no server. The bills live in your browser's `localStorage`.

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
- The photo is kept with the bill and goes at the **foot of the PDF**, so a number can be checked against the paper it came from. Under the scan button a row always says whether one is attached, with **Add photo** / **Remove photo** beside it — attaching this way stores the photo without reading it, which is what you want when the items are already right and re-scanning would only add them twice. Scanning replaces it, and emptying the bill clears it. It is the only large thing in storage, so if it ever won't fit the bill is saved without it and the scan note says so.

### On your phone, by default

[Tesseract.js](https://github.com/naptha/tesseract.js) with Indonesian and English data, in single-column mode. **Nothing is uploaded.** On the test struk it reads eight of the ten lines and mangles two, in about 16 seconds.

- Takes the rightmost amount on a line as that line's total (so a unit-price column is ignored) and the text before it as the name, keeping a quantity when it's more than one.
- Handles the other layout too — a delivery app's order screen, where the price sits on its own line *under* the dish with the customer's note in between. Lines with no money on them are held, five deep, and a price that arrives without a name of its own takes the first held line that reads like a dish and is not a charge.
- **Stops at the charges** — subtotal, service, PPN, discount, rounding, cash, change. Those belong to the app's own fields, so a misread can never quietly double-charge anybody. It shows the printed total when it finds one, purely as a cross-check.
- First scan downloads the engine and language data (~8 MB) and the browser caches it. Nothing loads until you press the button.

### With a Gemini key

Paste a [Gemini API key](https://aistudio.google.com/apikey) into the box under the scan button and the photo goes to `gemini-3.5-flash-lite` instead. On the test struk it reads **all ten lines exactly**, quantities included, in about 3 seconds.

- **The photo leaves your device** when a key is set — that is the whole trade, and the note under the button says so while the key is there. Nothing else about the bill is ever sent.
- The key is kept in `localStorage` on that device alone. It is never part of the bill, so emptying a bill does not clear it and no CSV, PDF or WhatsApp message carries it. **Clear** removes it, and an empty box puts you back on Tesseract.
- Never commit a key to this repo. It is public and GitHub Pages serves the source verbatim, so a key in the source is a key published to the world — and Google scans public repos and disables what it finds. The box exists precisely so the key stays off the server.
- The reply is schema-constrained JSON and is still validated before anything becomes an item: amounts must be whole rupiah between 1.000 and 100 juta, names are stripped of control characters and capped, and the list is truncated. A model's answer decides what people pay, so it is treated as untrusted input.

## Notes

- Amounts are whole rupiah. Phone numbers without a country code are assumed Indonesian (`08…` → `+62…`); type `+<code>…` for anywhere else.
- Tax is charged on subtotal + service charge by default (Indonesian convention) — there's a checkbox to turn that off.
- [jsPDF](https://github.com/parallax/jsPDF) and [Tesseract.js](https://github.com/naptha/tesseract.js) are loaded from a CDN at pinned versions with SRI hashes — Tesseract only when you first press scan. Tesseract then fetches its own wasm engine and language data, which SRI can't cover. So PDF export and scanning need a connection; everything else works offline.
- The only thing that ever leaves the device is a receipt photo, and only when you have set a Gemini key. The bill itself — names, amounts, phone numbers — never goes anywhere.
- The CSV starts with `sep=,` so Excel honours the comma whatever the machine's locale says, and a name beginning with `=`, `+`, `-` or `@` is prefixed with `'` so a spreadsheet can't run it as a formula.
