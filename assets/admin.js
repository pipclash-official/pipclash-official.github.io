/* PipClash – Admin panel (sirf pc_admins wale). Deposit / withdrawal / KYC ka faisla Supabase functions se
   (pc_admin_deposit, pc_admin_withdraw, pc_admin_kyc) – woh khud bhi admin check karte hain. */
(function () {
  'use strict';
  var SB_URL = 'https://vrcjgxnafmuxfkybtkbz.supabase.co';
  var SB_KEY = 'sb_publishable_hJfAzBCqJKrJkNmLNEsndA_UuFCLH6f';   // public key – website ke liye hi hai
  var root = document.querySelector('[data-admin]');
  if (!root || !window.supabase) return;
  var sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'implicit' } });
  var $ = function (s) { return root.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var usd = function (v) { v = Number(v) || 0; return (v < 0 ? '−' : '') + '$' + Math.abs(v).toFixed(2); };
  var when = function (iso) { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
  var TX = { TRC20: 'https://tronscan.org/#/transaction/', BEP20: 'https://bscscan.com/tx/' };
  var P = {}, S = {};

  function show(name) { root.querySelectorAll('[data-a-view]').forEach(function (v) { v.hidden = v.getAttribute('data-a-view') !== name; }); }
  function who(uid) { var p = P[uid]; return p ? '<b>' + esc(p.name) + '</b><div class="muted2" style="font-size:12px">' + esc(p.phone) + '</div>' : '<span class="muted2">' + esc(uid.slice(0, 8)) + '</span>'; }
  function people(ids) {
    ids = ids.filter(function (i) { return i && !P[i]; });
    if (!ids.length) return Promise.resolve();
    return sb.from('profiles').select('id,name,phone').in('id', ids).then(function (r) { (r.data || []).forEach(function (p) { P[p.id] = p; }); });
  }
  function stat(k, v) { var el = $('[data-a-stat="' + k + '"]'); if (el) el.textContent = v; }

  function load() {
    sb.auth.getUser().then(function (r) {
      if (!r.data || !r.data.user) { show('login'); return; }
      sb.rpc('pc_is_admin').then(function (a) {
        if (!a.data) { show('denied'); return; }
        show('main'); refresh();
      });
    });
  }

  function refresh() {
    Promise.all([
      sb.from('pc_settings').select('key,value'),
      sb.from('deposits').select('*').eq('status', 'pending').order('id'),
      sb.from('withdrawals').select('*').eq('status', 'pending').order('id'),
      sb.from('kyc').select('*').eq('status', 'pending').order('updated_at'),
      sb.from('ledger').select('user_id,amount,kind,note,created_at').order('id', { ascending: false }).limit(30),
      sb.from('wallets').select('balance'),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
      sb.from('web_entries').select('status,paid_fee,refunded,contest_date').gte('contest_date', new Date(Date.now() + 4 * 36e5).toISOString().slice(0, 10))
    ]).then(function (x) {
      (x[0].data || []).forEach(function (s) { S[s.key] = s.value; });
      $('[data-a-mode]').innerHTML = (S.mode === 'test' ? '<span class="tag-wait">TEST MODE</span>' : '<span class="tag-bad">LIVE – REAL MONEY</span>') +
        ' Paid entry: <b>' + (S.paid_entry === true ? 'ON' : 'OFF') + '</b> · fee ' + usd(S.entry_fee || 10);
      var deps = x[1].data || [], wds = x[2].data || [], kyc = x[3].data || [], led = x[4].data || [], ents = x[7].data || [];
      var fee = Number(S.entry_fee) || 10, paidN = ents.filter(function (e) { return Number(e.paid_fee) > 0 && !e.refunded; }).length;
      stat('users', x[6].count || 0);
      stat('wallets', usd((x[5].data || []).reduce(function (a, w) { return a + Number(w.balance); }, 0)));
      stat('deps', deps.length); stat('wds', wds.length); stat('kyc', kyc.length);
      stat('entries', ents.length + (paidN ? ' (' + paidN + ' paid)' : ''));
      stat('pool', usd(paidN * fee * 0.8) + ' · fee ' + usd(paidN * fee * 0.2));
      var ids = [].concat(deps, wds, kyc, led).map(function (o) { return o.user_id; });
      people(ids).then(function () { renderDeps(deps); renderWds(wds); renderKyc(kyc); renderLedger(led); });
    });
  }

  function empty(n, t) { return '<tr><td colspan="' + n + '" class="empty">' + t + '</td></tr>'; }
  function renderDeps(rows) {
    $('[data-a-deps]').innerHTML = rows.length ? rows.map(function (d) {
      return '<tr><td>' + who(d.user_id) + '</td><td class="mono"><b>' + usd(d.amount) + '</b><div class="muted2" style="font-size:12px">' + esc(d.network) + ' · ' + when(d.created_at) + '</div></td>' +
        '<td><a class="w-mono" href="' + TX[d.network] + encodeURIComponent(d.txid) + '" target="_blank" rel="noopener">' + esc(d.txid) + '</a></td>' +
        '<td class="a-act"><button class="btn btn-sm" data-dep-ok="' + d.id + '">Approve</button><button class="btn btn-ghost btn-sm" data-dep-no="' + d.id + '">Reject</button></td></tr>';
    }).join('') : empty(4, 'No deposits waiting ✅');
  }
  function renderWds(rows) {
    $('[data-a-wds]').innerHTML = rows.length ? rows.map(function (w) {
      return '<tr><td>' + who(w.user_id) + '</td><td class="mono"><b>' + usd(w.amount) + '</b><div class="muted2" style="font-size:12px">' + esc(w.network) + ' · ' + when(w.created_at) + '</div></td>' +
        '<td><span class="w-mono">' + esc(w.address) + '</span> <button class="btn btn-ghost btn-sm" data-copy="' + esc(w.address) + '">Copy</button></td>' +
        '<td class="a-act"><button class="btn btn-sm" data-wd-ok="' + w.id + '">Paid</button><button class="btn btn-ghost btn-sm" data-wd-no="' + w.id + '">Reject</button></td></tr>';
    }).join('') : empty(4, 'No withdrawals waiting ✅');
  }
  function renderKyc(rows) {
    $('[data-a-kyc]').innerHTML = rows.length ? rows.map(function (k) {
      return '<tr><td>' + who(k.user_id) + '</td><td class="muted2">' + when(k.updated_at) + '</td>' +
        '<td><button class="btn btn-ghost btn-sm" data-kyc-view="' + esc(k.doc_path) + '">View ID</button></td>' +
        '<td class="a-act"><button class="btn btn-sm" data-kyc-ok="' + k.user_id + '">Approve</button><button class="btn btn-ghost btn-sm" data-kyc-no="' + k.user_id + '">Reject</button></td></tr>';
    }).join('') : empty(4, 'No IDs waiting ✅');
  }
  function renderLedger(rows) {
    $('[data-a-led]').innerHTML = rows.length ? rows.map(function (l) {
      return '<tr><td class="muted2" style="font-size:13px">' + when(l.created_at) + '</td><td>' + who(l.user_id) + '</td><td>' + esc(l.kind) +
        (l.note ? '<div class="muted2" style="font-size:12px;word-break:break-all">' + esc(l.note) + '</div>' : '') + '</td>' +
        '<td class="mono r ' + (l.amount >= 0 ? 'up' : 'down') + '">' + (l.amount >= 0 ? '+' : '') + usd(l.amount) + '</td></tr>';
    }).join('') : empty(4, 'No transactions yet.');
  }

  function act(fn, args, btn) {
    btn.disabled = true;
    sb.rpc(fn, args).then(function (r) {
      if (r.error) { btn.disabled = false; alert('Error: ' + r.error.message); return; }
      refresh();
    });
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var a = function (k) { return b.getAttribute(k); };
    if (a('data-dep-ok') && confirm('Approve this deposit? Check the TXID on the explorer first.')) act('pc_admin_deposit', { did: +a('data-dep-ok'), ok: true, why: null }, b);
    if (a('data-dep-no')) { var w1 = prompt('Reason for rejecting this deposit:'); if (w1) act('pc_admin_deposit', { did: +a('data-dep-no'), ok: false, why: w1 }, b); }
    if (a('data-wd-ok')) { var tx = prompt('Paste the payout TXID (after you sent the USDT):'); if (tx) act('pc_admin_withdraw', { wid: +a('data-wd-ok'), paid: true, why: tx }, b); }
    if (a('data-wd-no')) { var w2 = prompt('Reason for rejecting (the amount goes back to the player wallet):'); if (w2) act('pc_admin_withdraw', { wid: +a('data-wd-no'), paid: false, why: w2 }, b); }
    if (a('data-kyc-ok') && confirm('Approve this ID? Name must match the account.')) act('pc_admin_kyc', { uid: a('data-kyc-ok'), ok: true, why: null }, b);
    if (a('data-kyc-no')) { var w3 = prompt('Reason (shown to the player):'); if (w3) act('pc_admin_kyc', { uid: a('data-kyc-no'), ok: false, why: w3 }, b); }
    if (a('data-kyc-view')) sb.storage.from('kyc').createSignedUrl(a('data-kyc-view'), 300).then(function (r) { if (r.data) window.open(r.data.signedUrl, '_blank', 'noopener'); else alert('Could not open the file.'); });
    if (a('data-copy')) navigator.clipboard && navigator.clipboard.writeText(a('data-copy')).then(function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1500); });
    if (b.hasAttribute('data-a-refresh')) refresh();
  });

  sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') load(); });
  load();
  setInterval(function () { if (!$('[data-a-view="main"]').hidden) refresh(); }, 60000);
})();
