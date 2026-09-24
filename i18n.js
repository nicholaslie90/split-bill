// English is the source: every string in the app is written in English, and
// that English is the key here. A string with no entry stays English, so a
// phrase added later and forgotten here shows up untranslated, never blank.
// {name}-style holes are filled by t(); the words around them are what change.
const ID = {
  // --- the page itself
  'Theme': 'Tema',
  'Auto': 'Otomatis',
  'Light': 'Terang',
  'Dark': 'Gelap',
  'Language': 'Bahasa',
  'Clear this bill and start fresh': 'Kosongkan tagihan ini dan mulai dari awal',
  'Clear': 'Kosongkan',
  'Add who’s eating, scan the struk, tag who shared each item, then send everyone their share on WhatsApp.':
    'Tambahkan siapa saja yang makan, pindai struknya, tandai siapa yang ikut di tiap item, lalu kirim bagian masing-masing lewat WhatsApp.',
  'Who’s eating': 'Siapa yang makan',
  'Add participant': 'Tambah peserta',
  'From contacts': 'Dari kontak',
  'Phone is optional — pick people from your contacts to fill it in, or leave it at 628 and WhatsApp will ask you who to send to. Tick the box to mark who paid the whole bill up front. Each person then gets buttons to send the message on its own, send it with the bill as a PDF, or just copy it.':
    'No. HP boleh dikosongkan — pilih dari kontak untuk mengisinya, atau biarkan 628 dan WhatsApp akan menanyakan mau dikirim ke siapa. Centang kotaknya untuk menandai siapa yang menalangi seluruh tagihan. Setiap orang lalu mendapat tombol untuk mengirim pesannya saja, mengirimnya bersama tagihan dalam PDF, atau cukup menyalinnya.',
  'What you ordered': 'Apa yang dipesan',
  'Scan a receipt': 'Pindai struk',
  'Reading the receipt': 'Membaca struk',
  'Add item': 'Tambah item',
  'Photograph the receipt': 'Foto struknya',
  'Fill the frame with the receipt, straight on and in good light — that is most of what makes the reading accurate.':
    'Isi bingkai dengan struknya, lurus dari depan dan dengan cahaya yang cukup — itu yang paling menentukan akurasi pembacaannya.',
  'Take photo': 'Ambil foto',
  'Choose a photo': 'Pilih foto',
  'Cancel': 'Batal',
  'The struk photo': 'Foto struk',
  'Close': 'Tutup',
  'Where & when': 'Di mana & kapan',
  'optional': 'opsional',
  'What / where': 'Apa / di mana',
  'Dinner at Sate Khas': 'Makan malam di Sate Khas',
  'Date': 'Tanggal',
  'Service, tax & discount': 'Servis, pajak & diskon',
  'Total on the struk (Rp)': 'Total di struk (Rp)',
  'Service charge %': 'Biaya servis %',
  'Service charge (Rp)': 'Biaya servis (Rp)',
  'Tax / PPN %': 'Pajak / PPN %',
  'Tax / PPN (Rp)': 'Pajak / PPN (Rp)',
  'Charge tax on top of the service charge': 'Kenakan pajak di atas biaya servis',
  'Discount (Rp)': 'Diskon (Rp)',
  'Discount %': 'Diskon %',
  'Either one (or both) — the discount is split evenly per person, except that nobody\'s share goes below zero: what a small share can\'t absorb comes off the others instead.':
    'Isi salah satu (atau keduanya) — diskon dibagi rata per orang, tapi bagian siapa pun tidak akan di bawah nol: sisa yang tidak tertampung bagian kecil dipotong dari yang lain.',
  'Round the total down to': 'Bulatkan total ke bawah ke',
  'Don\'t round': 'Tanpa pembulatan',
  'Nearest 100': 'Kelipatan 100',
  'Nearest 500': 'Kelipatan 500',
  'Nearest 1.000': 'Kelipatan 1.000',
  'Thousands separator': 'Pemisah ribuan',
  '1.000 — dot': '1.000 — titik',
  '1,000 — comma': '1,000 — koma',
  'Where to transfer': 'Transfer ke mana',
  'Add another account': 'Tambah rekening lain',
  'Optional, and as many as you like — a bank account, an e-wallet, a QRIS name. All of them go into every WhatsApp message and the PDF, so people can pick whichever they have.':
    'Opsional, dan boleh sebanyak apa pun — rekening bank, e-wallet, atau nama QRIS. Semuanya masuk ke setiap pesan WhatsApp dan PDF, jadi orang bisa pilih yang mereka punya.',
  'Send everyone their share': 'Kirim bagian masing-masing',
  'Save PDF': 'Simpan PDF',
  'Save Excel': 'Simpan Excel',
  'Bills': 'Daftar tagihan',
  'New bill': 'Tagihan baru',
  'Open a file…': 'Buka file…',
  'Save as file': 'Simpan sebagai file',
  'Every bill is in the picker at the top of the page, and stays in this browser. Saving one as a file is how it moves to another phone, or how you keep it after this browser forgets.':
    'Semua tagihan ada di pilihan di atas halaman, dan tersimpan di browser ini. Simpan sebagai file untuk memindahkannya ke HP lain, atau supaya tetap aman kalau browser ini menghapusnya.',

  // --- bills
  'There is no room left to save this bill.': 'Tidak ada ruang lagi untuk menyimpan tagihan ini.',
  'There is no room left to keep another bill — delete one first.': 'Tidak ada ruang untuk tagihan lain — hapus salah satu dulu.',
  'Clear this bill and start a fresh one? The other bills stay.': 'Kosongkan tagihan ini dan mulai yang baru? Tagihan lain tetap tersimpan.',
  'Untitled bill': 'Tagihan tanpa nama',
  'open now': 'sedang dibuka',
  '{name} is the bill you are in': '{name} adalah tagihan yang sedang dibuka',
  'Open {name}': 'Buka {name}',
  'Delete {name}': 'Hapus {name}',
  'Delete "{name}"? This cannot be undone.': 'Hapus "{name}"? Ini tidak bisa dibatalkan.',
  '{n} person': '{n} orang',
  '{n} people': '{n} orang',
  'The bill couldn\'t be saved as a file. {why}': 'Tagihan gagal disimpan sebagai file. {why}',
  'That file isn\'t a bill this app can open. {why}': 'File itu bukan tagihan yang bisa dibuka aplikasi ini. {why}',
  'It is far too big to be one.': 'Ukurannya terlalu besar untuk sebuah tagihan.',
  'There is no bill inside it.': 'Tidak ada tagihan di dalamnya.',

  // --- people
  'Name': 'Nama',
  'Participant name': 'Nama peserta',
  'Phone (optional)': 'No. HP (opsional)',
  'Phone number, optional': 'Nomor HP, opsional',
  'Add the people sharing this bill.': 'Tambahkan orang-orang yang ikut patungan.',
  '{name} paid the whole bill up front': '{name} menalangi seluruh tagihan',
  'This browser wouldn\'t open your contacts ({why}). Try Chrome, or type the names in.':
    'Browser ini tidak mau membuka kontakmu ({why}). Coba pakai Chrome, atau ketik namanya.',

  // --- items
  'Item name': 'Nama item',
  'Amount': 'Jumlah',
  'Remove item': 'Hapus item',
  'Add participants to tag this item.': 'Tambahkan peserta untuk menandai item ini.',
  'Everyone': 'Semua',
  'No items yet.': 'Belum ada item.',

  // --- scanning
  'That photo came back empty — if it lives in the cloud, open it in your gallery first so the phone has a copy.':
    'Foto itu kosong — kalau tersimpan di cloud, buka dulu di galeri supaya HP punya salinannya.',
  'This browser can\'t read that photo ({type}, {kb} KB). Phones that save pictures as HEIC are the usual reason. Take the picture with the camera button instead, or save a JPEG copy of it.':
    'Browser ini tidak bisa membaca foto itu ({type}, {kb} KB). Biasanya karena HP menyimpan foto dalam format HEIC. Ambil foto lewat tombol kamera, atau simpan salinannya sebagai JPEG.',
  'unknown type': 'jenis tidak dikenal',
  'Scanning is best effort, so check every name and amount afterwards.': 'Hasil pindaian belum tentu sempurna, jadi periksa lagi setiap nama dan jumlahnya.',
  'Service, tax and discount come off the struk as well, so check those too.': 'Servis, pajak, dan diskon juga dibaca dari struk, jadi periksa juga.',
  'The photo is read by Google’s Gemini AI, so it leaves your device; nothing else about the bill does.':
    'Foto dibaca oleh Gemini AI dari Google, jadi fotonya dikirim keluar dari perangkatmu; data tagihan lainnya tidak.',
  'If it cannot be read, nothing is guessed at — the photo stays on the bill and the lines are yours to type.':
    'Kalau tidak terbaca, tidak ada yang ditebak — foto tetap di tagihan dan itemnya bisa kamu ketik sendiri.',
  'Photograph the struk with your camera, or pick a photo you already have.': 'Foto struknya dengan kamera, atau pilih foto yang sudah ada.',
  'Couldn\'t open the camera — pick a photo instead.': 'Kamera tidak bisa dibuka — pilih foto saja.',
  'Sending the photo to Gemini AI to be read…': 'Mengirim foto ke Gemini AI untuk dibaca…',
  'Gemini AI could not be reached.': 'Gemini AI tidak dapat dihubungi.',
  'Gemini AI has reached its usage limit for now. Try again in {n} minute.': 'Gemini AI sedang mencapai batas pemakaian. Coba lagi dalam {n} menit.',
  'Gemini AI has reached its usage limit for now. Try again in {n} minutes.': 'Gemini AI sedang mencapai batas pemakaian. Coba lagi dalam {n} menit.',
  'Gemini AI has reached its usage limit for now. Try again in about {n} hours.': 'Gemini AI sedang mencapai batas pemakaian. Coba lagi sekitar {n} jam lagi.',
  'The reader could not be reached ({status}).': 'Pembaca struk tidak dapat dihubungi ({status}).',
  'Gemini sent back something that was not a receipt{why}.': 'Gemini mengirim balik sesuatu yang bukan struk{why}.',
  'It said: {text}': 'Katanya: {text}',
  'It said nothing at all.': 'Tidak ada jawaban sama sekali.',
  'Reading the photo…': 'Membaca foto…',
  'service': 'servis',
  'tax': 'pajak',
  'a discount of': 'diskon',
  'and': 'dan',
  'a total of Rp {amt}, with service and tax worked back from it': 'total Rp {amt}, dengan servis dan pajak dihitung mundur dari situ',
  'the place as {place}': 'tempatnya {place}',
  'the date as {date}': 'tanggalnya {date}',
  'Gemini AI added {n} item, Rp {amt} in total.': 'Gemini AI menambahkan {n} item, total Rp {amt}.',
  'Gemini AI added {n} items, Rp {amt} in total.': 'Gemini AI menambahkan {n} item, total Rp {amt}.',
  'Nothing came back from {reader} — no item lines it could make out, so add them by hand.':
    'Tidak ada hasil dari {reader} — tidak ada baris item yang terbaca, jadi tambahkan sendiri.',
  'It also read {list}.': 'Juga terbaca {list}.',
  'It set {list} from the struk.': 'Dari struk juga diisi {list}.',
  'That adds up to the Rp {amt} the struk says, so the reading is sound.': 'Jumlahnya pas dengan Rp {amt} di struk, jadi pembacaannya benar.',
  'The struk says Rp {total}, but the lines and charges read come to Rp {adds} — something on the paper was missed.':
    'Struk menyebut Rp {total}, tapi item dan biaya yang terbaca berjumlah Rp {adds} — ada yang terlewat.',
  'The photo goes at the foot of the PDF.': 'Foto dilampirkan di bagian bawah PDF.',
  'The photo was too big to keep, so the PDF goes without it.': 'Foto terlalu besar untuk disimpan, jadi PDF dibuat tanpa foto.',
  'The photo is on the bill, at the foot of the PDF.': 'Foto ada di tagihan, di bagian bawah PDF.',
  'No struk photo yet — scanning one attaches it. Without it the PDF is just the numbers.':
    'Belum ada foto struk — memindai struk akan melampirkannya. Tanpa foto, PDF hanya berisi angka.',
  'Struk photo attached, {kb} KB — it goes at the foot of the PDF.': 'Foto struk terlampir, {kb} KB — ada di bagian bawah PDF.',
  'See the struk': 'Lihat struk',
  'Remove photo': 'Hapus foto',
  'Photo removed, so the PDF goes without it. Scanning again attaches a new one.': 'Foto dihapus, jadi PDF dibuat tanpa foto. Memindai lagi akan melampirkan foto baru.',

  // --- charges
  'Less than the items': 'Kurang dari total item',
  'Service & tax': 'Servis & pajak',
  'Service charge': 'Biaya servis',
  'Service': 'Servis',
  'Tax': 'Pajak',
  'Discount': 'Diskon',
  'Rounding': 'Pembulatan',
  'Optional. Type the figure at the bottom of the struk and the service and tax work themselves out, spread across the items in proportion. Leave it blank to set the percentages yourself.':
    'Opsional. Ketik angka di bagian bawah struk, lalu servis dan pajak dihitung otomatis dan dibagi ke item secara proporsional. Kosongkan untuk mengisi persentasenya sendiri.',
  'That is exactly what the items come to, so there is nothing to add.': 'Itu sama persis dengan total item, jadi tidak ada tambahan.',
  '({pct}% of the items)': '({pct}% dari total item)',
  'Rp {amt} of service and tax{rate}, spread across the items. The fields below are switched off while this has a figure in it.':
    'Rp {amt} untuk servis dan pajak{rate}, dibagi ke semua item. Kolom di bawah dinonaktifkan selama kolom ini terisi.',
  'Rp {amt} less than the items{rate}, taken off them in proportion. The fields below are switched off while this has a figure in it.':
    'Rp {amt} kurang dari total item{rate}, dipotong dari item secara proporsional. Kolom di bawah dinonaktifkan selama kolom ini terisi.',

  // --- accounts
  'Remove this account': 'Hapus rekening ini',
  'Bank or wallet': 'Bank atau e-wallet',
  'Account number': 'Nomor rekening',
  'Account name (optional)': 'Nama pemilik (opsional)',
  'Account name, optional': 'Nama pemilik, opsional',
  'No account yet — nothing about where to pay goes out.': 'Belum ada rekening — info pembayaran tidak ikut terkirim.',

  // --- the split, and sending it
  'Add participants and items to see the split.': 'Tambahkan peserta dan item untuk melihat pembagiannya.',
  'Add participants and items first.': 'Tambahkan peserta dan item dulu.',
  '· paid up front': '· menalangi',
  'paid up front': 'menalangi',
  'gets back Rp {amt}': 'menerima kembali Rp {amt}',
  'Sent to all {n} — everyone has theirs.': 'Sudah dikirim ke semua {n} orang.',
  'Sent {n} of {total}.': 'Terkirim {n} dari {total}.',
  '{name} has had theirs — clear this mark': '{name} sudah dikirimi — hapus tanda ini',
  'what {name} gets back': 'yang diterima kembali oleh {name}',
  '{name} their share': 'bagian {name}',
  'Send text': 'Kirim teks',
  'Send attachment': 'Kirim lampiran',
  'Copy text': 'Salin teks',
  'Send text: {what} on WhatsApp': 'Kirim teks: {what} lewat WhatsApp',
  'Send text: {what} on WhatsApp — pick the contact there': 'Kirim teks: {what} lewat WhatsApp — pilih kontaknya di sana',
  'Send attachment: {what} on WhatsApp with the bill attached — the message is copied, ready to paste under it':
    'Kirim lampiran: {what} lewat WhatsApp dengan tagihan terlampir — pesannya sudah disalin, tinggal tempel di bawahnya',
  'Copy text: {name}\'s message': 'Salin teks: pesan untuk {name}',
  '{name}\'s message copied.': 'Pesan untuk {name} tersalin.',
  'No clipboard in this browser.': 'Browser ini tidak mendukung clipboard.',
  'Could not copy the message.': 'Gagal menyalin pesan.',
  '{a} of {b}': '{a} dari {b}',

  // --- the WhatsApp message
  'Hi {name}, you paid *Rp {amt}* up front.': 'Halo {name}, kamu menalangi *Rp {amt}*.',
  'You should get back *Rp {amt}*:': 'Kamu akan menerima kembali *Rp {amt}*:',
  'Your own share: Rp {amt}': 'Bagianmu sendiri: Rp {amt}',
  'Hi {name}, your share is *Rp {amt}*': 'Halo {name}, bagianmu *Rp {amt}*',
  '{name} paid the bill up front.': '{name} sudah menalangi tagihannya.',
  'Transfer to:': 'Transfer ke:',

  // --- the PDF
  'PDF library did not load — check your connection.': 'Library PDF gagal dimuat — periksa koneksimu.',
  'The PDF couldn\'t be sent. {why} You can still send the message on its own.': 'PDF gagal dikirim. {why} Kamu tetap bisa mengirim pesannya saja.',
  'total for the table': 'total satu meja',
  'WHO PAYS WHAT': 'SIAPA BAYAR BERAPA',
  'THE BILL': 'TAGIHAN',
  'TRANSFER TO ANY OF THESE': 'TRANSFER KE SALAH SATU',
  'TRANSFER TO': 'TRANSFER KE',
  'THE STRUK': 'STRUK',
  'everyone': 'semua',
  '{name} gets back': '{name} menerima kembali',
  'split {n}': 'dibagi {n}',

  // --- the spreadsheet
  'Bill': 'Tagihan',
  'Shared by': 'Dibagi oleh',
  'Service & tax (from the total)': 'Servis & pajak (dari total)',
  'Person': 'Orang',
  'Phone': 'No. HP',
  'Paid up front': 'Menalangi',
  'All': 'Total semua',
  'yes': 'ya',
  'Paid up front by': 'Ditalangi oleh',
  'Owed back': 'Harus dikembalikan',
  'Transfer to': 'Transfer ke',
};

