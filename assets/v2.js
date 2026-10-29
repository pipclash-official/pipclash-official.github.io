/* PipClash v2 – Home battle dashboard + Join (STARTER / PRO / ELITE).
   Data: data/live.js (engine) + Supabase pc_settings / pc_tables (public) + login ho to wallet aur apni entries.
   Inaam = prizes.py ka hi formula (80% pool, top 20%, min $10, 1/rank^1.15) – kabhi fixed vaada nahi. */
(function () {
  'use strict';
  var SB_URL = 'https://vrcjgxnafmuxfkybtkbz.supabase.co';
  var SB_KEY = 'sb_publishable_hJfAzBCqJKrJkNmLNEsndA_UuFCLH6f';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var NAMES = { 10: 'STARTER', 25: 'PRO', 50: 'ELITE' };
  var S = { paid: false, tiers: [], seats: 100, tables: null, sb: null, user: null, bal: null, mine: {} };

  /* ---------- time (UAE) ---------- */
  /* Test ke liye: page?at=11:00 = us UAE time jaisa dikhao (sirf dikhawa, data nahi badalta) */
  var SHIFT = 0, AT = (location.hostname === 'localhost' || location.pathname.indexOf('/v2/') === 0) && /[?&]at=(\d\d):(\d\d)/.exec(location.search);   // test switch – live site pe kabhi nahi
  function now() { return Date.now() + SHIFT; }
  window.PC_NOW = now;      // site.js bhi wahi (test) time le (WW6)
  var DEMO_LIVE = null;
  function D() {
    var dm = window.PC_DEMO;
    if (dm && document.querySelector('[data-v2-arena]')) {   // demo arena = PDF wala leaderboard
      if (!DEMO_LIVE) {
        var t0 = new Date().toISOString().slice(0, 10), L = dm.live;
        DEMO_LIVE = { updated_utc: 'demo', schedule: (window.PC_DATA || {}).schedule,
          battle: { status: 'live', players: L.players, in_profit: L.in_profit, update_no: L.update_no, updates_total: L.updates_total, start_utc: t0 + 'T12:30:00+00:00',
                    next_update_utc: new Date(t0 + 'T' + L.next + ':00+04:00').toISOString() },
          standings: L.rows.map(function (r, i) { return { rank: i + 1, name: r[0], cc: r[1], pnl: r[2] }; }).concat([{ rank: L.you[0], name: dm.user.name, cc: 'in', pnl: L.you[1] }]) };
      }
      return DEMO_LIVE;
    }
    return window.PC_DATA || {};
  }
  function sched() { return D().schedule || { join_open: '10:00', join_close: '16:00', creds_at: '16:25', trade_start: '16:30', trade_end: '19:30', result_at: '21:30', days: [1, 2, 3, 4, 5] }; }
  function uaeNow() {
    var o = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', hour12: false })
      .formatToParts(new Date(now())).forEach(function (p) { o[p.type] = p.value; });
    return { date: o.year + '-' + o.month + '-' + o.day, hm: (o.hour === '24' ? '00' : o.hour) + ':' + o.minute, wd: { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[o.weekday] };
  }
  function uaeDay(iso) { return new Date(new Date(iso).getTime() + 4 * 36e5).toISOString().slice(0, 10); }   // UTC time -> UAE din
  function at(date, hm) { return new Date(date + 'T' + hm + ':00+04:00'); }
  function addDays(ymd, n) { var d = new Date(ymd + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function nextDay(from, skipToday) {   // agla Mon–Fri
    var days = sched().days || [1, 2, 3, 4, 5];
    for (var i = skipToday ? 1 : 0; i < 9; i++) { var d = addDays(from, i), wd = new Date(d + 'T00:00:00Z').getUTCDay() || 7; if (days.indexOf(wd) >= 0) return d; }
    return from;
  }
  function dayName(ymd) {
    var t = uaeNow().date;
    if (ymd === t) return 'Today';
    if (ymd === addDays(t, 1)) return 'Tomorrow';
    return new Date(ymd + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  function hm12(hm) { var p = hm.split(':'), h = +p[0]; return ((h + 11) % 12 + 1) + ':' + p[1] + ' ' + (h < 12 ? 'AM' : 'PM'); }
  function left(to) {
    var s = Math.max(0, Math.floor((to - now()) / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x;
  }
  /* Battle ka abhi ka haal: next | soon | open | closed | live | done */
  function phase() {
    var n = uaeNow(), s = sched(), day = (s.days || [1, 2, 3, 4, 5]).indexOf(n.wd) >= 0;
    if (!day) return { k: 'next', date: nextDay(n.date) };
    if (n.hm < s.join_open) return { k: 'soon', date: n.date, to: at(n.date, s.join_open) };
    if (n.hm < s.join_close) return { k: 'open', date: n.date, to: at(n.date, s.join_close) };
    if (n.hm < s.trade_start) return { k: 'closed', date: n.date, to: at(n.date, s.trade_start) };
    if (n.hm < s.trade_end) return { k: 'live', date: n.date, to: at(n.date, s.trade_end) };
    return { k: 'done', date: n.date, next: nextDay(n.date, true) };
  }

  /* ---------- money + prizes (prizes.py jaisa) ---------- */
  function usd(v, cents) { v = Number(v) || 0; return '$' + v.toLocaleString('en-US', { minimumFractionDigits: cents || v % 1 ? 2 : 0, maximumFractionDigits: cents || v % 1 ? 2 : 0 }); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function paidTable(n, fee) {
    var pool = r2(n * fee * 0.8), k = Math.max(3, Math.floor(n * 0.2));
    k = pool >= 10 ? Math.min(k, Math.floor(pool / 10)) : 0;
    while (k > 0) {
      var w = [], sw = 0, p, sp = 0;
      for (var i = 1; i <= k; i++) { w.push(1 / Math.pow(i, 1.15)); sw += w[i - 1]; }
      p = w.map(function (x) { var v = r2(pool * x / sw); sp += v; return v; });
      if (p[k - 1] >= 10 || k === 1) { p[0] = r2(p[0] + pool - sp); return { pool: pool, rows: p }; }
      k--;
    }
    return { pool: pool, rows: [] };
  }
  function freeTable() {
    var t = D().prize_table;
    if (t && t.rows) return { pool: t.pool, rows: t.rows.map(function (r) { return r.usd; }) };
    return { pool: 420, rows: [200, 100, 50, 10, 10, 10, 10, 10, 10, 10] };
  }

  /* ---------- small UI parts ---------- */
  function chip(label, kind) { return '<span class="v2-chip v2-' + kind + '">' + label + '</span>'; }
  function bar(pct, gold) { return '<div class="v2-bar"><i style="width:' + Math.min(100, pct) + '%' + (gold ? ';background:linear-gradient(90deg,#B8862F,#F2C866)' : '') + '"></i></div>'; }
  function coin(t) { return '<span class="v2-coin" aria-hidden="true">' + t + '</span>'; }
  function tierCoin(fee, sm) {   // table ka premium sikka: $10 silver · $25 sapphire · $50 gold
    return '<span class="v2-tier ' + (fee >= 50 ? 'g' : fee >= 25 ? 'b' : 's') + (sm ? ' sm' : '') + '" aria-hidden="true"><i>' + fee + '</i></span>';
  }

  /* ---------- Supabase (fetch – library sirf login ke liye) ---------- */
  function rest(path, body) {
    return fetch(SB_URL + '/rest/v1/' + path, { method: body ? 'POST' : 'GET', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function loadSettings() {
    return rest('pc_settings?select=key,value').then(function (rows) {
      (rows || []).forEach(function (r) {
        if (r.key === 'paid_entry') { S.paid = r.value === true; window.PC_PAID = S.paid; }
        if (r.key === 'tiers' && Array.isArray(r.value)) S.tiers = r.value.map(Number).sort(function (a, b) { return a - b; });
        if (r.key === 'max_seats') S.seats = +r.value || 100;
      });
      return S.tiers.length ? rest('rpc/pc_tables', {}) : null;      // supabase_tiers.sql na chala ho to null
    }).then(function (t) {
      S.tables = Array.isArray(t) && t.length ? t : null;
      if (window.PC_DEMO) {   // preview demo (demo.js) – PDF wale numbers
        var d = uaeNow().date; S.paid = true; S.demo = true;
        S.tables = window.PC_DEMO.tables.map(function (t) { return { tier: t.tier, day: d, taken: t.taken, max_seats: 100 }; });
      }
    });
  }
  function loadUser() {
    if (window.PC_DEMO) {
      var u = window.PC_DEMO.user, td = uaeNow().date;
      S.user = { id: 'demo' }; S.bal = u.bal; S.kyc = u.kyc; S.profile = { name: u.name.split('-')[0], phone: '777' };
      S.entries = window.PC_DEMO.entries.map(function (e) { return { contest_date: td, status: e.status, tier: e.tier, paid_fee: e.paid_fee, public_name: e.public_name }; });
      S.mine = {}; S.entries.forEach(function (e) { S.mine[e.tier] = e; });
      return Promise.resolve();
    }
    if (!window.supabase) return Promise.resolve();
    S.sb = S.sb || window.PC_SB || (window.PC_SB = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'implicit' } }));   // ek hi client (account/wallet wala)
    return S.sb.auth.getSession().then(function (r) {
      S.user = r.data && r.data.session && r.data.session.user;
      if (!S.user) return;
      return Promise.all([
        S.sb.from('wallets').select('balance').eq('user_id', S.user.id).maybeSingle(),
        S.sb.from('web_entries').select('contest_date,status,tier,paid_fee,public_name').eq('user_id', S.user.id).order('contest_date', { ascending: false }).limit(40)
          .then(function (r) { return r.error ? S.sb.from('web_entries').select('contest_date,status,paid_fee,public_name').eq('user_id', S.user.id).order('contest_date', { ascending: false }).limit(40) : r; }),
        S.sb.from('profiles').select('name,phone').eq('id', S.user.id).maybeSingle(),
        S.sb.from('kyc').select('status').eq('user_id', S.user.id).maybeSingle()
      ]).then(function (x) {
        S.bal = x[0].data ? Number(x[0].data.balance) : 0;
        S.entries = x[1].data || [];
        S.profile = x[2].data;
        S.kyc = x[3].data && x[3].data.status;
        S.mine = {};
        var today = uaeNow().date;
        S.entries.forEach(function (e) { if (e.contest_date >= today && (e.status === 'pending' || e.status === 'joining' || e.status === 'joined')) S.mine[e.tier || 0] = e; });
      });
    }).catch(function () {});
  }

  /* ---------- tables list (paid: 3 tables, free: ek battle) ---------- */
  function tablesData() {
    var b = D().battle || {}, ph = phase();
    if (S.paid && S.tables) {
      return S.tables.map(function (t) {
        var fee = +t.tier, pt = paidTable(t.taken, fee);
        return { fee: fee, name: NAMES[fee] || ('$' + fee), day: t.day, taken: t.taken, max: t.max_seats || S.seats, pool: pt.pool, rows: pt.rows, full: t.day !== ph.date && ph.k === 'open' };
      });
    }
    var ft = freeTable(), todayBattle = b.start_utc && uaeDay(b.start_utc) === uaeNow().date;
    var booking = ph.k === 'open' || ph.k === 'soon' || ph.k === 'next';      // 4 PM ke baad = agle din ki seat
    return [{ fee: 0, name: 'FREE', day: booking ? ph.date : nextDay(ph.date, true), taken: booking && todayBattle ? (b.players || 0) : 0,
              max: null, pool: ft.pool, rows: ft.rows, free: true, live: !booking && todayBattle ? (b.players || 0) : 0 }];
  }

  function battlePool(t) {      // WEB-3: aaj ki chal rahi battle ka pool (pc_tables 4 PM ke baad kal ka deta)
    var P = D().prize_table, b = D().battle || {};
    return P && P.pool != null && b.start_utc && uaeDay(b.start_utc) === uaeNow().date ? +P.pool : t.pool;
  }

  /* ---------- HOME: hero card ---------- */
  function hero() {
    var box = $('[data-v2-hero]'); if (!box) return;
    var ph = phase(), list = tablesData(), t = list[list.length - 1], b = D().battle || {}, s = sched(), st = D().standings || [];
    var elite = t.fee >= 50, head, body, cta;
    var label = t.free ? '<div class="v2-eyebrow">FREE BATTLE</div><div class="v2-h">Daily battle</div>'
      : '<div class="v2-eyebrow' + (elite ? ' gold' : '') + '">' + t.name + (elite ? ' · VIP' : '') + '</div><div class="v2-h">' + usd(t.fee) + ' TABLE</div>';
    var poolBox = function (txt) { return '<div class="v2-mut">' + txt + '</div><div class="v2-pool tn">' + usd(t.pool) + '</div>'; };
    var seats = t.max ? '<div class="v2-row v2-mut"><span class="tn">' + t.taken + ' / ' + t.max + ' players</span><span class="tn">' + Math.max(0, t.max - t.taken) + ' seats left</span></div>' + bar(t.taken / t.max * 100, elite)
      : '<div class="v2-row v2-mut"><span class="tn">' + t.taken + ' players joined</span><span>Entry free</span></div>';
    if (ph.k === 'open' || ph.k === 'soon' || ph.k === 'next') {
      head = ph.k === 'open' ? chip('● ENTRY OPEN', 'up') + '<span class="v2-mut">closes in <b class="tn" data-v2-left>' + left(ph.to) + '</b></span>'
        : chip('NEXT BATTLE', 'acc') + '<span class="v2-mut">' + dayName(ph.date) + ' · ' + hm12(s.trade_start) + ' UAE</span>';
      body = seats + poolBox(t.free ? 'Prize table · only traders in profit win' : 'Prize pool now · grows with every entry');
      cta = '<a class="btn btn-lg v2-btn" href="join.html">' + (ph.k === 'open' ? 'JOIN BATTLE' : 'BOOK A SEAT') + ' →</a>';
    } else if (ph.k === 'closed' || ph.k === 'live') {
      var live = ph.k === 'live';
      head = (live ? chip('● LIVE', 'down') : chip('ENTRY CLOSED', 'gold')) + '<span class="v2-mut">' + (live ? 'time left' : 'starts in') + ' <b class="tn" data-v2-left>' + left(ph.to) + '</b></span>';
      body = '<div class="v2-row v2-mut"><span class="tn">' + (b.players || t.taken) + ' traders</span><span class="tn">' + (live && b.update_no ? 'Round ' + b.update_no + ' / ' + (b.updates_total || 19) : (uaeNow().hm < s.creds_at ? 'Login at ' : 'Login sent ') + hm12(s.creds_at)) + '</span></div>' +
        bar(live && b.updates_total ? (b.update_no || 0) / b.updates_total * 100 : 0) + (t.free ? poolBox('Prize table')
          : '<div class="v2-mut">Final prize pool</div><div class="v2-pool tn">' + usd(battlePool(t)) + '</div>');
      cta = '<a class="btn btn-lg v2-btn" href="arena.html">WATCH LIVE ARENA →</a>';
    } else {
      var top = st[0], final = b.status === 'ended';
      head = (final ? chip('COMPLETED', 'up') : chip('PENDING · RESULT ' + (uaeNow().hm >= s.result_at ? 'SOON' : hm12(s.result_at) + ' UAE'), 'gold')) + '<span class="v2-mut">' + dayName(ph.date) + '</span>';
      body = top ? '<div class="v2-win"><img src="assets/3d/trophy-cup.webp" width="64" height="64" alt=""><div><div class="v2-mut">' + (final ? 'Winner' : 'Leading') + '</div><b style="font-size:17px">' + esc(top.name) + '</b><div class="' + (top.pnl >= 0 ? 'up' : 'down') + ' tn">' + (top.pnl >= 0 ? '▲ +' : '▼ −') + usd(Math.abs(top.pnl), true) + '</div></div></div>'
        : '<div class="v2-mut">No ranked traders today.</div>';
      cta = '<a class="btn btn-lg v2-btn" href="' + (final ? 'winners.html' : 'arena.html') + '">' + (final ? 'SEE RESULTS' : 'SEE STANDINGS') + ' →</a><div class="v2-mut" style="text-align:center;margin-top:8px">Next battle: ' + dayName(ph.next) + ' · ' + hm12(s.trade_start) + ' UAE · <a href="join.html">book a seat</a></div>';
    }
    box.className = 'v2-hero' + (elite ? ' v2-elite' : '');
    box.innerHTML = '<div class="v2-row">' + head + '</div><div class="v2-row" style="margin:12px 0 10px">' + '<div>' + label + '</div>' + (t.free ? coin('$') : tierCoin(t.fee)) + '</div>' + body + '<div style="height:12px"></div>' + cta;
  }

  /* ---------- HOME: battles list ---------- */
  function upcoming() {
    var box = $('[data-v2-tables]'); if (!box) return;
    var list = tablesData(), ul = $('[data-v2-uplbl]'); if (ul) ul.textContent = 'Upcoming battles · ' + dayName(list[0].day);
    if (list[0].free) {
      box.innerHTML = '<a class="v2-trow" href="join.html"><div style="width:74px"><div class="v2-eyebrow">FREE</div><b class="tn">$0</b></div><div style="flex:1"><div class="v2-mut">' + dayName(list[0].day) + ' · ' + hm12(sched().trade_start) + ' UAE</div><div class="v2-mut tn">' + list[0].taken + ' joined · prize table ' + usd(list[0].pool) + '</div></div><svg class="v2-tk" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3z"/><path d="M9 4v16"/></svg></a>' +
        '<div class="v2-soon"><b>Coming soon:</b> STARTER $10 · PRO $25 · ELITE $50 tables. 80% of every entry goes to the winners – no fixed prize.</div>';
      return;
    }
    box.innerHTML = list.map(function (t) {
      return '<a class="v2-trow' + (t.fee >= 50 ? ' gold' : '') + '" href="join.html#t' + t.fee + '">' + tierCoin(t.fee, true) + '<div style="width:64px"><div class="v2-eyebrow' + (t.fee >= 50 ? ' gold' : '') + '">' + t.name + '</div><b class="tn">' + usd(t.fee) + '</b></div>' +
        '<div style="flex:1;min-width:0">' + bar(t.taken / t.max * 100, t.fee >= 50) + '<div class="v2-mut tn" style="margin-top:4px">' + t.taken + '/' + t.max + ' · pool ' + usd(t.pool) + (t.day !== list[0].day ? ' · ' + dayName(t.day) : '') + '</div></div><svg class="v2-tk" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3z"/><path d="M9 4v16"/></svg></a>';
    }).join('');
  }

  /* ---------- HOME: your performance (login ho to) ---------- */
  function perf() {
    var box = $('[data-v2-perf]'); if (!box) return;
    var cell = function (k, v, cls) { return '<div class="v2-stat"><span>' + k + '</span><b class="tn ' + (cls || '') + '">' + v + '</b></div>'; };
    var cell0 = function (k) { return '<div class="v2-stat"><span>' + k + '</span><b class="tn">–</b></div>'; };
    if (!S.user) { box.innerHTML = '<div class="v2-row v2-lbl"><span>Your performance</span><a class="v2-mut" href="account.html#login" style="font-weight:600">Log in to see yours →</a></div><div class="v2-grid2">' + cell0('Last rank') + cell0('P&amp;L') + cell0('Win rate') + cell0('Battles') + '</div>'; return; }
    var R = window.PC_RESULTS, name = (S.entries || []).map(function (e) { return e.public_name; }).filter(Boolean)[0];
    if (!name && S.profile) name = S.profile.name + '-' + String(S.profile.phone || '').slice(-3);
    if (window.PC_DEMO) { var P = window.PC_DEMO.perf;
      box.innerHTML = '<div class="v2-lbl">Your performance</div><div class="v2-grid2">' + cell('Last rank', '#' + P.rank) + cell('P&amp;L', '+' + usd(P.pnl) + ' ▲', 'up') + cell('Win rate', P.win + '%') + cell('Battles', P.battles) + '</div>'; return; }
    if (!R) { box.innerHTML = ''; return; }
    var mine = [];
    (R.list || []).forEach(function (b) { var d = R.detail[String(b.id)]; (d && d.rows || []).forEach(function (r) { if (r.name === name && !r.dq) mine.push(r); }); });
    var tot = mine.reduce(function (a, r) { return a + (r.pnl || 0); }, 0), wins = mine.filter(function (r) { return r.pnl > 0; }).length;
    box.innerHTML = '<div class="v2-lbl">Your performance</div><div class="v2-grid2">' +
      cell('Last rank', mine.length ? '#' + mine[0].rank : '–') + cell('P&amp;L', mine.length ? (tot >= 0 ? '▲ +' : '▼ −') + usd(Math.abs(tot), true) : '–', tot > 0 ? 'up' : (tot < 0 ? 'down' : '')) +
      cell('Win rate', mine.length ? Math.round(wins / mine.length * 100) + '%' : '–') + cell('Battles', mine.length) + '</div>';
  }

  /* ---------- JOIN page ---------- */
  var ERR = { SEATS_FULL: 'This table is full – try the next day.', ALREADY_IN: 'You already have a seat at this table.', INSUFFICIENT_BALANCE: 'Not enough balance.',
              PAID_OFF: 'Paid tables are not open yet.', NO_PROFILE: 'Finish your profile on My account first.', NOTHING_TO_CANCEL: 'Nothing to cancel (already entered).' };
  function errText(e) { var m = (e && e.message) || ''; for (var k in ERR) if (m.indexOf(k) >= 0) return ERR[k]; return 'Something went wrong. Try again.'; }
  function join() {
    var box = $('[data-v2-join]'); if (!box) return;
    var ph = phase(), list = tablesData(), bal = $('[data-v2-bal]');
    if (bal) bal.innerHTML = S.user && S.paid ? coin('₮') + '<b class="tn">' + usd(S.bal || 0, true) + '</b>' : '';
    var note = $('[data-v2-note]');
    if (note) note.innerHTML = list[0].free ? 'Free entry – no deposit, no fee · only traders in profit win · one entry per person (one phone number).'
      : 'No fixed prize · 80% of entries go to the winners · fewer than 5 players = full refund · max ' + S.seats + ' per table.<br>Each table is its own battle with its own leaderboard.';
    var when = $('[data-v2-when]');
    if (when) when.innerHTML = ph.k === 'open' ? 'Entry closes in <b class="tn" data-v2-left>' + left(ph.to) + '</b> · ' + hm12(sched().join_close) + ' UAE'
      : ph.k === 'soon' ? 'Entry opens ' + hm12(sched().join_open) + ' UAE – you can book a seat now'
        : ph.k === 'next' ? 'No battle today – seats below are for ' + dayName(ph.date)
        : 'Today’s entry is closed – seats below are for ' + dayName(nextDay(ph.date, true));
    box.innerHTML = list.map(function (t) {
      var elite = t.fee >= 50, pro = t.fee === 25, mine = S.mine[t.fee];
      var badge = t.free ? chip('FREE', 'up') : (t.taken >= t.max ? chip('FULL', 'down') : elite ? '<span class="v2-chip v2-vip">VIP</span>' : pro ? '<span class="v2-chip v2-pop">POPULAR</span>' : chip('● ENTRY OPEN', 'up'));
      var prizes = t.rows.length ? '1st ' + usd(t.rows[0], true) + (t.rows[1] ? ' · 2nd ' + usd(t.rows[1], true) : '') + (t.rows[2] ? ' · 3rd ' + usd(t.rows[2], true) : '') + ' · up to ' + t.rows.length + ' prizes' : 'Prizes start at 5 players (fewer = full refund)';
      var btn;
      if (t.free) btn = '<a class="btn v2-btn" href="account.html#signup">JOIN FREE</a><a class="btn btn-ghost v2-btn2" href="https://t.me/PipClashBot">or join on Telegram</a>';
      else if (mine) btn = '<div class="v2-row">' + chip('ENTERED · ' + dayName(mine.contest_date), 'acc') + (mine.status === 'pending' ? '<button class="btn btn-ghost btn-sm" data-cancel="' + t.fee + '">Cancel · refund ' + usd(t.fee) + '</button>' : '') + '</div>';
      else if (!S.user) btn = '<a class="btn v2-btn' + (elite ? ' v2-goldbtn' : '') + '" href="account.html#login">LOG IN TO JOIN · ' + usd(t.fee) + '</a>';
      else if ((S.bal || 0) < t.fee) btn = '<a class="btn v2-btn' + (elite ? ' v2-goldbtn' : '') + '" href="deposit.html">ADD ' + usd(t.fee - (S.bal || 0), true) + ' TO JOIN</a><div class="v2-mut" style="text-align:center">Balance ' + usd(S.bal || 0, true) + ' · entry ' + usd(t.fee) + '</div>';
      else btn = '<button class="btn v2-btn' + (elite ? ' v2-goldbtn' : '') + '" data-enter="' + t.fee + '">' + (t.day === uaeNow().date ? 'JOIN BATTLE' : 'BOOK ' + dayName(t.day).toUpperCase()) + ' · ' + usd(t.fee) + '</button>';
      return '<div class="v2-card v2-tcard' + (elite ? ' gold' : pro ? ' pro' : '') + '" id="t' + t.fee + '">' +
        '<div class="v2-row"><div style="display:flex;align-items:center;gap:12px">' + (t.free ? '' : tierCoin(t.fee)) + '<div><div class="v2-eyebrow' + (elite ? ' gold' : pro ? ' acc' : '') + '">' + t.name + '</div><b class="tn" style="font-size:22px">' + (t.free ? 'Free' : usd(t.fee)) + ' <span class="v2-mut" style="font-weight:500">entry</span></b></div></div>' + badge + '</div>' +
        '<div class="v2-grid3"><div><div class="v2-mut">' + (t.free ? 'Prizes' : 'Prize pool') + '</div><b class="tn gold">' + usd(t.pool) + '</b></div><div><div class="v2-mut">Players</div><b class="tn">' + t.taken + '</b></div><div><div class="v2-mut">' + (t.max ? 'Seats left' : 'Day') + '</div><b class="tn">' + (t.max ? Math.max(0, t.max - t.taken) : dayName(t.day)) + '</b></div></div>' +
        (t.max ? bar(t.taken / t.max * 100, elite) : '') + '<div class="v2-mut tn" style="margin:8px 0 12px">' + prizes + '</div>' + btn + '<p class="v2-msg" data-msg="' + t.fee + '" role="status"></p></div>';
    }).join('');
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-enter],[data-cancel]:not([data-cancel=""])'); if (!b || !S.sb) return;   // account.js ka khaali data-cancel uska apna
    var fee = +(b.getAttribute('data-enter') || b.getAttribute('data-cancel')), enter = b.hasAttribute('data-enter'), msg = $('[data-msg="' + fee + '"]');
    if (!enter && !confirm('Cancel your ' + usd(fee) + ' seat? The fee goes back to your wallet.')) return;
    b.disabled = true;
    S.sb.rpc(enter ? 'pc_enter_table' : 'pc_cancel_table', { t: fee }).then(function (r) {
      if (r.error) { b.disabled = false; if (msg) { msg.textContent = errText(r.error); msg.className = 'v2-msg bad'; } return; }
      return loadSettings().then(loadUser).then(function () { renderAll(); var m = $('[data-msg="' + fee + '"]'); if (m) { m.textContent = enter ? 'You’re in ✅ ' + usd(fee) + ' paid from your wallet.' : 'Cancelled – ' + usd(fee) + ' is back in your wallet.'; m.className = 'v2-msg'; } });
    });
  });

  /* ---------- ARENA: bada timer card + neeche "YOU" patti ---------- */
  function myName() {
    if (window.PC_DEMO) return window.PC_DEMO.user.name;
    var n = (S.entries || []).map(function (e) { return e.public_name; }).filter(Boolean)[0];
    return n || (S.profile ? S.profile.name + '-' + String(S.profile.phone || '').slice(-3) : null);
  }
  function arena() {
    var box = $('[data-v2-arena]'); if (!box) return;
    var ph = phase(), b = D().battle || {}, s = sched(), t = tablesData(), pool = battlePool(t[t.length - 1]);
    var today = b.start_utc && uaeDay(b.start_utc) === uaeNow().date, st = b.status;
    var chipH, lab, big, foot = '';
    var nxt = b.next_update_utc ? new Date(b.next_update_utc) : null, waiting = nxt && now() > nxt.getTime() + 60e3;
    if (ph.k === 'live' && today) {
      chipH = chip('● LIVE', 'down') + '<b class="tn">' + (b.players || 0) + ' TRADERS</b>' + (waiting ? chip('⟳ UPDATING', 'acc') : chip('Round ' + (b.update_no || 0) + ' / ' + (b.updates_total || 19), 'acc'));
      lab = 'TIME LEFT'; big = '<span data-v2-left>' + left(ph.to) + '</span>';
      var ft = t[t.length - 1];
      foot = (ft.free ? 'FREE battle · prizes ' : ft.name + ' ' + usd(ft.fee) + ' · pool ') + usd(pool) + ' · ' + (b.in_profit || 0) + ' in profit' + (nxt && !waiting ? ' · next update ' + nxt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dubai' }) : '');
    } else if (ph.k === 'closed') {
      chipH = chip('ENTRY CLOSED', 'gold') + '<b class="tn">' + (b.players || 0) + ' TRADERS</b>';
      lab = 'STARTS IN'; big = '<span data-v2-left>' + left(ph.to) + '</span>'; foot = 'MT5 logins are sent at ' + hm12(s.creds_at) + ' UAE';
    } else if (ph.k === 'done' && today && (st === 'review' || st === 'live')) {
      chipH = chip('PENDING', 'gold') + '<b class="tn">' + (b.players || 0) + ' TRADERS</b>';
      var late = uaeNow().hm >= s.result_at;
      lab = late ? 'FINAL RESULT' : 'FINAL RESULT AT'; big = late ? 'Soon' : hm12(s.result_at);
      foot = late ? 'Checks are taking a little longer – the final result is coming soon.' : 'Trades are checked before prizes are final.';
    } else if (ph.k === 'done' && today) {
      chipH = chip('COMPLETED', 'up') + '<b class="tn">' + (b.players || 0) + ' TRADERS</b>';
      lab = 'BATTLE COMPLETE'; big = 'Final'; foot = '<a href="winners.html">See the full result →</a>';
    } else {
      chipH = ph.k === 'open' ? chip('● ENTRY OPEN', 'up') : chip('NEXT BATTLE', 'acc');
      lab = 'TRADING STARTS IN'; var start = at(ph.k === 'done' ? ph.next : ph.date, s.trade_start);
      big = '<span data-v2-start>' + left(start) + '</span>'; foot = '<a href="join.html">Join the next battle →</a>';
      box.setAttribute('data-start', start.getTime());
    }
    var pct = ph.k === 'live' && b.updates_total ? (b.update_no || 0) / b.updates_total * 100 : (ph.k === 'done' ? 100 : 0);
    box.innerHTML = '<div class="v2-row">' + chipH + '</div><div style="text-align:center;margin-top:12px"><div class="v2-eyebrow">' + lab + '</div>' +
      '<div class="v2-clock tn">' + big + '</div>' + bar(pct) + '<div class="v2-mut tn" style="margin-top:6px">' + foot + '</div></div>';
    // YOU patti: login ho aur naam standings mein ho
    var you = $('[data-v2-you]'), nm = S.user && myName(), rows = D().standings || [], me = null;
    rows.forEach(function (r) { if (r.name === nm) me = r; });
    if (you) {
      you.hidden = !me;
      if (me) you.innerHTML = '<b>#' + me.rank + '</b><b style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">YOU · ' + esc(me.name) + '</b><b class="tn">' +
        (me.pnl >= 0 ? '+' : '−') + usd(Math.abs(me.pnl), true) + ' ' + (me.pnl > 0 ? '▲' : me.pnl < 0 ? '▼' : '') + '</b>';
    }
  }

  /* ---------- MY BATTLE (account): aaj ke 4 kadam + pichhli battles ---------- */
  function myRows() {   // results archive mein meri har battle (naya pehle)
    var R = window.PC_RESULTS, nm = myName(), out = [];
    if (!R || !nm) return out;
    (R.list || []).forEach(function (b) { var d = R.detail[String(b.id)]; (d && d.rows || []).forEach(function (r) { if (r.name === nm) out.push({ b: b, r: r }); }); });
    return out;
  }
  function steps() {
    var box = $('[data-v2-steps]'); if (!box) return;
    if (!S.user) { box.innerHTML = ''; return; }
    var ph = phase(), s = sched(), today = uaeNow().date, mineToday = (S.entries || []).some(function (e) { return e.contest_date === today && (e.status === 'pending' || e.status === 'joining' || e.status === 'joined'); });
    var hm = uaeNow().hm, done = [mineToday, hm >= s.join_close, hm >= s.creds_at, hm >= s.trade_start];
    var sh = function (hm) { return hm12(hm).replace(':00', ''); };      // '4 PM' – phone pe ek line (WW10)
    var lab = ['Entered', 'Closed ' + sh(s.join_close), 'Login ' + sh(s.creds_at), 'Trade ' + sh(s.trade_start)];
    if (!mineToday) { box.innerHTML = ''; return; }
    var mine = (S.entries || []).filter(function (e) { return e.contest_date === today && (e.status === 'pending' || e.status === 'joining' || e.status === 'joined'); });
    var pills = mine.map(function (e, i) { var f = e.tier || Number(e.paid_fee) || 0; return '<span class="v2-chip ' + (i ? 'v2-out' : 'v2-pop') + '">' + (f ? (NAMES[f] || '') + ' ' + usd(f) : 'FREE BATTLE') + '</span>'; }).join('');
    box.innerHTML = '<div class="v2-row" style="margin-bottom:10px"><span class="v2-row" style="gap:6px">' + pills + '</span>' + chip(mine.some(function (e) { return e.status === 'joined'; }) ? 'ENTERED' : 'BOOKED', 'acc') + '</div>' +
      '<div class="v2-steps">' + lab.map(function (l, i) { return '<div class="' + (done[i] ? 'on' : '') + '"><i></i><span>' + l + '</span></div>'; }).join('') + '</div>' +
      (ph.k === 'live' ? '<div class="v2-row" style="margin-top:8px">' + chip('● LIVE', 'down') + '<a href="arena.html">Watch your rank →</a></div>' : '');
  }
  function myStats() {   // #19: trader dashboard – sirf apni asli final battles se
    var box = $('[data-v2-stats]'); if (!box || window.PC_DEMO) return;
    var rows = myRows().filter(function (x) { return !x.r.dq; }); box.hidden = !rows.length; if (!rows.length) return;
    var pn = rows.map(function (x) { return +x.r.pnl || 0; }), wins = pn.filter(function (v) { return v > 0; });
    var best = rows.reduce(function (a, x) { return !a || x.r.pnl > a.r.pnl ? x : a; }, null);
    var prize = rows.reduce(function (a, x) { return a + (+x.r.prize || 0); }, 0), sum = pn.reduce(function (a, v) { return a + v; }, 0);
    var sg = function (v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + usd(Math.abs(v), true); };
    var cell = function (k, v, c) { return '<div class="v2-stat"><span>' + k + '</span><b class="tn ' + (c || '') + '">' + v + '</b></div>'; };
    // roz ka P&L calendar – pichhle 5 hafte (Mon–Fri), har din ek dabba
    var byDay = {}; rows.forEach(function (x) { var k = x.b.date; byDay[k] = (byDay[k] || 0) + (+x.r.pnl || 0); });
    var cal = '', now = new Date(Date.now() + 4 * 36e5), names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (var i = 34; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 864e5), dw = d.getUTCDay(); if (dw === 0 || dw === 6) continue;
      var key = names[dw] + ' ' + ('0' + d.getUTCDate()).slice(-2) + ' ' + mon[d.getUTCMonth()], v = byDay[key];
      cal += '<i class="' + (v == null ? '' : v > 0 ? 'w' : v < 0 ? 'l' : 'z') + '" title="' + key + (v == null ? '' : ' · ' + sg(v)) + '"></i>';
    }
    box.innerHTML = '<div class="v2-lbl">Your stats</div><div class="v2-grid2">' +
      cell('Battles', rows.length) + cell('Win rate', Math.round(wins.length / rows.length * 100) + '%') +
      cell('Total P&amp;L', sg(sum), sum > 0 ? 'up' : sum < 0 ? 'down' : '') + cell('Avg per battle', sg(sum / rows.length), sum > 0 ? 'up' : sum < 0 ? 'down' : '') +
      cell('Best day', best ? sg(best.r.pnl) : '–', best && best.r.pnl > 0 ? 'up' : '') + cell('Prizes won', usd(prize), prize ? 'gold' : '') + '</div>' +
      '<div class="v2-lbl" style="margin-top:12px">Last 5 weeks</div><div class="v2-cal">' + cal + '</div>' +
      '<div class="v2-mut" style="font-size:12px;margin-top:6px"><i class="v2-key w"></i> profit · <i class="v2-key l"></i> loss · <i class="v2-key"></i> no battle</div>';
  }
  function past() {
    myStats();
    var box = $('[data-v2-past]'); if (!box) return;
    if (window.PC_DEMO) { box.hidden = false;
      box.innerHTML = '<div class="v2-lbl">Past battles</div>' + window.PC_DEMO.past.map(function (p) {
        var up = p[3] >= 0; return '<div class="v2-past"><span>' + p[0] + '</span><span class="tn">$' + p[1] + '</span><span class="tn">#' + p[2] + '</span><span class="r tn ' + (up ? 'up' : 'down') + '"><b>' + (up ? '+' : '−') + usd(Math.abs(p[3])) + ' ' + (up ? '▲' : '▼') + '</b><small>' + (up ? '+' : '−') + Math.abs(p[4]).toFixed(1) + '%</small></span></div>'; }).join('');
      return; }
    var rows = myRows(); box.hidden = !rows.length;
    if (!rows.length) return;
    box.innerHTML = '<div class="v2-lbl">Past battles</div>' +
      rows.slice(0, 10).map(function (x) {
        var r = x.r, up = r.pnl > 0, dn = r.pnl < 0;
        var pc = r.pct != null ? r.pct : (r.pnl || 0) / 10, day = String(x.b.date).replace(/^\w+ /, '');
        return '<div class="v2-past"><span>' + esc(day) + '</span><span class="tn">' + (x.b.fee ? usd(x.b.fee) : 'Free') + '</span><span class="tn">' + (r.dq ? 'DQ' : '#' + r.rank) + '</span><span class="r tn ' + (up ? 'up' : dn ? 'down' : '') + '">' +
          (r.dq ? '–' : '<b>' + (up ? '+' : dn ? '−' : '') + usd(Math.abs(r.pnl || 0), true) + '</b><small>' + (up ? '▲ +' : dn ? '▼ −' : '') + Math.abs(pc).toFixed(1) + '%</small>') +
          (r.prize ? '<small class="gold">prize ' + usd(r.prize) + '</small>' : '') + '</span></div>';
      }).join('');
  }

  /* ---------- RESULTS: winner ceremony (sabse nayi battle) ---------- */
  function ceremony() {
    var box = $('[data-v2-ceremony]'); if (!box) return;
    var h1 = $('[data-res-title]'); if (h1) h1.parentElement.parentElement.hidden = !/[?&]id=/.test(location.search);   // naam top bar mein hai
    var R = window.PC_RESULTS;
    if (window.PC_DEMO) {   // PDF: YOU FINISHED #3 · PRO $25
      var X = window.PC_DEMO.result, pt = paidTable(X.traders, X.fee), rk = { 1: 'g', 2: 's', 3: 'b' };
      box.innerHTML = '<div class="v2-cere"><div class="v2-spark"></div>' + chip('COMPLETED', 'up') + '<div class="v2-eyebrow gold" style="margin-top:8px">BATTLE COMPLETE · ' + X.table + '</div>' +
        '<img src="assets/3d/trophy-cup.webp" width="110" height="110" alt="" class="v2-cere-cup"><div class="v2-mut">YOU FINISHED</div><div class="v2-cere-rank">#' + X.you + '</div>' +
        '<div class="v2-grid3"><div class="v2-stat"><span>P&amp;L</span><b class="tn up">+' + usd(X.pnl, true) + '</b></div><div class="v2-stat"><span>ROI</span><b class="tn up">▲ +' + (X.pnl / 10).toFixed(2) + '%</b></div>' +
        '<div class="v2-stat" style="border-color:#D6A84F"><span>Prize</span><b class="tn gold">' + usd(pt.rows[X.you - 1], true) + '</b></div></div>' +
        '<div class="v2-mut" style="margin-top:8px">' + chip('PENDING', 'gold') + ' added to wallet after ID check</div></div>' +
        '<div class="v2-card" style="padding:8px 10px;margin-top:12px">' + X.top.map(function (t, i) { return '<div class="v2-lrow' + (t[0] === 'YOU' ? ' me' : '') + '"><span class="v2-rk ' + rk[i + 1] + '">' + (i + 1) + '</span><b class="v2-ln">' + t[0] + '</b><span class="v2-lp tn up"><b>+' + usd(t[1], true) + ' ▲</b><small>+' + (t[1] / 10).toFixed(1) + '%</small></span><b class="tn gold" style="width:64px;text-align:right">' + usd(pt.rows[i], true) + '</b></div>'; }).join('') + '</div>' +
        '<div class="v2-mut tn" style="text-align:center;margin:10px 0">' + X.traders + ' traders · pool ' + usd(pt.pool) + ' · ' + pt.rows.length + ' winners</div><a class="btn btn-ghost v2-btn2" href="winners.html">VIEW FULL LEADERBOARD</a>';
      return;
    }
    if (!R || !R.list || !R.list.length || /[?&]id=/.test(location.search)) { box.innerHTML = ''; return; }
    var b = R.list[0], d = R.detail[String(b.id)] || { rows: [] }, nm = S.user && myName(), me = null, ranked = d.rows.filter(function (r) { return !r.dq; });
    ranked.forEach(function (r) { if (r.name === nm) me = r; });
    var w = ranked[0], hero = me || (w && w.pnl > 0 ? w : null);
    if (!hero) { box.innerHTML = ''; return; }
    var pct = hero.pct != null ? hero.pct : hero.pnl / 10;
    box.innerHTML = '<div class="v2-cere"><div class="v2-spark"></div>' + chip('COMPLETED', 'up') +
      '<div class="v2-eyebrow gold" style="margin-top:8px">BATTLE COMPLETE · ' + esc(b.date).toUpperCase() + ' · #' + b.id + '</div>' +
      '<img src="assets/3d/trophy-cup.webp" width="110" height="110" alt="" class="v2-cere-cup">' +
      '<div class="v2-mut">' + (me ? 'YOU FINISHED' : 'WINNER') + '</div><div class="v2-cere-rank">' + (me ? '#' + me.rank : esc(hero.name)) + '</div>' +
      '<div class="v2-grid3"><div class="v2-stat"><span>P&amp;L</span><b class="tn ' + (hero.pnl >= 0 ? 'up' : 'down') + '">' + (hero.pnl >= 0 ? '+' : '−') + usd(Math.abs(hero.pnl), true) + '</b></div>' +
      '<div class="v2-stat"><span>ROI</span><b class="tn ' + (pct >= 0 ? 'up' : 'down') + '">' + (pct >= 0 ? '▲ +' : '▼ −') + Math.abs(pct).toFixed(2) + '%</b></div>' +
      '<div class="v2-stat" style="border-color:#D6A84F"><span>Prize</span><b class="tn gold">' + (hero.prize ? usd(hero.prize) : '–') + '</b></div></div>' +
      (me && me.prize ? '<div class="v2-mut" style="margin-top:8px">' + chip('PENDING', 'gold') + ' paid after a quick ID check</div>' : '') +
      '</div>' +
      '<div class="v2-card" style="padding:8px 10px;margin-top:12px">' + ranked.slice(0, 3).map(function (r) {
        var p = r.pnl || 0, pc = r.pct != null ? r.pct : p / 10;
        return '<div class="v2-lrow' + (r.name === nm ? ' me' : '') + '"><span class="v2-rk ' + (p > 0 && { 1: 'g', 2: 's', 3: 'b' }[r.rank] || '') + '">' + r.rank + '</span><b class="v2-ln">' + esc(r.name === nm ? 'YOU' : r.name) + '</b>' +
          '<span class="v2-lp tn ' + (p > 0 ? 'up' : p < 0 ? 'down' : '') + '"><b>' + (p < 0 ? '−' : '+') + usd(Math.abs(p), true) + '</b><small>' + (p > 0 ? '▲ +' : p < 0 ? '▼ −' : '') + Math.abs(pc).toFixed(1) + '%</small></span>' +
          '<b class="tn gold" style="width:56px;text-align:right">' + (r.prize ? usd(r.prize) : '–') + '</b></div>';
      }).join('') + '</div>' +
      '<div class="v2-mut tn" style="text-align:center;margin:10px 0">' + b.traders + ' traders · ' + (function (k) { return k + (k === 1 ? ' winner' : ' winners'); })(ranked.filter(function (r) { return r.prize; }).length) + ' · prizes ' +
        usd(ranked.reduce(function (a, r) { return a + (r.prize || 0); }, 0)) + '</div>' +
      '<a class="btn btn-ghost v2-btn2" href="winners.html?id=' + b.id + '">VIEW FULL LEADERBOARD</a>';
  }

  /* ---------- ARENA leaderboard (PDF: medal · desh · naam · +$ ▲ %) + table tabs ---------- */
  function leaderboard() {
    var box = $('[data-v2-lb]'); if (!box) return;
    var rows = D().standings || [], dq = D().disqualified || [], q = (($('#v2-find') || {}).value || '').trim().toLowerCase(), nm = S.user && myName();
    var medal = { 1: 'g', 2: 's', 3: 'b' };
    var list = rows.filter(function (r) { return !q || r.name.toLowerCase().indexOf(q) >= 0; });
    box.innerHTML = (list.length ? list.map(function (r) {
      var p = r.pnl || 0, pct = p / 10, up = p > 0, dn = p < 0;
      return '<div class="v2-lrow' + (r.rank === 1 && p > 0 ? ' first' : '') + (r.name === nm ? ' me' : '') + '"><span class="v2-rk ' + (p > 0 && medal[r.rank] || '') + '">' + r.rank + '</span>' +
        (r.cc ? '<span class="v2-cc">' + esc(r.cc.toUpperCase()) + '</span>' : '') + '<b class="v2-ln">' + esc(r.name) + (r.move > 0 ? ' <span class="up" style="font-size:11px">▲' + r.move + '</span>' : '') + '</b>' +
        '<span class="v2-lp tn ' + (up ? 'up' : dn ? 'down' : '') + '"><b>' + (dn ? '−' : '+') + usd(Math.abs(p), true) + '</b><small>' + (up ? '▲ +' : dn ? '▼ −' : '') + Math.abs(pct).toFixed(1) + '%</small></span></div>';
    }).join('') : '<div class="v2-mut">' + (q ? 'No trader with that name.' : 'Standings appear when the battle starts at ' + hm12(sched().trade_start) + ' UAE.') + '</div>') +
      (dq.length && !q ? '<details class="v2-dq"><summary>Disqualified (' + dq.length + ')</summary>' + dq.map(function (d) { return '<div class="v2-mut">' + esc(d.name) + '</div>'; }).join('') + '</details>' : '');
    var tabs = $('[data-v2-tabs]');
    if (tabs) {
      var t = tablesData(); tabs.hidden = !S.paid || !S.tables;
      if (!tabs.hidden) tabs.innerHTML = t.map(function (x, i) { return '<span class="v2-chip ' + (i === t.length - 1 ? 'v2-vip' : 'v2-acc') + '">' + usd(x.fee) + (x.fee >= 50 ? ' ELITE' : '') + '</span>'; }).join('');
    }
  }
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'v2-find') leaderboard(); });

  /* ---------- har page: top bar balance chip + menu profile / balance ---------- */
  function shell() {
    var chipBox = $('[data-v2-chip]'), me = $('[data-v2-me]'), mb = $('[data-v2-mbal]'), lo = $('[data-v2-logout]');
    if (!S.user) return;
    var nm = myName() || (S.profile && S.profile.name) || 'Trader';
    if (chipBox) chipBox.innerHTML = '<a class="v2-balchip" href="wallet.html" aria-label="Wallet balance">' + coin('₮') + '<b class="tn">' + usd(S.bal || 0, true) + '</b></a>';
    if (me) me.innerHTML = '<div class="v2-av">' + esc(nm.charAt(0).toUpperCase()) + '</div><div><b>' + esc(nm) + '</b><div class="v2-mut">' +
      (S.kyc === 'approved' ? 'ID verified <span class="up">✓</span>' : '<a href="wallet.html">Verify ID</a>') + '</div></div>';
    if (mb) { mb.hidden = false; mb.innerHTML = '<div class="v2-row"><div><div style="font-size:11px;letter-spacing:.14em;color:#cfe0ff">AVAILABLE</div><b class="tn" style="font-size:20px">' + usd(S.bal || 0, true) + '</b></div><a class="v2-depbtn" href="deposit.html">+ DEPOSIT</a></div>'; }
    if (lo && !lo.innerHTML) { lo.innerHTML = ' · <button type="button" class="v2-lo">Log out</button>'; lo.firstElementChild.addEventListener('click', function () { S.sb.auth.signOut().then(function () { location.href = 'index.html'; }); }); }
  }

  function referMode() {   // menu ka "Refer & earn" = sirf refer wala hissa (PDF mein alag screen)
    if (!$('[data-ref-card]')) return;
    var on = location.hash === '#refer', t = $('.v2-ttl');
    document.body.classList.toggle('v2-refer-only', on);
    if (t) t.textContent = on ? 'Refer & earn' : 'My battle';
    document.querySelectorAll('.sn-it').forEach(function (a) { var h = a.getAttribute('href'); if (h === 'account.html' || h === 'account.html#refer') { if ((h === 'account.html#refer') === on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); } });
  }
  window.addEventListener('hashchange', referMode);

  function demoStrip() {
    if (!window.PC_DEMO || $('.v2-demo')) return;
    var d = document.createElement('div'); d.className = 'v2-demo';
    d.innerHTML = 'DEMO · sample numbers like the design PDF · <a href="?demo=0">exit demo</a>';
    document.body.insertBefore(d, document.body.firstChild);
  }

  var LOAD_FAIL = false;
  function paidToggle() {   // WW4: data-free / data-paid hamesha pc_settings (asli switch) se
    document.querySelectorAll('[data-free]').forEach(function (el) { el.hidden = S.paid; });
    document.querySelectorAll('[data-paid]').forEach(function (el) { el.hidden = !S.paid; });
  }
  function renderAll() {
    if (!window.PC_DATA && !window.PC_DEMO && !LOAD_FAIL) { shell(); join(); return; }   // live.js aane tak 'Loading…' – galat halat ki jhalak nahi
    demoStrip(); referMode(); paidToggle(); shell(); hero(); upcoming(); perf(); join(); arena(); leaderboard(); steps(); past(); ceremony(); }
  function tick() {
    var ph = phase(), a = $('[data-v2-arena]');
    document.querySelectorAll('[data-v2-left]').forEach(function (el) { if (ph.to) el.textContent = left(ph.to); });
    document.querySelectorAll('[data-v2-start]').forEach(function (el) { if (a && a.getAttribute('data-start')) el.textContent = left(+a.getAttribute('data-start')); });
  }
  var last = '';
  function watch() {   // site.js har minute naya live.js laata hai – badla to dobara banao, aur phase badla to bhi
    var k = (D().updated_utc || '') + phase().k + (D()._tier || '');
    if (k !== last) { last = k; renderAll(); }
    tick();
  }
  function results() {
    if (!$('[data-v2-perf],[data-v2-past],[data-v2-ceremony]') || window.PC_RESULTS) return Promise.resolve();
    return new Promise(function (ok) { var s = document.createElement('script'); s.src = (location.pathname.indexOf('/v2/') === 0 ? '/data/' : 'data/') + 'results.js?t=' + Date.now(); s.onload = s.onerror = function () { s.remove(); ok(); }; document.head.appendChild(s); });
  }
  var DM = window.PC_DEMO || null;
  if (AT || DM) { var u0 = uaeNow(), hm0 = AT ? AT[1] + ':' + AT[2] : DM.at; SHIFT = at(u0.date, hm0) - Date.now(); }
  document.addEventListener('DOMContentLoaded', function () {
    renderAll();
    Promise.all([loadSettings(), loadUser(), results()]).then(renderAll);
    setInterval(watch, 1000);
    setTimeout(function () { if (!window.PC_DATA) { LOAD_FAIL = true; renderAll(); } }, 12000);   // net/data fail
    setInterval(function () { loadSettings().then(renderAll); }, 60000);
  });
})();
