/* PipClash – Wallet (4 pages, ATL jaisa): wallet.html (saar) · deposit.html · withdraw.html · transactions.html.
   Har page pe <div data-wallet="overview|deposit|withdraw|transactions">. Ek hi file – jo cheez page pe nahi, usko chhoti nahi.
   Balance kabhi browser se nahi badalta – sirf Supabase ke functions (pc_request_deposit, pc_request_withdraw ...). */
(function () {
  'use strict';
  var SB_URL = 'https://vrcjgxnafmuxfkybtkbz.supabase.co';
  var SB_KEY = 'sb_publishable_hJfAzBCqJKrJkNmLNEsndA_UuFCLH6f';   // public key – website ke liye hi hai
  var root = document.querySelector('[data-wallet]');
  if (!root || !window.supabase) return;
  var PAGE = root.getAttribute('data-wallet') || 'overview';
  // purane link (wallet.html#deposit / #withdraw) – naye page pe bhejo
  if (PAGE === 'overview' && /^#(deposit|withdraw)$/.test(location.hash)) { location.replace(location.hash.slice(1) + '.html'); return; }
  var sb = window.PC_SB = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'implicit' } });   // v2.js bhi yahi use karta hai
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
  var setText = function (s, t) { $$(s).forEach(function (el) { el.textContent = t; }); };
  var on = function (s, ev, fn) { var el = $(s); if (el) el.addEventListener(ev, fn); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var usd = function (v) { v = Number(v) || 0; return (v < 0 ? '−' : '') + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };   // $1,250.00 (WW12)
  var when = function (iso) { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }) + ' UAE'; };   // UAE time (WW12)
  var S = {}, user = null, kyc = null, BAL = 0, D = { ledger: [], dep: [], wd: [] }, DONE = null;

  var ERR = {
    INSUFFICIENT_BALANCE: 'Not enough balance.', MIN_DEPOSIT: 'Amount is below the minimum deposit.', MIN_WITHDRAW: 'Amount is below the minimum withdrawal.',
    BAD_TXID: 'Please paste the full transaction ID (TXID / hash).', BAD_ADDRESS: 'Please paste your full USDT wallet address.',
    TOO_MANY_PENDING: 'You already have 3 deposits waiting. Please wait until they are checked.', ONE_PENDING: 'You already have a withdrawal waiting. Please wait until it is paid.',
    KYC_REQUIRED: 'Please verify your ID first.', OTP_REQUIRED: 'Please confirm with the email code first.',
    ADDRESS_ON_HOLD: 'For your safety, a new withdrawal address unlocks 24 hours after it is added. Please try again later.', NO_PROFILE: 'Please complete your details on My account first.', BAD_NETWORK: 'Please choose TRC20 or BEP20.',
    ALREADY_APPROVED: 'Your ID is already verified.', BAD_PATH: 'Upload failed – please try again.',
    GET_AMOUNT_FIRST: 'Please tap “Get my exact amount” first.', AMOUNT_MISMATCH: 'Please send and enter exactly your amount – get a new one if you changed the network.',
    TXID_USED: 'This TXID was already submitted.', TRY_AGAIN: 'Please try again in a moment.', BEP20_ONLY: 'Withdrawals are paid only on BEP20 (BNB Smart Chain).'
  };
  function errText(e) {
    var m = String((e && (e.message || e.error_description)) || e || '');
    for (var k in ERR) if (m.indexOf(k) >= 0) return ERR[k];
    if (/duplicate key|deposits_txid_key/i.test(m)) return 'This TXID was already submitted.';
    return 'Something went wrong. Please try again. (' + m.slice(0, 80) + ')';
  }
  function msg(sel, text, bad) { var el = $(sel); if (el) { el.textContent = text || ''; el.className = 'acc-msg' + (bad ? ' bad' : ''); } }
  function show(name) { $$('[data-w-view]').forEach(function (v) { v.hidden = v.getAttribute('data-w-view') !== name; }); }

  /* ---------- settings (mode, address, minimum) ---------- */
  function loadSettings() {
    return sb.from('pc_settings').select('key,value').then(function (r) {
      (r.data || []).forEach(function (x) { S[x.key] = x.value; });
      var t = $('[data-w-test]'); if (t) t.hidden = S.mode !== 'test';
      setText('[data-w-min-dep]', usd(S.min_deposit || 10));
      setText('[data-w-min-wd]', usd(S.min_withdraw || 10));
      setAddr();
    });
  }
  function net() { var n = $('#w-dep-net'); return n ? n.value : 'TRC20'; }
  function setAddr() {
    if (!$('[data-w-addr]')) return;
    var a = net() === 'BEP20' ? S.usdt_bep20 : S.usdt_trc20;
    setText('[data-w-addr]', a || '–');
    $('[data-w-addr-copy]').setAttribute('data-copy', a || '');
    setText('[data-w-net-name]', net() === 'BEP20' ? 'BNB Smart Chain (BEP20)' : 'TRON (TRC20)');
    $$('[data-w-net]').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-w-net') === net())); });
    // 5 Nov: gateway jaisa – chain ka logo, rang wala badge, QR
    var nb = root.querySelector('[data-w-net="' + net() + '"] .w-chain'), ci = $('[data-w-chain-ic]');
    if (ci) ci.innerHTML = nb ? nb.outerHTML : '';
    $$('.w-badge').forEach(function (x) { x.classList.toggle('bnb', net() === 'BEP20'); });
    drawQR(a);
  }
  var QR_FOR = null;
  function drawQR(a) {
    var box = $('[data-w-qr]'); if (!box || !a || a === QR_FOR) return;
    if (!window.QRCode) { setTimeout(function () { drawQR(a); }, 400); return; }   // qrcode.min.js abhi load ho raha
    box.innerHTML = ''; QR_FOR = a;
    try { new window.QRCode(box, { text: a, width: 144, height: 144, colorDark: '#0B1020', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M }); }
    catch (e) { box.textContent = ''; }
  }

  /* ---------- data ---------- */
  function load() {
    if (window.PC_DEMO) { demo(); return; }   // preview demo: PDF wale numbers, Supabase nahi
    sb.auth.getUser().then(function (r) {
      user = r.data && r.data.user;
      if (!user) { show('login'); return; }
      show('main');
      var big = PAGE === 'transactions' || PAGE === 'overview';      // totals / poori list ke liye zyada rows
      Promise.all([
        sb.from('wallets').select('balance').eq('user_id', user.id).maybeSingle(),
        sb.from('ledger').select('amount,kind,note,balance_after,created_at').eq('user_id', user.id).order('id', { ascending: false }).limit(big ? 1000 : 50),
        sb.from('deposits').select('id,amount,network,txid,status,note,created_at').eq('user_id', user.id).order('id', { ascending: false }).limit(big ? 200 : 10),
        sb.from('withdrawals').select('amount,network,address,status,note,created_at').eq('user_id', user.id).order('id', { ascending: false }).limit(big ? 200 : 10),
        sb.from('kyc').select('status,note').eq('user_id', user.id).maybeSingle(),
        myEntries()
      ]).then(function (x) {
        BAL = x[0].data ? Number(x[0].data.balance) : 0;
        D = { ledger: x[1].data || [], dep: x[2].data || [], wd: x[3].data || [] };
        kyc = x[4].data;
        var over = uaeHM() >= '19:30', today = uaeDate();
        var ents = (x[5].data || []).filter(function (e) { return Number(e.paid_fee) > 0 && !e.refunded && !(over && e.contest_date === today && e.status === 'joined'); });
        render(ents);
      }).catch(loadFail);
    }).catch(loadFail);
  }
  function loadFail() {     // WEB-8: net gaya / Supabase down – "Loading…" pe hamesha na atke
    show('loading');
    var l = root.querySelector('[data-w-view="loading"]');
    if (l) l.innerHTML = '<p class="muted2">Could not load your wallet – check your internet. <a href="' + location.pathname.split('/').pop() + '">Tap to retry</a></p>';
  }
  function uaeHM() { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); }
  function render(ents) {
    // Phone pe saaf hisaab: Available (wallet) + battles mein laga + withdraw hold = Total
    var inb = ents.reduce(function (a, e) { return a + Number(e.paid_fee); }, 0);
    var wdOpen = D.wd.filter(function (w) { return w.status === 'pending' || w.status === 'processing'; });
    var depOpen = D.dep.filter(function (d) { return d.status === 'pending'; });
    var wdp = wdOpen.reduce(function (a, w) { return a + Number(w.amount); }, 0);
    setText('[data-w-bal]', usd(BAL));
    setText('[data-w-inb]', usd(inb));
    setText('[data-w-wdp]', usd(wdp));
    setText('[data-w-wdable]', kyc && kyc.status === 'approved' ? usd(BAL) : 'ID check first');
    setText('[data-w-total]', usd(BAL + inb + wdp));
    setText('[data-w-dprog]', usd(depOpen.reduce(function (a, d) { return a + Number(d.amount); }, 0)));
    setText('[data-w-dprog-n]', depOpen.length + ' in progress');
    setText('[data-w-wprog]', usd(wdp));
    setText('[data-w-wprog-n]', wdOpen.length + ' awaiting payout');
    renderEntries(ents);
    var pend = depOpen.map(function (d) { return { kind: 'deposit', note: d.network, amount: Number(d.amount), created_at: d.created_at, pending: true }; })
      .concat(wdOpen.map(function (w) { return { kind: 'withdraw', note: w.network, amount: -Number(w.amount), created_at: w.created_at, pending: true }; }));
    renderHistory(pend.concat(D.ledger));
    renderTotals();
    renderReq('[data-w-deps]', D.dep, 'deposit');
    renderReq('[data-w-wds]', D.wd, 'withdraw');
    if ($('[data-w-quote-form]')) loadQuote();
    // AA13: auto credit hua? player ko turant batao (WEB-13: id se – jo deposit ABHI approve hua usi ki amount)
    var okIds = {}, fresh = null;
    D.dep.forEach(function (d) { if (d.status === 'approved') { okIds[d.id] = 1; if (DONE && !DONE[d.id] && !fresh) fresh = d; } });
    if (fresh) { msg('[data-w-quote-msg]', 'Received ✅ ' + usd(fresh.amount) + ' was added to your wallet.'); if ($('[data-w-done]')) showDone(fresh.amount); }
    DONE = okIds;
    // 5 Nov: status line – team check wala (pending) deposit pichle 24 ghante mein = "checking"
    if ($('[data-w-track]')) track(depOpen.some(function (d) { return Date.now() - new Date(d.created_at) < 864e5; }) ? 'check' : 'wait');
    if ($('[data-w-kyc-state]')) renderKyc();
    recv();
    renderTx();
  }
  function demo() {
    var W = window.PC_DEMO.wallet; show('main'); S.usdt_trc20 = S.usdt_trc20 || 'TDemo0000PipClash0000Preview0000x'; S.usdt_bep20 = S.usdt_bep20 || '0xDemo0000PipClash0000Preview0000000000000'; var t = $('[data-w-test]'); if (t) t.hidden = true;
    BAL = W.avail; kyc = { status: 'approved' };
    D = { ledger: W.tx.filter(function (x) { return !x[3]; }).map(function (x) { var k = /deposit/i.test(x[0]) ? 'deposit' : /withdraw/i.test(x[0]) ? 'withdraw' : 'entry'; return { kind: k, note: x[0].split('· ')[1] || '', amount: x[1], balance_after: x[2], created_at: new Date().toISOString() }; }),
          dep: [{ amount: 50, network: 'TRC20', txid: 'demo…', status: 'approved', created_at: new Date().toISOString() }],
          wd: W.tx.filter(function (x) { return x[3]; }).map(function (x) { return { amount: Math.abs(x[1]), network: 'BEP20', address: '0x…', status: 'pending', created_at: new Date().toISOString() }; }) };
    render(window.PC_DEMO.entries.map(function (e) { return { tier: e.tier, paid_fee: e.paid_fee, status: 'pending', contest_date: addDay(uaeDate(), 1) }; }));
  }
  function myEntries() {   // tier column supabase_tiers.sql ke baad aata hai – usse pehle bina tier
    var q = function (cols) { return sb.from('web_entries').select(cols).eq('user_id', user.id).gte('contest_date', uaeDate()).in('status', ['pending', 'joining', 'joined']).order('contest_date', { ascending: true }); };
    return q('id,contest_date,status,tier,paid_fee,refunded').then(function (r) { return r.error ? q('id,contest_date,status,paid_fee,refunded') : r; });
  }
  function addDay(d, n) { var x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function uaeDate() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date()); }
  var TNAME = { 10: 'STARTER $10', 25: 'PRO $25', 50: 'ELITE $50' };
  function renderEntries(ents) {
    var box = $('[data-w-entries]'); if (!box) return;
    box.hidden = !ents.length;
    var day = function (d) { return d === uaeDate() ? 'Today' : new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }); };
    box.innerHTML = '<div class="v2-lbl">' + (ents.every(function (e) { return e.contest_date === uaeDate(); }) ? 'Your entries today' : 'Your upcoming entries') + '</div>' + ents.map(function (e) {
      return '<div class="v2-row v2-erow"><span><b>' + esc(TNAME[e.tier] || ('$' + Number(e.paid_fee))) + '</b> <span class="v2-mut">· ' + day(e.contest_date) + '</span></span>' +
        '<span class="v2-row" style="gap:8px"><span class="v2-chip v2-acc">' + (e.status === 'joined' ? 'IN BATTLE' : 'ENTERED') + '</span>' +
        (e.status === 'pending' ? '<button class="v2-cancel" type="button" data-w-cancel="' + (e.tier || '') + '" data-w-fee="' + Number(e.paid_fee) + '">Cancel</button>' : '') + '</span></div>';
    }).join('');
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-w-cancel]'); if (!b) return;
    var t = b.getAttribute('data-w-cancel'), fee = b.getAttribute('data-w-fee');
    if (!confirm('Cancel this entry? $' + fee + ' goes back to your wallet.')) return;
    b.disabled = true;
    (t ? sb.rpc('pc_cancel_table', { t: +t }) : sb.rpc('pc_cancel_entry')).then(function (r) {
      if (r.error) { b.disabled = false; alert(r.error.message.indexOf('NOTHING_TO_CANCEL') >= 0 ? 'Already entered into the battle – it can’t be cancelled now.' : 'Could not cancel. Please try again.'); return; }
      load();
    });
  });
  var KIND = { deposit: 'Deposit', withdraw: 'Withdrawal', withdraw_refund: 'Withdrawal returned', entry: 'Battle entry', entry_refund: 'Entry refund',
               prize: 'Prize', referral: 'Referral reward', adjust: 'Adjustment', deposit_reverse: 'Deposit reversed', prize_revoke: 'Prize taken back' };
  function txLabel(r) {
    var m = /\$(\d+)/.exec(r.note || ''), fee = m && +m[1], TN = { 10: 'STARTER', 25: 'PRO', 50: 'ELITE' };
    return (r.kind === 'entry' || r.kind === 'entry_refund') && fee ? (r.kind === 'entry' ? 'Entry' : 'Refund') + ' · ' + (TN[fee] ? TN[fee] + ' ' : '') + '$' + fee
      : esc(KIND[r.kind] || r.kind) + (r.note ? ' · ' + esc(r.note) : '');
  }
  function txRow(r) {   // final design: line + status chip + bacha balance
    var up = r.amount >= 0;
    var IC = { deposit: ['↓', 'g'], withdraw: ['↑', 'b'], withdraw_refund: ['↺', 'b'], entry: ['⚔', 'n'], entry_refund: ['↺', 'g'], prize: ['🏆', 'y'],
               referral: ['🤝', 'y'], adjust: ['•', 'n'], deposit_reverse: ['↺', 'r'], prize_revoke: ['↺', 'r'] }[r.kind] || ['•', 'n'];   // 6 Nov: har line ka icon
    return '<div class="v2-tx"><span class="tx-ic ' + IC[1] + '" aria-hidden="true">' + IC[0] + '</span><div style="flex:1;min-width:0"><div>' + txLabel(r) + '</div>' +
      '<div class="v2-row" style="justify-content:flex-start;gap:6px;margin-top:4px">' + (r.pending ? '<span class="v2-chip v2-gold">PENDING</span>' : '<span class="v2-chip v2-up">COMPLETED</span>') +
      '<span class="v2-mut" style="font-size:12px">' + when(r.created_at) + '</span></div></div>' +
      '<div style="text-align:right"><b class="tn ' + (r.pending ? '' : (up ? 'up' : 'down')) + '">' + (up ? '+' : '') + usd(r.amount) + '</b>' +
      '<div class="v2-mut tn" style="font-size:12px">' + (r.pending ? 'checking' : 'balance ' + usd(r.balance_after)) + '</div></div></div>';
  }
  function renderHistory(rows) {
    var box = $('[data-w-hist]'); if (!box) return;
    var lim = +box.getAttribute('data-limit') || 50;
    box.innerHTML = rows.length ? rows.slice(0, lim).map(txRow).join('') : '<div class="v2-mut">No transactions yet. <a href="deposit.html">Make your first deposit</a>.</div>';
  }
  function renderTotals() {   // ATL jaisa: kitna jama, entry fee, inaam, nikala
    var box = $('[data-w-totals]'); if (!box) return;
    var sum = function (k) { return D.ledger.filter(function (l) { return l.kind === k; }).reduce(function (a, l) { return a + Number(l.amount); }, 0); };
    var cell = function (k, v) { return '<div class="v2-row"><span class="v2-mut">' + k + '</span><b class="tn">' + usd(v) + '</b></div>'; };
    box.innerHTML = cell('Deposited', sum('deposit') + sum('deposit_reverse')) + cell('Entry fees', -(sum('entry') + sum('entry_refund'))) +
      cell('Prizes won', sum('prize') + sum('prize_revoke')) + cell('Referral rewards', sum('referral')) +
      cell('Withdrawn', D.wd.filter(function (w) { return w.status === 'paid'; }).reduce(function (a, w) { return a + Number(w.amount); }, 0));
  }
  var ST = { pending: '<span class="tag-wait">CHECKING</span>', approved: '<span class="tag-ok">ADDED</span>', paid: '<span class="tag-ok">PAID</span>', rejected: '<span class="tag-bad">REJECTED</span>',
             reversed: '<span class="tag-bad">REVERSED</span>', processing: '<span class="tag-wait">SENDING</span>' };   // A5 / A1
  function reqRow(r, kind) {
    return '<div class="w-req">' + (ST[r.status] || esc(r.status)) + '<b class="mono">' + usd(r.amount) + '</b><span class="muted2">' + esc(r.network) + ' · ' + when(r.created_at) + '</span>' +
      '<span class="muted2 w-mono">' + esc(kind === 'deposit' ? r.txid : r.address) + '</span>' + (r.note ? '<span class="muted2">' + esc(r.note) + '</span>' : '') + '</div>';
  }
  function renderReq(sel, rows, kind) {
    var box = $(sel); if (!box) return;
    box.innerHTML = rows.length ? rows.slice(0, 10).map(function (r) { return reqRow(r, kind); }).join('')
      : '<p class="v2-mut">' + (kind === 'deposit' ? 'No deposits yet.' : 'No withdrawals yet.') + '</p>';
  }
  function renderKyc() {
    var st = kyc && kyc.status, ok = st === 'approved';
    $('[data-w-kyc-state]').innerHTML = ok ? '<span class="tag-ok">ID VERIFIED</span>' : (st === 'pending' ? '<span class="tag-wait">ID CHECKING</span> We are checking your ID – usually within a day.'
      : (st === 'rejected' ? '<span class="tag-bad">ID NOT ACCEPTED</span> ' + esc(kyc.note || 'Please upload a clear photo of a valid ID.') : 'Before your first withdrawal, verify your ID once.'));
    $('[data-w-kyc-form]').hidden = ok || st === 'pending';
    $('[data-w-wd-form]').hidden = !ok;
  }

  /* ---------- Transactions page: 3 tab + filter + pages ---------- */
  var TT = 'ledger', TF = '', PG = 0, PER = 20;
  var FK = { entry: ['entry'], prize: ['prize', 'prize_revoke'], refund: ['entry_refund', 'withdraw_refund'], referral: ['referral'] };
  function renderTx() {
    var box = $('[data-w-tlist]'); if (!box) return;
    setText('[data-w-tn="ledger"]', D.ledger.length); setText('[data-w-tn="dep"]', D.dep.length); setText('[data-w-tn="wd"]', D.wd.length);
    $$('[data-w-ttab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-w-ttab') === TT)); });
    $$('[data-w-f]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-w-f') === TF)); });
    var f = $('[data-w-filt]'); if (f) f.hidden = TT !== 'ledger';
    var rows = TT === 'ledger' ? D.ledger.filter(function (l) { return !TF || FK[TF].indexOf(l.kind) >= 0; }) : (TT === 'dep' ? D.dep : D.wd);
    var pages = Math.max(1, Math.ceil(rows.length / PER)); PG = Math.min(PG, pages - 1);
    var part = rows.slice(PG * PER, PG * PER + PER);
    box.innerHTML = part.length ? part.map(function (r) { return TT === 'ledger' ? txRow(r) : reqRow(r, TT === 'dep' ? 'deposit' : 'withdraw'); }).join('')
      : '<div class="v2-mut" style="padding:14px 0">' + (TT === 'ledger' ? 'No entry fees, prizes or refunds yet. <a href="join.html">Join a battle</a>.' : TT === 'dep' ? 'No deposits yet. <a href="deposit.html">Deposit</a>.' : 'No withdrawals yet.') + '</div>';
    setText('[data-w-pinfo]', rows.length + ' transactions · page ' + (PG + 1) + ' of ' + pages);
    $$('[data-w-pg]').forEach(function (b) { var d = +b.getAttribute('data-w-pg'); b.disabled = (d < 0 && PG === 0) || (d > 0 && PG >= pages - 1); });
  }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-w-ttab]'), f = e.target.closest('[data-w-f]'), p = e.target.closest('[data-w-pg]');
    if (t) { TT = t.getAttribute('data-w-ttab'); PG = 0; renderTx(); }
    if (f) { TF = f.getAttribute('data-w-f'); PG = 0; renderTx(); }
    if (p) { PG = Math.max(0, PG + (+p.getAttribute('data-w-pg'))); renderTx(); }
  });

  /* ---------- Deposit page ---------- */
  root.addEventListener('click', function (e) {   // network card = select ki value
    var b = e.target.closest('[data-w-net]'), s = $('#w-dep-net'); if (!b || !s) return;
    s.value = b.getAttribute('data-w-net'); setAddr(); quote(null);
  });
  // S5: har player ka apna exact amount ($50.37) – usi se pata chalta hai ki TXID usi ka hai
  var QUOTE_OK = true;     // false = supabase_paid_round2.sql abhi nahi chala – purana form
  var Q = null, DONE_SHOWN = false, EXP_T = null;
  function quote(q) {
    if (!$('[data-w-send]')) return;
    var on2 = !!q || !QUOTE_OK;
    Q = q;
    $('[data-w-send]').hidden = !on2 || DONE_SHOWN; $('[data-w-dep-form]').hidden = !on2;
    var fa = $('[data-w-form-area]'); if (fa) fa.hidden = (!!q && QUOTE_OK) || DONE_SHOWN;   // invoice dikhe to form chhupao
    $('#w-dep-amt').readOnly = QUOTE_OK;
    if (q) {
      setText('[data-w-quote-amt]', Number(q.amount).toFixed(2) + ' USDT'); $('[data-w-amt-copy]').setAttribute('data-copy', Number(q.amount).toFixed(2));
      $('#w-dep-amt').value = Number(q.amount).toFixed(2);
      if (q.network && net() !== q.network) { $('#w-dep-net').value = q.network; }
      setAddr();
      expTick();
    } else if (QUOTE_OK) $('#w-dep-amt').value = '';
  }
  function expTick() {     // exact amount 24 ghante tak reserved – ulti ginti
    clearTimeout(EXP_T);
    var el = $('[data-w-exp]'); if (!el || !Q) return;
    var end = new Date(Q.created_at || Date.now()).getTime() + 864e5, s = Math.max(0, Math.floor((end - Date.now()) / 1000));
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    el.textContent = s ? '⏱ ' + p(Math.floor(s / 3600)) + ':' + p(Math.floor(s % 3600 / 60)) + ':' + p(s % 60) : 'Expired – get a new amount';
    if (s) EXP_T = setTimeout(expTick, 1000);
  }
  function track(st) {     // wait → check → done
    var order = ['wait', 'check', 'done'], k = order.indexOf(st);
    $$('[data-w-st]').forEach(function (li) {
      var i = order.indexOf(li.getAttribute('data-w-st'));
      li.className = i < k ? 'ok' : i === k ? (st === 'done' ? 'ok' : 'on') : '';
    });
  }
  function showDone(amount) {
    DONE_SHOWN = true; setText('[data-w-done-amt]', usd(amount));
    var d = $('[data-w-done]'); if (d) d.hidden = false;
    var s = $('[data-w-send]'); if (s) s.hidden = true;
    var fa = $('[data-w-form-area]'); if (fa) fa.hidden = true;
  }
  root.addEventListener('click', function (e) {
    var c = e.target.closest('[data-w-chip]');
    if (c) { $('#w-dep-want').value = c.getAttribute('data-w-chip'); var f = $('[data-w-quote-form]'); if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true })); return; }
    if (e.target.closest('[data-w-new]')) { DONE_SHOWN = false; quote(null); var fa = $('[data-w-form-area]'); if (fa) fa.hidden = false; }
  });
  function loadQuote() {
    if (!user) return;
    sb.from('deposit_quotes').select('amount,network,created_at').eq('user_id', user.id).maybeSingle().then(function (r) {
      if (r.error) { QUOTE_OK = false; $('[data-w-quote-form]').hidden = true; quote(null); return; }
      var q = r.data; quote(q && Date.now() - new Date(q.created_at) < 864e5 ? q : null);
    });
  }
  on('[data-w-quote-form]', 'submit', function (e) {
    e.preventDefault();
    var want = parseFloat($('#w-dep-want').value), b = e.submitter || $('[data-w-quote-form] button');
    if (!(want > 0)) { msg('[data-w-quote-msg]', 'Please type how much you want to add.', true); return; }
    if (window.PC_DEMO) { quote({ amount: Math.floor(want) + 0.37, network: net(), created_at: new Date().toISOString() }); return; }   // preview demo
    b.disabled = true;
    sb.rpc('pc_deposit_amount', { base: want, net: net() }).then(function (r) {
      b.disabled = false;
      if (r.error) { msg('[data-w-quote-msg]', errText(r.error), true); return; }
      msg('[data-w-quote-msg]', ''); quote({ amount: r.data, network: net(), created_at: new Date().toISOString() });
    });
  });
  root.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]');
    if (c && c.getAttribute('data-copy')) navigator.clipboard && navigator.clipboard.writeText(c.getAttribute('data-copy')).then(function () { c.textContent = 'Copied'; setTimeout(function () { c.textContent = 'Copy'; }, 1500); });
  });
  on('[data-w-dep-form]', 'submit', function (e) {
    e.preventDefault();
    var amt = parseFloat($('#w-dep-amt').value), tx = $('#w-dep-tx').value.trim(), b = e.submitter || $('[data-w-dep-form] button');
    if (!(amt > 0)) { msg('[data-w-dep-msg]', 'Please enter the amount you sent.', true); return; }
    b.disabled = true; msg('[data-w-dep-msg]', 'Sending…');
    sb.rpc('pc_request_deposit', { amt: amt, net: net(), tx: tx }).then(function (r) {
      b.disabled = false;
      if (r.error) { msg('[data-w-dep-msg]', errText(r.error), true); return; }
      msg('[data-w-dep-msg]', 'Received ✅ We check the transaction and add it to your wallet – usually within an hour.');
      $('#w-dep-amt').value = ''; $('#w-dep-tx').value = ''; load();
    });
  });

  /* ---------- Withdraw page ---------- */
  function recv() { var a = $('#w-wd-amt'); if (a) setText('[data-w-recv]', usd(Math.max(0, parseFloat(a.value) || 0))); }
  on('#w-wd-amt', 'input', recv);
  on('[data-w-max]', 'click', function () { $('#w-wd-amt').value = BAL > 0 ? BAL.toFixed(2) : ''; recv(); });
  on('[data-w-kyc-form]', 'submit', function (e) {
    e.preventDefault();
    var f = $('#w-kyc-file').files[0], b = $('[data-w-kyc-form] button');
    if (!f) { msg('[data-w-kyc-msg]', 'Please choose a photo of your ID.', true); return; }
    if (f.size > 8 * 1024 * 1024) { msg('[data-w-kyc-msg]', 'Photo is too big (max 8 MB).', true); return; }
    var ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
    var path = user.id + '/id-' + Date.now() + '.' + ext;
    b.disabled = true; msg('[data-w-kyc-msg]', 'Uploading…');
    sb.storage.from('kyc').upload(path, f, { upsert: false, contentType: f.type || 'image/jpeg' }).then(function (u) {
      if (u.error) { b.disabled = false; msg('[data-w-kyc-msg]', errText(u.error), true); return; }
      sb.rpc('pc_submit_kyc', { path: path }).then(function (r) {
        b.disabled = false;
        if (r.error) { msg('[data-w-kyc-msg]', errText(r.error), true); return; }
        msg('[data-w-kyc-msg]', 'Uploaded ✅ We will check it soon.'); load();
      });
    });
  });
  on('[data-w-wd-form]', 'submit', function (e) {
    e.preventDefault();
    var amt = parseFloat($('#w-wd-amt').value), addr = $('#w-wd-addr').value.trim(), nt = $('#w-wd-net').value, b = $('[data-w-wd-form] button[type=submit]');
    if (!(amt > 0)) { msg('[data-w-wd-msg]', 'Please enter an amount.', true); return; }
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) { msg('[data-w-wd-msg]', 'This is not a BEP20 address. It must start with 0x and have 42 characters (choose “BSC / BEP20” in your wallet).', true); return; }
    if (!confirm('Withdraw ' + usd(amt) + ' USDT to ' + nt + ' address\n' + addr + ' ?\n\nPlease check the address – crypto transfers cannot be reversed.')) return;
    withOtp(b, function () {
      b.disabled = true; msg('[data-w-wd-msg]', 'Sending…');
      sb.rpc('pc_request_withdraw', { amt: amt, net: nt, addr: addr }).then(function (r) {
        b.disabled = false;
        if (r.error) { msg('[data-w-wd-msg]', errText(r.error), true); return; }
        if (r.data === -1) {                                   // naya address – 24h hold
          var t = new Date(Date.now() + 864e5);
          msg('[data-w-wd-msg]', 'New address saved 🔒 For your safety, withdrawals to a new address unlock after 24 hours (' +
            t.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '). Your balance is not touched. Please submit again then.');
          return;
        }
        msg('[data-w-wd-msg]', 'Request received ✅ The amount is held from your balance and paid after a check.');
        $('#w-wd-amt').value = ''; $('#w-wd-addr').value = ''; recv(); load();
      });
    });
  });

  /* Withdraw OTP: pichhle 10 min mein email code nahi = code bhejo, daalo, phir aage (server bhi check karta – pc_fresh_otp) */
  function otpFresh(sess) {
    try {
      var p = JSON.parse(atob(sess.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return (p.amr || []).some(function (a) { return /otp|magiclink/.test(a.method) && a.timestamp > Date.now() / 1000 - 540; });
    } catch (e) { return false; }
  }
  function withOtp(b, go) {
    sb.auth.getSession().then(function (r) {
      var sess = r.data && r.data.session;
      if (sess && otpFresh(sess)) return go();
      var email = user && user.email;
      if (!email) { msg('[data-w-wd-msg]', 'Please log in again.', true); return; }
      b.disabled = true; msg('[data-w-wd-msg]', 'Sending a code to ' + email + '…');
      sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: false } }).then(function (s) {
        b.disabled = false;
        if (s.error) { msg('[data-w-wd-msg]', 'Could not send the code: ' + s.error.message, true); return; }
        var box = $('[data-w-otp]');
        if (!box) {
          box = document.createElement('div'); box.setAttribute('data-w-otp', ''); box.className = 'w-otp';
          box.innerHTML = '<label class="bk-f"><span>Email code</span><input id="w-otp-code" inputmode="numeric" maxlength="10" autocomplete="one-time-code" placeholder="6-digit code"></label>' +
            '<button type="button" class="btn" data-w-otp-go>Confirm withdrawal</button>';
          $('[data-w-wd-form]').appendChild(box);
        }
        box.hidden = false;
        msg('[data-w-wd-msg]', '📧 We emailed a code to ' + email + '. Enter it below to confirm (check spam too).');
        setTimeout(function () { $('#w-otp-code').focus(); }, 50);
        box.querySelector('[data-w-otp-go]').onclick = function () {
          var code = $('#w-otp-code').value.replace(/\s/g, '');
          if (code.length < 6) { msg('[data-w-wd-msg]', 'Please enter the code from the email.', true); return; }
          this.disabled = true; var me = this;
          sb.auth.verifyOtp({ email: email, token: code, type: 'email' }).then(function (v) {
            me.disabled = false;
            if (v.error) { msg('[data-w-wd-msg]', 'Wrong or expired code. Please try again.', true); return; }
            box.hidden = true; $('#w-otp-code').value = ''; go();
          });
        };
      });
    });
  }

  // setTimeout: callback ke andar seedha Supabase call = deadlock (naya sign-in 'Loading…' pe atakta tha)
  sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') setTimeout(load, 0); });
  loadSettings().then(load, load);
  setTimeout(function () {   // WEB-8: 15 sec baad bhi Loading… = retry ka rasta
    var l = root.querySelector('[data-w-view="loading"]');
    if (l && !l.hidden && !/retry/.test(l.textContent)) l.innerHTML = '<p class="muted2">This is taking long. <a href="' + location.pathname.split('/').pop() + '">Tap to refresh</a></p>';
  }, 15000);
  // AA13: deposit page pe exact amount dikh raha ho to har 20 sec dekho – blockchain se aaya to khud dikhe
  if (PAGE === 'deposit' && !window.PC_DEMO) setInterval(function () { var s = $('[data-w-send]'); if (s && !s.hidden && !document.hidden) load(); }, 20000);
})();
