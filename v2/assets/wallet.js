/* PipClash – Wallet: balance, USDT deposit (TXID), KYC (ID photo), withdrawal, history.
   Balance kabhi browser se nahi badalta – sirf Supabase ke functions (pc_request_deposit, pc_request_withdraw ...). */
(function () {
  'use strict';
  var SB_URL = 'https://vrcjgxnafmuxfkybtkbz.supabase.co';
  var SB_KEY = 'sb_publishable_hJfAzBCqJKrJkNmLNEsndA_UuFCLH6f';   // public key – website ke liye hi hai
  var root = document.querySelector('[data-wallet]');
  if (!root || !window.supabase) return;
  var sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'implicit' } });
  var $ = function (s) { return root.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var usd = function (v) { v = Number(v) || 0; return (v < 0 ? '−' : '') + '$' + Math.abs(v).toFixed(2); };
  var when = function (iso) { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
  var S = {}, user = null, kyc = null;

  var ERR = {
    INSUFFICIENT_BALANCE: 'Not enough balance.', MIN_DEPOSIT: 'Amount is below the minimum deposit.', MIN_WITHDRAW: 'Amount is below the minimum withdrawal.',
    BAD_TXID: 'Please paste the full transaction ID (TXID / hash).', BAD_ADDRESS: 'Please paste your full USDT wallet address.',
    TOO_MANY_PENDING: 'You already have 3 deposits waiting. Please wait until they are checked.', ONE_PENDING: 'You already have a withdrawal waiting. Please wait until it is paid.',
    KYC_REQUIRED: 'Please verify your ID first (below).', NO_PROFILE: 'Please complete your details on My account first.', BAD_NETWORK: 'Please choose TRC20 or BEP20.',
    ALREADY_APPROVED: 'Your ID is already verified.', BAD_PATH: 'Upload failed – please try again.'
  };
  function errText(e) {
    var m = String((e && (e.message || e.error_description)) || e || '');
    for (var k in ERR) if (m.indexOf(k) >= 0) return ERR[k];
    if (/duplicate key|deposits_txid_key/i.test(m)) return 'This TXID was already submitted.';
    return 'Something went wrong. Please try again. (' + m.slice(0, 80) + ')';
  }
  function msg(sel, text, bad) { var el = $(sel); if (el) { el.textContent = text || ''; el.className = 'acc-msg' + (bad ? ' bad' : ''); } }
  function show(name) { root.querySelectorAll('[data-w-view]').forEach(function (v) { v.hidden = v.getAttribute('data-w-view') !== name; }); }
  function tab(name) {
    root.querySelectorAll('[data-w-tab]').forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-w-tab') === name)); });
    root.querySelectorAll('[data-w-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-w-pane') !== name; });
  }

  /* ---------- settings (mode, address, minimum) ---------- */
  function loadSettings() {
    return sb.from('pc_settings').select('key,value').then(function (r) {
      (r.data || []).forEach(function (x) { S[x.key] = x.value; });
      $('[data-w-test]').hidden = S.mode !== 'test';
      $('[data-w-min-dep]').textContent = usd(S.min_deposit || 10);
      $('[data-w-min-wd]').textContent = usd(S.min_withdraw || 10);
      setAddr();
    });
  }
  function setAddr() {
    var net = $('#w-dep-net').value, a = net === 'BEP20' ? S.usdt_bep20 : S.usdt_trc20;
    $('[data-w-addr]').textContent = a || '–';
    $('[data-w-addr-copy]').setAttribute('data-copy', a || '');
    $('[data-w-net-name]').textContent = net === 'BEP20' ? 'BNB Smart Chain (BEP20)' : 'TRON (TRC20)';
  }

  /* ---------- data ---------- */
  function load() {
    sb.auth.getUser().then(function (r) {
      user = r.data && r.data.user;
      if (!user) { show('login'); return; }
      show('main');
      Promise.all([
        sb.from('wallets').select('balance').eq('user_id', user.id).maybeSingle(),
        sb.from('ledger').select('amount,kind,note,balance_after,created_at').eq('user_id', user.id).order('id', { ascending: false }).limit(50),
        sb.from('deposits').select('amount,network,txid,status,note,created_at').eq('user_id', user.id).order('id', { ascending: false }).limit(10),
        sb.from('withdrawals').select('amount,network,address,status,note,created_at').eq('user_id', user.id).order('id', { ascending: false }).limit(10),
        sb.from('kyc').select('status,note').eq('user_id', user.id).maybeSingle(),
        myEntries()
      ]).then(function (x) {
        // Phone pe saaf hisaab: Available (wallet) + battles mein laga + withdraw hold = Total
        var bal = x[0].data ? Number(x[0].data.balance) : 0;
        var ents = (x[5].data || []).filter(function (e) { return Number(e.paid_fee) > 0 && !e.refunded; });
        var inb = ents.reduce(function (a, e) { return a + Number(e.paid_fee); }, 0);
        var wdp = (x[3].data || []).filter(function (w) { return w.status === 'pending'; }).reduce(function (a, w) { return a + Number(w.amount); }, 0);
        kyc = x[4].data;
        $('[data-w-bal]').textContent = usd(bal);
        $('[data-w-inb]').textContent = usd(inb);
        $('[data-w-wdp]').textContent = usd(wdp);
        $('[data-w-wdable]').textContent = kyc && kyc.status === 'approved' ? usd(bal) : 'ID check first';
        $('[data-w-total]').textContent = usd(bal + inb + wdp);
        renderEntries(ents);
        var pend = (x[2].data || []).filter(function (d) { return d.status === 'pending'; }).map(function (d) { return { kind: 'deposit', note: d.network, amount: Number(d.amount), created_at: d.created_at, pending: true }; })
          .concat((x[3].data || []).filter(function (w) { return w.status === 'pending'; }).map(function (w) { return { kind: 'withdraw', note: w.network, amount: -Number(w.amount), created_at: w.created_at, pending: true }; }));
        renderHistory(pend.concat(x[1].data || []));
        renderReq('[data-w-deps]', x[2].data || [], 'deposit');
        renderReq('[data-w-wds]', x[3].data || [], 'withdraw');
        renderKyc();
      });
    });
  }
  function myEntries() {   // tier column supabase_tiers.sql ke baad aata hai – usse pehle bina tier
    var q = function (cols) { return sb.from('web_entries').select(cols).eq('user_id', user.id).gte('contest_date', uaeDate()).in('status', ['pending', 'joined']).order('contest_date', { ascending: true }); };
    return q('id,contest_date,status,tier,paid_fee,refunded').then(function (r) { return r.error ? q('id,contest_date,status,paid_fee,refunded') : r; });
  }
  function uaeDate() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date()); }
  var TNAME = { 10: 'STARTER $10', 25: 'PRO $25', 50: 'ELITE $50' };
  function renderEntries(ents) {
    var box = $('[data-w-entries]'); if (!box) return;
    box.hidden = !ents.length;
    var day = function (d) { return d === uaeDate() ? 'Today' : new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); };
    box.innerHTML = '<div class="v2-lbl">Your entries</div>' + ents.map(function (e) {
      return '<div class="v2-row v2-erow"><span><b>' + esc(TNAME[e.tier] || ('$' + Number(e.paid_fee))) + '</b> <span class="v2-mut">· ' + day(e.contest_date) + '</span></span>' +
        '<span class="v2-row" style="gap:8px"><span class="v2-chip v2-acc">' + (e.status === 'joined' ? 'IN BATTLE' : 'ENTERED') + '</span>' +
        (e.status === 'pending' ? '<button class="btn btn-ghost btn-sm" type="button" data-w-cancel="' + (e.tier || '') + '" data-w-fee="' + Number(e.paid_fee) + '">Cancel</button>' : '') + '</span></div>';
    }).join('') + '<p class="v2-mut" style="margin:8px 0 0">Cancel gives the fee back to your wallet until you are entered into the battle at 10:00 AM UAE.</p>';
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
               prize: 'Prize', referral: 'Referral reward', adjust: 'Adjustment' };
  function renderHistory(rows) {   // final design: line + status chip + bacha balance
    $('[data-w-hist]').innerHTML = rows.length ? rows.map(function (r) {
      var up = r.amount >= 0;
      var m = /\$(\d+)/.exec(r.note || ''), fee = m && +m[1], TN = { 10: 'STARTER', 25: 'PRO', 50: 'ELITE' };
      var label = (r.kind === 'entry' || r.kind === 'entry_refund') && fee ? (r.kind === 'entry' ? 'Entry' : 'Refund') + ' · ' + (TN[fee] ? TN[fee] + ' ' : '') + '$' + fee
        : esc(KIND[r.kind] || r.kind) + (r.note ? ' · ' + esc(r.note) : '');
      return '<div class="v2-tx"><div><div>' + label + '</div>' +
        '<div class="v2-row" style="justify-content:flex-start;gap:6px;margin-top:4px">' + (r.pending ? '<span class="v2-chip v2-gold">PENDING</span>' : '<span class="v2-chip v2-up">COMPLETED</span>') +
        '<span class="v2-mut" style="font-size:12px">' + when(r.created_at) + '</span></div></div>' +
        '<div style="text-align:right"><b class="tn ' + (r.pending ? '' : (up ? 'up' : 'down')) + '">' + (up ? '+' : '') + usd(r.amount) + '</b>' +
        '<div class="v2-mut tn" style="font-size:12px">' + (r.pending ? 'checking' : 'bal ' + usd(r.balance_after)) + '</div></div></div>';
    }).join('') : '<div class="v2-mut">No transactions yet.</div>';
  }
  var ST = { pending: '<span class="tag-wait">CHECKING</span>', approved: '<span class="tag-ok">ADDED</span>', paid: '<span class="tag-ok">PAID</span>', rejected: '<span class="tag-bad">REJECTED</span>' };
  function renderReq(sel, rows, kind) {
    var box = $(sel); if (!box) return;
    box.innerHTML = rows.map(function (r) {
      return '<div class="w-req">' + (ST[r.status] || esc(r.status)) + '<b class="mono">' + usd(r.amount) + '</b><span class="muted2">' + esc(r.network) + ' · ' + when(r.created_at) + '</span>' +
        '<span class="muted2 w-mono">' + esc(kind === 'deposit' ? r.txid : r.address) + '</span>' + (r.note ? '<span class="muted2">' + esc(r.note) + '</span>' : '') + '</div>';
    }).join('');
  }
  function renderKyc() {
    var st = kyc && kyc.status, ok = st === 'approved';
    $('[data-w-kyc-state]').innerHTML = ok ? '<span class="tag-ok">ID VERIFIED</span>' : (st === 'pending' ? '<span class="tag-wait">ID CHECKING</span> We are checking your ID – usually within a day.'
      : (st === 'rejected' ? '<span class="tag-bad">ID NOT ACCEPTED</span> ' + esc(kyc.note || 'Please upload a clear photo of a valid ID.') : 'Before your first withdrawal, verify your ID once.'));
    $('[data-w-kyc-form]').hidden = ok || st === 'pending';
    $('[data-w-wd-form]').hidden = !ok;
  }

  /* ---------- actions ---------- */
  $('#w-dep-net').addEventListener('change', setAddr);
  root.querySelectorAll('[data-w-tab]').forEach(function (t) { t.addEventListener('click', function () { tab(t.getAttribute('data-w-tab')); }); });
  root.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]');
    if (c && c.getAttribute('data-copy')) navigator.clipboard && navigator.clipboard.writeText(c.getAttribute('data-copy')).then(function () { c.textContent = 'Copied'; setTimeout(function () { c.textContent = 'Copy'; }, 1500); });
  });
  $('[data-w-dep-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var amt = parseFloat($('#w-dep-amt').value), tx = $('#w-dep-tx').value.trim(), net = $('#w-dep-net').value, b = e.submitter || $('[data-w-dep-form] button');
    if (!(amt > 0)) { msg('[data-w-dep-msg]', 'Please enter the amount you sent.', true); return; }
    b.disabled = true; msg('[data-w-dep-msg]', 'Sending…');
    sb.rpc('pc_request_deposit', { amt: amt, net: net, tx: tx }).then(function (r) {
      b.disabled = false;
      if (r.error) { msg('[data-w-dep-msg]', errText(r.error), true); return; }
      msg('[data-w-dep-msg]', 'Received ✅ We check the transaction and add it to your wallet – usually within an hour.');
      $('#w-dep-amt').value = ''; $('#w-dep-tx').value = ''; load();
    });
  });
  $('[data-w-kyc-form]').addEventListener('submit', function (e) {
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
  $('[data-w-wd-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var amt = parseFloat($('#w-wd-amt').value), addr = $('#w-wd-addr').value.trim(), net = $('#w-wd-net').value, b = $('[data-w-wd-form] button');
    if (!(amt > 0)) { msg('[data-w-wd-msg]', 'Please enter an amount.', true); return; }
    if (!confirm('Withdraw ' + usd(amt) + ' USDT to ' + net + ' address\n' + addr + ' ?\n\nPlease check the address – crypto transfers cannot be reversed.')) return;
    b.disabled = true; msg('[data-w-wd-msg]', 'Sending…');
    sb.rpc('pc_request_withdraw', { amt: amt, net: net, addr: addr }).then(function (r) {
      b.disabled = false;
      if (r.error) { msg('[data-w-wd-msg]', errText(r.error), true); return; }
      msg('[data-w-wd-msg]', 'Request received ✅ The amount is held from your balance and paid after a check.');
      $('#w-wd-amt').value = ''; $('#w-wd-addr').value = ''; load();
    });
  });

  // setTimeout: callback ke andar seedha Supabase call = deadlock (naya sign-in 'Loading…' pe atakta tha)
  sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') setTimeout(load, 0); });
  loadSettings().then(load);
  function hashTab() { tab(location.hash === '#withdraw' ? 'wd' : (location.hash === '#deposit' ? 'dep' : '')); }   // form tab dabane pe hi khule
  hashTab(); window.addEventListener('hashchange', hashTab);
})();
