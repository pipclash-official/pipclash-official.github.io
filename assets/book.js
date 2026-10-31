/* PipClash Coming Soon – free seat booking (launch Mon 9 Nov 2026).
   Supabase RPC: pc_booking_counts, pc_book, pc_booking_top_ref (supabase_prelaunch_booking.sql). Account nahi chahiye. */
(function () {
  var SB_URL = 'https://vrcjgxnafmuxfkybtkbz.supabase.co';
  var SB_KEY = 'sb_publishable_hJfAzBCqJKrJkNmLNEsndA_UuFCLH6f';   // public key – website ke liye hi hai
  var LAUNCH = Date.UTC(2026, 10, 9, 12, 30);                      // Mon 9 Nov 2026, 4:30 PM UAE
  var MAX = 100;
  var TIERS = [{ fee: 10, name: 'STARTER', c: 's', note: 'Best to start' },
               { fee: 25, name: 'PRO', c: 'b', note: 'Bigger pool' },
               { fee: 50, name: 'ELITE', c: 'g', note: 'Serious traders' }];
  var KEY = 'pc_bookings_v1';
  var root = document.querySelector('[data-book]');
  if (!root) return;

  var ref = (new URLSearchParams(location.search).get('ref') || '').replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 30);
  try { if (ref) localStorage.setItem('pc_book_ref', ref); else ref = localStorage.getItem('pc_book_ref') || ''; } catch (e) {}
  var counts = null, pick = null;

  function rpc(fn, body) {
    return fetch(SB_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function mine() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function saveMine(b) {
    var a = mine().filter(function (x) { return x.tier !== b.tier; }); a.push(b);
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {}
  }
  function coin(t) { return '<span class="v2-tier ' + t.c + '" aria-hidden="true"><i>' + t.fee + '</i></span>'; }
  function link(code) { return location.origin + location.pathname + '?ref=' + code; }

  /* ---------- countdown ---------- */
  var cd = root.querySelector('[data-bk-cd]');
  function tick() {
    var s = Math.max(0, Math.floor((LAUNCH - Date.now()) / 1000));
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    cd.innerHTML = [[d, 'days'], [h, 'hrs'], [m, 'min'], [x, 'sec']].map(function (p) {
      return '<div class="bk-cdu"><b class="tn">' + (p[0] < 10 ? '0' : '') + p[0] + '</b><span>' + p[1] + '</span></div>';
    }).join('');
  }
  tick(); setInterval(tick, 1000);

  /* ---------- 3 table cards ---------- */
  var grid = root.querySelector('[data-bk-tables]');
  function drawTables() {
    var my = mine();
    grid.innerHTML = TIERS.map(function (t) {
      var n = counts ? Math.min(MAX, counts[t.fee] || 0) : null, full = n !== null && n >= MAX;
      var have = my.filter(function (b) { return b.tier === t.fee; })[0];
      var left = n === null ? '' : full ? 'Full – join the waitlist' : (MAX - n) + ' seats left';
      var btn = have ? '<button class="btn btn-ghost bk-btn" type="button" data-show="' + t.fee + '">✅ Booked – see my seat</button>'
        : '<button class="btn bk-btn" type="button" data-pick="' + t.fee + '">' + (full ? 'Join waitlist' : 'Book free seat') + '</button>';
      return '<div class="v2-card bk-t' + (pick === t.fee ? ' on' : '') + '">' +
        '<div class="bk-th">' + coin(t) + '<div><b class="bk-tn">' + t.name + '</b><div class="v2-mut">$' + t.fee + ' entry · ' + t.note + '</div></div></div>' +
        '<div class="bk-cnt"><b class="tn">' + (n === null ? '–' : n) + '</b><span> / ' + MAX + ' booked</span></div>' +
        '<div class="bk-bar"><i style="width:' + (n === null ? 0 : n) + '%"></i></div>' +
        '<div class="v2-mut bk-left">' + left + '</div>' + btn + '</div>';
    }).join('');
  }
  function loadCounts() {
    return rpc('pc_booking_counts').then(function (c) { if (c) { counts = c; drawTables(); } });
  }

  /* ---------- form ---------- */
  var form = root.querySelector('[data-bk-form]'), done = root.querySelector('[data-bk-done]');
  var err = form.querySelector('[data-bk-err]');
  function openForm(fee) {
    pick = fee; drawTables();
    var t = TIERS.filter(function (x) { return x.fee === fee; })[0];
    form.querySelector('[data-bk-ft]').innerHTML = coin(t) + '<span>Book a free seat – <b>' + t.name + ' $' + t.fee + '</b></span>';
    form.hidden = false; done.hidden = true; err.textContent = '';
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () { form.querySelector('#bk-name').focus(); }, 350);
  }
  grid.addEventListener('click', function (e) {
    var p = e.target.closest('[data-pick]'), s = e.target.closest('[data-show]');
    if (p) openForm(+p.getAttribute('data-pick'));
    if (s) { var fee = +s.getAttribute('data-show'); showDone(mine().filter(function (b) { return b.tier === fee; })[0]); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.querySelector('#bk-name').value.trim(), contact = form.querySelector('#bk-contact').value.trim();
    var country = form.querySelector('#bk-country').value, ok18 = form.querySelector('#bk-18').checked;
    if (name.length < 2) { err.textContent = 'Please write your name.'; return; }
    if (contact.replace(/[^a-zA-Z0-9]/g, '').length < 4) { err.textContent = 'Please write your Telegram @username or WhatsApp number.'; return; }
    if (!ok18) { err.textContent = 'Please confirm you are 18 or older.'; return; }
    var b = form.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Booking…'; err.textContent = '';
    rpc('pc_book', { p_name: name, p_contact: contact, p_country: country, p_tier: pick, p_ref: ref }).then(function (r) {
      b.disabled = false; b.textContent = 'Book my free seat';
      if (!r) { err.textContent = 'Could not book right now – check your internet and try again.'; return; }
      if (!r.ok) { err.textContent = r.err === 'limit' ? 'Too many bookings from this network today.' : 'Please check your details and try again.'; return; }
      var bk = { tier: r.tier, code: r.code, seat: r.seat, waitlist: r.waitlist, name: name };
      saveMine(bk); form.hidden = true; pick = null; showDone(bk, r.already);
      loadCounts(); loadTop();
    });
  });

  function showDone(bk, already) {
    if (!bk) return;
    var t = TIERS.filter(function (x) { return x.fee === bk.tier; })[0], url = link(bk.code);
    var msg = 'I booked my seat for PipClash – daily MT5 trading battle, same $1,000 demo account for everyone, top traders win. Only 100 seats per table, booking is free: ' + url;
    done.innerHTML = '<div class="bk-ok">' + coin(t) + '<div><b>' + (bk.waitlist ? 'You are on the waitlist' : already ? 'You already have this seat' : 'Seat booked!') + ' ✅</b>' +
      '<div class="v2-mut">' + t.name + ' $' + t.fee + ' · ' + (bk.waitlist ? 'waitlist #' : 'seat #') + bk.seat + ' of ' + MAX + ' · Launch Mon 9 Nov, 4:30 PM UAE</div></div></div>' +
      '<p class="bk-p">We will remind you on Telegram/WhatsApp before launch. On launch day you pay the entry in USDT and get your MT5 login.' +
      (bk.waitlist ? ' If a booked seat is not used by 4 PM, it goes to the waitlist.' : '') + '</p>' +
      '<div class="v2-lbl">Invite friends – your link</div>' +
      '<div class="bk-link"><input readonly value="' + esc(url) + '" aria-label="Your invite link"><button class="btn btn-sm" type="button" data-copy>Copy</button></div>' +
      '<div class="bk-share"><a class="btn btn-ghost" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">WhatsApp</a>' +
      '<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent('Book your free PipClash seat – only 100 per table') + '">Telegram</a>' +
      '<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://t.me/pipclash_official">Join our channel</a></div>' +
      '<div class="v2-mut" style="font-size:13px">Top inviters are shown below. Want another table too? Book it above.</div>';
    done.hidden = false;
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  done.addEventListener('click', function (e) {
    if (!e.target.closest('[data-copy]')) return;
    var i = done.querySelector('.bk-link input'); i.select();
    (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).catch(function () { document.execCommand('copy'); });
    e.target.textContent = 'Copied ✓'; setTimeout(function () { e.target.textContent = 'Copy'; }, 1800);
  });

  /* ---------- top inviters ---------- */
  var top = root.querySelector('[data-bk-top]');
  function loadTop() {
    rpc('pc_booking_top_ref').then(function (rows) {
      if (!rows || !rows.length) { top.innerHTML = '<div class="v2-mut">No invites yet – be the first. Share your link after booking.</div>'; return; }
      top.innerHTML = rows.map(function (r, i) {
        return '<div class="bk-tr"><span class="bk-rk">' + (i + 1) + '</span><span>' + esc(r.who) + '</span><b class="tn">' + r.n + ' friend' + (r.n === 1 ? '' : 's') + '</b></div>';
      }).join('');
    });
  }

  if (ref) { var rb = root.querySelector('[data-bk-ref]'); rb.hidden = false; rb.textContent = 'Invited by a friend 🎉 – pick a table below.'; }
  drawTables(); loadCounts(); loadTop();
  setInterval(loadCounts, 30000);
})();