export const LANGS = ['en', 'id'];
let lang = 'en';
export const getLang = () => lang;
export const setLang = (v) => { lang = LANGS.includes(v) ? v : 'en'; };

// The English for a phrase in either language: itself if it is a key, or the
// key it translates, so the page can be swapped back and forth any number of
// times. Templates are left out: their holes are filled, so no screen text is
// ever one of them verbatim.
const EN = new Map();
for (const [k, v] of Object.entries(ID)) if (!k.includes('{')) { EN.set(k, k); EN.set(v, k); }

// A phrase in the current language, holes filled from `vars`.
export const t = (en, vars) => {
  const s = (lang === 'id' && ID[en]) || en;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
};

// A whole run of fixed text — a text node, an attribute, a PDF label — put
// into the current language, keeping the whitespace around it. Anything that
// is not one of the phrases above comes back untouched.
// ponytail: a user-typed name that happens to be exactly one of these phrases
// ("Tax", "Service") is translated too; mark such nodes translate="no" if it bites.
export const swap = (s) => {
  const core = s.replace(/\s+/g, ' ').trim();
  const en = EN.get(core);
  if (!en) return s;
  const want = t(en);
  return want === core ? s : s.match(/^\s*/)[0] + want + s.match(/\s*$/)[0];
};

const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
export function translateTree(node) {
  if (node.nodeType === 3) {
    const v = swap(node.data);
    if (v !== node.data) node.data = v;
    return;
  }
  if (node.nodeType !== 1 || node.matches('script, style, [translate=no]')) return;
  for (const a of ATTRS) {
    const v = node.getAttribute(a);
    if (v == null) continue;
    const w = swap(v);
    if (w !== v) node.setAttribute(a, w);
  }
  for (const c of node.childNodes) translateTree(c);
}

// Everything the page draws later, in the current language as it lands: the
// fixed strings in the app need no t() of their own as long as they are here.
export function watch(root) {
  translateTree(root);
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'childList') m.addedNodes.forEach(translateTree);
      else translateTree(m.target);
    }
  }).observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
