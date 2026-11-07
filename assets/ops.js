/* PipClash Ops – naya back office (5 Nov). admin.js ke saare purane kaam (Payments, Battles, Players, Support, Settings,
   Team, Log) waise hi chalte hain; yeh file naye sections jodti hai: Dashboard v2, Influencers (partner engine),
   Bookings, Command center. ?demo=1 (sirf laptop/localhost) = nakli data se design dikhana – login nahi. */
(function () {
  'use strict';
  var DEMO = /[?&]demo=1/.test(location.search) && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var A = window.PC_ADMIN;
  var root = document.querySelector('[data-admin]');
  if (!root) return;
  var RANGE = 30, TAB = 'dash';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (v) { v = Number(v) || 0; return (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var pct = function (v) { return Math.round((Number(v) || 0) * 100) + '%'; };
  var day = function (d) { return new Date(d).toISOString().slice(0, 10); };
  var uae = function (iso) { return iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }) : '–'; };
  var $ = function (s, el) { return (el || root).querySelector(s); };
  var pane = function () { return $('[data-a-pane]'); };
  var TITLES = { dash: 'Dashboard', command: 'Command center', influencers: 'Influencers', bookings: 'Bookings', battle: 'Battles',
                 players: 'Players', money: 'Payments & KYC', support: 'Support', reports: 'Reports', settings: 'Settings', team: 'Team', log: 'Activity log',
                 today: "Today's tables", risk: 'Risk & fraud', daily: 'Daily hisaab',
                 campaigns: 'Campaigns', creatives: 'Creatives', competitions: 'Competitions', broadcast: 'Broadcast' };

  /* ---------- demo data (sirf design dikhane ke liye) ---------- */
  function demoData() {
    var now = Date.now(), D = 864e5, rnd = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
    var cc = ['India', 'Pakistan', 'United Arab Emirates', 'Nigeria', 'South Africa', 'United States', 'Egypt', 'Kenya'];
    var refs = ['', '', 'IG_BIO', 'TG_JOIN', 'EMAIL', 'NILESH', 'TRADERSEMPIRES', 'TEAM_RONAK', 'CS_ROBOTIX'];
    var bookings = [], profiles = [], deps = [], wds = [], ents = [];
    for (var i = 0; i < 260; i++) {
      var t = new Date(now - rnd(0, 34) * D - rnd(0, 86e6)).toISOString();
      bookings.push({ name: 'Trader ' + (i + 1), contact: '+97150' + rnd(1000000, 9999999), country: cc[rnd(0, 7)], tier: [10, 10, 10, 25, 50][rnd(0, 4)], code: 'BK' + (1000 + i), ref: refs[rnd(0, 8)] || null, waitlist: false, created_at: t });
      if (i % 2 === 0) profiles.push({ id: 'u' + i, created_at: t, partner: ['NILESH', 'TRADERSEMPIRES', null, null][rnd(0, 3)] });
    }
    for (i = 0; i < 90; i++) deps.push({ amount: [10, 25, 50, 100, 20][rnd(0, 4)], status: i % 9 === 0 ? 'pending' : 'approved', created_at: new Date(now - rnd(0, 30) * D).toISOString(), network: rnd(0, 1) ? 'TRC20' : 'BEP20' });
    for (i = 0; i < 25; i++) wds.push({ amount: rnd(10, 300), status: i % 6 === 0 ? 'pending' : 'paid', created_at: new Date(now - rnd(0, 30) * D).toISOString() });
    for (i = 0; i < 180; i++) ents.push({ contest_date: day(now - rnd(0, 30) * D), tier: [10, 25, 50][rnd(0, 2)], paid_fee: [10, 25, 50][rnd(0, 2)], refunded: false, status: 'joined', user_id: 'u' + rnd(0, 120) });
    return {
      bookings: bookings, profiles: profiles, deposits: deps, withdrawals: wds, entries: ents,
      kycPending: 3, supportOpen: 2, wallets: 4210.5, claims: 1,
      battles: [{ contest_id: 41, name: 'Daily 2026-11-09 $10', status: 'live', players: 64, updated_at: new Date(now - 6e4).toISOString() }],
      partners: [
        { code: 'NILESH', name: 'Nilesh Trader', contact: '@nilesh_traderr', platform: 'Instagram', followers: 11300, country: 'UAE', pay_to: '0x7a…91', active: true, pct: 0.05, boost_pct: 0.05, boost_days: 0, started_on: '2026-11-06', rate_now: 0.05, bookings: 38, players: 21, entries: 54, fees: 860, earned: 43, paid: 20, due: 23, last_paid: new Date(now - 3 * D).toISOString() },
        { code: 'TRADERSEMPIRES', name: 'Traders Empires', contact: '@traders.empires', platform: 'Instagram', followers: 35500, country: 'India', pay_to: '', active: true, pct: 0.05, boost_pct: 0.05, boost_days: 0, started_on: '2026-11-07', rate_now: 0.05, bookings: 61, players: 33, entries: 70, fees: 1140, earned: 57, paid: 0, due: 57, last_paid: null },
        { code: 'COACHAHMAD', name: 'Coach Ahmad', contact: '@coach.ahmadayoush', platform: 'Telegram', followers: 5300, country: 'UAE', pay_to: 'TQx…k2', active: true, pct: 0.05, boost_pct: 0.05, boost_days: 0, started_on: '2026-10-20', rate_now: 0.05, bookings: 12, players: 8, entries: 15, fees: 230, earned: 11.5, paid: 11.5, due: 0, last_paid: new Date(now - D).toISOString() }
      ]
    };
  }

  function demoOps() {   // 6 Nov: engine feed (pc_ops) ka nakli roop – sirf design
    var t = function (id, tier, bal, pl, st) { return { id: id, no: '#001', tier: tier, balance: bal, status: st, players: pl, active: pl - 2, dq: 2, in_profit: Math.round(pl * 0.4),
      low_trades_in_profit: 3, fees: pl * tier, pool: pl * tier * 0.8, platform: pl * tier * 0.2, prizes_paid: 0, flags: { start_balance: 1, robot: 1 },
      top: [{ user: 'Arjun M.', pnl: bal * 0.12, pct: 12, trades: 5 }, { user: 'Lina K.', pnl: bal * 0.08, pct: 8, trades: 2 }, { user: 'Omar F.', pnl: bal * 0.05, pct: 5, trades: 4 }] }; };
    return {
      pools: { by_balance: { '1000': { free: 199, assigned: 50 }, '2500': { free: 34, assigned: 50 }, '5000': { free: 22, assigned: 50 } },
               targets: { '1000': { target: 200, low: 150 }, '2500': { target: 120, low: 80 }, '5000': { target: 110, low: 70 } }, _at: new Date().toISOString() },
      today: { date: day(Date.now()), tables: [t(17, 10, 1000, 50, 'live'), t(18, 25, 2500, 50, 'live'), t(19, 50, 5000, 50, 'live')],
               msgs: { rules: ['$10 table 4:15 rules msg: 12/50 players ko Telegram pe gaya'], remind: ['$10 table 7 PM yaad: 3 profit wale – 2 ko Telegram msg gaya'] }, _at: new Date().toISOString() },
      flags: { items: [{ cid: 19, user: 'Dost50-07', kind: 'start_balance', detail: 'start balance 1000 (table ka 5000)', time: new Date().toISOString(), status: 'active' },
                       { cid: 18, user: 'Dost25-11', kind: 'robot', detail: 'EXPERT deals 14', time: new Date().toISOString(), status: 'disqualified' }] },
      daily: { rows: [{ id: 16, no: 'T16', tier: 0, status: 'ended', start_utc: new Date(Date.now() - 864e5).toISOString(), players: 12, dq: 1, in_profit: 5, fees: 0, pool: 0, platform: 0, prizes_paid: 0 }] },
      risk: { dq: [{ cid: 18, user: 'Dost25-11', why: 'robot: EXPERT deals' }], flags: [{ cid: 19, login: '750000007', kind: 'mirror', detail: 'opposite trades 20s' }], big: [{ cid: 17, user: 'Arjun M.', pnl: 320, pct: 32, trades: 6 }] },
      fraud: { profiles: 140, same_phone: [{ phone_end: '4126', accounts: 2 }], self_referral: 0 },
      server: { engine: '1', mt5: '6', disk_gb: '168', auto_last: '[auto 06 Nov 16:40 UAE] round 2 ok', backup_last: '06 Nov 23:30 backup -> Hostinger: OK [locked]', watchdog_last: 'ok', _at: new Date().toISOString() },
      ads: { currency: 'INR', today: { total: { spend: 195, impressions: 886, clicks: 17, lpv: 11 } }, maximum: { total: { spend: 856, impressions: 8565, clicks: 108, lpv: 56 } },
             status: [{ ad: 'Ad2 Tweet static', status: 'ACTIVE', daily_budget: 790 }] }
    };
  }

  /* ---------- data (asli: Supabase, admin RLS) ---------- */
  var CACHE = null, CACHE_AT = 0;
  function load(force) {
    if (DEMO) { if (!CACHE) { CACHE = demoData(); CACHE.ops = demoOps(); CACHE.sources = [{ source: 'unknown (purani)', n: 18 }, { source: 'google', n: 1 }, { source: 'meta_ad', n: 0 }]; } return Promise.resolve(CACHE); }
    if (CACHE && !force && Date.now() - CACHE_AT < 60e3) return Promise.resolve(CACHE);
    var sb = A.sb, q = function (p) { return p.then(function (r) { return r.error ? { error: r.error } : r; }, function (e) { return { error: e }; }); };
    return Promise.all([
      q(sb.rpc('pc_admin_bookings')), allRows('profiles', 'id,created_at,partner'),
      allRows('deposits', 'amount,status,created_at,network'), allRows('withdrawals', 'amount,status,created_at'),
      allRows('web_entries', 'contest_date,tier,paid_fee,refunded,status,user_id'),
      q(sb.from('kyc').select('user_id', { count: 'exact', head: true }).eq('status', 'pending')),
      q(sb.from('support').select('id', { count: 'exact', head: true }).eq('status', 'open')),
      allRows('wallets', 'balance'), q(sb.from('battles').select('*').order('contest_id', { ascending: false }).limit(3)),
      q(sb.rpc('pc_admin_partners')), q(sb.rpc('pc_admin_claims', { cid: null })),
      q(sb.from('pc_ops').select('id,data,updated_at')), q(sb.rpc('pc_admin_booking_sources'))
    ]).then(function (x) {
      var ops = {}; (x[11].data || []).forEach(function (r) { ops[r.id] = r.data || {}; ops[r.id]._at = r.updated_at; });
      CACHE = {
        bookings: x[0].data || [], bookingsErr: x[0].error, profiles: x[1].data || [], deposits: x[2].data || [], withdrawals: x[3].data || [],
        entries: x[4].data || [], kycPending: x[5].count || 0, supportOpen: x[6].count || 0,
        wallets: (x[7].data || []).reduce(function (a, w) { return a + Number(w.balance || 0); }, 0),
        battles: x[8].data || [], partners: x[9].data || [], partnersErr: x[9].error, claims: (x[10].data || []).length,
        ops: ops, opsErr: x[11].error, sources: x[12].data || [], sourcesErr: x[12].error
      };
      CACHE_AT = Date.now(); return CACHE;
    });
  }
  var NOT_DONE = ['pending', 'rejected', 'reversed', 'cancelled', 'canceled', 'processing'];
  function inRange(iso, days, offset) {   // offset 1 = pichhla period (comparison)
    if (!days) return !offset;
    var t = new Date(iso).getTime(), end = Date.now() - (offset || 0) * days * 864e5, start = end - days * 864e5;
    return t > start && t <= end;
  }
  function sum(a, f) { return a.reduce(function (s, x) { return s + (Number(f(x)) || 0); }, 0); }
  function delta(cur, prev) {
    if (!RANGE) return '';
    if (!prev) return cur ? '<small class="up">new</small>' : '<small>–</small>';
    var d = Math.round((cur - prev) / prev * 100);
    return '<small class="' + (d >= 0 ? 'up' : 'down') + '">' + (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d) + '% vs previous</small>';
  }
  function series(items, field, days, val) {
    var n = days || 30, out = [];
    for (var i = n - 1; i >= 0; i--) {
      var d = day(Date.now() - i * 864e5);
      out.push({ d: d, v: sum(items.filter(function (x) { return String(x[field]).slice(0, 10) === d; }), val || function () { return 1; }) });
    }
    return out;
  }
  function bars(a, b, ca, cb) {
    var mx = Math.max(1, Math.max.apply(null, a.map(function (x) { return x.v; }).concat(b ? b.map(function (x) { return x.v; }) : [])));
    return '<div class="o-bars">' + a.map(function (x, i) {
      return '<div title="' + x.d + ': ' + x.v + (b ? ' / ' + b[i].v : '') + '">' + (b ? '<i class="' + cb + '" style="height:' + (b[i].v / mx * 100) + '%"></i>' : '') +
        '<i class="' + ca + '" style="height:' + (x.v / mx * 100) + '%"></i></div>';
    }).join('') + '</div><div class="o-axis"><span>' + a[0].d.slice(5) + '</span><span>' + a[a.length - 1].d.slice(5) + '</span></div>';
  }
  function kpi(cls, label, value, sub) { return '<div class="o-kpi ' + cls + '"><span>' + label + '</span><b>' + value + '</b>' + (sub || '') + '</div>'; }
  function sqlHint(err) { return err ? '<div class="o-demo">Is section ke liye <b>sql/supabase_ops_panel.sql</b> Supabase mein ek baar chalani hai (owner). (' + esc(err.message || err) + ')</div>' : ''; }
  function demoBar() { return DEMO ? '<div class="o-demo">DEMO – nakli numbers, sirf design dekhne ke liye. Asli data login ke baad.</div>' : ''; }

  /* ---------- Dashboard ---------- */
  function dash() {
    pane().innerHTML = '<div class="o-note">Loading…</div>';
    load(true).then(function (D) {
      var R = RANGE, cur = function (a, f) { return a.filter(function (x) { return inRange(x[f], R, 0); }); }, prv = function (a, f) { return a.filter(function (x) { return inRange(x[f], R, 1); }); };
      var depOk = function (a) { return a.filter(function (x) { return NOT_DONE.indexOf(x.status) < 0; }); };
      var dep = sum(depOk(cur(D.deposits, 'created_at')), function (x) { return x.amount; }), depP = sum(depOk(prv(D.deposits, 'created_at')), function (x) { return x.amount; });
      var wd = sum(depOk(cur(D.withdrawals, 'created_at')), function (x) { return x.amount; }), wdP = sum(depOk(prv(D.withdrawals, 'created_at')), function (x) { return x.amount; });
      var paidE = function (a) { return a.filter(function (e) { return Number(e.paid_fee) > 0 && !e.refunded && e.status === 'joined'; }); };
      var entC = paidE(cur(D.entries, 'contest_date')), entP = paidE(prv(D.entries, 'contest_date'));
      var fees = sum(entC, function (e) { return e.paid_fee; }), feesP = sum(entP, function (e) { return e.paid_fee; });
      var bk = cur(D.bookings, 'created_at').length, bkP = prv(D.bookings, 'created_at').length;
      var pl = cur(D.profiles, 'created_at').length, plP = prv(D.profiles, 'created_at').length;
      var due = sum(D.partners, function (p) { return p.due; });
      var depPend = D.deposits.filter(function (x) { return x.status === 'pending'; }).length, wdPend = D.withdrawals.filter(function (x) { return x.status === 'pending'; }).length;
      var b = D.battles[0], live = b && Date.now() - new Date(b.updated_at) < 5 * 60e3;
      var tt = ((D.ops.today || {}).tables || []), noOf = {}; tt.forEach(function (x) { noOf[x.id] = x.no; });
      var chip = function (n, label, tab, bad) { return '<button class="o-chip ' + (n ? (bad ? 'bad' : '') : 'ok') + '" data-go="' + tab + '">' + label + ' <b>' + n + '</b></button>'; };
      var cty = {}; D.bookings.forEach(function (x) { cty[x.country || '?'] = (cty[x.country || '?'] || 0) + 1; });
      var ctyL = Object.keys(cty).sort(function (a, b2) { return cty[b2] - cty[a]; }).slice(0, 6), ctyMax = ctyL.length ? cty[ctyL[0]] : 1;
      var depositors = {}; D.deposits.forEach(function (x) { if (NOT_DONE.indexOf(x.status) < 0) depositors[x.user_id || Math.random()] = 1; });
      var entered = {}; paidE(D.entries).forEach(function (e) { entered[e.user_id] = 1; });
      var fun = [['Bookings', D.bookings.length], ['Accounts', D.profiles.length], ['Deposited', Object.keys(depositors).length], ['Paid entry', Object.keys(entered).length]];
      var fMax = Math.max(1, fun[0][1]);
      pane().innerHTML = demoBar() + healthBanner(D) + (TAB === 'bookings' ? sourcesHtml(D) : '') +
        '<div class="o-alert"><b>Needs you now</b>' + chip(depPend, 'Deposits', 'money', 1) + chip(wdPend, 'Withdrawals', 'money', 1) + chip(D.kycPending, 'ID checks', 'money', 1) +
          chip(D.supportOpen, 'Support', 'support', 1) + chip(D.claims, 'Telegram prizes', 'money', 1) + chip(Math.round(due), 'Partner $ due', 'influencers', 0) +
          '<span class="o-sp"></span><span class="o-engine"><span class="o-dot' + (live ? '' : ' off') + '"></span>' + (b ? 'Battle ' + esc(noOf[b.contest_id] || (window.pcTagOf ? window.pcTagOf(b) : '#' + b.contest_id)) + ' · ' + esc(b.status) + ' · ' + (b.players || 0) + ' players' : 'No battle yet') + '</span></div>' +
        '<div class="o-kpis">' +
          kpi('k1', 'Deposits', money(dep), delta(dep, depP)) + kpi('k2', 'Withdrawals', money(wd), delta(wd, wdP)) +
          kpi('k3', 'Net deposits', money(dep - wd), '<small>in wallets now ' + money(D.wallets) + '</small>') +
          kpi('k4', 'Bookings', bk, delta(bk, bkP)) + kpi('k5', 'New accounts', pl, delta(pl, plP)) +
          kpi('k6', 'Paid entries', entC.length, delta(entC.length, entP.length)) +
          kpi('k3', 'Platform 20%', money(fees * 0.2), delta(fees, feesP)) + kpi('k2', 'Prize pools 80%', money(fees * 0.8), '<small>' + money(fees) + ' entry fees</small>') +
        '</div>' + tablesHtml(D) + '<div class="o-grid2">' + poolsHtml(D) + adsHtml(D) + '</div>' +
        '<div class="o-grid2">' +
          '<div class="o-card"><h3>Bookings & new accounts</h3><div class="o-sub">per day</div>' + bars(series(D.bookings, 'created_at', R || 30), series(D.profiles, 'created_at', R || 30), 'a', 'b') +
            '<div class="o-legend"><span><i style="background:var(--accent)"></i>Bookings</span><span><i style="background:var(--gold)"></i>Accounts</span></div></div>' +
          '<div class="o-card"><h3>Deposits vs withdrawals</h3><div class="o-sub">USDT per day</div>' +
            bars(series(depOk(D.deposits), 'created_at', R || 30, function (x) { return x.amount; }), series(depOk(D.withdrawals), 'created_at', R || 30, function (x) { return x.amount; }), 'c', 'd') +
            '<div class="o-legend"><span><i style="background:#22C55E"></i>Deposits</span><span><i style="background:#F97316"></i>Withdrawals</span></div></div>' +
        '</div><div class="o-grid2">' +
          '<div class="o-card"><h3>Funnel</h3><div class="o-sub">all time – kahan log ruk rahe</div><div class="o-funnel">' +
            fun.map(function (f) { return '<div class="row"><span>' + f[0] + '</span><span class="bar"><i style="width:' + (f[1] / fMax * 100) + '%"></i></span><b class="r">' + f[1] + '</b></div>'; }).join('') + '</div></div>' +
          '<div class="o-card"><h3>Top countries</h3><div class="o-sub">bookings</div><div class="o-list">' +
            ctyL.map(function (c) { return '<div class="row"><span>' + esc(c) + '</span><span class="bar"><i style="width:' + (cty[c] / ctyMax * 100) + '%"></i></span><b>' + cty[c] + '</b></div>'; }).join('') + '</div></div>' +
          '<div class="o-card"><h3>Top influencers</h3><div class="o-sub">earned / due</div><div class="o-list">' +
            (D.partners.slice(0, 5).map(function (p) { return '<div class="row"><span>' + esc(p.code) + '</span><span class="o-note">' + p.players + ' players</span><b>' + money(p.earned) + ' / ' + money(p.due) + '</b></div>'; }).join('') || '<span class="o-note">No partners yet.</span>') +
          '</div></div>' +
        '</div>';
    });
  }

  /* ---------- Influencers (partner engine) ---------- */
  var OPEN = null;
  function influencers() {
    pane().innerHTML = '<div class="o-note">Loading…</div>';
    load(true).then(function (D) {
      var P = D.partners, own = DEMO || A.owner();
      var tot = function (f) { return sum(P, function (p) { return p[f]; }); };
      var base = location.origin.replace(/localhost:\d+/, 'pipclash.net').replace(/^http:/, 'https:') + '/?ref=';
      var rows = P.map(function (p) {
        return '<tr><td><b>' + esc(p.code) + '</b><div class="o-note">' + esc(p.name || '') + ' · ' + esc(p.contact || '') + '</div></td>' +
          '<td>' + esc(p.platform || '–') + (p.followers ? '<div class="o-note">' + Number(p.followers).toLocaleString() + ' followers</div>' : '') + '</td>' +
          '<td><span class="o-tag b">' + pct(p.rate_now) + '</span><div class="o-note">since ' + esc(p.started_on || '') + '</div></td>' +
          '<td class="r">' + p.bookings + '</td><td class="r">' + p.players + '</td><td class="r">' + p.entries + '</td><td class="r">' + money(p.fees) + '</td>' +
          '<td class="r"><b>' + money(p.earned) + '</b></td><td class="r">' + money(p.paid) + '</td><td class="r"><span class="o-tag ' + (p.due > 0 ? 'r' : 'g') + '">' + money(p.due) + '</span></td>' +
          '<td>' + (p.active ? '<span class="o-tag g">Active</span>' : '<span class="o-tag">Off</span>') + '</td>' +
          '<td><button class="btn btn-ghost btn-sm" data-p-open="' + esc(p.code) + '">Open</button> <button class="btn btn-ghost btn-sm" data-copy="' + base + esc(p.code) + '">Copy link</button></td></tr>';
      }).join('');
      pane().innerHTML = demoBar() + healthBanner(D) + (TAB === 'bookings' ? sourcesHtml(D) : '') + sqlHint(D.partnersErr) +
        '<div class="o-kpis">' + kpi('k3', 'Partners', P.length, '<small>' + P.filter(function (p) { return p.active; }).length + ' active</small>') +
          kpi('k4', 'Bookings via partners', tot('bookings'), '') + kpi('k5', 'Players via partners', tot('players'), '<small>' + tot('entries') + ' paid entries</small>') +
          kpi('k1', 'Fees from partners', money(tot('fees')), '') + kpi('k6', 'Partners earned', money(tot('earned')), '<small>paid ' + money(tot('paid')) + '</small>') +
          kpi('k2', 'Due now', money(tot('due')), '<small>send USDT, then mark paid</small>') + '</div>' +
        '<div class="o-card"><div class="o-row"><h3>All influencers</h3><span class="o-sp"></span>' +
          '<input class="o-search" placeholder="Search code / name" data-p-q> <button class="btn btn-ghost btn-sm" data-p-csv>Export CSV</button>' +
          (own ? ' <button class="btn btn-sm" data-p-new>+ Add influencer</button>' : '') + '</div>' +
          '<div class="o-note">Deal: flat 5% of every paid entry from their players – paid daily, after each battle result. A player from a partner link never gives the 1% referral too. Link = pipclash.net/?ref=CODE</div>' +
          '<div class="o-scroll"><table class="o-table" data-p-table><thead><tr><th>Code</th><th>Platform</th><th>Rate</th><th class="r">Bookings</th><th class="r">Players</th><th class="r">Entries</th><th class="r">Fees</th><th class="r">Earned</th><th class="r">Paid</th><th class="r">Due</th><th>Status</th><th></th></tr></thead><tbody>' +
          (rows || '<tr><td colspan="12" class="o-note">No influencers yet – add the first one.</td></tr>') + '</tbody></table></div></div>' +
        '<div class="o-row" style="margin:8px 0"><button class="btn btn-sm" data-p-batch-open>Daily payout list</button></div><div data-p-batch></div>' +
        '<div data-p-form></div><div data-p-detail></div>';
      if (OPEN) openPartner(OPEN);
    });
  }
  function partnerForm(p) {
    p = p || { pct: 0.05, started_on: day(Date.now()), active: true };
    $('[data-p-form]').innerHTML = '<div class="o-card"><h3>' + (p.code ? 'Edit ' + esc(p.code) : 'Add influencer') + '</h3><div class="o-sub">Owner only. Code = their link (?ref=CODE). Booking codes cannot be used.</div>' +
      '<form class="o-form" data-p-save>' +
      '<label>Code<input name="c" required maxlength="24" value="' + esc(p.code || '') + '" ' + (p.code ? 'readonly' : '') + ' placeholder="NILESH"></label>' +
      '<label>Name<input name="nm" value="' + esc(p.name || '') + '" placeholder="Nilesh Trader"></label>' +
      '<label>Contact<input name="contact" value="' + esc(p.contact || '') + '" placeholder="@instagram / @telegram / email"></label>' +
      '<label>Platform<select name="platform">' + ['Instagram', 'YouTube', 'Telegram', 'TikTok', 'X', 'Other'].map(function (x) { return '<option' + (p.platform === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
      '<label>Followers<input name="followers" type="number" min="0" value="' + esc(p.followers || '') + '"></label>' +
      '<label>Country<input name="country" value="' + esc(p.country || '') + '"></label>' +
      '<label>Deal start<input name="start" type="date" value="' + esc(p.started_on || day(Date.now())) + '"></label>' +
      '<label>Their own PipClash email<input name="own" type="email" value="' + esc(p.own_email || '') + '" placeholder="no 5% on their own entries"></label>' +
      '<label>Commission % (flat 5)<input name="p" type="number" step="0.5" min="5" max="5" readonly value="' + (Number(p.pct) * 100) + '"></label>' +
      '<label>Pay to (USDT address)<input name="pay" value="' + esc(p.pay_to || '') + '" placeholder="0x… (BEP20) or T… (TRC20)"></label>' +
      '<label>Active<select name="on"><option value="1"' + (p.active ? ' selected' : '') + '>Active</option><option value="0"' + (p.active ? '' : ' selected') + '>Off</option></select></label>' +
      '<label style="grid-column:1/-1">Notes<textarea name="notes" rows="2">' + esc(p.notes || '') + '</textarea></label>' +
      '<div class="o-row" style="grid-column:1/-1"><button class="btn btn-sm" type="submit">Save</button><button class="btn btn-ghost btn-sm" type="button" data-p-cancel>Cancel</button></div></form></div>';
    $('[data-p-form]').scrollIntoView({ behavior: 'smooth' });
  }
  function openPartner(code) {
    OPEN = code;
    var box = $('[data-p-detail]'); if (!box) return;
    var p = (CACHE.partners || []).filter(function (x) { return x.code === code; })[0]; if (!p) return;
    var render = function (d) {
      box.innerHTML = '<div class="o-card"><div class="o-row"><h3>' + esc(p.code) + ' – ' + esc(p.name || '') + '</h3><span class="o-sp"></span>' +
        ((DEMO || A.owner()) ? '<button class="btn btn-ghost btn-sm" data-p-edit="' + esc(p.code) + '">Edit</button>' : '') + ' <button class="btn btn-ghost btn-sm" data-p-close>Close</button></div>' +
        '<div class="o-sub">' + esc(p.contact || '') + ' · ' + esc(p.platform || '') + ' · pay to ' + esc(p.pay_to || '–') + '</div>' +
        '<div class="o-kpis">' + kpi('k6', 'Earned', money(p.earned), '') + kpi('k1', 'Paid', money(p.paid), p.last_paid ? '<small>last ' + uae(p.last_paid) + '</small>' : '') + kpi('k2', 'Due', money(p.due), '') + '</div>' +
        ((DEMO || A.owner()) ? '<h3 style="margin-top:14px">Mark paid</h3><div class="o-note">First send USDT from your wallet, then paste the TXID here.</div>' +
          '<form class="o-form" data-p-pay><label>Amount (USDT)<input name="amt" type="number" step="0.01" min="0.01" value="' + Math.max(0, Number(p.due) || 0).toFixed(2) + '"></label>' +
          '<label>TXID<input name="tx" required minlength="20" placeholder="0x… / tron tx hash"></label><label>Battle day from<input name="f" type="date"></label><label>Battle day to<input name="t" type="date"></label>' +
          '<div class="o-row" style="grid-column:1/-1"><button class="btn btn-sm" type="submit">Save payout</button></div></form>' : '') +
        '<div class="o-grid2" style="margin-top:12px"><div><h3>Earnings by day</h3><table class="o-table"><thead><tr><th>Day</th><th class="r">Entries</th><th class="r">Fees</th><th class="r">Rate</th><th class="r">Earned</th></tr></thead><tbody>' +
          ((d.days || []).map(function (x) { return '<tr><td>' + esc(x.contest_date) + '</td><td class="r">' + x.entries + '</td><td class="r">' + money(x.fees) + '</td><td class="r">' + pct(x.rate) + '</td><td class="r">' + money(x.amount) + '</td></tr>'; }).join('') || '<tr><td colspan="5" class="o-note">No paid entries yet.</td></tr>') +
          '</tbody></table></div><div><h3>Payouts</h3><table class="o-table"><thead><tr><th>When</th><th class="r">Amount</th><th>TXID</th></tr></thead><tbody>' +
          ((d.payouts || []).map(function (x) { return '<tr><td>' + uae(x.paid_at) + '</td><td class="r">' + money(x.amount) + '</td><td class="o-note">' + esc(String(x.txid || '').slice(0, 18)) + '…</td></tr>'; }).join('') || '<tr><td colspan="3" class="o-note">Nothing paid yet.</td></tr>') +
          '</tbody></table><h3 style="margin-top:12px">Players (' + (d.players || []).length + ')</h3><div class="o-list">' +
          (d.players || []).slice(0, 30).map(function (x) { return '<div class="row"><span>' + esc(x.name || '–') + '</span><span class="o-note">' + uae(x.created_at) + ' · ' + x.entries + ' entries</span></div>'; }).join('') + '</div></div></div></div>';
      box.scrollIntoView({ behavior: 'smooth' });
    };
    if (DEMO) render({ days: [{ contest_date: '2026-11-10', entries: 12, fees: 180, rate: 0.10, amount: 18 }, { contest_date: '2026-11-09', entries: 9, fees: 110, rate: 0.10, amount: 11 }], payouts: p.paid ? [{ paid_at: new Date().toISOString(), amount: p.paid, txid: '0x9f3c…demo' }] : [], players: [{ name: 'Ali', created_at: new Date().toISOString(), entries: 3 }] });
    else A.sb.rpc('pc_admin_partner_detail', { c: code }).then(function (r) { render(r.data || {}); });
  }

  /* ---------- Bookings ---------- */
  function sourcesHtml(D) {
    var S = D.sources || [], mx = Math.max(1, Math.max.apply(null, S.map(function (x) { return x.n; }).concat([1])));
    var nm = { meta_ad: 'Meta ads', google: 'Google', instagram: 'Instagram', telegram: 'Telegram', invite: 'Friend invite', direct: 'Direct', 'unknown (purani)': 'Purani (tracking se pehle)' };
    return '<div class="o-card"><h3>Booking kahan se aayi</h3><div class="o-sub">pehli visit ka source · tracking 6 Nov se</div>' + sqlHint(D.sourcesErr) + '<div class="o-list">' +
      (S.map(function (x) { return '<div class="row"><span>' + esc(nm[x.source] || x.source) + '</span><span class="bar"><i style="width:' + (x.n / mx * 100) + '%"></i></span><b>' + x.n + '</b></div>'; }).join('') || '<span class="o-note">Abhi data nahi.</span>') + '</div></div>';
  }
  function bookings() {
    pane().innerHTML = '<div class="o-note">Loading…</div>';
    load(true).then(function (D) {
      var B = D.bookings, by = function (f) { var o = {}; B.forEach(function (x) { var k = f(x); o[k] = (o[k] || 0) + 1; }); return o; };
      var src = by(function (x) { var r = x.ref || ''; return !r ? '(link unknown)' : /^[0-9A-F]{6}$/i.test(r) ? 'friend invite' : r.toUpperCase(); });
      var people = {}; B.forEach(function (x) { people[(x.contact || '').toLowerCase()] = 1; });
      var tier = by(function (x) { return x.tier; }), last24 = B.filter(function (x) { return inRange(x.created_at, 1, 0); }).length;
      var srcL = Object.keys(src).sort(function (a, b) { return src[b] - src[a]; }), sMax = srcL.length ? src[srcL[0]] : 1;
      pane().innerHTML = demoBar() + healthBanner(D) + (TAB === 'bookings' ? sourcesHtml(D) : '') + sqlHint(D.bookingsErr) +
        '<div class="o-kpis">' + kpi('k3', 'Bookings', B.length, '<small>' + Object.keys(people).length + ' people</small>') + kpi('k4', 'Last 24h', last24, '') +
          kpi('k1', 'STARTER $10', tier[10] || 0, '') + kpi('k6', 'PRO $25', tier[25] || 0, '') + kpi('k2', 'ELITE $50', tier[50] || 0, '') + '</div>' +
        '<div class="o-grid2"><div class="o-card"><h3>Where bookings come from</h3><div class="o-sub">tracking link (?ref=)</div><div class="o-list">' +
          srcL.map(function (k) { return '<div class="row"><span>' + esc(k) + '</span><span class="bar"><i style="width:' + (src[k] / sMax * 100) + '%"></i></span><b>' + src[k] + '</b></div>'; }).join('') + '</div></div>' +
          '<div class="o-card"><h3>Per day</h3><div class="o-sub">last ' + (RANGE || 30) + ' days</div>' + bars(series(B, 'created_at', RANGE || 30), null, 'a') + '</div></div>' +
        '<div class="o-card"><div class="o-row"><h3>All bookings</h3><span class="o-sp"></span><input class="o-search" placeholder="Search name / contact / country / source" data-b-q>' +
          '<select class="o-search" data-b-tier><option value="">All tables</option><option>10</option><option>25</option><option>50</option></select> <button class="btn btn-ghost btn-sm" data-b-csv>Export CSV</button></div>' +
          '<div class="o-note">Private player data – do not share outside the team.</div><div class="o-scroll"><table class="o-table" data-b-table><thead><tr><th>When (UAE)</th><th>Name</th><th>Contact</th><th>Country</th><th>Table</th><th>Source</th><th>Code</th></tr></thead><tbody>' +
          B.map(function (x) { return '<tr data-s="' + esc((x.name + ' ' + x.contact + ' ' + x.country + ' ' + (x.ref || '')).toLowerCase()) + '" data-t="' + x.tier + '"><td>' + uae(x.created_at) + '</td><td>' + esc(x.name) + '</td><td>' + esc(x.contact) + '</td><td>' + esc(x.country) + '</td><td>$' + x.tier + (x.waitlist ? ' <span class="o-tag y">wait</span>' : '') + '</td><td>' + esc(x.ref || '–') + '</td><td class="o-note">' + esc(x.code) + '</td></tr>'; }).join('') +
          '</tbody></table></div></div>';
    });
  }

  /* ---------- Command center ---------- */
  function serverHtml(D) {   // 6 Nov Jarvis: server hara/laal (feed har 5 min)
    var S = (D.ops || {}).server || {}, ok = function (c) { return '<span class="o-pill ' + (c ? 'live' : 'bad') + '">' + (c ? 'OK' : 'CHECK') + '</span>'; };
    var fresh = S._at && Date.now() - new Date(S._at) < 15 * 60e3;
    return '<div class="o-card"><h3>Server (engine VPS)</h3>' + feedNote(D, 'server') + '<div class="o-list">' +
      '<div class="row"><span>Feed zinda (15 min)</span>' + ok(fresh) + '</div>' +
      '<div class="row"><span>Engine process</span><b>' + esc(S.engine || '?') + ' ' + ok(S.engine === '1') + '</b></div>' +
      '<div class="row"><span>MT5 khule</span><b>' + esc(S.mt5 || '?') + '</b></div>' +
      '<div class="row"><span>Disk free</span><b>' + esc(S.disk_gb || '?') + ' GB</b></div>' +
      '<div class="row"><span>Backup</span><span class="o-note">' + esc(S.backup_last || '–') + '</span></div>' +
      '<div class="row"><span>Engine log</span><span class="o-note">' + esc(S.auto_last || '–') + '</span></div>' +
      '<div class="row"><span>Watchdog</span><span class="o-note">' + esc(S.watchdog_last || '–') + '</span></div></div></div>';
  }
  function command() {
    var L = [['Team group (Telegram)', 'Posts ✅, DM list, summary', 'https://web.telegram.org/'], ['Website', 'pipclash.net', 'https://pipclash.net/'],
      ['Supabase', 'database, SQL, auth', 'https://supabase.com/dashboard/project/vrcjgxnafmuxfkybtkbz'], ['Meta Ads', 'UAE ad, billing', 'https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=2727448367713368'],
      ['Instagram', '@pipclash_official', 'https://www.instagram.com/pipclash_official/'], ['Collabstr', 'paid creators', 'https://collabstr.com/influencers?c=trading'],
      ['Search Console', 'Google traffic', 'https://search.google.com/search-console?resource_id=https%3A%2F%2Fpipclash.net%2F'], ['Resend', 'login emails', 'https://resend.com/emails'],
      ['Gmail (support@)', 'replies as support@', 'https://mail.google.com/'], ['GitHub', 'website repo', 'https://github.com/pipclash-official/pipclash-official.github.io'],
      ['Old admin', 'classic panel', 'admin.html'], ['Live arena', 'public leaderboard', 'https://pipclash.net/arena.html']];
    load(false).then(function (D) { var x = $('[data-j-extra]'); if (x) x.innerHTML = '<div class="o-grid2">' + serverHtml(D) + adsHtml(D) + '</div>' + '<div class="o-grid2">' + poolsHtml(D) + sourcesHtml(D) + '</div>'; });
    pane().innerHTML = demoBar() + '<div data-j-extra><div class="o-note">Loading…</div></div>' +
      '<div class="o-card"><h3>Battle day – what happens when (UAE)</h3><div class="o-sub">Mon–Fri · engine does the timed steps itself</div><div class="o-list">' +
      [['Any time', 'Players deposit + join the next battle (Join battle page)'], ['4:00 PM', 'Entry closes · a table with fewer than 5 = cancelled + full refund (automatic)'],
       ['4:15 PM', 'Engine prepares – do NOT touch the engine until 7:45 PM'], ['4:25 PM', 'MT5 logins sent to players'], ['4:30–7:30 PM', 'Battle live – watch Battles / Risk'],
       ['7:30–9:30 PM', 'Review – DQ only if a rule is broken'], ['9:30 PM', 'Final result + prizes to wallets (automatic)'], ['After', 'Withdrawals: Payments → Start payout → send → Paid + TXID']]
        .map(function (x) { return '<div class="row"><b style="min-width:60px">' + x[0] + '</b><span class="o-sp">' + x[1] + '</span></div>'; }).join('') + '</div></div>' +
      '<div class="o-card"><h3>Quick links</h3><div class="o-links">' + L.map(function (x) { return '<a href="' + x[2] + '" target="_blank" rel="noopener"><b>' + x[0] + '</b><small>' + x[1] + '</small></a>'; }).join('') + '</div></div>' +
      '<div class="o-card"><h3>Ask Claude (Jarvis)</h3><div class="o-sub">Type a task – it is copied with today’s numbers; paste it in the Claude chat (C:\\pipclash).</div>' +
      '<textarea class="o-search" style="width:100%;min-height:80px" data-j-q placeholder="e.g. Make tomorrow’s influencer DM list from today’s bookings"></textarea>' +
      '<div class="o-row" style="margin-top:8px"><button class="btn btn-sm" data-j-copy>Copy for Claude</button><span class="o-note" data-j-msg></span></div></div>';
  }

  /* ---------- 6 Nov: engine feed (pc_ops) – tables today, pools, ads, risk, daily ---------- */
  function ago(iso) { if (!iso) return '–'; var m = Math.round((Date.now() - new Date(iso)) / 60e3); return m < 1 ? 'abhi' : m < 60 ? m + ' min pehle' : Math.round(m / 60) + ' ghante pehle'; }

  /* 7 Nov (ADM-4/10): engine chup = bada laal patta · flags ke saaf shabd */
  var FLAGW = { hft_suspected: 'Fast trading – allowed, just watch', ea_suspected: 'Robot / EA suspected → DQ rule', robot: 'Robot / EA → DQ rule',
    exact_mismatch: 'Result differs from MT5 – check', no_exact: 'MT5 exact result missing – check', late_price: 'Price arrived late', price_note: 'Price note',
    pnl_equity: 'P&L vs equity differs – check', hedge_cross_table: 'Opposite trades on 2 tables – check', copy_trading: 'Copy trading suspected – check',
    start_balance: 'Wrong start balance', mirror: 'Mirror / opposite trades – check', pre_trade: 'Traded before 4:30 → DQ rule' };
  window.pcFlag = function (k) { return FLAGW[k] || String(k || '').replace(/_/g, ' '); };
  function feedAge(D) { var t = 0; Object.keys(D.ops || {}).forEach(function (k) { var o = D.ops[k]; if (o && o._at) t = Math.max(t, new Date(o._at).getTime()); }); return t ? (Date.now() - t) / 60e3 : null; }
  function healthBanner(D) {
    if (DEMO) return '';
    var m = feedAge(D);
    if (m === null || m > 15) return '<div class="o-card" style="border:2px solid #EF4444;background:rgba(239,68,68,.12)"><h3 style="color:#F87171;margin:0">🚨 Engine silent ' + (m === null ? '(no feed)' : Math.round(m) + ' min') + '</h3>' +
      '<div class="o-note">The server has not reported for 15+ minutes. During a battle (4:15–7:45 PM UAE) this is urgent: tell Claude / check the VPS. Deposits may not be credited.</div></div>';
    return '';
  }
  function feedNote(D, k) { var o = (D.ops || {})[k]; return o && o._at ? '<span class="o-mini">feed ' + ago(o._at) + '</span>' : '<span class="o-mini">feed abhi nahi (sql/supabase_ops_engine.sql + server task)</span>'; }
  function stPill(st) { return '<span class="o-pill ' + (st === 'live' ? 'live' : st === 'upcoming' ? 'up' : st === 'cancelled' ? 'bad' : 'end') + '">' + esc(st || '–') + '</span>'; }
  function tablesHtml(D) {
    var T = ((D.ops || {}).today || {}).tables || [];
    if (!T.length) return '<div class="o-card"><h3>Aaj ki tables</h3>' + feedNote(D, 'today') + '<p class="o-note">Aaj koi table nahi.</p></div>';
    return '<div class="o-card"><h3>Aaj ki tables · ' + esc(((D.ops.today || {}).date) || '') + '</h3>' + feedNote(D, 'today') + '<div class="o-tables" style="margin-top:10px">' + T.map(function (t) {
      return '<div class="o-tbl"><h4>Battle ' + esc(t.no) + ' · $' + t.tier + ' ' + stPill(t.status) + '</h4><div class="o-mini">account $' + Number(t.balance).toLocaleString() + ' · id ' + t.id + '</div>' +
        stepsHtml(t) +
        '<div class="kv"><span>Players</span><b>' + t.players + ' (' + t.active + ' active, ' + t.dq + ' DQ)</b></div>' +
        '<div class="kv"><span>Pool 80% / platform 20%</span><b>' + money(t.pool) + ' / ' + money(t.platform) + '</b></div>' +
        '<div class="kv"><span>Profit mein</span><b>' + t.in_profit + (t.low_trades_in_profit ? ' <span class="o-pill bad">' + t.low_trades_in_profit + ' × 2/3 trade</span>' : '') + '</b></div>' +
        (t.top || []).map(function (x, i) { return '<div class="kv"><span>#' + (i + 1) + ' ' + esc(x.user) + (x.trades < 3 ? ' <span class="o-pill bad">' + x.trades + '/3</span>' : '') + '</span><b>' + (x.pnl >= 0 ? '+' : '') + x.pnl.toFixed(2) + ' (' + x.pct + '%)</b></div>'; }).join('') +
        (Object.keys(t.flags || {}).length ? '<div class="o-mini" style="margin-top:6px">flags: ' + Object.keys(t.flags).map(function (k) { return esc(window.pcFlag(k)) + ' ×' + t.flags[k]; }).join(' · ') + '</div>' : '') + '</div>';
    }).join('') + '</div></div>';
  }
  function stepsHtml(t) {     // C24 (7 Nov): battle-day ek nazar – ✓ ho gaya / ⏳ baaki
    var S = t.steps || {}, ok = function (b, txt, sub) { return '<div class="kv"><span>' + (b ? '✅ ' : '⏳ ') + txt + '</span><b class="o-mini">' + (sub || '') + '</b></div>'; };
    if (t.cancelled) return '<div class="kv"><span>❌ Cancelled – kam log</span><b>' + t.players + ' / ' + (t.need || 5) + ' · refund ' + money(t.refund) + '</b></div>';
    return '<div class="o-steps">' +
      ok(t.players >= (t.need || 5), '4 PM: kam se kam ' + (t.need || 5) + ' log', t.players + ' / ' + (t.need || 5) + ' joined') +
      ok(S.creds_sent || t.logins > 0, '4:25 MT5 login', t.logins + ' / ' + t.players + ' ko login') +
      ok(S.battle_done, '7:30 trades band', '') +
      ok(S.results_pub, '9:30 final result', '') +
      ok(S.results_sent, 'Result + inaam players ko gaya', t.nobody_won ? 'koi qualify nahi – 80% wapas' : '') + '</div>';
  }
  function poolsHtml(D) {
    var P = (D.ops || {}).pools || {}, B = P.by_balance || {}, T = P.targets || {};
    var rows = ['1000', '2500', '5000'].map(function (k) {
      var f = (B[k] || {}).free || 0, tg = (T[k] || {}).target || 0, lo = (T[k] || {}).low || 0, warn = f <= lo;
      return '<div class="row"><span>$' + Number(k).toLocaleString() + ' account <span class="o-mini">(table $' + ({ '1000': 10, '2500': 25, '5000': 50 })[k] + ')</span></span><span class="bar"><i style="width:' + Math.min(100, tg ? f / tg * 100 : 0) + '%"></i></span><b>' + f + (warn ? ' <span class="o-pill bad">kam</span>' : '') + '</b></div>';
    }).join('');
    return '<div class="o-card"><h3>MT5 account dabbe (free)</h3><div class="o-sub">target tak engine raat ko khud banata</div>' + feedNote(D, 'pools') + '<div class="o-list">' + rows + '</div></div>';
  }
  function adsHtml(D) {
    var A2 = (D.ops || {}).ads || {}, tdy = ((A2.today || {}).total) || {}, all = ((A2.maximum || {}).total) || {};
    var adB = ((D.sources || []).filter(function (x) { return x.source === 'meta_ad'; })[0] || {}).n || 0;
    var cur = A2.currency === 'INR' ? '₹' : '$', f = function (v) { return cur + Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }); };
    return '<div class="o-card"><h3>Ads (Meta)</h3><div class="o-sub">aaj / ab tak · ek booking kitne ki padi</div>' + (A2.error ? '<div class="o-demo">' + esc(A2.error) + '</div>' : '') + '<div class="o-list">' +
      '<div class="row"><span>Kharch</span><b>' + f(tdy.spend) + ' / ' + f(all.spend) + '</b></div>' +
      '<div class="row"><span>Log ne dekha</span><b>' + (tdy.impressions || 0) + ' / ' + (all.impressions || 0) + '</b></div>' +
      '<div class="row"><span>Website pe aaye</span><b>' + (tdy.lpv || 0) + ' / ' + (all.lpv || 0) + (all.lpv ? ' <span class="o-mini">(' + f(all.spend / all.lpv) + '/visit)</span>' : '') + '</b></div>' +
      '<div class="row"><span>Ads se booking</span><b>' + adB + (adB ? ' <span class="o-mini">(' + f(all.spend / adB) + '/booking)</span>' : ' <span class="o-pill bad">0</span>') + '</b></div>' +
      '</div></div>';
  }
  function today() {
    pane().innerHTML = '<div class="o-note">Loading…</div>';
    load(true).then(function (D) {
      var F = ((D.ops || {}).flags || {}).items || [], M = ((D.ops || {}).today || {}).msgs || {};
      var C = ((D.ops || {}).today || {}).counts || {};
      pane().innerHTML = demoBar() + sqlHint(D.opsErr) +
        '<div class="o-kpis">' + kpi('k3', '4:15 rules msg', (C.rules_sent || 0) + ' / ' + (C.rules_total || 0), '<small>Telegram pe gaya / players</small>') +
          kpi('k4', '7 PM 3-trade yaad', C.remind_sent || 0, '<small>' + (C.remind_low || 0) + ' players profit me, 3 se kam trade</small>') +
          kpi('k2', 'Abhi 2/3 trade (profit)', C.low_trades_in_profit || 0, '<small>3 trade nahi to inaam nahi</small>') +
          kpi('k6', 'Galat start balance', C.wrong_balance || 0, '<small>flag – check karo</small>') + '</div>' + tablesHtml(D) +
        '<div class="o-grid2"><div class="o-card"><h3>Player messages (Telegram)</h3><div class="o-sub">4:15 rules · 7 PM 3-trade yaad</div><div class="o-list">' +
          ((M.rules || []).concat(M.remind || []).map(function (x) { return '<div class="row"><span class="o-note">' + esc(x) + '</span></div>'; }).join('') || '<span class="o-note">Aaj abhi koi msg nahi gaya.</span>') + '</div></div>' +
        poolsHtml(D) + '</div>' +
        '<div class="o-card"><h3>Flags (aakhri 6 battles)</h3>' + feedNote(D, 'flags') + '<div class="o-scroll"><table class="o-table"><thead><tr><th>Battle id</th><th>Player</th><th>Kind</th><th>Detail</th><th>Status</th></tr></thead><tbody>' +
          (F.map(function (f) { return '<tr><td>' + f.cid + '</td><td>' + esc(f.user || '–') + '</td><td><span class="o-pill ' + (/robot|hedge|mirror|pre_start|password/.test(f.kind) ? 'bad' : '') + '">' + esc(window.pcFlag(f.kind)) + '</span></td><td class="o-note">' + esc(f.detail) + '</td><td>' + esc(f.status || '') + '</td></tr>'; }).join('') || '<tr><td colspan="5" class="o-note">Koi flag nahi.</td></tr>') +
          '</tbody></table></div></div>';
    });
  }
  function risk() {
    pane().innerHTML = '<div class="o-note">Loading…</div>';
    load(true).then(function (D) {
      var R = (D.ops || {}).risk || {}, Fr = (D.ops || {}).fraud || {};
      pane().innerHTML = demoBar() + sqlHint(D.opsErr) +
        '<div class="o-kpis">' + kpi('k2', 'DQ (aaj/kal)', (R.dq || []).length, '') + kpi('k4', 'Risk flags', (R.flags || []).length, '') + kpi('k6', 'Bade winners (25%+)', (R.big || []).length, '') +
          kpi('k1', 'Same phone accounts', (Fr.same_phone || []).length, '<small>' + (Fr.profiles || 0) + ' website accounts</small>') + kpi('k3', 'Khud ko refer', Fr.self_referral || 0, '') + '</div>' +
        '<div class="o-grid2"><div class="o-card"><h3>Disqualified</h3>' + feedNote(D, 'risk') + '<div class="o-list">' + ((R.dq || []).map(function (x) { return '<div class="row"><span>' + esc(x.user) + ' <span class="o-mini">id ' + x.cid + '</span></span><span class="o-note">' + esc(x.why) + '</span></div>'; }).join('') || '<span class="o-note">Koi DQ nahi.</span>') + '</div></div>' +
          '<div class="o-card"><h3>Bade winners – check karo</h3><div class="o-sub">balance ka 25%+ profit</div><div class="o-list">' + ((R.big || []).map(function (x) { return '<div class="row"><span>' + esc(x.user) + ' <span class="o-mini">id ' + x.cid + ' · ' + x.trades + ' trades</span></span><b>+' + x.pnl + ' (' + x.pct + '%)</b></div>'; }).join('') || '<span class="o-note">Koi nahi.</span>') + '</div></div></div>' +
        '<div class="o-grid2"><div class="o-card"><h3>Risk flags</h3><div class="o-list">' + ((R.flags || []).map(function (x) { return '<div class="row"><span><span class="o-pill bad">' + esc(window.pcFlag(x.kind)) + '</span> ' + esc(x.login) + ' <span class="o-mini">id ' + x.cid + '</span></span><span class="o-note">' + esc(x.detail) + '</span></div>'; }).join('') || '<span class="o-note">Koi flag nahi.</span>') + '</div></div>' +
          '<div class="o-card"><h3>Fraud check (website accounts)</h3><div class="o-sub">same phone · khud ko refer</div>' + feedNote(D, 'fraud') + '<div class="o-list">' + ((Fr.same_phone || []).map(function (x) { return '<div class="row"><span>Phone …' + esc(x.phone_end) + '</span><b>' + x.accounts + ' accounts</b></div>'; }).join('') || '<span class="o-note">Same phone pe 2 account nahi.</span>') + '</div></div></div>' + '<div data-fraud-x></div>';
      fraudExtra();
    });
  }
  function daily() {
    pane().innerHTML = '<div class="o-note">Loading…</div>';
    load(true).then(function (D) {
      var Rr = ((D.ops || {}).daily || {}).rows || [], tot = function (f) { return sum(Rr, function (r) { return r[f]; }); };
      pane().innerHTML = demoBar() + sqlHint(D.opsErr) +
        '<div class="o-kpis">' + kpi('k4', 'Battles (21 din)', Rr.filter(function (r) { return !r.cancelled; }).length, '<small>' + Rr.filter(function (r) { return r.cancelled; }).length + ' cancelled (ginti me nahi)</small>') + kpi('k1', 'Entry fees', money(tot('fees')), '') + kpi('k3', 'Platform 20%', money(tot('platform')), '') +
          kpi('k2', 'Prize pool 80%', money(tot('pool')), '') + kpi('k6', 'Inaam diya', money(tot('prizes_paid')), '') + '</div>' +
        '<div class="o-card"><h3>Har battle ka hisaab</h3>' + feedNote(D, 'daily') + '<div class="o-row"><button class="btn btn-ghost btn-sm" data-d-csv>CSV</button></div><div class="o-scroll"><table class="o-table"><thead><tr><th>Date (UAE)</th><th>Battle</th><th>Table</th><th class="r">Players</th><th class="r">DQ</th><th class="r">Profit mein</th><th class="r">Fees</th><th class="r">Pool 80%</th><th class="r">Platform 20%</th><th class="r">Inaam diya</th><th class="r">Wapas</th><th>Status</th></tr></thead><tbody>' +
          (Rr.map(function (r) { return '<tr><td>' + uae(r.start_utc) + '</td><td>' + esc(r.no) + '</td><td>' + (r.tier ? '$' + r.tier : 'free') + '</td><td class="r">' + r.players + '</td><td class="r">' + r.dq + '</td><td class="r">' + r.in_profit + '</td><td class="r">' + money(r.fees) + '</td><td class="r">' + money(r.pool) + '</td><td class="r">' + money(r.platform) + '</td><td class="r">' + money(r.prizes_paid) + '</td><td class="r">' + (r.refund ? money(r.refund) : '–') + '</td><td>' + (r.cancelled ? '<span class="o-pill bad">Cancelled · full refund</span>' : r.nobody_won ? '<span class="o-pill">Koi qualify nahi · 80% wapas</span>' : stPill(r.status)) + '</td></tr>'; }).join('') || '<tr><td colspan="12" class="o-note">Abhi koi battle khatam nahi hui.</td></tr>') +
          '</tbody></table></div></div>';
    });
  }
  function payoutBatch() {
    var P = (CACHE.partners || []).filter(function (p) { return Number(p.due) > 0; });
    var box = $('[data-p-batch]'); if (!box) return;
    box.innerHTML = '<div class="o-card"><h3>Daily payout list (after result)</h3><div class="o-sub">Jinka due > 0 · paisa owner wallet se bheje, phir har partner pe "Save payout" (TXID)</div>' +
      '<div class="o-row"><button class="btn btn-ghost btn-sm" data-p-batch-csv>CSV (wallet ke liye)</button></div><div class="o-scroll"><table class="o-table"><thead><tr><th>Code</th><th>Pay to (USDT)</th><th class="r">Due</th><th></th></tr></thead><tbody>' +
      (P.map(function (p) { return '<tr><td><b>' + esc(p.code) + '</b></td><td class="o-note">' + esc(p.pay_to || '– address nahi –') + '</td><td class="r"><b>' + money(p.due) + '</b></td><td><button class="btn btn-ghost btn-sm" data-p-open="' + esc(p.code) + '">Open</button></td></tr>'; }).join('') || '<tr><td colspan="4" class="o-note">Kisi ka due nahi.</td></tr>') +
      '</tbody></table></div><div class="o-mini" style="margin-top:6px">Kul: ' + money(sum(P, function (p) { return p.due; })) + ' · ' + P.length + ' partners</div></div>';
  }

  /* ---------- CSV ---------- */
  function csv(name, head, rows) {
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var blob = new Blob([[head].concat(rows).map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  }

  /* ---------- events ---------- */
  root.addEventListener('click', function (e) {
    var t = e.target.closest('button,a'); if (!t) return;
    if (t.matches('[data-r]')) { RANGE = +t.getAttribute('data-r'); root.querySelectorAll('[data-r]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); }); rerender(); }
    if (t.matches('[data-a-tab]') || t.matches('[data-go]')) { setTimeout(title, 0); if (DEMO) route(t.getAttribute('data-a-tab') || t.getAttribute('data-go')); }
    if (t.matches('[data-copy]')) { navigator.clipboard.writeText(t.getAttribute('data-copy')); t.textContent = 'Copied ✓'; }
    if (t.matches('[data-p-new]')) partnerForm();
    if (t.matches('[data-p-cancel]')) $('[data-p-form]').innerHTML = '';
    if (t.matches('[data-p-batch-open]')) payoutBatch();
    if (t.matches('[data-p-batch-csv]')) csv('pipclash-partner-payouts.csv', ['code', 'pay_to', 'due_usdt'],
      (CACHE.partners || []).filter(function (p) { return Number(p.due) > 0; }).map(function (p) { return [p.code, p.pay_to, Number(p.due).toFixed(2)]; }));
    if (t.matches('[data-d-csv]')) csv('pipclash-daily.csv', ['date', 'battle', 'tier', 'players', 'dq', 'in_profit', 'fees', 'pool', 'platform', 'prizes_paid', 'status'],
      (((CACHE.ops || {}).daily || {}).rows || []).map(function (r) { return [r.start_utc, r.no, r.tier, r.players, r.dq, r.in_profit, r.fees, r.pool, r.platform, r.prizes_paid, r.status]; }));
    if (t.matches('[data-p-open]')) openPartner(t.getAttribute('data-p-open'));
    if (t.matches('[data-cr-toggle]')) {
      var cr = CR.filter(function (x) { return String(x.id) === t.getAttribute('data-cr-toggle'); })[0];
      if (cr) A.call('pc_admin_creative_save', { id_: cr.id, title_: cr.title, kind_: cr.kind, url_: cr.url || '', caption_: cr.caption || '', active_: !cr.active }, t, creatives);
    }
    if (t.matches('[data-cp-approve]')) {
      var cp = CP.filter(function (x) { return String(x.id) === t.getAttribute('data-cp-approve'); })[0];
      if (cp && confirm('Approve "' + cp.name + '"?')) A.call('pc_admin_competition_save', { id_: cp.id, name_: cp.name, kind_: cp.kind, tiers_: cp.tiers, start_: cp.start_date, end_: cp.end_date,
        days_: cp.days, ts_: cp.trade_start, te_: cp.trade_end, rules_: cp.rules, status_: 'approved' }, t, competitions);
    }
    if (t.matches('[data-bc-approve]')) {
      var bc = BC.filter(function (x) { return String(x.id) === t.getAttribute('data-bc-approve'); })[0];
      if (bc && confirm('Approve this message? It is sent only after the team group ✅.')) A.call('pc_admin_broadcast_save', { id_: bc.id, segment_: bc.segment, channel_: bc.channel, body_: bc.body, status_: 'approved' }, t, broadcast);
    }
    if (t.matches('[data-p-close]')) { OPEN = null; $('[data-p-detail]').innerHTML = ''; }
    if (t.matches('[data-p-edit]')) partnerForm((CACHE.partners || []).filter(function (x) { return x.code === t.getAttribute('data-p-edit'); })[0]);
    if (t.matches('[data-p-csv]')) csv('pipclash-influencers.csv', ['code', 'name', 'contact', 'platform', 'followers', 'rate_now', 'bookings', 'players', 'entries', 'fees', 'earned', 'paid', 'due', 'pay_to'],
      CACHE.partners.map(function (p) { return [p.code, p.name, p.contact, p.platform, p.followers, p.rate_now, p.bookings, p.players, p.entries, p.fees, p.earned, p.paid, p.due, p.pay_to]; }));
    if (t.matches('[data-b-csv]')) csv('pipclash-bookings.csv', ['created_at', 'name', 'contact', 'country', 'tier', 'ref', 'code'],
      CACHE.bookings.map(function (x) { return [x.created_at, x.name, x.contact, x.country, x.tier, x.ref, x.code]; }));
    if (t.matches('[data-j-copy]')) {
      var D = CACHE || {}, q = ($('[data-j-q]').value || '').trim();
      var ctx = 'PipClash ops context (' + new Date().toISOString().slice(0, 16) + 'Z): bookings ' + (D.bookings || []).length + ', accounts ' + (D.profiles || []).length +
        ', partners ' + (D.partners || []).length + ', partner due ' + money(sum(D.partners || [], function (p) { return p.due; })) + '.\nTask: ' + q;
      navigator.clipboard.writeText(ctx); $('[data-j-msg]').textContent = 'Copied – paste in Claude.';
    }
  });
  root.addEventListener('submit', function (e) {
    var f = e.target, v = function (n) { return (f.elements[n] && f.elements[n].value || '').trim(); };
    if (f.matches('[data-cr-save]')) {
      e.preventDefault(); if (DEMO) { alert('Demo – save only works after login.'); return; }
      A.call('pc_admin_creative_save', { id_: null, title_: v('t'), kind_: v('k'), url_: v('u'), caption_: v('c'), active_: true }, f.querySelector('[type=submit]'), creatives);
      return;
    }
    if (f.matches('[data-cp-save]')) {
      e.preventDefault(); if (DEMO) { alert('Demo – save only works after login.'); return; }
      var tiers = v('tiers').split(/[ ,]+/).map(Number).filter(function (x) { return [10, 25, 50].indexOf(x) >= 0; });
      if (!tiers.length) { alert('Tables: 10, 25 or 50'); return; }
      A.call('pc_admin_competition_save', { id_: null, name_: v('n'), kind_: v('k'), tiers_: tiers, start_: v('s') || null, end_: v('e') || null,
        days_: v('d') || 'Mon-Fri', ts_: v('ts') || '16:30', te_: v('te') || '19:30', rules_: v('r') || null, status_: 'draft' }, f.querySelector('[type=submit]'), competitions);
      return;
    }
    if (f.matches('[data-bc-save]')) {
      e.preventDefault(); if (DEMO) { alert('Demo – save only works after login.'); return; }
      if (/\b(game|earn|invest|investment|guaranteed)\b/i.test(v('b'))) { alert('Mana shabd: game / earn / invest / guaranteed – badlo.'); return; }
      A.call('pc_admin_broadcast_save', { id_: null, segment_: v('s'), channel_: v('c'), body_: v('b'), status_: 'draft' }, f.querySelector('[type=submit]'), broadcast);
      return;
    }
    if (f.matches('[data-p-save]')) {
      e.preventDefault();
      var args = { c: v('c'), nm: v('nm'), p: (+v('p') || 0) / 100, bp: (+v('p') || 0) / 100, bd: 0, start: v('start') || null, on_: v('on') === '1',
                   contact_: v('contact') || null, platform_: v('platform') || null, followers_: v('followers') ? +v('followers') : null, country_: v('country') || null, pay_to_: v('pay') || null, notes_: v('notes') || null, own_: v('own') || null };
      if (!(args.p >= 0.05 && args.p <= 0.10)) { alert('Commission must be between 5% and 10%.'); return; }
      if (DEMO) { alert('Demo – save only works after login.'); return; }
      A.call('pc_admin_partner_save', args, f.querySelector('[type=submit]'), function () { CACHE = null; OPEN = args.c.toUpperCase(); influencers(); });
    }
    if (f.matches('[data-p-pay]')) {
      e.preventDefault();
      if (DEMO) { alert('Demo – payout only works after login.'); return; }
      if (!confirm('Save payout of $' + v('amt') + ' to ' + OPEN + '? Only do this after the USDT was sent.')) return;
      A.call('pc_admin_partner_pay', { c: OPEN, amt: +v('amt'), tx: v('tx'), d_from: v('f') || null, d_to: v('t') || null }, f.querySelector('[type=submit]'), function () { CACHE = null; influencers(); });
    }
  });
  root.addEventListener('input', function (e) {
    if (e.target.matches('[data-b-q],[data-b-tier]')) {
      var q = ($('[data-b-q]').value || '').toLowerCase(), tr = $('[data-b-tier]').value;
      root.querySelectorAll('[data-b-table] tbody tr').forEach(function (r) { r.hidden = (q && r.getAttribute('data-s').indexOf(q) < 0) || (tr && r.getAttribute('data-t') !== tr); });
    }
    if (e.target.matches('[data-p-q]')) {
      var s = e.target.value.toLowerCase();
      root.querySelectorAll('[data-p-table] tbody tr').forEach(function (r) { r.hidden = s && r.textContent.toLowerCase().indexOf(s) < 0; });
    }
  });
  root.addEventListener('change', function (e) { if (e.target.matches('[data-b-tier]')) e.target.dispatchEvent(new Event('input', { bubbles: true })); });


  /* ---------- 7 Nov: A20 campaigns · A21 creatives · A22 competitions · A23 broadcast · A11 fraud IP/device ---------- */
  var CR = [], CP = [], BC = [];
  function rpcP(fn, args) {
    if (DEMO) return Promise.resolve({ data: null });
    return A.sb.rpc(fn, args || {}).then(function (r) { return r; }, function (e) { return { error: e }; });
  }
  function tbl(head, rows, empty) {
    return '<div class="o-scroll"><table class="o-table"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (rows.join('') || '<tr><td colspan="' + head.length + '" class="o-note">' + (empty || 'Abhi kuch nahi.') + '</td></tr>') + '</tbody></table></div>';
  }
  function campaigns() {
    pane().innerHTML = '<div class="o-note">Loading…</div>';
    rpcP('pc_admin_campaigns').then(function (r) {
      var d = r.data || {}, B = d.bookings || [], S = d.signups || [];
      pane().innerHTML = demoBar() + sqlHint(r.error) +
        '<div class="o-card"><h3>Campaign link kaise banaye</h3><div class="o-note">Har post / reel / ad ka alag tag: <b>pipclash.net/?ref=CODE&amp;c=reel1</b> (c = 1–40 akshar: a-z 0-9 _ . -). Booking aur signup dono pe tag judta.</div></div>' +
        '<div class="o-grid2"><div class="o-card"><h3>Bookings by campaign</h3>' + tbl(['Ref', 'Campaign', 'Bookings'], B.map(function (x) { return '<tr><td>' + esc(x.ref) + '</td><td><b>' + esc(x.campaign) + '</b></td><td class="r">' + x.n + '</td></tr>'; })) + '</div>' +
        '<div class="o-card"><h3>Signups + paid entries</h3>' + tbl(['Partner', 'Campaign', 'Signups', 'Paid entries'], S.map(function (x) { return '<tr><td>' + esc(x.partner) + '</td><td><b>' + esc(x.campaign) + '</b></td><td class="r">' + x.n + '</td><td class="r">' + x.paid_entries + '</td></tr>'; })) + '</div></div>';
    });
  }
  function creatives() {
    pane().innerHTML = '<div class="o-note">Loading…</div>';
    (DEMO ? Promise.resolve({ data: [] }) : A.sb.from('pc_creatives').select('*').order('created_at', { ascending: false })).then(function (r) {
      CR = r.data || [];
      pane().innerHTML = demoBar() + sqlHint(r.error) +
        '<div class="o-card"><h3>Add creative</h3><div class="o-sub">Partners apne portal (partner.html) me dekhte + download karte. Sirf group ✅ wali post / reel yahan daalo.</div>' +
        '<form class="o-form" data-cr-save><label>Title<input name="t" required maxlength="120" placeholder="Reel – Then vs Now"></label>' +
        '<label>Type<select name="k"><option>image</option><option>video</option><option>caption</option><option>link</option></select></label>' +
        '<label style="grid-column:1/-1">Link (https://…)<input name="u" placeholder="https://ops.pipclash.net/m/…"></label>' +
        '<label style="grid-column:1/-1">Caption<textarea name="c" rows="3"></textarea></label>' +
        '<div class="o-row" style="grid-column:1/-1"><button class="btn btn-sm" type="submit">Save</button></div></form></div>' +
        '<div class="o-card"><h3>Library (' + CR.length + ')</h3>' + tbl(['Title', 'Type', 'Link', 'Active', ''], CR.map(function (x) {
          return '<tr><td><b>' + esc(x.title) + '</b><div class="o-note">' + esc((x.caption || '').slice(0, 90)) + '</div></td><td>' + esc(x.kind) + '</td><td>' + (x.url ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">open</a>' : '–') + '</td>' +
            '<td>' + (x.active ? '<span class="o-tag g">on</span>' : '<span class="o-tag">off</span>') + '</td><td><button class="btn btn-ghost btn-sm" data-cr-toggle="' + x.id + '">' + (x.active ? 'Hide' : 'Show') + '</button></td></tr>';
        }), 'Library khaali hai.') + '</div>';
    });
  }
  function competitions() {
    pane().innerHTML = '<div class="o-note">Loading…</div>';
    rpcP('pc_admin_competitions').then(function (r) {
      CP = r.data || [];
      var own = DEMO || A.owner();
      pane().innerHTML = demoBar() + sqlHint(r.error) +
        '<div class="o-card"><h3>Naya competition (plan)</h3><div class="o-sub">Abhi engine roz ka battle config.py se chalata. Yahan naye type (weekly / special) ka plan + owner approve; engine se jodna agla kadam.</div>' +
        '<form class="o-form" data-cp-save><label>Name<input name="n" required maxlength="80" placeholder="Weekly Gold Cup"></label>' +
        '<label>Type<select name="k"><option>daily</option><option>weekly</option><option>special</option></select></label>' +
        '<label>Tables<input name="tiers" value="10,25,50"></label>' +
        '<label>Start date<input name="s" type="date"></label><label>End date<input name="e" type="date"></label>' +
        '<label>Days<input name="d" value="Mon-Fri"></label><label>Trade start (UAE)<input name="ts" type="time" value="16:30"></label><label>Trade end (UAE)<input name="te" type="time" value="19:30"></label>' +
        '<label style="grid-column:1/-1">Rules / notes<textarea name="r" rows="3"></textarea></label>' +
        '<div class="o-row" style="grid-column:1/-1"><button class="btn btn-sm" type="submit">Save draft</button></div></form></div>' +
        '<div class="o-card"><h3>All plans</h3>' + tbl(['Name', 'Type', 'Tables', 'Dates', 'Time (UAE)', 'Status', ''], CP.map(function (x) {
          return '<tr><td><b>' + esc(x.name) + '</b><div class="o-note">' + esc((x.rules || '').slice(0, 80)) + '</div></td><td>' + esc(x.kind) + '</td><td>' + esc((x.tiers || []).map(function (t) { return '$' + t; }).join(' ')) + '</td>' +
            '<td>' + esc(x.start_date || '–') + ' → ' + esc(x.end_date || '–') + '<div class="o-note">' + esc(x.days) + '</div></td><td>' + esc(String(x.trade_start).slice(0, 5)) + '–' + esc(String(x.trade_end).slice(0, 5)) + '</td>' +
            '<td><span class="o-pill ' + (x.status === 'approved' ? 'live' : '') + '">' + esc(x.status) + '</span></td>' +
            '<td>' + (own && x.status === 'draft' ? '<button class="btn btn-ghost btn-sm" data-cp-approve="' + x.id + '">Approve</button>' : '') + '</td></tr>';
        }), 'Koi plan nahi.') + '</div>';
    });
  }
  var SEG = { bookers: 'Free seat bookers', players_today: "Today's players", all_players: 'All website players', partners: 'Partners (influencers)', telegram_channel: 'Telegram channel post' };
  function broadcast() {
    pane().innerHTML = '<div class="o-note">Loading…</div>';
    rpcP('pc_admin_broadcasts').then(function (r) {
      BC = r.data || [];
      var own = DEMO || A.owner();
      pane().innerHTML = demoBar() + sqlHint(r.error) +
        '<div class="o-card"><h3>Naya message (draft)</h3><div class="o-sub">Yahan se message apne-aap NAHI jaata. Draft → owner Approve → team group ✅ → "Copy" daba ke Telegram / email me haath se bhejo. Mana shabd (game / earn / invest / guaranteed) save hi nahi honge.</div>' +
        '<form class="o-form" data-bc-save><label>Kisko<select name="s">' + Object.keys(SEG).map(function (k) { return '<option value="' + k + '">' + SEG[k] + '</option>'; }).join('') + '</select></label>' +
        '<label>Kaise<select name="c"><option value="telegram">Telegram</option><option value="email">Email</option></select></label>' +
        '<label style="grid-column:1/-1">Message (English, UAE time)<textarea name="b" rows="5" required minlength="5" maxlength="4000"></textarea></label>' +
        '<div class="o-row" style="grid-column:1/-1"><button class="btn btn-sm" type="submit">Save draft</button></div></form></div>' +
        '<div class="o-card"><h3>Messages</h3>' + tbl(['When', 'To', 'Via', 'Message', 'Status', ''], BC.map(function (x) {
          return '<tr><td>' + uae(x.created_at) + '</td><td>' + esc(SEG[x.segment] || x.segment) + '</td><td>' + esc(x.channel) + '</td><td class="o-note" style="white-space:pre-wrap;max-width:420px">' + esc(x.body) + '</td>' +
            '<td><span class="o-pill ' + (x.status === 'approved' ? 'live' : x.status === 'sent' ? 'end' : '') + '">' + esc(x.status === 'approved' ? 'Approved – haath se bhejo' : x.status) + '</span>' + (x.sent_count ? '<div class="o-note">' + x.sent_count + ' sent</div>' : '') + '</td>' +
            '<td>' + (own && x.status === 'draft' ? '<button class="btn btn-ghost btn-sm" data-bc-approve="' + x.id + '">Approve</button>' : '') + (x.status === 'approved' ? '<button class="btn btn-ghost btn-sm" data-bc-copy="' + x.id + '">Copy</button>' : '') + '</td></tr>';
        }), 'Koi message nahi.') + '</div>';
    });
  }
  function allRows(tb, cols) {   // C31 (7 Nov): Supabase 1000 row pe rukta – page-page sab lo, total galat na ho
    var out = [], step = 1000;
    function page(i) {
      return sb.from(tb).select(cols).range(i, i + step - 1).then(function (r) {
        if (r.error) return { data: out, error: r.error };
        out = out.concat(r.data || []);
        return (r.data || []).length === step && i < 50000 ? page(i + step) : { data: out, error: null };
      }, function (e) { return { data: out, error: e }; });
    }
    return page(0);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-bc-copy]'); if (!b) return;
    var m = (BC || []).filter(function (x) { return String(x.id) === b.getAttribute('data-bc-copy'); })[0]; if (!m) return;
    (navigator.clipboard ? navigator.clipboard.writeText(m.body) : Promise.reject()).then(function () { b.textContent = 'Copied ✓'; }, function () { b.textContent = 'Copy fail'; });
  });
  function fraudExtra() {      // risk page ke neeche: IP / device (pc_seen)
    var box = $('[data-fraud-x]'); if (!box || DEMO) return;
    rpcP('pc_admin_fraud').then(function (r) {
      var d = r.data || {};
      var row = function (x, k) { return '<div class="row"><span>' + esc(k === 'ip' ? 'IP ' + x.ip : 'Device ' + x.dev + '…') + ' · <b>' + x.accounts + ' accounts</b></span><span class="o-note">' + esc((x.names || []).join(', ')) + '</span></div>'; };
      box.innerHTML = '<div class="o-card"><h3>Same IP / device (30 din)</h3><div class="o-sub">' + (d.tracked_accounts || 0) + ' accounts tracked · ghar / cafe ka WiFi bhi same IP deta – sirf shak, seedha DQ nahi</div>' + sqlHint(r.error) +
        '<div class="o-list">' + ((d.same_ip || []).map(function (x) { return row(x, 'ip'); }).concat((d.same_device || []).map(function (x) { return row(x, 'dev'); })).join('') || '<span class="o-note">Kuch shak wala nahi.</span>') + '</div>' +
        '<h3 style="margin-top:12px">Refer – dono ek IP / device pe</h3><div class="o-list">' + ((d.ref_same_place || []).map(function (x) { return '<div class="row"><span>' + esc(x.referrer) + ' → ' + esc(x.friend) + '</span><span class="o-pill bad">' + esc(x.why) + '</span></div>'; }).join('') || '<span class="o-note">Koi nahi.</span>') + '</div></div>';
    });
  }
  var SECTIONS = { dash: dash, influencers: influencers, bookings: bookings, command: command, today: today, risk: risk, daily: daily,
                   campaigns: campaigns, creatives: creatives, competitions: competitions, broadcast: broadcast };
  function title() { var h = (location.hash || '#dash').slice(1).split('?')[0]; TAB = h; var el = $('[data-ops-title]'); if (el) el.textContent = TITLES[h] || 'Dashboard'; }
  function rerender() { if (SECTIONS[TAB]) SECTIONS[TAB](); else if (A && A.render) A.render(); }
  function route(t) {
    TAB = SECTIONS[t] ? t : 'dash';
    root.querySelectorAll('[data-a-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-a-tab') === TAB)); });
    history.replaceState(null, '', '#' + TAB); title();
    if (!SECTIONS[t]) { pane().innerHTML = demoBar() + '<div class="o-card"><h3>' + esc(TITLES[t] || t) + '</h3><p class="o-note">This section uses the live database (deposits, KYC, battles, players…). It works after you log in with 2FA – same as the old admin panel.</p></div>'; return; }
    SECTIONS[TAB]();
  }

  if (DEMO) {
    root.querySelectorAll('[data-a-view]').forEach(function (v) { v.hidden = v.getAttribute('data-a-view') !== 'main'; });
    $('[data-a-me]').innerHTML = '<b>Owner</b> · demo';
    $('[data-a-mode]').innerHTML = '<span class="tag-wait">DEMO DATA</span> design preview';
    route((location.hash || '#dash').slice(1));
  } else if (A) {
    Object.keys(SECTIONS).forEach(function (k) { A.register(k, function () { TAB = k; title(); SECTIONS[k](); }); });
    window.addEventListener('hashchange', title); title();
    // A17 (7 Nov): staff ka area (finance / support / marketing) – sirf apne kaam ka menu. Paise wale kaam SQL me pehle se owner-only.
    var AREA = { finance: ['dash', 'money', 'daily', 'influencers', 'reports', 'log'], support: ['dash', 'today', 'support', 'players', 'bookings', 'battle', 'risk'],
                 marketing: ['dash', 'command', 'influencers', 'bookings', 'campaigns', 'creatives', 'broadcast'] };
    setTimeout(function () {
      if (!A.sb || A.owner()) return;
      A.sb.rpc('pc_admin_my_area').then(function (r) {
        var keep = r && r.data && AREA[r.data.area]; if (!keep) return;
        root.querySelectorAll('[data-a-tab]').forEach(function (b) { if (keep.indexOf(b.getAttribute('data-a-tab')) < 0) b.hidden = true; });
      }, function () { });
    }, 1500);
  }
})();
