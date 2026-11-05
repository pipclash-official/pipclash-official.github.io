/* PipClash Coming Soon – Battle #001 free seat booking (launch Mon 9 Nov 2026).
   Supabase RPC: pc_booking_counts, pc_book, pc_booking_top_ref (supabase_prelaunch_booking.sql), pc_booking_recent (supabase_prelaunch_recent.sql).
   Account nahi chahiye. Inaam (window.PC_BOOK_PRIZES) = prizes.py, agar arena mein 100 log khelein. */
(function () {
  var SB_URL = 'https://vrcjgxnafmuxfkybtkbz.supabase.co';
  var SB_KEY = 'sb_publishable_hJfAzBCqJKrJkNmLNEsndA_UuFCLH6f';   // public key – website ke liye hi hai
  var LAUNCH = Date.UTC(2026, 10, 9, 12, 30);                      // Mon 9 Nov 2026, 4:30 PM UAE
  var MAX = 100, SHOW_FROM = 30;
  function totalBooked() { return counts ? (counts[10] || 0) + (counts[25] || 0) + (counts[50] || 0) : 0; }
  var TIERS = [{ fee: 10, name: 'STARTER', c: 's' }, { fee: 25, name: 'PRO', c: 'b' }, { fee: 50, name: 'ELITE', c: 'g' }];
  var PRZ = window.PC_BOOK_PRIZES || {};
  var KEY = 'pc_bookings_v1';
  var USDT_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#fff"/><path d="M17.9 17.4c-.1 0-.7.1-1.9.1-1 0-1.7 0-1.9-.1-3.7-.2-6.5-.8-6.5-1.6s2.8-1.4 6.5-1.6v2.6c.2 0 .9.1 1.9.1 1.2 0 1.8-.1 1.9-.1v-2.6c3.7.2 6.4.8 6.4 1.6s-2.7 1.4-6.4 1.6m0-3.5v-2.3h5.2V8H8.9v3.6h5.2v2.3c-4.2.2-7.4 1-7.4 2s3.2 1.8 7.4 2v7.3h3.8v-7.3c4.2-.2 7.3-1 7.3-2s-3.1-1.8-7.3-2" fill="#26A17B"/></svg>';
  var root = document.querySelector('[data-book]');
  if (!root) return;

  var ref = (new URLSearchParams(location.search).get('ref') || '').replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 30), refInUrl = !!ref;
  try { if (ref) localStorage.setItem('pc_book_ref', ref); else ref = localStorage.getItem('pc_book_ref') || ''; } catch (e) {}
  var counts = null, pick = null;

  function rpc(fn, body) {
    return fetch(SB_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function usd(n) { return '$' + Number(n).toLocaleString('en-US'); }
  function mine() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function saveMine(b) {
    var a = mine().filter(function (x) { return x.tier !== b.tier; }); a.push(b);
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {}
  }
  function tier(fee) { return TIERS.filter(function (x) { return x.fee === fee; })[0]; }
  function coin(t) { return '<span class="v2-tier ' + t.c + '" aria-hidden="true"><i>' + t.fee + '</i></span>'; }
  function link(code) { return location.origin + location.pathname + '?ref=' + code; }
  function total() { return counts ? (counts['10'] || 0) + (counts['25'] || 0) + (counts['50'] || 0) : 0; }

  /* ---------- countdown ---------- */
  var cd = root.querySelector('[data-bk-cd]');
  function tick() {
    var s = Math.max(0, Math.floor((LAUNCH - Date.now()) / 1000));
    if (!s) { cd.innerHTML = '<a class="cs-live" href="account.html">🔴 Battles are LIVE – join today’s battle →</a>'; return; }   // 5 Nov: launch ke baad 00:00 nahi
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    cd.innerHTML = [[d, 'DAYS'], [h, 'HRS'], [m, 'MIN'], [x, 'SEC']].map(function (p) {
      return '<div><b class="tn">' + (p[0] < 10 ? '0' : '') + p[0] + '</b><span>' + p[1] + '</span></div>';
    }).join('');
  }
  tick(); setInterval(tick, 1000);

  /* ---------- country picker: duniya ke saare desh + jhanda (flagcdn) + search ---------- */
  var CODES = 'AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW XK'.split(' ');
  var TOPC = ['IN', 'PK', 'AE', 'NG', 'ZA', 'KE', 'GH', 'EG', 'MY', 'ID', 'PH', 'VN', 'TH', 'BD', 'GB', 'SA', 'US'];
  var dn = null; try { dn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) {}
  function cname(c) { var n = dn ? dn.of(c) : c; return c === 'XK' && n === 'XK' ? 'Kosovo' : n; }
  var NAME2CODE = {};
  var ALLC = CODES.map(function (c) { var n = cname(c); NAME2CODE[n] = c; return { c: c, n: n }; })
    .sort(function (a, b) { return a.n.localeCompare(b.n); });
  function flag(c, w) { c = (c || '').toLowerCase(); return c ? '<img class="cs-flag" alt="" width="' + (w || 20) + '" height="' + Math.round((w || 20) * .75) + '" loading="lazy" src="https://flagcdn.com/w40/' + c + '.png" srcset="https://flagcdn.com/w80/' + c + '.png 2x">' : ''; }
  function flagOf(name) { return flag(NAME2CODE[name] || ''); }
  var cty = root.querySelector('[data-cty]');
  if (cty) {
    var cBtn = cty.querySelector('[data-cty-btn]'), cPop = cty.querySelector('[data-cty-pop]'), cQ = cty.querySelector('[data-cty-q]'),
        cList = cty.querySelector('[data-cty-list]'), cVal = cty.querySelector('#bk-country');
    var setC = function (c) {
      var n = cname(c); cVal.value = n;
      cty.querySelector('[data-cty-name]').textContent = n;
      var im = cty.querySelector('[data-cty-flag]'); im.src = 'https://flagcdn.com/w40/' + c.toLowerCase() + '.png'; im.srcset = 'https://flagcdn.com/w80/' + c.toLowerCase() + '.png 2x';
    };
    var row = function (x) { return '<button type="button" role="option" data-c="' + x.c + '">' + flag(x.c) + '<span>' + esc(x.n) + '</span></button>'; };
    var drawC = function () {
      var q = cQ.value.trim().toLowerCase();
      if (q) { var hit = ALLC.filter(function (x) { return x.n.toLowerCase().indexOf(q) >= 0 || x.c.toLowerCase() === q; });
        cList.innerHTML = hit.length ? hit.map(row).join('') : '<div class="cs-ctyn">No match</div>'; return; }
      cList.innerHTML = '<div class="cs-ctyh">Popular</div>' + TOPC.map(function (c) { return row({ c: c, n: cname(c) }); }).join('') +
        '<div class="cs-ctyh">All countries</div>' + ALLC.map(row).join('');
    };
    var openC = function (o) { cPop.hidden = !o; cBtn.setAttribute('aria-expanded', o); if (o) { cQ.value = ''; drawC(); setTimeout(function () { cQ.focus(); }, 30); } };
    cBtn.addEventListener('click', function () { openC(cPop.hidden); });
    cQ.addEventListener('input', drawC);
    cList.addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (b) { setC(b.getAttribute('data-c')); openC(false); cBtn.focus(); } });
    document.addEventListener('click', function (e) { if (!cPop.hidden && !cty.contains(e.target)) openC(false); });
    cty.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !cPop.hidden) { openC(false); cBtn.focus(); } });
    var TZ = { Kolkata: 'IN', Calcutta: 'IN', Karachi: 'PK', Dubai: 'AE', Riyadh: 'SA', Dhaka: 'BD', Kathmandu: 'NP', Katmandu: 'NP', Muscat: 'OM',
               Qatar: 'QA', Kuwait: 'KW', Bahrain: 'BH', Colombo: 'LK', London: 'GB', Kuala_Lumpur: 'MY', Cairo: 'EG', Lagos: 'NG',
               Nairobi: 'KE', Johannesburg: 'ZA', Accra: 'GH', Manila: 'PH', Jakarta: 'ID', Ho_Chi_Minh: 'VN', Saigon: 'VN', Bangkok: 'TH' };
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var guess = TZ[tz.split('/').pop()] || (/^America\//.test(tz) ? 'US' : '') ||                  // pehle phone ka time zone, phir language
      ((navigator.language || '').split('-')[1] || '').toUpperCase();
    if (CODES.indexOf(guess) >= 0) setC(guess);           // 5 Nov: pata na chale to India nahi – khaali, user khud chune
  }

  /* ---------- 3 arenas ---------- */
  var grid = root.querySelector('[data-bk-tables]');
  var FIRST_FEE = 10;   // 5 Nov owner: Battle #001 sirf STARTER $10 (5+ pakka) – PRO/ELITE Battle #002 se
  function drawTables() {
    var my = mine();
    var card = function (t) {
      var n = counts ? Math.min(MAX, counts[t.fee] || 0) : null, full = n !== null && n >= MAX;
      var shown = n !== null && totalBooked() >= SHOW_FROM;          // kam ginti dikhane se bharosa ghatta – 30+ pe hi number
      var have = my.filter(function (b) { return b.tier === t.fee; })[0];
      var btn = have ? '<button class="btn btn-ghost cs-abtn" type="button" data-show="' + t.fee + '">✅ Booked · see my seat</button>'
        : '<button class="btn cs-abtn' + (t.c === 'g' ? ' cs-gold' : '') + '" type="button" data-pick="' + t.fee + '">' + (full ? 'Join waitlist' : 'Book FREE seat') + '</button>' +
          '<div class="cs-afee">' + (t.fee === FIRST_FEE ? 'Entry ' + usd(t.fee) + ' only on battle day · nothing to pay now'
            : 'Opens from Battle #002 (Tue 10 Nov) · entry ' + usd(t.fee) + ' · nothing to pay now') + '</div>';
      return '<div class="cs-arena ' + t.c + (pick === t.fee ? ' on' : '') + '">' +
        '<div class="cs-arow">' + coin(t) + '<div class="cs-ainfo"><b class="cs-aname">' + t.name + '</b>' +
        (shown ? '<div class="cs-seat"><b>' + n + '</b>/' + MAX + ' booked · ' + (full ? 'full – waitlist' : (MAX - n) + ' left') + '</div>' +
          '<div class="bar' + (t.c === 'g' ? ' g' : '') + '"><i style="width:' + (n || 0) + '%"></i></div>'
          : '<div class="cs-seat">' + (t.fee === FIRST_FEE ? 'Battle #001 · Mon 9 Nov · booking open' : 'From Battle #002 · Tue 10 Nov') + '</div>') + '</div>' +
        '</div>' + btn + '</div>';
    };
    var first = TIERS.filter(function (t) { return t.fee === FIRST_FEE; }), later = TIERS.filter(function (t) { return t.fee !== FIRST_FEE; });
    var openLater = later.some(function (t) { return pick === t.fee || my.some(function (b) { return b.tier === t.fee; }); });
    grid.innerHTML = first.map(card).join('') +      // 5 Nov audit: 9 Nov ko sirf STARTER – baaki chhote mein (confusion kam)
      '<details class="cs-later"' + (openLater ? ' open' : '') + '><summary>Also book PRO ($25) or ELITE ($50) – open from Tue 10 Nov</summary>' +
      later.map(card).join('') + '</details>';
  }
  function loadCounts() {
    return rpc('pc_booking_counts').then(function (c) { if (c) { counts = c; drawTables(); } });
  }

  /* ---------- prize ladder (tabs) ---------- */
  var ptabs = root.querySelector('[data-bk-ptabs]'), ladder = root.querySelector('[data-bk-ladder]'), ptier = 10;
  function drawLadder() {
    if (!ptabs || !ladder) return;          // 5 Nov: 100-player ladder hata (sach wale example build.py mein)
    ptabs.innerHTML = TIERS.map(function (t) { return '<button type="button" class="' + (t.fee === ptier ? 'on' : '') + '" data-pt="' + t.fee + '">' + t.name + '</button>'; }).join('');
    var p = PRZ[ptier] || [], cells = '';
    for (var r = 1; r <= 20; r++) cells += '<div class="' + (r <= 3 ? 't1' : '') + '"><span>#' + r + '</span><b>' + (p[r - 1] ? usd(p[r - 1]) : '–') + '</b></div>';
    var pool = ptier * MAX * 0.8;                                 // 100 entries ka 80%
    ladder.innerHTML = '<div class="prz">' + cells + '</div><p class="cs-small">If all 100 seats play: pool ' + usd(pool) + ' (80% of entry fees) · top ' + p.length + ' above $1,000 (3+ trades) win' +
      (p.length < 20 ? ' · smallest prize is $10, so #' + (p.length + 1) + '–20 get none' : '') + '. No fixed prize – real prizes are 80% of the entry fees actually paid.</p>';
  }
  if (ptabs) ptabs.addEventListener('click', function (e) { var b = e.target.closest('[data-pt]'); if (b) { ptier = +b.getAttribute('data-pt'); drawLadder(); } });

  /* ---------- form ---------- */
  var form = root.querySelector('[data-bk-form]'), done = root.querySelector('[data-bk-done]');
  var err = form.querySelector('[data-bk-err]');
  function openForm(fee, keep) {
    pick = fee; drawTables();
    var t = tier(fee), my = mine();
    // 5 Nov owner: teeno table form ke andar hi dikhen ($10 / $25 / $50) – chhupe nahi
    var pills = TIERS.map(function (x) {
      var have = my.some(function (b) { return b.tier === x.fee; });
      return '<button type="button" class="bk-pill ' + x.c + (x.fee === fee ? ' on' : '') + '" data-tp="' + x.fee + '" aria-pressed="' + (x.fee === fee) + '"' + (have ? ' disabled' : '') + '>' +
        '<span class="bk-pt"><b><sup>$</sup>' + x.fee + '</b><span class="bk-pn">' + x.name + '</span><small>' + (have ? 'Booked ✓' : x.fee === FIRST_FEE ? 'Mon 9 Nov' : 'Tue 10 Nov') + '</small></span>' +
        '<span class="bk-strip">' + USDT_SVG + 'USDT</span></button>';   // 5 Nov owner: design 5 ($ + hari USDT patti)
    }).join('');
    form.querySelector('[data-bk-ft]').innerHTML = '<div class="bk-pills" role="group" aria-label="Choose your table">' + pills + '</div>' +
      '<small class="bk-ftn">Free seat · ' + t.name + ' · entry ' + usd(t.fee) + ' only on battle day</small>';
    form.hidden = false; done.hidden = true; err.textContent = '';
    if (keep) return;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () { form.querySelector('#bk-name').focus({ preventScroll: true }); }, 450);
  }
  form.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tp]'); if (!b || b.disabled) return;
    openForm(+b.getAttribute('data-tp'), true);
  });
  var cta = root.querySelector('.cs-cta');
  if (cta) cta.addEventListener('click', function (e) {             // bada button = seedha form (STARTER), arena baad mein badal sakte
    e.preventDefault();
    if (mine().length) {                                            // pehle se booked: apni seat dikhao (arena list ab chhupi hai)
      var w = root.querySelector('[data-bk-mine-wrap]'), sec = root.querySelector('#arenas');
      if (sec) sec.hidden = false;
      (w && !w.hidden ? w : sec).scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    openForm(pick || 10);
  });
  root.addEventListener('click', function (e) {     // 5 Nov: arena list chhupi – "change arena" pe hi khule
    var a = e.target.closest('[data-arenas]'); if (!a) return;
    e.preventDefault(); var sec = root.querySelector('#arenas'); sec.hidden = false; sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  grid.addEventListener('click', function (e) {
    var p = e.target.closest('[data-pick]'), s = e.target.closest('[data-show]');
    if (p) openForm(+p.getAttribute('data-pick'));
    if (s) { var fee = +s.getAttribute('data-show'); showDone(mine().filter(function (b) { return b.tier === fee; })[0]); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.querySelector('#bk-name').value.trim(), contact = form.querySelector('#bk-contact').value.trim();
    var country = form.querySelector('#bk-country').value, ok18 = form.querySelector('#bk-18').checked;
    if (!country) { err.textContent = 'Please choose your country.'; return; }
    if (name.length < 2) { err.textContent = 'Please write your name.'; return; }
    if (contact.replace(/[^a-zA-Z0-9]/g, '').length < 4) { err.textContent = 'Please write your Telegram @username or WhatsApp number.'; return; }
    if (!ok18) { err.textContent = 'Please confirm you are 18 or older.'; return; }
    var b = form.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Booking…'; err.textContent = '';
    rpc('pc_book', { p_name: name, p_contact: contact, p_country: country, p_tier: pick, p_ref: ref }).then(function (r) {
      b.disabled = false; b.textContent = 'Book my free seat';
      if (!r) { err.textContent = 'Could not book right now – check your internet and try again.'; return; }
      if (!r.ok) { err.textContent = r.err === 'limit' ? 'Too many bookings from this network today.' : 'Please check your details and try again.'; return; }
      var bk = { tier: r.tier, code: r.code, seat: r.seat, waitlist: r.waitlist, name: name };
      saveMine(bk); form.hidden = true; pick = null; drawMine();
      if (!r.already && window.fbq) fbq('track', 'Lead', { content_name: 'seat_' + r.tier });   // Meta Pixel: booking hui
      loadCounts().then(function () { showDone(bk, r.already); });
      loadTop(); loadRecent();
    });
  });

  function showDone(bk, already) {
    if (!bk) return;
    var t = tier(bk.tier), url = link(bk.code);
    var left = counts ? Math.max(0, MAX - (counts[t.fee] || 0)) : null;
    var msg = 'I booked my seat for PipClash Battle #001 – weekday (Mon–Fri) MT5 trading battle, same $1,000 demo account for everyone, top traders win. Only 100 seats per arena, booking is free: ' + url;
    done.innerHTML = '<span class="cs-pill u">' + (bk.waitlist ? 'ON THE WAITLIST' : already ? 'YOUR SEAT' : 'SEAT BOOKED ✓') + '</span>' +
      '<div class="cs-seatno">' + t.name + ' <span>arena · Battle #001</span></div>' +          // 5 Nov owner: seat number / ginti nahi (abhi kam)
      '<a class="btn cs-tgjoin" href="https://pipclash.net/tg" target="_blank" rel="noopener" style="display:block;text-align:center;margin:10px 0 4px;font-weight:700">📢 Join Telegram – get battle news &amp; reminders</a>' +
      '<div class="v2-mut" style="text-align:center;font-size:12.5px">One tap → our bot sends you a welcome message with all updates.</div>' +
      '<div class="cs-code"><span>Your booking code</span><b>' + esc(bk.code) + '</b><small>Keep it (take a screenshot). When you create your account on 7 Nov, enter this code – it keeps your seat and your invites linked to you.</small></div>' +
      '<p class="bk-p">Launch Mon 9 Nov, 4:30 PM UAE. We will remind you before launch. On launch day you pay the entry in USDT and get your MT5 login.' +
      (bk.waitlist ? ' If a booked seat is not used by 4 PM, it goes to the waitlist in order.' : '') + '</p>' +
      '<div class="cs-earn"><b>Invite friends – get <span class="gold">1%</span> credit on every entry they pay, forever.</b>' +
      '<span>Friends who book with your link stay linked to you. When they play paid battles, 1% of each entry goes to your PipClash wallet.</span></div>' +
      '<div class="cs-lbl" style="margin:4px 0 0">Your invite link</div>' +
      '<div class="bk-link"><input readonly value="' + esc(url) + '" aria-label="Your invite link"><button class="btn btn-sm" type="button" data-copy>Copy</button></div>' +
      '<div class="cs-share"><a class="btn cs-wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">WhatsApp</a>' +
      '<a class="btn cs-tg" target="_blank" rel="noopener" href="https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent('Book your free PipClash seat – Battle #001, only 100 per arena') + '">Telegram</a></div>' +
      '<a class="v2-mut" href="https://pipclash.net/tg" target="_blank" rel="noopener" style="text-align:center">Join our Telegram channel →</a>';
    done.hidden = false;
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  done.addEventListener('click', function (e) {
    if (!e.target.closest('[data-copy]')) return;
    var i = done.querySelector('.bk-link input'); i.select();
    (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).catch(function () { document.execCommand('copy'); });
    e.target.textContent = 'Copied ✓'; setTimeout(function () { e.target.textContent = 'Copy'; }, 1800);
  });

  /* ---------- meri seat + invite link (hamesha upar, jab is phone se booking ho) ---------- */
  var mineBox = root.querySelector('[data-bk-mine]'), mineWrap = root.querySelector('[data-bk-mine-wrap]');
  function drawMine() {
    var my = mine();
    if (!my.length) { mineWrap.hidden = true; return; }
    var url = link(my[0].code);
    var msg = 'Book your free seat for PipClash Battle #001 – weekday (Mon–Fri) MT5 trading battle, same $1,000 demo account for everyone, top traders win. Only 100 seats per arena: ' + url;
    mineBox.innerHTML = my.map(function (b) {
      var t = tier(b.tier);
      return '<div class="cs-mrow">' + coin(t) + '<div><b>' + t.name + ' · ' + (b.waitlist ? 'waitlist #' : 'seat #') + b.seat + '</b><div class="v2-mut">Booking code <b class="gold">' + esc(b.code) + '</b></div></div></div>';
    }).join('') +
      '<div class="bk-link"><input readonly value="' + esc(url) + '" aria-label="Your invite link"><button class="btn btn-sm" type="button" data-copy>Copy</button></div>' +
      '<div class="cs-share"><a class="btn cs-wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">WhatsApp</a>' +
      '<a class="btn cs-tg" target="_blank" rel="noopener" href="https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent('Book your free PipClash seat – Battle #001, only 100 per arena') + '">Telegram</a></div>' +
      '<div class="v2-mut" style="font-size:12.5px">Get <b class="gold">1%</b> credit on every entry your friends pay.</div>';
    mineWrap.hidden = false;
  }
  mineBox.addEventListener('click', function (e) {
    if (!e.target.closest('[data-copy]')) return;
    var i = mineBox.querySelector('.bk-link input'); i.select();
    (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).catch(function () { document.execCommand('copy'); });
    e.target.textContent = 'Copied ✓'; setTimeout(function () { e.target.textContent = 'Copy'; }, 1800);
  });

  /* ---------- just booked (asli, naam chhupa) ---------- */
  var feed = root.querySelector('[data-bk-recent]'), feedWrap = root.querySelector('[data-bk-recent-wrap]');
  function ago(ts) {
    var m = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
    return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago';
  }
  function loadRecent() {
    rpc('pc_booking_recent').then(function (rows) {
      if (!rows || !rows.length || total() < 20) { feedWrap.hidden = true; return; }   // 5 purane naam = "koi nahi aa raha" lagta
      feed.innerHTML = rows.map(function (r) {
        var t = tier(r.tier) || TIERS[0];
        return '<div class="cs-fi"><i></i><b>' + esc(r.who) + '</b>' + (r.country ? flagOf(r.country) + '<span class="v2-mut">' + esc(r.country) + '</span>' : '') +
          '<span class="v2-mut">booked</span><b class="cs-t-' + t.c + '">' + t.name + '</b><span class="v2-mut cs-ago">' + ago(r.at) + '</span></div>';
      }).join('');
      feedWrap.hidden = false;
    });
  }

  /* ---------- top inviters ---------- */
  var top = root.querySelector('[data-bk-top]');
  function loadTop() {
    rpc('pc_booking_top_ref').then(function (rows) {
      if (!rows || !rows.length) { top.innerHTML = '<div class="v2-mut">No invites yet – book a seat and share your link to be first.</div>'; return; }
      top.innerHTML = rows.map(function (r, i) {
        return '<div class="bk-tr"><span class="bk-rk">' + (i + 1) + '</span><span>' + esc(r.who) + '</span><b class="tn">' + r.n + ' friend' + (r.n === 1 ? '' : 's') + '</b></div>';
      }).join('');
    });
  }

  if (refInUrl) { var rb = root.querySelector('[data-bk-ref]'); rb.hidden = false; rb.textContent = 'Invited by a friend 🎉 – your seat booking is free.'; }   // 5 Nov: sirf asli invite link pe (purana yaad wala ref nahi)
  drawTables(); drawLadder(); drawMine(); loadCounts(); loadTop(); loadRecent();
  setInterval(function () { loadCounts(); loadRecent(); }, 30000);
})();
