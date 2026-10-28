/* PipClash site – reads data/live.js (window.PC_DATA, written by the engine) and fills the page.
   Refreshes the data every 60 s. Works when opened as a file and on hosting. */
(function () {
  'use strict';
  var D = null;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var rk = function (n, pnl) { return n && n <= 3 && !(pnl <= 0) ? '<span class="medal m' + n + '" role="img" aria-label="Rank ' + n + '">' + n + '</span>' : '#' + n; };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (v) { v = Number(v) || 0; return (v >= 0 ? '+$' : '−$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var cls = function (v) { return Number(v) >= 0 ? 'up' : 'down'; };
  var BAL = 1000;   // har account ka start balance
  var arrow = function (v) { return v > 0 ? '▲ ' : (v < 0 ? '▼ ' : ''); };   // rang ke saath nishaan bhi (final design)
  var pctOf = function (pnl) { var v = (Number(pnl) || 0) / BAL * 100; return arrow(v) + (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + '%'; };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  function uae(iso) { // UTC ISO -> "4:30 PM" UAE
    if (!iso) return '';
    var d = new Date(new Date(iso).getTime() + 4 * 3600e3);
    var h = d.getUTCHours(), m = d.getUTCMinutes();
    return ((h + 11) % 12 + 1) + ':' + pad(m) + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  function uaeHM(hm, add) { // "16:30" UAE (+ minutes offset for other countries) -> "4:30 PM"
    var p = hm.split(':'), t = (+p[0]) * 60 + (+p[1]) + (add || 0);
    var h = Math.floor(t / 60) % 24, m = t % 60;
    return ((h + 11) % 12 + 1) + ':' + pad(m) + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  /* ---------- schedule / countdown ---------- */
  function sched() { return (D && D.schedule) || { join_open: '10:00', join_close: '16:00', creds_at: '16:25', trade_start: '16:30', trade_end: '19:30', result_at: '21:30', days: [1, 2, 3, 4, 5] }; }
  function nextWindow(now) {
    var s = sched(), toUTC = function (hm) { var p = hm.split(':'); return (+p[0] - 4) * 60 + (+p[1]); };
    var b = D && D.battle;
    var mins = function (hm) { var p = hm.split(':'); return (+p[0]) * 60 + (+p[1]); };
    if (b && b.status === 'live' && b.end_utc) {
      if (new Date(b.end_utc) > now) return { live: true, target: new Date(b.end_utc) };
      return { live: false, closing: true, target: now };            // time khatam, engine trades band kar raha hai
    }
    if (b && b.status === 'review' && b.end_utc) {                   // result ka countdown
      var r = new Date(new Date(b.end_utc).getTime() + (mins(s.result_at) - mins(s.trade_end)) * 60e3);
      if (r > now) return { live: false, review: true, target: r };
    }
    if (b && b.status === 'upcoming' && b.start_utc && new Date(b.start_utc) > now) return { live: false, target: new Date(b.start_utc) };
    var st = toUTC(s.trade_start), en = toUTC(s.trade_end);
    var canLive = !!(b && (b.status === 'upcoming' || b.status === 'live'));   // aaj ka battle bana ho tabhi LIVE
    for (var i = 0; i < 8; i++) {
      var d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i));
      var dow = d.getUTCDay(); if ((s.days || [1, 2, 3, 4, 5]).indexOf(dow) < 0) continue;
      var a = new Date(d.getTime() + st * 60e3), z = new Date(d.getTime() + en * 60e3);
      if (now >= a && now < z) { if (canLive) return { live: true, target: z }; continue; }
      if (now < a) return { live: false, target: a };
    }
    return { live: false, target: new Date(now.getTime() + 864e5) };
  }
  function ago(iso) {
    var m = Math.max(0, Math.floor((Date.now() - new Date(iso)) / 60000));
    return m < 1 ? 'just now' : (m < 60 ? m + ' min ago' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min ago');
  }
  function liveChip() {
    var b = D && D.battle, st = b ? b.status : null;
    $$('[data-live-chip]').forEach(function (el) {
      if (!b || !D.updated_utc || (st !== 'live' && st !== 'review')) { el.hidden = true; return; }
      var n = (D.standings || []).length;
      el.hidden = false;
      el.className = 'live-chip' + (st === 'live' ? ' on' : '');
      el.innerHTML = '<span class="dot' + (st === 'live' ? ' live' : '') + '"></span><b>' + (st === 'live' ? 'LIVE' : 'CHECKING') + '</b> · ' + n + ' traders · ' + ago(D.updated_utc);
    });
  }
  function tickClock() {
    liveChip();
    var now = new Date(window.PC_NOW ? window.PC_NOW() : Date.now()), w = nextWindow(now), left = Math.max(0, Math.floor((w.target - now) / 1000));
    $$('[data-clock]').forEach(function (el) {
      var h = Math.floor(left / 3600), m = Math.floor(left % 3600 / 60), s = left % 60;
      var b = el.querySelectorAll('b'); if (b.length === 3) { b[0].textContent = pad(h); b[1].textContent = pad(m); b[2].textContent = pad(s); }
      else el.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
    });
    $$('[data-clock-label]').forEach(function (el) { el.textContent = w.live ? 'Battle ends in' : (w.review ? 'Final result in' : (w.closing ? 'Battle over' : 'Trading starts in')); });
    $$('[data-live-tag]').forEach(function (el) { el.hidden = !w.live; });
    $$('[data-status]').forEach(function (el) {
      var b = D && D.battle, st = b ? b.status : null;
      var txt = w.live ? 'LIVE' : (w.closing ? 'CLOSING' : (st === 'review' ? 'CHECKING' : 'NEXT'));
      var desc = w.live ? (' Battle #' + (b ? b.id : '') + ' in progress · ends ' + uaeHM(sched().trade_end) + ' UAE')
        : w.closing ? ' Time is up · closing all trades'
        : (st === 'review' ? ' Results are being checked · final ' + uaeHM(sched().result_at) + ' UAE'
          : ' Daily battle · ' + uaeHM(sched().trade_start) + ' UAE');
      el.innerHTML = '<span class="dot' + (w.live ? ' live' : '') + '"></span><span class="mono" style="color:var(--text)">' + txt + '</span>' + esc(desc);
    });
  }

  /* ---------- renderers ---------- */
  function standings() { return (D && D.standings) || []; }
  function flag(c) { return c ? '<img class="flag" src="https://flagcdn.com/w20/' + esc(c) + '.png" width="18" height="13" alt="" loading="lazy" onerror="this.remove()"> ' : ''; }
  function renderDQ() {
    var list = (D && D.disqualified) || [];
    $$('[data-dq]').forEach(function (box) {
      box.hidden = !list.length;
      var n = box.querySelector('[data-dq-n]'); if (n) n.textContent = list.length;
      var b = box.querySelector('[data-dq-list]'); if (b) b.innerHTML = list.map(function (x) { return '<div class="dq-li">' + flag(x.cc) + '<b>' + esc(x.name) + '</b><span class="dq-badge">Rule broken</span></div>'; }).join('');
    });
  }
  function renderStandings() {
    $$('[data-standings]').forEach(function (box) {
      var lim = +box.getAttribute('data-limit') || 999, compact = box.hasAttribute('data-compact');
      var q = (($('#find') || {}).value || '').trim().toLowerCase();
      var rows = standings().filter(function (r) { return !q || r.name.toLowerCase().indexOf(q) >= 0; }).slice(0, lim);
      if (!rows.length) { box.innerHTML = '<tr><td colspan="7" class="empty">' + (q ? 'No trader with that name.' : 'Standings appear when the battle starts at ' + uaeHM(sched().trade_start) + ' UAE.') + '</td></tr>'; return; }
      var rowHtml = function (r) {
        var rc = r.rank === 1 ? 'gold' : (r.rank <= 3 ? 'acc' : 'muted');
        var mv = r.move > 0 ? '<span class="up">▲' + r.move + '</span>' : (r.move < 0 ? '<span class="down">▼' + (-r.move) + '</span>' : '');
        return '<tr class="lb-row' + (r.rank === 1 ? ' first' : '') + '"><td class="mono ' + rc + '" style="font-weight:700">' + rk(r.rank, r.pnl) + '</td><td style="font-weight:600">' + flag(r.cc) + esc(r.name) +
          (compact ? ' <span class="mono" style="font-size:13px">' + mv + '</span>' : ' <span class="mono" style="font-size:13px" data-mv>' + mv + '</span>') + '</td><td class="mono muted2 c-trades">' + (r.trades || 0) + '</td>' +
          (compact ? '' : '<td class="mono c-move" style="font-size:13px">' + mv + '</td><td class="mono r c-ru ' + cls(r.real || 0) + '">' + money(r.real || 0) + '</td><td class="mono r c-ru ' + cls(r.unreal || 0) + '">' + money(r.unreal || 0) + '</td>') + '<td class="mono r ' + cls(r.pnl) + '" style="font-weight:700">' + money(r.pnl) + '<span class="pct-line">' + pctOf(r.pnl) + '</span></td></tr>';
      };
      // Laptop + 30 se zyada players: rank 1-30 baayein, 31-60 daayein (do column)
      var split = +box.getAttribute('data-split') || 0, wrap = box.closest('.lb-cols');
      var two = !!(split && wrap && !q && rows.length > split && window.innerWidth >= 1280);
      if (wrap) { wrap.classList.toggle('two', two); var b2 = wrap.querySelector('[data-lb2]'); if (b2) b2.hidden = !two; }
      box.innerHTML = (two ? rows.slice(0, split) : rows).map(rowHtml).join('');
      if (two) wrap.querySelector('[data-standings2]').innerHTML = rows.slice(split, split * 2).map(rowHtml).join('');
    });
  }
  function feedItems() { return (D && D.feed) || []; }
  function renderFeed() {
    $$('[data-feed]').forEach(function (box) {
      var items = feedItems().slice(0, +box.getAttribute('data-limit') || 12);
      box.innerHTML = items.length ? items.map(function (f) {
        var c = f.kind === 'profit' ? 'var(--up2)' : (f.kind === 'loss' ? 'var(--down)' : (f.kind === 'start' ? 'var(--gold)' : 'var(--accent2)'));
        return '<div style="display:grid;grid-template-columns:62px minmax(0,1fr);gap:10px;padding:12px 20px;border-bottom:1px solid var(--line);font-size:14px"><span class="mono" style="font-size:13px;color:var(--dim)">' + uae(f.t_utc) + '</span><span><span style="color:' + c + '">●</span> ' + esc(f.text) + '</span></div>';
      }).join('') : '<div class="empty">The feed starts when the battle begins.</div>';
    });
    $$('[data-ticker]').forEach(function (box) {
      var items = feedItems().slice(0, 8);
      var st = D && D.battle && D.battle.status;
      var bar = box.parentElement; if (bar) bar.hidden = !(items.length && (st === 'live' || st === 'review'));   // patti sirf battle ke time
      if (!items.length) { box.innerHTML = ''; return; }
      var html = items.map(function (f) { var c = f.kind === 'profit' ? 'var(--up2)' : (f.kind === 'loss' ? 'var(--down)' : 'var(--accent2)'); return '<span><span style="color:' + c + '">●</span> ' + esc(f.text) + '</span>'; }).join('');
      // Loop ke liye list 2 baar chahiye – par 1-3 event ho to "Battle started" do baar dikhta (E18): tab ruki hui patti
      var few = items.length < 4;
      box.innerHTML = few ? html : html + html;
      box.style.animation = few ? 'none' : '';
    });
  }
  function renderDuel() {
    var s = standings(), box = $('[data-duel]'); if (!box) return;
    if (s.length < 2) { box.innerHTML = '<p class="muted">The title fight appears once the battle is running.</p>'; return; }
    var fin = !(D && D.battle && D.battle.status === 'live');      // battle khatam = 'winner', chal rahi = 'leading'
    var a = s[0], b = s[1], max = Math.max(Math.abs(a.pnl), 1), w = Math.max(5, Math.min(100, (b.pnl / max) * 100));
    box.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><span style="font-size:21px;font-weight:700">' + esc(a.name) + '</span><span class="mono gold" style="font-size:24px;font-weight:700">' + money(a.pnl) + '</span></div><div class="bar"><i style="width:100%;background:var(--gold)"></i></div><span class="muted" style="font-size:13px">' + (a.trades || 0) + ' trades · ' + pctOf(a.pnl) + (fin ? ' · winner' : ' · leading') + '</span></div>' +
      '<div class="vs">vs</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><span style="font-size:21px;font-weight:700">' + esc(b.name) + '</span><span class="mono acc" style="font-size:24px;font-weight:700">' + money(b.pnl) + '</span></div><div class="bar"><i style="width:' + w.toFixed(0) + '%;background:var(--accent)"></i></div><span class="muted" style="font-size:13px">' + (b.trades || 0) + ' trades · ' + pctOf(b.pnl) + ' · gap ' + money(a.pnl - b.pnl).replace('+', '') + '</span></div>';
  }
  function renderStats() {
    var b = (D && D.battle) || {};
    var set = function (k, v) { $$('[data-stat="' + k + '"]').forEach(function (el) { el.textContent = v; }); };
    var on = b.status === 'live' || b.status === 'review';
    var done = b.status === 'ended', st = standings();
    set('players', b.players != null ? b.players : 0);              // battle se pehle bhi: kitne jude
    set('inprofit', on && b.in_profit != null ? b.in_profit : (done ? st.filter(function (r) { return r.pnl > 0; }).length : 0));
    set('update', on && b.update_no ? b.update_no + ' of ' + (b.updates_total || 19) : (done ? 'Final' : '0 of ' + (b.updates_total || 19)));
    $$('[data-stand-title]').forEach(function (el) {
      if (!el.hasAttribute('data-base')) el.setAttribute('data-base', el.textContent);
      el.textContent = done && st.length ? 'Last battle' + (b.end_utc ? ' · ' + new Date(b.end_utc).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Dubai' }) : '') : el.getAttribute('data-base');
    });
    set('next', b.status === 'live' && b.next_update_utc && new Date(b.next_update_utc) > Date.now() - 5 * 60e3 ? uae(b.next_update_utc) : (b.status === 'review' ? 'Final ' + uaeHM(sched().result_at) : uaeHM(sched().trade_start)));
    set('battle', b.id ? '#' + b.id : '');
    var late = D && D.updated_utc && b.status === 'live' && (Date.now() - new Date(D.updated_utc)) > 45 * 60e3;
    set('updated', D && D.updated_utc ? (late ? 'Last update ' + uae(D.updated_utc) + ' UAE · next one is late' : 'Updated ' + uae(D.updated_utc) + ' UAE') : 'Waiting for data');
  }
  function renderResult() {
    var r = D && D.last_result, pod = $('[data-podium]'), body = $('[data-result]');
    if (!r || !r.rows || !r.rows.length) {
      if (pod) pod.innerHTML = '<p class="muted" style="grid-column:1/-1">The first final result will appear here after the first battle.</p>';
      if (body) body.innerHTML = '<tr><td colspan="5" class="empty">No final result yet.</td></tr>';
      return;
    }
    $$('[data-result-title]').forEach(function (el) { el.textContent = 'FINAL · BATTLE #' + r.id + ' · ' + r.date; });
    if (pod) {
      var p = r.rows.filter(function (x) { return x.pnl > 0; }).slice(0, 3), card = function (x, i) {
        var styles = [
          'border-color:var(--gold);background:linear-gradient(170deg,rgba(242,200,102,.14),var(--surface) 55%);transform:scale(1.03)',
          'background:linear-gradient(170deg,#182440,var(--surface));transform:rotateY(8deg) translateY(20px)',
          'background:linear-gradient(170deg,#1E1A16,var(--surface));transform:rotateY(-8deg) translateY(34px)'][i];
        var col = ['var(--gold)', '#D8DEE9', '#D7B48C'][i];
        return '<div class="card" style="padding:26px;display:flex;flex-direction:column;gap:10px;box-shadow:0 30px 60px rgba(0,0,0,.45);order:' + [2, 1, 3][i] + ';' + styles + '"><span class="display" style="font-size:44px;font-weight:700;color:' + col + '">' + x.rank + '</span><span style="font-size:21px;font-weight:700">' + esc(x.name) + '</span><span class="mono up" style="font-size:26px;font-weight:700">' + money(x.pnl) + '</span><span class="muted" style="font-size:14px">' + (x.trades || 0) + ' trades' + (x.prize ? ' · prize <b style="color:' + (i ? 'var(--text)' : 'var(--gold)') + '">$' + x.prize + '</b>' : '') + '</span></div>';
      };
      pod.innerHTML = p.length ? p.map(card).join('') : '<p class="muted" style="grid-column:1/-1">No winner in this battle – nobody finished in profit.</p>';
    }
    if (body) body.innerHTML = r.rows.map(function (x) {
      return '<tr><td class="mono ' + (x.rank === 1 ? 'gold' : (x.rank <= 3 ? 'acc' : 'muted')) + '" style="font-weight:700">' + rk(x.rank, x.pnl) + '</td><td style="font-weight:600">' + esc(x.name) + '</td><td class="mono muted2 c-trades">' + (x.trades || 0) + '</td><td class="mono r ' + cls(x.pnl) + '" style="font-weight:700">' + money(x.pnl) + '</td><td class="mono r" style="font-weight:700;color:' + (x.rank === 1 ? 'var(--gold)' : 'var(--text)') + '">' + (x.prize ? '$' + x.prize : '–') + (x.cert ? '<a class="cert-link" href="' + x.cert + '" target="_blank" rel="noopener">Certificate</a>' : '') + '</td></tr>';
    }).join('');
  }
  function renderPast() {
    $$('[data-past]').forEach(function (box) {
      var past = (D && D.past) || [];
      box.innerHTML = past.length ? past.map(function (p) {
        return '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:13px 20px;border-bottom:1px solid var(--line)"><div style="display:flex;flex-direction:column"><span style="font-weight:700' + (p.winner ? '' : ';color:var(--muted)') + '">' + (p.winner ? esc(p.winner) : 'No winner') + '</span><span style="font-size:13px;color:var(--dim)">' + esc(p.date) + ' · Battle #' + p.id + '</span></div><span class="mono ' + (p.winner ? 'up' : 'muted') + '" style="font-weight:700;align-self:center">' + (p.winner ? money(p.pnl) : '–') + '</span></div>';
      }).join('') : '<div class="empty">Past champions appear here.</div>';
    });
  }
  function renderHeroDay() {          // 'Win $200 today' – weekend / battle ke baad: tomorrow / on Monday
    var sc = sched(), days = sc.days || [1, 2, 3, 4, 5], u = new Date(Date.now() + 4 * 36e5), hm = u.toISOString().slice(11, 16), txt = '';
    for (var i = 0; i < 8 && !txt; i++) {
      var d = new Date(Date.UTC(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate() + i));
      if (days.indexOf(d.getUTCDay()) < 0 || (i === 0 && hm >= sc.trade_end)) continue;
      txt = i === 0 ? 'today' : (i === 1 ? 'tomorrow' : 'on ' + d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' }));
    }
    $$('[data-hero-day]').forEach(function (el) { el.textContent = txt || 'today'; });
  }
  function renderPrizeTable() {      // jitne log, utna inaam – entries band hone pe final
    var P = D && D.prize_table, box = $('[data-prize-card]'); if (!box) return;
    if (!P || !P.rows || !P.rows.length) { box.hidden = true; return; }
    box.hidden = false;
    $('[data-prize-title]').textContent = P.final ? 'Prize table' : 'Prize table so far';
    $('[data-prize-note]').textContent = (P.paid ? P.players + ' traders · prize pool $' + P.pool.toFixed(2) + ' · ' : '') +
      (P.final ? 'Final – only traders in profit can win.' : 'Grows with every entry until ' + uaeHM(sched().join_close) + ' UAE.');
    var m = function (v) { return '$' + (v % 1 ? v.toFixed(2) : v); };
    $('[data-prize-rows]').innerHTML = P.rows.map(function (r) {
      return '<div style="display:flex;justify-content:space-between;gap:10px;font-size:14px"><span class="mono muted2">#' + r.rank + '</span><b class="mono' + (r.rank === 1 ? ' gold' : '') + '">' + m(r.usd) + '</b></div>';
    }).join('');
  }
  function renderSchedule() {
    var s = sched();
    $$('[data-t]').forEach(function (el) { // data-t="trade_start" data-add="60"
      var k = el.getAttribute('data-t'), add = +(el.getAttribute('data-add') || 0);
      if (s[k]) el.textContent = uaeHM(s[k], add);
    });
    if (D && D.prizes) $$('[data-prize]').forEach(function (el) { var v = D.prizes[el.getAttribute('data-prize')]; if (v != null) el.textContent = '$' + v; });
  }
  function renderPaid() {          // paid entry chalu = 'free' wale text chhupao, '$10' wale dikhao
    var paid = window.PC_PAID != null ? window.PC_PAID : !!(D && D.paid_entry);
    $$('[data-free]').forEach(function (el) { el.hidden = paid; });
    $$('[data-paid]').forEach(function (el) { el.hidden = !paid; });
  }
  function renderAll() { renderToasts(); renderStats(); renderStandings(); renderDQ(); renderFeed(); renderDuel(); renderResult(); renderPast(); renderSchedule(); renderHeroDay(); renderPrizeTable(); renderPaid(); tickClock(); }

  /* ---------- decorative live chart (home) ---------- */
  function chart() {
    var box = $('[data-chart]'); if (!box) return;
    var seed = 11, rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    var p = 4128.4, ks = [];
    for (var i = 0; i < 30; i++) { var o = p, c = +(o + (rnd() - 0.42) * 7.5).toFixed(2); ks.push({ o: o, c: c, h: Math.max(o, c) + rnd() * 3.4, l: Math.min(o, c) - rnd() * 3.4, v: 8 + rnd() * 30 }); p = c; }
    var price = ks[29].c;
    function draw() {
      var last = ks[29]; last.c = price; last.h = Math.max(last.h, price); last.l = Math.min(last.l, price);
      var hi = Math.max.apply(null, ks.map(function (k) { return k.h; })), lo = Math.min.apply(null, ks.map(function (k) { return k.l; }));
      var H = 290, y = function (v) { return 14 + (hi - v) / (hi - lo) * (H - 28); }, slot = 100 / 30, html = '', vol = '';
      ks.forEach(function (k, i) {
        var up = k.c >= k.o, col = up ? '#22C55E' : '#EF4444', dk = up ? '#13805A' : '#8C2433', t = y(Math.max(k.o, k.c)), b = y(Math.min(k.o, k.c));
        html += '<div class="k" style="left:' + (i * slot + slot * .2).toFixed(2) + '%;width:' + (slot * .6).toFixed(2) + '%"><div class="w" style="top:' + y(k.h).toFixed(1) + 'px;height:' + Math.max(2, y(k.l) - y(k.h)).toFixed(1) + 'px;background:' + col + '"></div><div class="b" style="top:' + t.toFixed(1) + 'px;height:' + Math.max(2, b - t).toFixed(1) + 'px;background:linear-gradient(90deg,' + col + ' 62%,' + dk + ');box-shadow:4px -3px 0 ' + dk + (i === 29 ? ',0 0 18px ' + col : '') + '"></div></div>';
        vol += '<i style="left:' + (i * slot + slot * .2).toFixed(2) + '%;width:' + (slot * .6).toFixed(2) + '%;height:' + Math.round(k.v) + 'px;background:' + col + '"></i>';
      });
      var ma = ks.map(function (k, i) { var w = ks.slice(Math.max(0, i - 4), i + 1); return w.reduce(function (a, b) { return a + b.c; }, 0) / w.length; });
      var path = 'M' + ma.map(function (v, i) { return ((i + .5) * 10).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' L');
      var diff = price - ks[0].o, col = diff >= 0 ? '#22C55E' : '#EF4444', py = y(price);
      box.innerHTML = html + '<svg viewBox="0 0 300 290" preserveAspectRatio="none" aria-hidden="true"><path d="' + path + '" fill="none" stroke="#4DA3FF" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>' +
        '<div class="pline" style="top:' + py.toFixed(1) + 'px;border-color:' + col + '"></div><span class="ptag" style="top:' + (py - 9).toFixed(1) + 'px;background:' + col + '">' + price.toFixed(2) + '</span>' +
        '<span class="hilo" style="top:2px">' + hi.toFixed(1) + '</span><span class="hilo" style="bottom:2px">' + lo.toFixed(1) + '</span>';
      var v = $('[data-vol]'); if (v) v.innerHTML = vol;
      $$('[data-px]').forEach(function (el) { el.textContent = price.toFixed(2); el.style.color = col; });
      $$('[data-chg]').forEach(function (el) { el.textContent = (diff >= 0 ? '+' : '') + diff.toFixed(2) + ' (' + (diff / ks[0].o * 100).toFixed(2) + '%)'; el.style.color = col; });
      $$('[data-bid]').forEach(function (el) { el.textContent = price.toFixed(2); });
      $$('[data-ask]').forEach(function (el) { el.textContent = (price + .25).toFixed(2); });
    }
    draw();
    setInterval(function () { price = +(price + (Math.random() - .47) * .55).toFixed(2); draw(); }, 1000);
    var term = $('.terminal-in'), hero = $('.hero');
    if (term && hero && window.matchMedia('(hover:hover)').matches) {
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, yy = (e.clientY - r.top) / r.height - .5;
        term.style.transform = 'rotateY(' + (-14 + x * 10).toFixed(1) + 'deg) rotateX(' + (7 - yy * 8).toFixed(1) + 'deg)';
        $$('[data-par]').forEach(function (el) { el.style.transform = 'translate(' + (x * 18).toFixed(1) + 'px,' + (yy * 12).toFixed(1) + 'px)'; });
        $$('[data-par2]').forEach(function (el) { el.style.transform = 'translate(' + (-x * 26).toFixed(1) + 'px,' + (-yy * 16).toFixed(1) + 'px)'; });
      });
    }
  }

  /* ---------- background skyline candles ---------- */
  function sky() {
    var seed = 7, r = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    $$('[data-sky]').forEach(function (box) {
      var html = '', lvl = 60;
      for (var i = 0; i < 40; i++) { lvl = Math.max(30, Math.min(190, lvl + (r() - 0.42) * 30)); var col = r() > 0.38 ? '#22C55E' : '#EF4444'; html += '<div><i style="height:' + Math.round(8 + r() * 22) + 'px;background:' + col + '"></i><b style="height:' + Math.round(lvl) + 'px;background:' + col + '"></b></div>'; }
      box.innerHTML = html;
    });
  }
  /* ---------- floating toasts: real battle events when live, samples otherwise ---------- */
  function renderToasts() {
    var f = feedItems(), s = standings();
    var p = f.filter(function (x) { return x.kind === 'profit'; })[0], m = f.filter(function (x) { return x.kind === 'move'; })[0];
    var set = function (i, t) { $$('[data-toast="' + i + '"]').forEach(function (el) { el.hidden = !t; if (t) el.textContent = t; }); };
    set(0, p && '▲ ' + p.text);
    set(1, m && '⇧ ' + m.text);
    set(2, s.length >= 2 && '◆ Gap to #1: $' + Math.abs(s[0].pnl - s[1].pnl).toFixed(2));
  }

  /* ---------- results archive (winners.html) ---------- */
  var pct = function (v) { v = Number(v) || 0; return arrow(v) + (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + '%'; };
  function renderArchive() {
    var main = $('[data-res-main]'); if (!main) return;
    var R = window.PC_RESULTS || { list: [], detail: {} };
    var id = (location.search.match(/[?&]id=(\d+)/) || [])[1];
    var pod = $('[data-res-podium]'), back = $('[data-res-back]');
    var setT = function (sel, t) { $$(sel).forEach(function (el) { el.textContent = t; }); };
    if (id && R.detail[id]) {
      var d = R.detail[id], ranked = d.rows.filter(function (x) { return !x.dq; });
      document.title = 'Battle #' + d.id + ' result – PipClash';
      setT('[data-res-eyebrow]', 'FINAL RESULT · BATTLE #' + d.id);
      setT('[data-res-title]', d.date);
      setT('[data-res-sub]', d.traders + ' traders · final standings');
      if (back) back.hidden = false;
      var winners = ranked.filter(function (x) { return x.pnl > 0; }).slice(0, 3);
      pod.innerHTML = winners.length ? [1, 0, 2].map(function (i) {
        var x = winners[i]; if (!x) return '<div></div>';
        var lab = ['WINNER', '2ND', '3RD'][i];
        return '<div class="res-card' + (i === 0 ? ' win' : '') + '"><span class="res-lab">' + lab + '</span><b class="res-name">' + esc(x.name) +
          '</b><span class="mono res-pnl">' + money(x.pnl) + '</span><span class="mono res-pct">' + pct(x.pct) + '</span>' +
          (x.prize ? '<span class="res-prize">Prize <b>$' + x.prize + '</b></span>' : '') + '</div>';
      }).join('') : '<p class="muted" style="grid-column:1/-1">No winner in this battle – nobody finished in profit.</p>';
      main.innerHTML = '<div class="card"><div class="table-box"><table><thead><tr><th>Rank</th><th>Trader</th><th class="c-trades">Trades</th><th class="r">P&amp;L</th><th class="r c-pct">%</th><th class="r">Prize</th></tr></thead><tbody>' +
        d.rows.map(function (x) {
          if (x.dq) return '<tr class="dq-row"><td class="mono muted">–</td><td style="font-weight:600">' + esc(x.name) + '</td><td class="mono muted2 c-trades">' + (x.trades || 0) + '</td><td colspan="3" class="r"><span class="dq-badge">DISQUALIFIED</span></td></tr>';
          return '<tr' + (x.rank === 1 && x.pnl > 0 ? ' class="lb-row first"' : '') + '><td class="mono ' + (x.rank === 1 ? 'gold' : (x.rank <= 3 ? 'acc' : 'muted')) + '" style="font-weight:700">' + rk(x.rank, x.pnl) + '</td><td style="font-weight:600">' + esc(x.name) +
            '</td><td class="mono muted2 c-trades">' + (x.trades || 0) + '</td><td class="mono r ' + cls(x.pnl) + '" style="font-weight:700">' + money(x.pnl) + '<span class="pct-sm">' + pct(x.pct) + '</span></td><td class="mono r c-pct ' + cls(x.pnl) + '">' + pct(x.pct) +
            '</td><td class="mono r" style="font-weight:700;color:' + (x.prize ? (x.rank === 1 ? 'var(--gold)' : 'var(--text)') : 'var(--dim)') + '">' + (x.prize ? '$' + x.prize : '–') + (x.cert ? '<a class="cert-link" href="' + x.cert + '" target="_blank" rel="noopener">Certificate</a>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div><div class="sample">P&amp;L counts only trades opened in the battle window. % is profit on the $1,000 starting balance.</div></div>';
      return;
    }
    if (id) {                 // ?id=99 – aisi battle nahi (WW12)
      if (back) back.hidden = false;
      pod.innerHTML = '';
      main.innerHTML = '<div class="card"><div class="empty">Battle #' + esc(id) + ' was not found. <a href="winners.html">See all results →</a></div></div>';
      return;
    }
    if (back) back.hidden = true;
    pod.innerHTML = '';
    if (!R.list.length) { main.innerHTML = '<div class="card"><div class="empty">The first result will appear here after the first battle.</div></div>'; return; }
    main.innerHTML = '<div class="res-list">' + R.list.map(function (b) {
      var top = b.top.map(function (t) {
        return '<div class="res-top">' + rk(t.rank, t.pnl) + '<span class="res-tn">' + esc(t.name) + '</span><span class="mono ' + cls(t.pnl) + '">' + money(t.pnl) + '</span></div>';
      }).join('') || '<div class="muted">No ranked traders</div>';
      return '<a class="card res-item" href="winners.html?id=' + b.id + '"><div class="res-head"><div><b class="display" style="font-size:19px">' + esc(b.date) + '</b><div class="muted" style="font-size:13px">Battle #' + b.id + ' · ' + b.traders + ' traders</div></div>' +
        (b.winner ? '' : '<span class="pill" style="font-size:13px;padding:4px 10px">No winner</span>') + '</div>' + top + '<span class="res-view">View full result →</span></a>';
    }).join('') + '</div>';
  }
  function loadArchive() {
    if (!$('[data-res-main]')) return;
    var s = document.createElement('script');
    s.src = DATA + 'results.js?t=' + Date.now();
    s.onload = s.onerror = function () { s.remove(); renderArchive(); };
    document.head.appendChild(s);
  }

  /* ---------- data loading ---------- */
  var DATA = location.pathname.indexOf('/v2/') === 0 ? '/data/' : 'data/';   // /v2/ preview = main site ka live data
  function load() {
    var s = document.createElement('script');
    s.src = DATA + 'live.js?t=' + Date.now();
    s.onload = function () { D = window.PC_DATA || D; renderAll(); s.remove(); };
    s.onerror = function () { s.remove(); renderAll(); };
    document.head.appendChild(s);
  }
  document.addEventListener('DOMContentLoaded', function () {
    var f = $('#find'); if (f) f.addEventListener('input', renderStandings);
    chart(); sky(); renderAll(); load(); loadArchive();
    setInterval(tickClock, 1000);
    setInterval(load, 60000);
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(renderStandings, 200); });
  });
})();
