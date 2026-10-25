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
  var user = null, profile = null, timer = null;

  function show(name) {
    root.querySelectorAll('[data-view]').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== name; });
  }
  function msg(sel, text, bad) { var el = $(sel); if (el) { el.textContent = text || ''; el.className = 'acc-msg' + (bad ? ' bad' : ''); } }

  /* ---------- login ---------- */
  $('[data-login-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('#acc-email').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg('[data-login-msg]', 'Please enter a valid email address.', true); return; }
    var btn = $('[data-login-btn]'); btn.disabled = true; msg('[data-login-msg]', 'Sending…');
    sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname } }).then(function (r) {
      btn.disabled = false;
      if (r.error) { msg('[data-login-msg]', r.error.message.indexOf('rate') >= 0 ? 'Too many emails right now. Please wait a few minutes and try again, or use Telegram.' : r.error.message, true); return; }
      msg('[data-login-msg]', 'Check your inbox (and spam). Tap the link in the email from PipClash to log in.');
    });
  });
  var GOOGLE_ON = false;   // Google login Supabase mein chalu karne ke baad true
  var g = $('[data-google]');
  if (g && !GOOGLE_ON) { g.hidden = true; var or = $('.acc-or'); if (or) or.hidden = true; }
  if (g) g.addEventListener('click', function () { sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }); });

  /* ---------- profile ---------- */
  $('[data-profile-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#acc-name').value.trim().replace(/[^\p{L}\p{N} ]/gu, '').slice(0, 14);
    var phone = ($('#acc-cc').value + $('#acc-phone').value.replace(/\D/g, '').replace(/^0+/, ''));
    if (name.length < 2) { msg('[data-profile-msg]', 'Please enter your first name (at least 2 letters).', true); return; }
    if (!/^\+\d{8,15}$/.test(phone)) { msg('[data-profile-msg]', 'Please enter your mobile number without the country code.', true); return; }
    if (!$('#acc-agree').checked) { msg('[data-profile-msg]', 'Please confirm you are 18+ and accept the rules.', true); return; }
    msg('[data-profile-msg]', 'Saving…');
    sb.from('profiles').insert({ id: user.id, name: name, phone: phone }).then(function (r) {
      if (r.error) { msg('[data-profile-msg]', r.error.code === '23505' ? 'This phone number already has a PipClash account. One person = one account.' : 'Could not save: ' + r.error.message, true); return; }
      load();
    });
  });

  /* ---------- join ---------- */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-join]');
    if (b) {
      b.disabled = true;
      sb.from('web_entries').insert({ contest_date: windowState().date, user_id: user.id }).then(function (r) {
        if (r.error && r.error.code !== '23505') { b.disabled = false; msg('[data-entry-msg]', 'Entry is closed right now. Entry is open Mon–Fri ' + hm12(sched().join_open) + ' – ' + hm12(sched().join_close) + ' UAE.', true); return; }
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

  function entryCard(en, cr) {
    var s = sched(), w = windowState(), box = $('[data-entry]'), out = '';
    if (!en) {
      if (w.open) out = '<p class="muted2">Today’s battle is open for entry until ' + hm12(s.join_close) + ' UAE.</p><button class="btn btn-lg" type="button" data-join>Join today’s battle</button>';
      else if (w.day && w.before) out = '<p class="muted2">Entry opens today at <b>' + hm12(s.join_open) + '</b> UAE. Come back then and tap Join.</p>';
      else out = '<p class="muted2">Entry for the next battle opens at <b>' + hm12(s.join_open) + '</b> UAE, Monday to Friday.</p>';
    } else if (en.status === 'pending') {
      out = '<p><span class="tag-wait">CONFIRMING</span> We received your entry. Your seat is confirmed within about a minute.</p>';
    } else if (en.status === 'rejected') {
      out = '<p><span class="tag-bad">NOT ACCEPTED</span> ' + esc(en.reason || 'Your entry could not be accepted.') + '</p>';
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

  function refresh() {
    var d = windowState().date;
    Promise.all([
      sb.from('web_entries').select('status,reason,public_name').eq('contest_date', d).eq('user_id', user.id).maybeSingle(),
      sb.from('web_creds').select('server,login,password').eq('contest_date', d).eq('user_id', user.id).maybeSingle()
    ]).then(function (r) { entryCard(r[0].data, r[1].data); });
  }

  function load() {
    sb.auth.getUser().then(function (r) {
      user = r.data && r.data.user;
      if (!user) { show('login'); return; }
      sb.from('profiles').select('name,phone').eq('id', user.id).maybeSingle().then(function (p) {
        profile = p.data;
        if (!profile) { show('profile'); var gn = (user.user_metadata && (user.user_metadata.given_name || user.user_metadata.name)) || ''; $('#acc-name').value = gn.split(' ')[0] || ''; return; }
        $('[data-hello]').textContent = profile.name;
        $('[data-who]').textContent = (user.email || '') + ' · phone ending ' + profile.phone.slice(-3);
        show('home');
        refresh();
        clearInterval(timer); timer = setInterval(refresh, 20000);
      });
    });
  }
  sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') load(); });
  load();
})();
