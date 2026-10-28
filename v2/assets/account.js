/* PipClash – My Account: login (email link / Google), profile, today's entry, MT5 login */
(function () {
  'use strict';
  var SB_URL = 'https://vrcjgxnafmuxfkybtkbz.supabase.co';
  var SB_KEY = 'sb_publishable_hJfAzBCqJKrJkNmLNEsndA_UuFCLH6f';   // public key – website ke liye hi hai
  var root = document.querySelector('[data-acc]');
  if (!root || !window.supabase) return;
  var sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'implicit' } });
  var $ = function (s) { return root.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var sched = function () { return (window.PC_DATA && window.PC_DATA.schedule) || { join_open: '10:00', join_close: '16:00', creds_at: '16:25', trade_start: '16:30', trade_end: '19:30', days: [1, 2, 3, 4, 5] }; };
  var hm12 = function (s) { var p = s.split(':'), h = +p[0], m = p[1]; return ((h + 11) % 12 + 1) + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM'); };
  function uaeNow() {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[o.weekday];
    return { date: o.year + '-' + o.month + '-' + o.day, hm: (o.hour === '24' ? '00' : o.hour) + ':' + o.minute, wd: wd };
  }
  function windowState() {
    var n = uaeNow(), s = sched(), day = (s.days || [1, 2, 3, 4, 5]).indexOf(n.wd) >= 0;
    return { open: day && n.hm >= s.join_open && n.hm <= s.join_close, day: day, before: n.hm < s.join_open, credsTime: n.hm >= s.creds_at, date: n.date };
  }
  function addDays(ymd, n) { var d = new Date(ymd + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  /* Agli battle ki date (Supabase ka pc_next_battle_date jaisa): aaj, agar battle day hai aur entry abhi band nahi hui; warna agla Mon–Fri */
  function nextBattle() {
    var n = uaeNow(), s = sched(), days = s.days || [1, 2, 3, 4, 5];
    for (var i = 0; i < 8; i++) {
      var ymd = addDays(n.date, i), wd = new Date(ymd + 'T00:00:00Z').getUTCDay() || 7;
      if (days.indexOf(wd) < 0 || (i === 0 && n.hm > s.join_close)) continue;
      return ymd;
    }
    return n.date;
  }
  function dayLabel(ymd) {
    var t = uaeNow().date;
    if (ymd === t) return 'today';
    if (ymd === addDays(t, 1)) return 'tomorrow';
    return new Date(ymd + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  var user = null, profile = null, timer = null;
  /* Paid entry: Supabase pc_settings.paid_entry = true -> $10 wallet se. Tables na hon (SQL nahi chala) = free mode */
  var PAY = { on: false, fee: 10, bal: 0, test: false };
  function loadPay() {
    return Promise.all([sb.from('pc_settings').select('key,value'), sb.from('wallets').select('balance').eq('user_id', user.id).maybeSingle()]).then(function (r) {
      var S = {}; ((r[0] && r[0].data) || []).forEach(function (x) { S[x.key] = x.value; });
      PAY = { on: S.paid_entry === true, fee: Number(S.entry_fee) || 10, bal: Number(r[1] && r[1].data && r[1].data.balance) || 0, test: S.mode === 'test' };
    }, function () { });
  }
  var usd = function (v) { return '$' + (Number(v) || 0).toFixed(2); };
  var PAYERR = { INSUFFICIENT_BALANCE: 'Not enough balance – add money to your wallet first.', ALREADY_IN: 'You already have a seat.', NO_PROFILE: 'Please complete your details first.',
                 PAID_OFF: 'Paid entry is not open right now.', NOTHING_TO_CANCEL: 'This entry can no longer be cancelled.' };
  function payErr(e) { var m = String((e && e.message) || e || ''); for (var k in PAYERR) if (m.indexOf(k) >= 0) return PAYERR[k]; return 'Something went wrong. Please refresh and try again.'; }
  /* Refer: ?ref=CODE wale link se aaya – code yaad rakho (signup ke baad profile mein ref_by) */
  var REF = (new URLSearchParams(location.search).get('ref') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  try { if (REF) localStorage.setItem('pc_ref', REF); else REF = localStorage.getItem('pc_ref') || ''; } catch (e) { }
  /* Profile banao – ref_by column abhi Supabase mein na ho (SQL nahi chala) to uske bina dobara */
  function insertProfile(row) {
    var ref = REF || ((user && user.user_metadata) || {}).ref || '';
    var full = ref ? Object.assign({ ref_by: ref }, row) : row;
    return sb.from('profiles').insert(full).then(function (r) {
      return (r.error && full !== row && /ref_by|column|schema/i.test(r.error.message || '')) ? sb.from('profiles').insert(row) : r;
    });
  }

  function show(name) {
    root.querySelectorAll('[data-view]').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== name; });
  }
  function msg(sel, text, bad) { var el = $(sel); if (el) { el.textContent = text || ''; el.className = 'acc-msg' + (bad ? ' bad' : ''); } }

  /* ---------- create account / log in ---------- */
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var redirect = location.origin + location.pathname;
  function tab(name) {
    root.querySelectorAll('[data-tab]').forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === name)); });
    root.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== name; });
  }
  root.querySelectorAll('[data-tab]').forEach(function (t) { t.addEventListener('click', function () { tab(t.getAttribute('data-tab')); }); });
  tab(location.hash === '#login' ? 'login' : 'signup');
  function errText(m) {
    m = String(m || '');
    if (/rate|too many|security purposes/i.test(m)) return 'Too many emails right now. Please wait a few minutes and try again, or join with Telegram.';
    if (/signups? not allowed|user not found/i.test(m)) return 'No PipClash account with this email yet. Tap “Create account”.';
    return m;
  }
  function sent(email) { $('[data-sent-to]').textContent = email; $('[data-login-step]').hidden = true; $('[data-sent-step]').hidden = false; }
  function cleanName(v) { return v.trim().replace(/[^\p{L}\p{N} ]/gu, '').slice(0, 14); }
  function fullPhone(cc, v) { return cc + v.replace(/\D/g, '').replace(/^0+/, ''); }

  $('[data-signup-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = cleanName($('#su-name').value), email = $('#su-email').value.trim(), phone = fullPhone($('#su-cc').value, $('#su-phone').value);
    if (name.length < 2) { msg('[data-signup-msg]', 'Please enter your first name (at least 2 letters).', true); return; }
    if (!EMAIL_RE.test(email)) { msg('[data-signup-msg]', 'Please enter a valid email address.', true); return; }
    if (!/^\+\d{8,15}$/.test(phone)) { msg('[data-signup-msg]', 'Please enter your mobile number (without the country code).', true); return; }
    if (!$('#su-agree').checked) { msg('[data-signup-msg]', 'Please confirm you are 18+ and accept the Rules and Terms.', true); return; }
    var btn = $('[data-signup-btn]'); btn.disabled = true; msg('[data-signup-msg]', 'Creating your account…');
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, emailRedirectTo: redirect, data: { name: name, phone: phone, ref: REF || undefined } } }).then(function (r) {
      btn.disabled = false;
      if (r.error) { msg('[data-signup-msg]', errText(r.error.message), true); return; }
      msg('[data-signup-msg]', ''); sent(email);
    });
  });
  $('[data-login-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('#acc-email').value.trim();
    if (!EMAIL_RE.test(email)) { msg('[data-login-msg]', 'Please enter a valid email address.', true); return; }
    var btn = $('[data-login-btn]'); btn.disabled = true; msg('[data-login-msg]', 'Sending…');
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: false, emailRedirectTo: redirect } }).then(function (r) {
      btn.disabled = false;
      if (r.error) { msg('[data-login-msg]', errText(r.error.message), true); return; }
      msg('[data-login-msg]', ''); sent(email);
    });
  });
  $('[data-change-email]').addEventListener('click', function () { $('[data-sent-step]').hidden = true; $('[data-login-step]').hidden = false; });

  /* ---------- profile ---------- */
  $('[data-profile-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#acc-name').value.trim().replace(/[^\p{L}\p{N} ]/gu, '').slice(0, 14);
    var phone = ($('#acc-cc').value + $('#acc-phone').value.replace(/\D/g, '').replace(/^0+/, ''));
    if (name.length < 2) { msg('[data-profile-msg]', 'Please enter your first name (at least 2 letters).', true); return; }
    if (!/^\+\d{8,15}$/.test(phone)) { msg('[data-profile-msg]', 'Please enter your mobile number without the country code.', true); return; }
    if (!$('#acc-agree').checked) { msg('[data-profile-msg]', 'Please confirm you are 18+ and accept the rules.', true); return; }
    msg('[data-profile-msg]', 'Saving…');
    insertProfile({ id: user.id, name: name, phone: phone }).then(function (r) {
      if (r.error) { msg('[data-profile-msg]', r.error.code === '23505' ? 'This phone number already has a PipClash account. One person = one account.' : 'Could not save: ' + r.error.message, true); return; }
      load();
    });
  });

  /* ---------- join ---------- */
  root.addEventListener('click', function (e) {
    var pb = e.target.closest('[data-pay]');
    if (pb) {
      pb.disabled = true; msg('[data-entry-msg]', 'Paying ' + usd(PAY.fee) + ' from your wallet…');
      sb.rpc('pc_enter_battle').then(function (r) {
        if (r.error) { pb.disabled = false; msg('[data-entry-msg]', payErr(r.error), true); return; }
        msg('[data-entry-msg]', 'Paid ✅ Your seat is booked.'); refresh();
      });
      return;
    }
    var cb = e.target.closest('[data-cancel]');
    if (cb) {
      if (!confirm('Cancel your entry and get ' + usd(PAY.fee) + ' back to your wallet?')) return;
      cb.disabled = true;
      sb.rpc('pc_cancel_entry').then(function (r) {
        if (r.error) { cb.disabled = false; msg('[data-entry-msg]', payErr(r.error), true); return; }
        msg('[data-entry-msg]', 'Cancelled ✅ ' + usd(PAY.fee) + ' is back in your wallet.'); refresh();
      });
      return;
    }
    var b = e.target.closest('[data-join]');
    if (b) {
      b.disabled = true;
      sb.from('web_entries').insert({ contest_date: b.getAttribute('data-join') || nextBattle(), user_id: user.id }).then(function (r) {
        if (r.error && r.error.code !== '23505') { b.disabled = false; msg('[data-entry-msg]', 'Could not book your seat right now. Please refresh the page and try again.', true); return; }
        msg('[data-entry-msg]', '');
        refresh();
      });
    }
    var c = e.target.closest('[data-copy]');
    if (c) {
      var t = c.getAttribute('data-copy');
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { c.textContent = 'Copied'; setTimeout(function () { c.textContent = 'Copy'; }, 1500); }, function () { });
    }
    if (e.target.closest('[data-logout]')) sb.auth.signOut().then(function () { location.reload(); });
  });

  function entryCard(en, cr, date) {
    var s = sched(), w = windowState(), box = $('[data-entry]'), out = '', lab = dayLabel(date), today = date === w.date;
    var title = $('[data-entry-title]'); if (title) title.textContent = today ? 'Today’s battle' : 'Next battle · ' + lab.charAt(0).toUpperCase() + lab.slice(1);
    var tnote = PAY.on && PAY.test ? '<p class="w-test"><b>TEST MODE</b> – no real money.</p>' : '';
    if (!en && PAY.on) {
      var can = PAY.bal >= PAY.fee, what = today && w.open ? 'today’s battle' : esc(lab);
      out = tnote + '<p class="muted2">Entry fee <b>' + usd(PAY.fee) + '</b> · your wallet <b>' + usd(PAY.bal) + '</b>. 80% of all entry fees go to the winners – the more traders, the bigger the prizes.</p>' +
        (can ? '<button class="btn btn-lg" type="button" data-pay>Pay ' + usd(PAY.fee) + ' & join ' + what + '</button>'
             : '<a class="btn btn-lg" href="wallet.html">Add money to your wallet</a>') +
        '<p class="muted2" style="font-size:13px">You can cancel and get the fee back until you are entered into the battle at ' + hm12(s.join_open) + ' UAE.</p>';
    } else if (!en) {
      if (today && w.open) out = '<p class="muted2">Today’s battle is open for entry until ' + hm12(s.join_close) + ' UAE.</p><button class="btn btn-lg" type="button" data-join="' + date + '">Join today’s battle</button>';
      else out = '<p class="muted2">Book your seat now for <b>' + esc(lab) + '</b>. You are entered automatically when entry opens at ' + hm12(s.join_open) + ' UAE – nothing else to tap.</p><button class="btn btn-lg" type="button" data-join="' + date + '">Book my seat for ' + esc(lab) + '</button>';
    } else if (en.status === 'pending' && (!today || w.before)) {
      out = '<p><span class="tag-ok">BOOKED</span> Your seat for <b>' + esc(lab) + '</b> is booked. You are entered automatically at ' + hm12(s.join_open) + ' UAE, and your MT5 login appears here at ' + hm12(s.creds_at) + ' UAE.</p>';
      if (PAY.on) out = tnote + out + '<button class="btn btn-ghost" type="button" data-cancel>Cancel & get ' + usd(PAY.fee) + ' back</button>';
    } else if (en.status === 'pending') {
      out = '<p><span class="tag-wait">CONFIRMING</span> We received your entry. Your seat is confirmed within about a minute.</p>';
      if (PAY.on) out = tnote + out + '<button class="btn btn-ghost" type="button" data-cancel>Cancel & get ' + usd(PAY.fee) + ' back</button>';
    } else if (en.status === 'rejected') {
      out = '<p><span class="tag-bad">NOT ACCEPTED</span> ' + esc(en.reason || 'Your entry could not be accepted.') + '</p>' +
        (PAY.on && !/back in your wallet/.test(en.reason || '') ? '<p class="muted2">Your entry fee has been refunded to your <a href="wallet.html">wallet</a>.</p>' : '');
    } else {
      out = '<p><span class="tag-ok">YOU’RE IN</span> Your battle name is <b>' + esc(en.public_name) + '</b>.</p>';
      if (cr) {
        var row = function (k, v) { return '<div class="cred"><span>' + k + '</span><b class="mono">' + esc(v) + '</b><button class="btn btn-ghost btn-sm" type="button" data-copy="' + esc(v) + '">Copy</button></div>'; };
        out += '<div class="creds"><h3>Your MT5 login</h3>' + row('Server', cr.server) + row('Login', cr.login) + row('Password', cr.password) +
          '<p class="muted2">Trade only after ' + hm12(s.trade_start) + ' UAE. Do not change the password. All trades close at ' + hm12(s.trade_end) + '. <a href="guide.html">How to log in to MT5</a></p></div>';
      } else {
        out += '<p class="muted2">Your MT5 login appears here at <b>' + hm12(s.creds_at) + '</b> UAE. Keep this page open or come back then.</p>';
      }
    }
    box.innerHTML = out;
  }

  function refCard() {          // Invite friends: apna link + kitne dost aaye/khele
    var box = $('[data-ref-card]'); if (!box) return;
    if (!profile || !profile.ref_code) { box.hidden = true; return; }
    var link = location.origin + location.pathname + '?ref=' + profile.ref_code + '#signup';
    box.hidden = false;
    $('[data-ref-link]').textContent = link;
    $('[data-ref-copy]').setAttribute('data-copy', link);
    var wa = $('[data-ref-wa]'); if (wa) wa.href = 'https://wa.me/?text=' + encodeURIComponent('Free daily trading battle – same $1,000 demo account, real prizes. Join with my link: ' + link);
    var tg = $('[data-ref-tg]'); if (tg) tg.href = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent('Daily MT5 trading battle – join with my link');
    sb.rpc('pc_my_referrals').then(function (r) {
      var d = r.data && (r.data[0] || r.data);
      $('[data-ref-stats]').textContent = d ? ('Friends joined: ' + (d.friends || 0) + ' · played a battle: ' + (d.played || 0)) : '';
    });
  }

  function refresh() {
    var t = windowState().date, nb = nextBattle();
    var q = function (tbl, cols, d) { return sb.from(tbl).select(cols).eq('contest_date', d).eq('user_id', user.id).maybeSingle(); };
    loadPay().then(function () { return Promise.all([
      q('web_entries', 'status,reason,public_name', t),
      q('web_creds', 'server,login,password', t),
      nb === t ? Promise.resolve({ data: null }) : q('web_entries', 'status,reason,public_name', nb)
    ]).then(function (r) {
      // Aaj khel raha hai to result tak aaj ka card (MT5 login ke saath); warna agli battle ki booking
      if (nb !== t && r[0].data && uaeNow().hm <= (sched().result_at || '21:30')) entryCard(r[0].data, r[1].data, t);
      else entryCard(nb === t ? r[0].data : r[2].data, nb === t ? r[1].data : null, nb);
    }); });
  }

  function load() {
    sb.auth.getUser().then(function (r) {
      user = r.data && r.data.user;
      if (!user) { show('login'); return; }
      var prof = function () {   // ref_code abhi na ho (SQL nahi chala) to purana select
        return sb.from('profiles').select('name,phone,ref_code').eq('id', user.id).maybeSingle().then(function (p) {
          return p.error ? sb.from('profiles').select('name,phone').eq('id', user.id).maybeSingle() : p;
        });
      };
      prof().then(function (p) {
        profile = p.data;
        if (!profile) {
          var md = user.user_metadata || {};
          if (md.name && md.phone && !load.tried) {
            load.tried = true;
            insertProfile({ id: user.id, name: cleanName(md.name), phone: md.phone }).then(function (x) {
              if (x.error) { show('profile'); $('#acc-name').value = md.name; msg('[data-profile-msg]', x.error.code === '23505' ? 'This phone number already has a PipClash account. One person = one account.' : 'Please check your details.', true); return; }
              load();
            });
            return;
          }
          show('profile'); $('#acc-name').value = (md.name || md.given_name || '').split(' ')[0]; return;
        }
        $('[data-hello]').textContent = profile.name;
        var em = /@telegram\.pipclash\.app$/.test(user.email || '') ? 'Telegram login' : (user.email || '');   // bot wala nakli email mat dikhao
        $('[data-who]').textContent = em + ' · phone ending ' + profile.phone.slice(-3);
        show('home');
        refCard();
        refresh();
        clearInterval(timer); timer = setInterval(refresh, 20000);
      });
    });
  }
  // setTimeout: callback ke andar seedha Supabase call = deadlock (naya sign-in 'Loading…' pe atakta tha)
  sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') setTimeout(load, 0); });
  load();
  setTimeout(function () {   // 15 sec baad bhi Loading… = refresh ka rasta do (kamzor internet)
    var l = root.querySelector('[data-view="loading"]');
    if (l && !l.hidden) l.innerHTML = '<p class="muted2">This is taking long. <a href="account.html">Tap to refresh</a></p>';
  }, 15000);
})();
