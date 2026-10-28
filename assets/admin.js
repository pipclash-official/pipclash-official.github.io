/* PipClash – Admin panel v2 (owner + staff). Har faisla Supabase function se – woh khud role check karte hain
   (pc_need), aur har kaam admin_log mein likha jaata hai. Battle ke faisle (DQ, publish) admin_requests mein
   jaate hain – laptop engine 1 minute mein chalata hai. */
(function () {
  'use strict';
  var SB_URL = 'https://vrcjgxnafmuxfkybtkbz.supabase.co';
  var SB_KEY = 'sb_publishable_hJfAzBCqJKrJkNmLNEsndA_UuFCLH6f';   // public key – website ke liye hi hai
  var root = document.querySelector('[data-admin]');
  if (!root || !window.supabase) return;
  var sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'implicit' } });
  var $ = function (s, el) { return (el || root).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var usd = function (v) { v = Number(v) || 0; return (v < 0 ? '−' : '') + '$' + Math.abs(v).toFixed(2); };
  var when = function (iso) { return iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–'; };
  var TX = { TRC20: 'https://tronscan.org/#/transaction/', BEP20: 'https://bscscan.com/tx/' };
  var ROLE = null, ME = '', P = {}, S = {}, TAB = 'dash', BID = null;
  var owner = function () { return ROLE === 'owner'; };
  var ERR = { OWNER_ONLY: 'Only the owner can do this.', NOT_ADMIN: 'You are not an admin.', NEEDS_SECOND_ADMIN: 'Big withdrawal: another admin must press "Check" first.',
              ALREADY_DECIDED: 'Someone already handled this.', NO_SUCH_USER: 'No PipClash account with this email – they must sign up on the website first.',
              NOT_YOURSELF: 'You cannot remove yourself.', REASON_REQUIRED: 'Please write a reason.', INSUFFICIENT_BALANCE: 'Player balance is too low for this.',
              NEEDS_CHECK: 'Someone must press "Check" first.', START_FIRST: 'Press "Start payout" first – before you send any USDT.', TXID_REQUIRED: 'Paste the full payout TXID.',
              IN_PROCESSING: 'This payout was started – the owner may have sent the USDT. Only the owner can undo it.', ALREADY_CHECKED: 'Someone already checked this.',
              SELF: 'You cannot decide your own request.', KYC_REQUIRED: 'This player has no approved ID.', BLOCKED: 'This player is blocked.' };
  function errText(e) { var m = String((e && e.message) || e || ''); for (var k in ERR) if (m.indexOf(k) >= 0) return ERR[k]; return m; }
  function call(fn, args, btn, done) {
    if (btn) btn.disabled = true;
    return sb.rpc(fn, args || {}).then(function (r) {
      if (btn) btn.disabled = false;
      if (r.error) { alert(errText(r.error)); return null; }
      toast('Done ✅'); (done || render)(); return r;
    });
  }
  function toast(t) { var el = $('[data-a-toast]'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 1800); }
  function who(uid) { var p = P[uid]; return p ? '<b>' + esc(p.name) + '</b><div class="muted2 a-sm">' + esc(p.phone) + '</div>' : '<span class="muted2">' + esc(String(uid).slice(0, 8)) + '</span>'; }
  function people(ids) {
    ids = ids.filter(function (i, n) { return i && !P[i] && ids.indexOf(i) === n; });
    if (!ids.length) return Promise.resolve();
    return sb.from('profiles').select('id,name,phone').in('id', ids).then(function (r) { (r.data || []).forEach(function (p) { P[p.id] = p; }); });
  }
  function table(head, rows, empty) {
    return '<div class="table-box"><table><thead><tr>' + head.map(function (h) { return '<th' + (h[0] === '>' ? ' class="r"' : '') + '>' + esc(h.replace(/^>/, '')) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + (rows.length ? rows.join('') : '<tr><td colspan="' + head.length + '" class="empty">' + empty + '</td></tr>') + '</tbody></table></div>';
  }
  function card(title, inner, note) { return '<div class="card acc-card"><h2>' + title + '</h2>' + (note ? '<p class="muted2 a-sm">' + note + '</p>' : '') + inner + '</div>'; }
  var pane = function () { return $('[data-a-pane]'); };

  /* ---------- start ---------- */
  function load() {
    sb.auth.getUser().then(function (r) {
      if (!r.data || !r.data.user) { show('login'); return; }
      sb.rpc('pc_role').then(function (a) {
        ROLE = a.data;
        if (!ROLE) { show('denied'); return; }
        sb.from('pc_admins').select('name').eq('user_id', r.data.user.id).maybeSingle().then(function (m) {
          ME = (m.data && m.data.name) || r.data.user.email;
          $('[data-a-me]').innerHTML = esc(ME) + ' · <span class="' + (owner() ? 'tag-ok' : 'tag-wait') + '">' + ROLE.toUpperCase() + '</span>';
          root.querySelectorAll('[data-owner]').forEach(function (el) { el.hidden = !owner(); });
          show('main'); go(location.hash.slice(1) || 'dash');
        });
      });
    });
  }
  function show(name) { root.querySelectorAll('[data-a-view]').forEach(function (v) { v.hidden = v.getAttribute('data-a-view') !== name; }); }
  function go(t) {
    TAB = t; root.querySelectorAll('[data-a-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-a-tab') === t)); });
    history.replaceState(null, '', '#' + t); render();
  }
  function render() {
    sb.from('pc_settings').select('key,value').then(function (r) {
      (r.data || []).forEach(function (x) { S[x.key] = x.value; });
      $('[data-a-mode]').innerHTML = (S.mode === 'test' ? '<span class="tag-wait">TEST MODE</span>' : '<span class="tag-bad">LIVE – REAL MONEY</span>') +
        ' Paid entry <b>' + (S.paid_entry === true ? 'ON' : 'OFF') + '</b> · fee ' + usd(S.entry_fee || 10);
      ({ dash: dash, money: money, battle: battle, players: players, support: support, reports: reports, settings: settings, team: team, log: logs }[TAB] || dash)();
    });
  }

  /* ---------- Dashboard ---------- */
  function dash() {
    var today = new Date(Date.now() + 4 * 36e5).toISOString().slice(0, 10);
    Promise.all([
      sb.from('profiles').select('id', { count: 'exact', head: true }),
      sb.from('wallets').select('balance'),
      sb.from('deposits').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      sb.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      sb.from('kyc').select('user_id', { count: 'exact', head: true }).eq('status', 'pending'),
      sb.from('support').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      sb.from('web_entries').select('paid_fee,refunded').gte('contest_date', today),
      sb.from('battles').select('*').order('contest_id', { ascending: false }).limit(1)
    ]).then(function (x) {
      var ents = x[6].data || [], paid = ents.filter(function (e) { return Number(e.paid_fee) > 0 && !e.refunded; }), fees = paid.reduce(function (a, e) { return a + Number(e.paid_fee); }, 0);
      var b = (x[7].data || [])[0];
      var st = function (lab, v, t) { return '<button class="card a-stat" type="button"' + (t ? ' data-go="' + t + '"' : '') + '><span class="muted2">' + lab + '</span><b>' + v + '</b></button>'; };
      pane().innerHTML = '<div class="a-stats">' +
        st('Deposits waiting', x[2].count || 0, 'money') + st('Withdrawals waiting', x[3].count || 0, 'money') + st('IDs waiting', x[4].count || 0, 'money') +
        st('Support open', x[5].count || 0, 'support') + st('Players', x[0].count || 0, 'players') +
        st('In wallets', usd((x[1].data || []).reduce(function (a, w) { return a + Number(w.balance); }, 0))) +
        st('Website entries (next battle)', ents.length + (paid.length ? ' · ' + paid.length + ' paid' : '')) +
        st('Prize pool 80% · platform 20%', usd(fees * 0.8) + ' · ' + usd(fees * 0.2)) +
        (b ? st('Battle #' + b.contest_id + ' – ' + b.status, b.players + ' players', 'battle') : '') + '</div>';
    });
  }

  /* ---------- Money ---------- */
  function money() {
    Promise.all([
      sb.from('deposits').select('*').eq('status', 'pending').order('id'),
      sb.from('withdrawals').select('*').in('status', ['pending', 'processing']).order('id'),
      sb.from('kyc').select('*').eq('status', 'pending').order('updated_at'),
      sb.from('deposits').select('*').neq('status', 'pending').order('id', { ascending: false }).limit(15),
      sb.from('withdrawals').select('*').neq('status', 'pending').order('id', { ascending: false }).limit(15)
    ]).then(function (x) {
      var all = [].concat(x[0].data, x[1].data, x[2].data, x[3].data, x[4].data).filter(Boolean), wds = x[1].data || [];
      var wdUsers = wds.map(function (w) { return w.user_id; });
      Promise.all([people(all.map(function (o) { return o.user_id; })),
        // A4: withdraw row pe "deposit kisne approve kiya" · A1: BIG = 24 ghante ka jod ($99 + $99 + $99 nahi)
        wdUsers.length ? sb.from('deposits').select('user_id,decided_by,checked_name,amount').in('user_id', wdUsers).eq('status', 'approved').order('id', { ascending: false }) : Promise.resolve({ data: [] }),
        Promise.all(wds.map(function (w) { return sb.rpc('pc_wd_day_total', { wid: w.id }); }))
      ]).then(function (y) {
        var big = Number(S.big_withdraw) || 100, bigDep = Number(S.big_deposit) || 200, depBy = {}, dayTot = {};
        (y[1].data || []).forEach(function (d) { if (!depBy[d.user_id]) depBy[d.user_id] = d; });
        wds.forEach(function (w, i) { var r = y[2][i]; dayTot[w.id] = r && !r.error && r.data != null ? Number(r.data) : Number(w.amount); });
        pane().innerHTML =
          card('Deposits to check', table(['Player', 'Amount', 'TXID', 'Check', ''], (x[0].data || []).map(function (d) {
            var isBig = Number(d.amount) >= bigDep;
            return '<tr><td>' + who(d.user_id) + '</td><td class="mono"><b>' + usd(d.amount) + '</b>' + (isBig ? ' <span class="tag-bad">BIG</span>' : '') + '<div class="muted2 a-sm">' + esc(d.network) + ' · ' + when(d.created_at) + '</div></td>' +
              '<td><a class="w-mono" href="' + TX[d.network] + encodeURIComponent(d.txid) + '" target="_blank" rel="noopener">' + esc(d.txid) + '</a></td>' +
              '<td>' + (d.checked_name ? '<span class="tag-ok">✓ ' + esc(d.checked_name) + '</span>' : (isBig ? '<button class="btn btn-ghost btn-sm" data-dep-check="' + d.id + '">Check</button>' : '<span class="muted2 a-sm">not needed</span>')) + '</td>' +
              '<td class="a-act"><button class="btn btn-sm" data-dep-ok="' + d.id + '">Approve</button><button class="btn btn-ghost btn-sm" data-dep-no="' + d.id + '">Reject</button></td></tr>';
          }), 'No deposits waiting ✅'), 'Open the TXID: the amount on the blockchain must be EXACTLY the amount here (every player gets their own cents, like $50.37) and it must have arrived at our address. ' +
            usd(bigDep) + '+ needs a Check from a DIFFERENT admin before Approve.') +
          card('Withdrawals', table(['Player', 'Amount', 'Address', 'Check', ''], wds.map(function (w) {
            var isBig = dayTot[w.id] >= big, proc = w.status === 'processing', dep = depBy[w.user_id];
            return '<tr' + (proc ? ' class="a-flag"' : '') + '><td>' + who(w.user_id) + (dep ? '<div class="muted2 a-sm">last deposit approved by ' + esc([dep.checked_name, dep.decided_by].filter(Boolean).join(' + ')) + '</div>' : '<div class="muted2 a-sm">no approved deposit</div>') + '</td>' +
              '<td class="mono"><b>' + usd(w.amount) + '</b>' + (isBig ? ' <span class="tag-bad" title="24h total ' + usd(dayTot[w.id]) + '">BIG</span>' : '') + (proc ? ' <span class="tag-wait">SENDING</span>' : '') +
              '<div class="muted2 a-sm">' + esc(w.network) + ' · ' + when(w.created_at) + '</div></td>' +
              '<td><span class="w-mono">' + esc(w.address) + '</span> <button class="btn btn-ghost btn-sm" data-copy="' + esc(w.address) + '">Copy</button></td>' +
              '<td>' + (w.checked_name ? '<span class="tag-ok">✓ ' + esc(w.checked_name) + '</span>' : '<button class="btn btn-ghost btn-sm" data-wd-check="' + w.id + '">Check</button>') + '</td>' +
              '<td class="a-act">' + (proc ? (owner() ? '<button class="btn btn-sm" data-wd-ok="' + w.id + '">Paid – paste TXID</button><button class="btn btn-ghost btn-sm" data-wd-undo="' + w.id + '">Not sent – undo</button>' : '<span class="muted2 a-sm">owner is sending</span>')
                : (owner() ? '<button class="btn btn-sm" data-wd-start="' + w.id + '"' + (w.checked_name ? '' : ' disabled title="Check first"') + '>Start payout</button>' : '') + '<button class="btn btn-ghost btn-sm" data-wd-no="' + w.id + '">Reject</button>') + '</td></tr>';
          }), 'No withdrawals waiting ✅'), 'Step 1: an admin checks name, ID and history and presses Check. Step 2: the owner presses Start payout – ALL checks run now, BEFORE any USDT leaves. ' +
            'Step 3: send the USDT, then Paid + TXID. ' + usd(big) + '+ in 24 hours needs the Check from a DIFFERENT admin. A started payout cannot be rejected. Reject = money goes back to the player.') +
          card('IDs to check', table(['Player', 'Sent', 'ID', ''], (x[2].data || []).map(function (k) {
            return '<tr><td>' + who(k.user_id) + '</td><td class="muted2">' + when(k.updated_at) + '</td><td><button class="btn btn-ghost btn-sm" data-kyc-view="' + esc(k.doc_path) + '">View ID</button></td>' +
              '<td class="a-act"><button class="btn btn-sm" data-kyc-ok="' + k.user_id + '">Approve</button><button class="btn btn-ghost btn-sm" data-kyc-no="' + k.user_id + '">Reject</button></td></tr>';
          }), 'No IDs waiting ✅'), 'The name on the ID must match the account name.') +
          card('Recently decided', table(['Type', 'Player', 'Amount', 'Status', 'By'], [].concat(
            (x[3].data || []).map(function (d) { return '<tr><td>Deposit</td><td>' + who(d.user_id) + '</td><td class="mono">' + usd(d.amount) + '</td><td>' + esc(d.status) + '</td><td class="muted2">' + esc(d.decided_by || '') + '</td></tr>'; }),
            (x[4].data || []).map(function (w) { return '<tr><td>Withdrawal</td><td>' + who(w.user_id) + '</td><td class="mono">' + usd(w.amount) + '</td><td>' + esc(w.status) + (w.note ? '<div class="w-mono">' + esc(w.note) + '</div>' : '') + '</td><td class="muted2">' + esc([w.checked_name, w.decided_by].filter(Boolean).join(' → ')) + '</td></tr>'; })), 'Nothing yet.'));
      });
    });
  }

  /* ---------- Battle ---------- */
  function battle() {
    sb.from('battles').select('*').order('contest_id', { ascending: false }).limit(5).then(function (r) {
      var bs = r.data || [];
      if (!bs.length) { pane().innerHTML = card('Battle', '<p class="muted2">No battle data yet. The laptop engine sends it every minute.</p>'); return; }
      if (!BID || !bs.some(function (b) { return b.contest_id === BID; })) BID = bs[0].contest_id;
      var b = bs.filter(function (x) { return x.contest_id === BID; })[0];
      Promise.all([
        sb.from('battle_players').select('*').eq('contest_id', BID).order('rank', { ascending: true, nullsFirst: false }),
        sb.from('admin_requests').select('*').eq('contest_id', BID).order('id', { ascending: false }).limit(10),
        sb.from('prize_claims_cloud').select('*').eq('contest_id', BID)
      ]).then(function (x) {
        var pl = x[0].data || [], canDq = b.status !== 'ended';
        var pick = '<select data-bid>' + bs.map(function (o) { return '<option value="' + o.contest_id + '"' + (o.contest_id === BID ? ' selected' : '') + '>#' + o.contest_id + ' · ' + esc(o.name) + ' · ' + esc(o.status) + '</option>'; }).join('') + '</select>';
        pane().innerHTML = card('Battle #' + b.contest_id + ' <span class="tag-wait">' + esc(b.status).toUpperCase() + '</span>',
          pick + '<p class="muted2 a-sm">' + b.players + ' players · data from the laptop engine, updated ' + when(b.updated_at) +
          '. DQ / Publish are done by the engine within ~1 minute.</p>' +
          (owner() && b.status === 'review' ? '<button class="btn" data-publish="' + b.contest_id + '">Publish FINAL result now</button>' : '') +
          table(['#', 'Player', '>P&L', 'Trades', 'Status / flags', ''], pl.map(function (p) {
            var dq = p.status === 'disqualified';
            return '<tr' + (p.flags ? ' class="a-flag"' : '') + '><td class="mono">' + (p.rank || '–') + '</td><td><b>' + esc(p.player) + '</b><div class="muted2 a-sm">' + esc(p.channel || '') + (p.prize ? ' · prize ' + usd(p.prize) : '') + '</div></td>' +
              '<td class="mono r ' + (p.pnl >= 0 ? 'up' : 'down') + '">' + usd(p.pnl) + '</td><td class="mono">' + (p.trades || 0) + '</td>' +
              '<td>' + esc(p.status) + (p.dq_reason ? '<div class="muted2 a-sm">' + esc(p.dq_reason) + '</div>' : '') + (p.flags ? '<div class="a-flags">⚠️ ' + esc(p.flags) + '</div>' : '') + '</td>' +
              '<td class="a-act">' + (canDq ? (dq ? '<button class="btn btn-ghost btn-sm" data-undq="' + esc(p.player) + '">Undo DQ</button>' : '<button class="btn btn-ghost btn-sm" data-dq="' + esc(p.player) + '">DQ</button>') : '') + '</td></tr>';
          }), 'No players.')) +
          card('Prize claims (Telegram)', table(['Player', 'Prize', 'Status', 'Payment', ''], (x[2].data || []).map(function (c) {
            return '<tr><td><b>' + esc(c.player) + '</b></td><td class="mono">' + usd(c.prize) + '</td><td>' + esc(c.status) + '</td><td class="w-mono">' + esc(c.pay || '') + '</td>' +
              '<td>' + (owner() && c.status === 'review' ? '<button class="btn btn-sm" data-claim="' + esc(c.player) + '">Mark paid</button>' : '') + '</td></tr>';
          }), 'No claims.'), 'Website winners get prizes in their wallet automatically (paid mode).') +
          card('Requests to the engine', table(['When', 'What', 'By', 'Result'], (x[1].data || []).map(function (q) {
            return '<tr><td class="muted2 a-sm">' + when(q.created_at) + '</td><td>' + esc(q.kind) + ' ' + esc(q.player || '') + (q.reason ? '<div class="muted2 a-sm">' + esc(q.reason) + '</div>' : '') + '</td><td>' + esc(q.requested_by || '') + '</td>' +
              '<td>' + (q.status === 'pending' ? '<span class="tag-wait">WAITING</span>' : (q.status === 'done' ? '<span class="tag-ok">DONE</span> ' : '<span class="tag-bad">FAILED</span> ') + esc(q.result || '')) + '</td></tr>';
          }), 'No requests.'));
      });
    });
  }

  /* ---------- Players ---------- */
  function players(q) {
    pane().innerHTML = card('Players', '<form data-find class="a-row"><input type="text" placeholder="Name, phone, email or referral code" value="' + esc(q || '') + '"><button class="btn" type="submit">Search</button></form><div data-find-out></div>');
    sb.rpc('pc_admin_find', { q: q || '' }).then(function (r) {
      $('[data-find-out]').innerHTML = r.error ? '<p class="acc-msg bad">' + esc(errText(r.error)) + '</p>' : table(['Player', 'Email', '>Wallet', 'ID', ''], (r.data || []).map(function (p) {
        P[p.id] = { name: p.name, phone: p.phone };
        return '<tr><td><b>' + esc(p.name) + '</b>' + (p.blocked ? ' <span class="tag-bad">BLOCKED</span>' : '') + '<div class="muted2 a-sm">' + esc(p.phone) + ' · ' + esc(p.ref_code || '') + '</div></td>' +
          '<td class="a-sm">' + esc(p.email) + '</td><td class="mono r">' + usd(p.balance) + '</td><td>' + esc(p.kyc || '–') + '</td>' +
          '<td><button class="btn btn-ghost btn-sm" data-player="' + p.id + '">Open</button></td></tr>';
      }), 'No players found.');
    });
  }
  function player(id) {
    Promise.all([
      sb.rpc('pc_admin_player', { uid: id }),      // A3: sirf yahi player (pehle 50 ki list mein dhoondhta – 51st pe '?')
      sb.from('ledger').select('*').eq('user_id', id).order('id', { ascending: false }).limit(30),
      sb.from('web_entries').select('contest_date,status,paid_fee,refunded,public_name').eq('user_id', id).order('contest_date', { ascending: false }).limit(15)
    ]).then(function (x) {
      var p = (x[0].data || [])[0];
      if (!p) { pane().innerHTML = card('Player', '<p class="acc-msg bad">Could not load this player' + (x[0].error ? ': ' + esc(errText(x[0].error)) : '') + '.</p><button class="btn btn-ghost btn-sm" data-go="players">← Back</button>'); return; }
      pane().innerHTML = card(esc(p.name) + (p.blocked ? ' <span class="tag-bad">BLOCKED</span>' : ''),
        '<p class="muted2">' + esc(p.phone) + ' · ' + esc(p.email || '') + ' · ref ' + esc(p.ref_code || '–') + ' · ID: ' + esc(p.kyc || 'none') + '</p>' +
        '<p>Wallet <b class="mono">' + usd(p.balance) + '</b></p>' +
        (owner() ? '<div class="a-row"><button class="btn btn-ghost btn-sm" data-block="' + id + '" data-yes="' + (!p.blocked) + '">' + (p.blocked ? 'Unblock' : 'Block') + '</button>' +
          '<button class="btn btn-ghost btn-sm" data-adjust="' + id + '">Adjust balance</button></div>' : '') +
        '<button class="btn btn-ghost btn-sm" data-go="players">← Back</button>') +
        card('Battles', table(['Date', 'Name', 'Status', 'Fee'], (x[2].data || []).map(function (e) {
          return '<tr><td>' + esc(e.contest_date) + '</td><td>' + esc(e.public_name || '') + '</td><td>' + esc(e.status) + '</td><td class="mono">' + usd(e.paid_fee) + (e.refunded ? ' refunded' : '') + '</td></tr>';
        }), 'No entries.')) +
        card('Wallet history', table(['Date', 'Type', '>Amount', '>Balance'], (x[1].data || []).map(function (l) {
          return '<tr><td class="muted2 a-sm">' + when(l.created_at) + '</td><td>' + esc(l.kind) + (l.note ? '<div class="muted2 a-sm">' + esc(l.note) + '</div>' : '') + '</td>' +
            '<td class="mono r ' + (l.amount >= 0 ? 'up' : 'down') + '">' + usd(l.amount) + '</td><td class="mono r">' + usd(l.balance_after) + '</td></tr>';
        }), 'No transactions.'));
    });
  }

  /* ---------- Support ---------- */
  function support() {
    sb.from('support').select('*').neq('status', 'closed').order('id', { ascending: false }).limit(50).then(function (r) {
      var rows = r.data || [];
      pane().innerHTML = card('Support', rows.length ? rows.map(function (t) {
        return '<div class="a-ticket"><div class="a-row"><b>' + esc(t.name || 'Player') + '</b><span class="muted2 a-sm">' + esc(t.channel) + ' · ' + when(t.created_at) + '</span>' +
          (t.status === 'open' ? '<span class="tag-bad">OPEN</span>' : (t.status === 'reply_pending' ? '<span class="tag-wait">SENDING</span>' : '<span class="tag-ok">ANSWERED</span>')) + '</div>' +
          '<p>' + esc(t.message) + '</p>' + (t.reply ? '<p class="muted2">↳ ' + esc(t.replied_by || '') + ': ' + esc(t.reply) + '</p>' : '') +
          '<form class="a-row" data-reply="' + t.id + '"><input type="text" placeholder="Write a reply (sent on Telegram)"><button class="btn btn-sm" type="submit">Send</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" data-close="' + t.id + '">Close</button></form></div>';
      }).join('') : '<p class="muted2">No open questions ✅</p>', 'Questions players send to “Talk to admin” in the bot. Replies are sent by the engine within a minute.');
    });
  }

  /* ---------- Reports ---------- */
  function reports() {
    sb.rpc('pc_admin_report', { days: 14 }).then(function (r) {
      var rows = r.data || [], t = { entries: 0, fees: 0, pool: 0, platform: 0, prizes: 0, referrals: 0, deposits: 0, withdrawals: 0, refunds: 0 };
      rows.forEach(function (d) { for (var k in t) t[k] += Number(d[k]) || 0; });
      var line = function (d, b) { return '<tr' + (b ? ' class="a-total"' : '') + '><td>' + esc(d.day || 'TOTAL') + '</td><td class="mono r">' + (d.entries || 0) + '</td><td class="mono r">' + usd(d.fees) + '</td><td class="mono r">' + usd(d.pool) + '</td><td class="mono r">' + usd(d.platform) +
        '</td><td class="mono r">' + usd(d.prizes) + '</td><td class="mono r">' + usd(d.referrals) + '</td><td class="mono r">' + usd(d.deposits) + '</td><td class="mono r">' + usd(d.withdrawals) + '</td></tr>'; };
      pane().innerHTML = card('Last 14 days', r.error ? '<p class="acc-msg bad">' + esc(errText(r.error)) + '</p>' :
        table(['Day', '>Entries', '>Fees', '>Pool 80%', '>Platform 20%', '>Prizes paid', '>Referral', '>Deposits', '>Withdrawals'], rows.map(function (d) { return line(d); }).concat([line(t, true)]), 'No data.'),
        'Platform 20% includes the 1% referral rewards. Entries = paid website entries that were not refunded.');
    });
  }

  /* ---------- Settings (owner) ---------- */
  function settings() {
    if (!owner()) { pane().innerHTML = card('Settings', '<p class="muted2">Only the owner can change settings.</p>'); return; }
    var f = function (k, lab, type) { return '<label>' + lab + '</label><input type="' + (type || 'text') + '" data-set="' + k + '" value="' + esc(S[k] == null ? '' : S[k]) + '">'; };
    pane().innerHTML = card('Settings', '<form data-settings class="a-form">' +
      '<label>Mode</label><select data-set="mode"><option value="test"' + (S.mode === 'test' ? ' selected' : '') + '>TEST – no real money</option><option value="live"' + (S.mode === 'live' ? ' selected' : '') + '>LIVE – real money</option></select>' +
      '<label class="acc-check"><input type="checkbox" data-set="paid_entry"' + (S.paid_entry === true ? ' checked' : '') + '> Paid entry ON (players pay the entry fee from their wallet)</label>' +
      f('entry_fee', 'Entry fee (USD)', 'number') + f('min_deposit', 'Minimum deposit (USD)', 'number') + f('min_withdraw', 'Minimum withdrawal (USD)', 'number') +
      f('big_withdraw', 'Big withdrawal – needs 2 admins from (USD)', 'number') + f('usdt_trc20', 'Our USDT TRC20 address') + f('usdt_bep20', 'Our USDT BEP20 address') +
      '<button class="btn btn-lg" type="submit">Save changes</button></form>', 'Every change is saved in the activity log. The laptop engine picks up paid entry ON/OFF within a minute.');
  }

  /* ---------- Team (owner) ---------- */
  function team() {
    sb.from('pc_admins').select('*').order('added_at').then(function (r) {
      var few = (r.data || []).length < 2;
      pane().innerHTML = (few ? '<div class="card acc-card a-flag"><b>⚠️ Only one admin.</b><p class="muted2">Big withdrawals and big deposits need a SECOND admin to press Check – with one admin they cannot be done. Add at least one trusted person below.</p></div>' : '') +
        card('Team', table(['Name', 'Role', 'Added', ''], (r.data || []).map(function (a) {
        return '<tr><td><b>' + esc(a.name || '') + '</b></td><td>' + esc(a.role) + '</td><td class="muted2">' + when(a.added_at) + '</td>' +
          '<td>' + (owner() ? '<button class="btn btn-ghost btn-sm" data-team-rm="' + a.user_id + '">Remove</button>' : '') + '</td></tr>';
      }), 'No admins.') + (owner() ? '<h3>Add a team member</h3><p class="muted2 a-sm">They must first create a PipClash account on the website with this email.</p>' +
        '<form data-team-add class="a-form"><input type="email" placeholder="Their email" required><input type="text" placeholder="Their name" required>' +
        '<select><option value="staff">Staff – deposits, IDs, battle review, support</option><option value="owner">Owner – everything</option></select><button class="btn" type="submit">Add</button></form>' : ''));
    });
  }

  /* ---------- Activity log ---------- */
  function logs() {
    sb.from('admin_log').select('*').order('id', { ascending: false }).limit(100).then(function (r) {
      pane().innerHTML = card('Activity log', table(['When', 'Who', 'What', 'Detail'], (r.data || []).map(function (l) {
        return '<tr><td class="muted2 a-sm">' + when(l.created_at) + '</td><td><b>' + esc(l.admin_name || '') + '</b></td><td>' + esc(l.action) + '<div class="muted2 a-sm">' + esc(l.target || '') + '</div></td><td class="a-sm">' + esc(l.detail || '') + '</td></tr>';
      }), 'Nothing yet.'), 'Every approve, reject, DQ, setting change and team change – who did it and when.');
    });
  }

  /* ---------- clicks + forms ---------- */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button,[data-go]'); if (!b) return;
    var a = function (k) { return b.getAttribute(k); };
    if (a('data-a-tab')) return go(a('data-a-tab'));
    if (a('data-go')) return go(a('data-go'));
    if (b.hasAttribute('data-a-refresh')) return render();
    if (a('data-dep-ok') && confirm('Approve this deposit? Check the TXID on the explorer first.')) call('pc_admin_deposit', { did: +a('data-dep-ok'), ok: true, why: null }, b);
    if (a('data-dep-no')) { var w1 = prompt('Reason for rejecting this deposit:'); if (w1) call('pc_admin_deposit', { did: +a('data-dep-no'), ok: false, why: w1 }, b); }
    if (a('data-wd-check') && confirm('I checked the name, ID and history – this withdrawal looks OK.')) call('pc_admin_withdraw_check', { wid: +a('data-wd-check') }, b);
    if (a('data-dep-check') && confirm('BIG deposit: I opened the TXID – the exact amount arrived at our address.')) call('pc_admin_deposit_check', { did: +a('data-dep-check') }, b);
    if (a('data-wd-start') && confirm('Start payout? All checks run now. Only AFTER this, send the USDT.')) call('pc_admin_withdraw_start', { wid: +a('data-wd-start') }, b);
    if (a('data-wd-undo') && confirm('You did NOT send the USDT? The withdrawal goes back to waiting.')) call('pc_admin_withdraw_unstart', { wid: +a('data-wd-undo') }, b);
    if (a('data-wd-ok')) { var tx = prompt('You sent the USDT. Paste the payout TXID:'); if (tx) call('pc_admin_withdraw', { wid: +a('data-wd-ok'), paid: true, why: tx }, b); }
    if (a('data-wd-no')) { var w2 = prompt('Reason for rejecting (the amount goes back to the player):'); if (w2) call('pc_admin_withdraw', { wid: +a('data-wd-no'), paid: false, why: w2 }, b); }
    if (a('data-kyc-ok') && confirm('Approve this ID? The name must match the account.')) call('pc_admin_kyc', { uid: a('data-kyc-ok'), ok: true, why: null }, b);
    if (a('data-kyc-no')) { var w3 = prompt('Reason (shown to the player):'); if (w3) call('pc_admin_kyc', { uid: a('data-kyc-no'), ok: false, why: w3 }, b); }
    if (a('data-kyc-view')) sb.storage.from('kyc').createSignedUrl(a('data-kyc-view'), 300).then(function (r) { if (r.data) window.open(r.data.signedUrl, '_blank', 'noopener'); else alert('Could not open the file.'); });
    if (a('data-copy')) navigator.clipboard && navigator.clipboard.writeText(a('data-copy')).then(function () { toast('Copied'); });
    if (a('data-dq')) { var w4 = prompt('Disqualify ' + a('data-dq') + ' – reason:'); if (w4) call('pc_admin_request', { k: 'dq', cid: BID, pl: a('data-dq'), why: w4 }, b); }
    if (a('data-undq') && confirm('Undo the DQ of ' + a('data-undq') + '?')) call('pc_admin_request', { k: 'undq', cid: BID, pl: a('data-undq'), why: 'undo' }, b);
    if (a('data-publish') && confirm('Publish the FINAL result of battle #' + a('data-publish') + ' now? Prizes are paid and players are told.')) call('pc_admin_request', { k: 'publish', cid: +a('data-publish'), pl: null, why: null }, b);
    if (a('data-claim') && confirm('You sent the prize to ' + a('data-claim') + '? The player gets a Telegram message.')) call('pc_admin_request', { k: 'claim_paid', cid: BID, pl: a('data-claim'), why: null }, b);
    if (a('data-player')) player(a('data-player'));
    if (a('data-block')) { var yes = a('data-yes') === 'true', w5 = yes ? prompt('Reason for blocking:') : 'unblock'; if (w5) call('pc_admin_block', { u: a('data-block'), yes: yes, why: w5 }, b, function () { player(a('data-block')); }); }
    if (a('data-adjust')) { var am = parseFloat(prompt('Amount to add (use minus to take away), e.g. 10 or -5:')); if (am) { var w6 = prompt('Reason (saved in the log):'); if (w6) call('pc_admin_adjust', { u: a('data-adjust'), amt: am, why: w6 }, b, function () { player(a('data-adjust')); }); } }
    if (a('data-close')) call('pc_admin_close', { sid: +a('data-close') }, b);
    if (a('data-team-rm') && confirm('Remove this admin?')) call('pc_admin_team_remove', { u: a('data-team-rm') }, b);
  });
  root.addEventListener('change', function (e) { if (e.target.matches('[data-bid]')) { BID = +e.target.value; render(); } });
  root.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.matches('[data-find]')) return players(f.querySelector('input').value.trim());
    if (f.matches('[data-reply]')) { var t = f.querySelector('input').value.trim(); if (t) call('pc_admin_reply', { sid: +f.getAttribute('data-reply'), txt: t }, f.querySelector('button')); return; }
    if (f.matches('[data-team-add]')) { var i = f.querySelectorAll('input,select'); call('pc_admin_team_add', { em: i[0].value, nm: i[1].value, rl: i[2].value }, f.querySelector('button')); return; }
    if (f.matches('[data-settings]')) {
      var ch = [];
      f.querySelectorAll('[data-set]').forEach(function (el) {
        var k = el.getAttribute('data-set'), v = el.type === 'checkbox' ? el.checked : (el.type === 'number' ? Number(el.value) : el.value.trim());
        if (JSON.stringify(v) !== JSON.stringify(S[k])) ch.push([k, v]);
      });
      if (!ch.length) { toast('Nothing changed'); return; }
      if (ch.some(function (c) { return c[0] === 'mode' && c[1] === 'live'; }) && !confirm('Switch to LIVE – REAL MONEY? Check the USDT addresses first.')) return;
      if (!confirm('Save: ' + ch.map(function (c) { return c[0] + ' = ' + c[1]; }).join(', ') + ' ?')) return;
      ch.reduce(function (p, c) { return p.then(function (ok) { return ok === null ? null : sb.rpc('pc_admin_set', { k: c[0], v: c[1] }).then(function (r) { if (r.error) { alert(errText(r.error)); return null; } return true; }); }); }, Promise.resolve(true))
        .then(function (ok) { if (ok) { toast('Saved ✅'); render(); } });
    }
  });

  // setTimeout: callback ke andar seedha Supabase call = deadlock (naya sign-in 'Loading…' pe atakta tha)
  sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') setTimeout(load, 0); });
  load();
  setInterval(function () { if (!$('[data-a-view="main"]').hidden && ['dash', 'money', 'battle', 'support'].indexOf(TAB) >= 0 && !document.activeElement.matches('input,textarea,select')) render(); }, 30000);
})();
