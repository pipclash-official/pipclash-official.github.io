"""Builds the 6 static pages from shared header/footer. Run: python build.py  (output: *.html next to this file)"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
BOT = "https://t.me/PipClashBot"
SITE_URL = ""   # domain milne ke baad: "https://pipclash.live" (share preview ke liye poora link chahiye)
V = "5"         # icon/css badlo toh number badha do – browser cache todta hai
LOGO = ('<svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true"><path d="M21 5v54" stroke="#60A5FA" stroke-width="3" stroke-linecap="round"/>'
        '<rect x="14" y="12" width="14" height="40" rx="3" fill="#3B82F6"/><path d="M28 14h9a13.5 13.5 0 0 1 0 27h-9" fill="none" stroke="#EEF2F8" stroke-width="8"/>'
        '<path d="M48 44v14" stroke="#3EE6A8" stroke-width="2.5" stroke-linecap="round"/><rect x="44" y="47" width="8" height="8" rx="2" fill="#3EE6A8"/></svg>')
NAV = [("arena.html", "Live Arena"), ("winners.html", "Winners"), ("rules.html", "Rules"), ("guide.html", "MT5 Guide")]


def page(fname, title, desc, body):
    nav = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h == fname else ""}>{t}</a>' for h, t in NAV)
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="PipClash">
<meta property="og:image" content="{SITE_URL}{"/" if SITE_URL else ""}assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B1120">
<link rel="icon" href="assets/favicon.svg?v={V}" type="image/svg+xml">
<link rel="icon" href="assets/favicon-32.png?v={V}" type="image/png" sizes="32x32">
<link rel="icon" href="assets/favicon-16.png?v={V}" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png?v={V}">
<link rel="manifest" href="site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=Bodoni+Moda:ital,opsz,wght@1,6..96,700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap">
<link rel="stylesheet" href="assets/site.css?v={V}">
<script src="assets/site.js?v={V}" defer></script>
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="index.html">{LOGO}<b>PIP<span>CLASH</span></b></a>
  <nav class="nav" aria-label="Main">{nav}</nav>
  <a class="btn" href="{BOT}">Join on Telegram</a>
</div></header>
<main>
{body}
</main>
<footer class="foot"><div class="wrap">
  <span class="brand">{LOGO.replace('width="34" height="34"', 'width="24" height="24"')}<b style="font-size:17px">PIP<span>CLASH</span></b></span>
  <span>Demo accounts only – no real money is traded and entry is free. Not financial advice. <a href="legal.html#terms">Terms</a> · <a href="legal.html#privacy">Privacy</a> · <a href="rules.html">Rules</a></span>
</div></footer>
</body>
</html>
'''
    open(os.path.join(HERE, fname), "w", encoding="utf-8").write(html)


TIMES = '''<div class="card table-box"><table>
<thead><tr><th>Mon – Fri</th><th>UAE</th><th>Pakistan</th><th>India</th></tr></thead>
<tbody class="mono">
<tr><td style="font-family:var(--f-body)">Entry opens</td><td data-t="join_open">10:00 AM</td><td data-t="join_open" data-add="60">11:00 AM</td><td data-t="join_open" data-add="90">11:30 AM</td></tr>
<tr><td style="font-family:var(--f-body)">Entry closes</td><td data-t="join_close">4:00 PM</td><td data-t="join_close" data-add="60">5:00 PM</td><td data-t="join_close" data-add="90">5:30 PM</td></tr>
<tr><td style="font-family:var(--f-body)">MT5 login sent</td><td data-t="creds_at">4:25 PM</td><td data-t="creds_at" data-add="60">5:25 PM</td><td data-t="creds_at" data-add="90">5:55 PM</td></tr>
<tr class="acc"><td style="font-family:var(--f-body)">Trading</td><td><span data-t="trade_start">4:30 PM</span> – <span data-t="trade_end">7:30 PM</span></td><td><span data-t="trade_start" data-add="60">5:30 PM</span> – <span data-t="trade_end" data-add="60">8:30 PM</span></td><td><span data-t="trade_start" data-add="90">6:00 PM</span> – <span data-t="trade_end" data-add="90">9:00 PM</span></td></tr>
<tr><td style="font-family:var(--f-body)">Final result</td><td data-t="result_at">9:30 PM</td><td data-t="result_at" data-add="60">10:30 PM</td><td data-t="result_at" data-add="90">11:00 PM</td></tr>
</tbody></table></div>'''

LB_HEAD = '<thead><tr><th>Rank</th><th>Trader</th><th>Trades</th><th class="r">P&amp;L</th></tr></thead>'

TERMINAL = '''      <div class="terminal"><div class="terminal-in">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--line);flex-wrap:wrap">
          <span><b class="display" style="font-size:18px">XAUUSD</b> <b class="mono" data-px style="font-size:20px">0</b> <span class="mono" data-chg style="font-size:13px"></span></span>
          <span class="mono" style="display:flex;gap:4px;font-size:12px;color:var(--muted)"><span style="padding:4px 8px">M1</span><span style="padding:4px 8px;border-radius:6px;background:#1E2D4F;color:var(--accent2)">M5</span><span style="padding:4px 8px">M15</span><span style="padding:4px 8px">H1</span></span>
        </div>
        <div class="chart" data-chart></div>
        <div class="vol" data-vol></div>
        <div class="orders">
          <div class="sell" style="background:rgba(255,107,122,.08);border:1px solid rgba(255,107,122,.45)"><b class="down" style="font-size:14px">SELL</b><b class="mono" data-bid style="font-size:17px">0</b></div>
          <div class="buy" style="background:rgba(110,231,183,.08);border:1px solid rgba(110,231,183,.5)"><b class="up" style="font-size:14px">BUY</b><b class="mono" data-ask style="font-size:17px">0</b></div>
        </div>
        <div style="padding:0 18px 12px;font-size:11px;color:var(--dim)">Demo chart · sample prices</div>
      </div></div>
      <div class="toasts-l" data-par><div class="toast t-up" data-toast="0">▲ Trader closed XAUUSD +$38.20</div><div class="toast t-acc" data-toast="1" style="animation-delay:2s">⇧ Trader climbs to #2</div></div>
      <div class="toasts-r" data-par><div class="toast t-gap" data-toast="2" style="animation-delay:4s">◆ Gap to #1: $85.35</div></div>
'''

# ---------------- HOME ----------------
page("index.html", "PipClash – Free daily MT5 trading battle",
     "Same $1,000. Same 3 hours. One winner. Free daily MT5 demo trading battle for India, Pakistan and the UAE.", f'''
<section class="hero">
  <div class="floor" aria-hidden="true"></div>
  <div class="sky" data-sky aria-hidden="true"></div><div class="beam" aria-hidden="true"></div>
  <div class="wrap hero-grid">
    <div style="display:flex;flex-direction:column;gap:24px;position:relative;z-index:3">
      <span class="pill" data-status style="align-self:flex-start"><span class="dot"></span>Daily battle · 4:30 PM UAE</span>
      <h1>Same $1,000.<br>Same 3 hours.<br><em>One winner.</em></h1>
      <p class="lede">The free daily MT5 demo trading battle for India, Pakistan and the UAE. A fresh account for every trader, the same balance, the same clock. Best profit at <span data-t="trade_end">7:30 PM</span> UAE wins.</p>
      <div style="display:flex;flex-direction:column;gap:10px">
        <span class="eyebrow" data-clock-label style="letter-spacing:.16em;text-transform:uppercase">Trading starts in</span>
        <div class="clock" data-clock><div><b>00</b><span>HRS</span></div><div><b>00</b><span>MIN</span></div><div><b>00</b><span>SEC</span></div></div>
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap">
        <a class="btn btn-lg" href="{BOT}">Claim your free seat</a>
        <a class="btn btn-lg btn-ghost" href="arena.html">Enter the arena</a>
      </div>
    </div>
    <div class="stage" aria-hidden="true">
      <div class="coin" data-par2><div class="ring"></div><div class="spin">
        <div class="face"><span class="display" style="font-size:36px;font-weight:700;line-height:1" data-prize="1">$200</span><span class="display" style="font-size:9px;letter-spacing:.26em;font-weight:700;margin-top:3px">TODAY’S GOLD</span></div>
        <div class="face back"><span class="display" style="font-size:17px;font-weight:700;letter-spacing:.1em">PIPCLASH</span></div>
      </div></div>
{TERMINAL}    </div>
  </div>
</section>
<div class="ticker"><div class="ticker-in" data-ticker></div></div>

<section class="section"><div class="wrap grid-2">
  <div class="card"><div class="card-h"><b>LIVE STANDINGS</b><span class="mono muted" style="font-size:12px" data-stat="updated">Waiting for data</span></div>
    <div class="table-box"><table>{LB_HEAD}<tbody data-standings data-limit="5" data-compact></tbody></table></div>
    <div style="padding:14px 20px;border-top:1px solid var(--line)"><a href="arena.html">Full standings →</a></div></div>
  <div class="card" style="padding:24px;display:flex;flex-direction:column;gap:18px;background:linear-gradient(120deg,rgba(59,130,246,.10),var(--surface) 55%)">
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><h2 style="font-size:30px">Title fight</h2><span class="mono muted" style="font-size:12px">#1 vs #2</span></div>
    <div class="duel" data-duel></div>
  </div>
</div></section>

<section class="section"><div class="wrap grid-4">
  <div class="stat"><div class="v acc">$0</div><div class="k">entry fee, always</div></div>
  <div class="stat"><div class="v">$1,000</div><div class="k">same demo balance</div></div>
  <div class="stat"><div class="v">3 hrs</div><div class="k"><span data-t="trade_start">4:30 PM</span> – <span data-t="trade_end">7:30 PM</span> UAE</div></div>
  <div class="stat"><div class="v acc">30 min</div><div class="k">rank updates</div></div>
</div></section>

<section class="section"><div class="wrap" style="display:flex;flex-direction:column;gap:26px">
  <h2>Enter in three steps</h2>
  <div class="grid-3" style="perspective:1400px">
    <div class="step" style="transform:rotateY(6deg)"><span class="eyebrow">01 · <span data-t="join_open">10:00 AM</span> – <span data-t="join_close">4:00 PM</span> UAE</span><h3 style="font-size:22px">Join on Telegram</h3><p class="muted2">Open @PipClashBot, tap Join and share your phone number. One phone, one seat.</p></div>
    <div class="step"><span class="eyebrow">02 · <span data-t="creds_at">4:25 PM</span></span><h3 style="font-size:22px">Get your MT5 key</h3><p class="muted2">The bot sends your own fresh demo account with $1,000. Log in on the MT5 app.</p></div>
    <div class="step" style="transform:rotateY(-6deg)"><span class="eyebrow">03 · <span data-t="trade_start">4:30 PM</span> – <span data-t="trade_end">7:30 PM</span></span><h3 style="font-size:22px">Trade and climb</h3><p class="muted2">Forex, gold and indices. Standings refresh every 30 minutes. Every trade closes at the end.</p></div>
  </div>
</div></section>

<section class="section"><div class="wrap" style="display:flex;flex-direction:column;gap:28px">
  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap"><h2>The daily purse</h2><span class="muted2">Ranks 4–10 win <b data-prize="4">$10</b> each · profit only</span></div>
  <div class="podium">
    <div style="width:210px"><span class="mono" style="font-size:34px;font-weight:700;color:#D8DEE9" data-prize="2">$100</span><div class="blk" style="height:160px;background:linear-gradient(180deg,#3A4A68,#121B2E);font-size:46px;color:#D8DEE9">2</div></div>
    <div style="width:240px"><span class="mono gold" style="font-size:44px;font-weight:700" data-prize="1">$200</span><div class="blk" style="height:230px;background:linear-gradient(180deg,#F5D06A,#8A5E14);font-size:60px;color:#1E1503;box-shadow:0 -12px 60px rgba(245,197,66,.3)">1</div></div>
    <div style="width:210px"><span class="mono" style="font-size:30px;font-weight:700;color:#D7B48C" data-prize="3">$50</span><div class="blk" style="height:120px;background:linear-gradient(180deg,#8A6340,#2A1C10);font-size:42px;color:#F0DEC8">3</div></div>
  </div>
  <p class="muted2" style="text-align:center">Results are checked for two hours. Final winners at <span data-t="result_at">9:30 PM</span> UAE.</p>
</div></section>

<section class="section"><div class="wrap">{TIMES}</div></section>

<section class="section"><div class="wrap">
  <div class="card" style="padding:40px 34px;display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;background:linear-gradient(110deg,#0F1A33,var(--surface) 50%,#13254A)">
    <div style="display:flex;flex-direction:column;gap:8px;max-width:640px"><h2 style="font-size:34px">Your seat for today’s battle is free.</h2><p class="muted2">Entry closes at <span data-t="join_close">4:00 PM</span> UAE · <span data-t="join_close" data-add="60">5:00 PM</span> Pakistan · <span data-t="join_close" data-add="90">5:30 PM</span> India.</p></div>
    <a class="btn btn-lg" href="{BOT}">Join @PipClashBot</a>
  </div>
</div></section>
''')

# ---------------- ARENA ----------------
page("arena.html", "Live Arena – PipClash", "Live standings, title fight and battle feed for today's PipClash battle.", f'''
<section class="hero arena-hero">
  <div class="floor" aria-hidden="true"></div>
  <div class="sky" data-sky aria-hidden="true"></div><div class="beam" aria-hidden="true"></div>
  <div class="wrap hero-grid">
    <div style="display:flex;flex-direction:column;gap:20px;position:relative;z-index:3">
      <span class="pill" data-status style="align-self:flex-start"><span class="dot"></span>Daily battle</span>
      <h1>Live Arena</h1>
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 20px;border-radius:14px;align-self:flex-start;min-width:300px"><span class="muted" data-clock-label style="font-size:13px">Trading starts in</span><span class="mono" data-clock style="font-size:30px;font-weight:700">00:00:00</span></div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px">
        <div class="stat"><div class="k">Traders</div><div class="v" data-stat="players">–</div></div>
        <div class="stat"><div class="k">In profit</div><div class="v up" data-stat="inprofit">–</div></div>
        <div class="stat"><div class="k">Rank update</div><div class="v" data-stat="update">–</div></div>
        <div class="stat" style="border-color:var(--accent);background:var(--surface2)"><div class="k">Next update</div><div class="v acc" data-stat="next">–</div></div>
      </div>
    </div>
    <div class="stage arena-stage" aria-hidden="true">
{TERMINAL}    </div>
  </div>
</section>
<section class="section" style="padding-top:24px"><div class="wrap side">
  <div class="card">
    <div class="card-h"><b>Standings</b>
      <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--line2);border-radius:10px;background:var(--bg);font-size:14px">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="#94A0B8" stroke-width="2"/><path d="m20 20-4-4" stroke="#94A0B8" stroke-width="2" stroke-linecap="round"/></svg>
        <span class="muted" style="position:absolute;left:-9999px">Find your name</span><input id="find" type="search" placeholder="Find your name" style="background:transparent;border:0;outline:none;color:var(--text);font:inherit;width:160px"></label></div>
    <div class="table-box"><table><thead><tr><th>Rank</th><th>Trader</th><th class="c-trades">Trades</th><th class="c-move">Move</th><th class="r">P&amp;L</th></tr></thead><tbody data-standings></tbody></table></div>
    <div class="sample">P&amp;L counts only trades opened after <span data-t="trade_start">4:30 PM</span> UAE. Disqualified players are not ranked. <span data-stat="updated"></span></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:20px">
    <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:14px;background:linear-gradient(160deg,var(--surface2),var(--surface))"><b class="display" style="font-size:18px">Title fight</b><div class="duel" data-duel style="grid-template-columns:minmax(0,1fr)"></div></div>
    <div class="card"><div class="card-h"><b>Battle feed</b></div><div data-feed data-limit="12"></div></div>
    <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:10px"><b class="display" style="font-size:18px">Not in today’s battle?</b><p class="muted2" style="font-size:14px">Entry for the next battle opens at <span data-t="join_open">10:00 AM</span> UAE on Telegram.</p><a class="btn" href="{BOT}" style="align-self:flex-start">Join @PipClashBot</a></div>
  </div>
</div></section>
''')

# ---------------- WINNERS ----------------
page("winners.html", "Winners – PipClash", "Final results and past champions of the PipClash daily trading battle.", f'''
<section class="section" style="padding-top:40px"><div class="wrap" style="display:flex;flex-direction:column;gap:24px">
  <div style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow" data-result-title>FINAL RESULT</span><h1>Winners</h1></div>
  <div class="grid-3" data-podium style="perspective:1400px;align-items:end;padding-top:10px"></div>
</div></section>
<section class="section"><div class="wrap side">
  <div class="card"><div class="card-h"><b>Full result</b><span class="muted" style="font-size:13px">checked and final at <span data-t="result_at">9:30 PM</span> UAE</span></div>
    <div class="table-box"><table><thead><tr><th>Rank</th><th>Trader</th><th class="c-trades">Trades</th><th class="r">P&amp;L</th><th class="r">Prize</th></tr></thead><tbody data-result></tbody></table></div></div>
  <div style="display:flex;flex-direction:column;gap:20px">
    <div class="card"><div class="card-h"><b>Past champions</b></div><div data-past></div></div>
    <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:10px;background:linear-gradient(160deg,var(--surface2),var(--surface))"><b class="display" style="font-size:18px">How prizes are paid</b><p class="muted2" style="font-size:14px;line-height:1.6">After the result is final, @PipClashBot messages each winner to collect payment details. Name and phone must match the entry. One prize per person per day.</p></div>
  </div>
</div></section>
''')

# ---------------- RULES ----------------
rules = [
    ("Entry is free", "There is no fee and no deposit, ever. You join through @PipClashBot on Telegram."),
    ("One person, one entry", "Each entry is tied to one verified phone number. A second entry from the same person is removed."),
    ("Everyone gets the same account", "A fresh MT5 demo account with $1,000 and 1:500 leverage, sent to you at <span data-t=\"creds_at\">4:25 PM</span> UAE. It is used for this battle only."),
    ("Trade only in the battle window", "Open trades only between <span data-t=\"trade_start\">4:30 PM</span> and <span data-t=\"trade_end\">7:30 PM</span> UAE. At the start your account must be untouched: $1,000 and no open trades."),
    ("All trades close at the end", "Every position is closed automatically. Your result is calculated at the exact end-time price."),
    ("Highest profit wins", "Rank is your profit from trades opened during the battle. Only accounts in profit can win a prize."),
    ("Results are checked", "Every result is reviewed for two hours. The final result is published at <span data-t=\"result_at\">9:30 PM</span> UAE and the admin’s decision is final."),
    ("Prizes", "1st <span data-prize=\"1\">$200</span>, 2nd <span data-prize=\"2\">$100</span>, 3rd <span data-prize=\"3\">$50</span>, 4th–10th <span data-prize=\"4\">$10</span> each. One prize per person per day. You must be 18 or older to receive a prize."),
]
dq = ["trade before the start or keep a trade open from before", "change your MT5 password", "add or withdraw demo balance",
      "use robots, EAs, copy trading or trade bots", "open opposite trades across two accounts (hedging)", "enter more than once with different numbers"]
faq = [
    ("Is this real money?", "No. Every account is a demo account with virtual money. You cannot lose real money. Only the prizes are real."),
    ("Who can join?", "Anyone in India, Pakistan or the UAE with Telegram and the MetaTrader 5 app. You must be 18 or older to receive a prize."),
    ("What can I trade?", "Any symbol on the demo account, such as forex pairs, gold and indices. The bot tells you the server with your login."),
    ("When do I get my login?", "At <span data-t=\"creds_at\">4:25 PM</span> UAE (<span data-t=\"creds_at\" data-add=\"60\">5:25 PM</span> Pakistan, <span data-t=\"creds_at\" data-add=\"90\">5:55 PM</span> India), directly in @PipClashBot. It is never sent by email."),
    ("Can I see my rank during the battle?", "Yes. Standings update every 30 minutes on the Live Arena page and in the bot under “My status”."),
    ("Why does my profit look different from MT5?", "Your score counts only trades opened during the battle, valued at the exact end-time price."),
    ("How do I get my prize?", "After the final result the bot messages each winner to collect payment details. Name and phone must match your entry."),
    ("Can I play again tomorrow?", "Yes. Join again from <span data-t=\"join_open\">10:00 AM</span> UAE and you get a new account. Battles run Monday to Friday."),
    ("I was disqualified. Can I appeal?", "Message the admin through the bot during the review window (<span data-t=\"trade_end\">7:30 PM</span> – <span data-t=\"result_at\">9:30 PM</span> UAE). After the final result, decisions are final."),
]
rules_html = "".join(f'<div class="card" style="display:grid;grid-template-columns:52px minmax(0,1fr);gap:16px;padding:20px 22px;border-radius:16px"><span class="mono acc" style="width:44px;height:44px;border-radius:12px;background:var(--surface2);border:1px solid var(--line2);display:flex;align-items:center;justify-content:center;font-weight:700">{i+1:02d}</span><div style="display:flex;flex-direction:column;gap:6px"><h3 style="font-size:19px">{t}</h3><p class="muted2" style="line-height:1.6">{b}</p></div></div>' for i, (t, b) in enumerate(rules))
dq_html = "".join(f'<div style="display:flex;gap:12px;align-items:flex-start;padding:16px 18px;border:1px solid rgba(255,107,122,.35);border-radius:14px;background:rgba(255,107,122,.06)"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style="flex:none;margin-top:2px"><circle cx="12" cy="12" r="9" fill="none" stroke="#FF6B7A" stroke-width="2"/><path d="M8 8l8 8M16 8l-8 8" stroke="#FF6B7A" stroke-width="2" stroke-linecap="round"/></svg><span>{d}</span></div>' for d in dq)
faq_html = "".join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in faq)
page("rules.html", "Rules and FAQ – PipClash", "Rules, disqualification, timings and answers for the PipClash daily trading battle.", f'''
<section class="section" style="padding-top:44px"><div class="wrap narrow" style="display:flex;flex-direction:column;gap:14px">
  <span class="eyebrow">THE RULES · SAME FOR EVERYONE</span><h1>Rules and FAQ</h1>
  <p class="muted2" style="font-size:18px;line-height:1.6;max-width:680px">Short version: one free entry per person, a fresh $1,000 demo account, trade only in the battle window, and the highest profit wins.</p>
</div></section>
<section class="section" style="padding-top:20px"><div class="wrap narrow" style="display:flex;flex-direction:column;gap:14px">{rules_html}</div></section>
<section class="section"><div class="wrap narrow" style="display:flex;flex-direction:column;gap:16px"><h2 style="font-size:30px">You will be disqualified if you</h2><div class="grid-2" style="gap:14px">{dq_html}</div></div></section>
<section class="section"><div class="wrap narrow">{TIMES}</div></section>
<section class="section"><div class="wrap narrow" style="display:flex;flex-direction:column;gap:14px"><h2 style="font-size:30px">Questions</h2>{faq_html}
  <p class="muted" style="margin-top:8px">Still stuck? Message <a href="{BOT}">@PipClashBot</a> and tap “Talk to admin”.</p></div></section>
''')

# ---------------- GUIDE ----------------
def phone(inner):
    return f'<div style="justify-self:center;width:240px;height:440px;border-radius:34px;border:8px solid var(--line2);background:#0F1626;padding:18px 12px;display:flex;flex-direction:column;gap:10px;box-shadow:0 30px 60px rgba(0,0,0,.5);font-size:12px">{inner}</div>'
steps = [
    ("STEP 01 · ONE TIME", "Install MetaTrader 5", 'Search “MetaTrader 5” by MetaQuotes in the Play Store or App Store and install it. It is free. On a computer, download MT5 for Windows or Mac from metatrader5.com.<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><a class="btn btn-ghost" href="https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5">Google Play</a><a class="btn btn-ghost" href="https://apps.apple.com/app/metatrader-5/id413251709">App Store</a></div>',
     '<div style="margin:auto;display:flex;flex-direction:column;align-items:center;gap:12px"><div class="display" style="width:92px;height:92px;border-radius:22px;background:linear-gradient(160deg,#3B82F6,#1E3A8A);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:28px">MT5</div><b style="font-size:14px">MetaTrader 5</b><span style="padding:8px 22px;border-radius:999px;background:var(--accent);font-weight:700">Install</span></div>'),
    ("STEP 02 · <span data-t=\"creds_at\">4:25 PM</span> UAE", "Get your login from the bot", "@PipClashBot sends you three things: the server name, your login number and your password. They are only for you. Do not share them and do not change the password.",
     '<b style="text-align:center;color:var(--muted)">PipClash Support</b><div style="align-self:flex-start;max-width:92%;padding:10px 12px;border-radius:12px 12px 12px 4px;background:var(--line);line-height:1.5">Battle – your MT5 account<br><br>Server: <b>MetaQuotes-Demo</b><br>Login: <b>12345678</b><br>Password: <b>••••••••</b><br><br>Trade only after <span data-t=\"trade_start\">4:30 PM</span> UAE.</div>'),
    ("STEP 03", "Find the server", "In MT5 open <b>Settings → New Account → Login to an existing account</b>. Type the server name from the bot exactly, for example “MetaQuotes-Demo”, and tap it.",
     '<b style="font-size:13px">Find a broker</b><div style="padding:9px 10px;border-radius:8px;background:var(--line)">MetaQuotes-Demo</div><div style="padding:10px;border-radius:8px;border:1px solid var(--accent);background:var(--surface2)"><b>MetaQuotes Ltd.</b><br><span class="muted">MetaQuotes-Demo</span></div>'),
    ("STEP 04", "Enter login and password", "Type the login number and password exactly as the bot sent them (copy and paste is safest), keep “Save password” on, and tap <b>Login</b>.",
     '<b style="font-size:13px">Login to an existing account</b><div style="padding:9px 10px;border-radius:8px;background:var(--line)"><span class="muted">Login</span><br>12345678</div><div style="padding:9px 10px;border-radius:8px;background:var(--line)"><span class="muted">Password</span><br>••••••••</div><div style="padding:9px 10px;border-radius:8px;background:var(--line)"><span class="muted">Server</span><br>MetaQuotes-Demo</div><span style="margin-top:auto;padding:11px;border-radius:10px;background:var(--accent);text-align:center;font-weight:700">Login</span>'),
    ("STEP 05 · READY", "Check $1,000 and wait for the start", "Open the Trade tab. You should see Balance 1,000.00 USD and no open trades. Do not trade yet. When the battle starts, trade as you like until the end.",
     '<b style="font-size:13px;text-align:center">Trade</b><div style="display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid var(--line)"><span class="muted">Balance</span><b>1 000.00</b></div><div style="display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid var(--line)"><span class="muted">Equity</span><b>1 000.00</b></div><div style="margin-top:auto;padding:10px;border-radius:10px;background:var(--surface2);border:1px solid var(--accent);text-align:center;color:var(--accent2);font-weight:700">Battle starts <span data-t="trade_start">4:30 PM</span></div>'),
]
steps_html = "".join(f'<div class="card" style="display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:36px;align-items:center;padding:26px;border-radius:22px{";border-color:var(--accent);background:linear-gradient(160deg,var(--surface2),var(--surface))" if i == 4 else ""}"><div style="display:flex;flex-direction:column;gap:12px"><span class="eyebrow acc">{e}</span><h2 style="font-size:26px">{t}</h2><div class="muted2" style="line-height:1.6">{b}</div></div>{phone(p)}</div>' for i, (e, t, b, p) in enumerate(steps))
fixes = [("“Invalid account” or “Authorization failed”", "Check the server name and copy the password again – it is case sensitive and may contain symbols like * or _."),
         ("I can’t find the server", "Type the full server name exactly as the bot sent it. Do not choose a different broker with a similar name."),
         ("Prices are not moving", "Forex and gold markets are closed on weekends. Battles run Monday to Friday."),
         ("I see a different balance", "You may be logged in to an old account. Use only today’s login from the bot – every battle has a new account."),
         ("I lost my login", "Tap “My status” in the bot, or ask the admin. Never ask another player for their login."),
         ("Can I use my computer?", "Yes. MT5 for Windows and Mac works the same: File → Login to Trade Account, then the same three details.")]
fixes_html = "".join(f'<div class="card" style="padding:18px 20px;border-radius:16px;display:flex;flex-direction:column;gap:6px"><b>{p}</b><span class="muted2" style="line-height:1.55;font-size:15px">{s}</span></div>' for p, s in fixes)
page("guide.html", "MT5 Guide – PipClash", "How to install MetaTrader 5 and log in to your PipClash battle account in 5 minutes.", f'''
<style>@media (max-width:900px){{main .card[style*="260px"]{{grid-template-columns:minmax(0,1fr)!important}}}}</style>
<section class="section" style="padding-top:44px"><div class="wrap narrow" style="display:flex;flex-direction:column;gap:14px">
  <span class="eyebrow">5 MINUTES · DO IT BEFORE THE START</span><h1>Log in to MetaTrader 5</h1>
  <p class="muted2" style="font-size:18px;line-height:1.6;max-width:640px">You trade the battle on the free MetaTrader 5 app. Install it once, then each day log in with the new account the bot sends you.</p>
</div></section>
<section class="section" style="padding-top:20px"><div class="wrap narrow" style="display:flex;flex-direction:column;gap:24px">{steps_html}</div></section>
<section class="section"><div class="wrap narrow" style="display:flex;flex-direction:column;gap:16px"><h2 style="font-size:30px">If something goes wrong</h2><div class="grid-2" style="gap:16px">{fixes_html}</div>
<p class="muted">Still not working? Open <a href="{BOT}">@PipClashBot</a> → “Talk to admin”.</p></div></section>
''')

# ---------------- LEGAL ----------------
page("legal.html", "Terms, Privacy and Disclaimer – PipClash", "Terms of use, privacy policy and risk disclaimer for PipClash.", '''
<section class="section" style="padding-top:44px"><div class="wrap" style="max-width:1100px;display:flex;flex-direction:column;gap:26px">
  <div style="display:flex;flex-direction:column;gap:10px"><h1>Terms, Privacy and Disclaimer</h1><span class="muted">Last updated: [DATE]</span>
  <div style="padding:12px 16px;border-radius:12px;border:1px dashed var(--gold);color:var(--gold);font-size:14px;max-width:760px">Draft – to be reviewed by a lawyer before launch. Items in [brackets] still need to be filled in.</div></div>
  <div style="display:flex;flex-direction:column;gap:34px;max-width:720px;line-height:1.7" class="muted2">
    <article id="terms" style="display:flex;flex-direction:column;gap:12px"><h2 style="font-size:28px;color:var(--text)">Terms of use</h2>
      <p>PipClash is a free daily trading competition run by [COMPANY NAME] (“we”). By joining a battle you agree to these terms and to the <a href="rules.html">Rules</a>.</p>
      <p><b style="color:var(--text)">Free entry.</b> No purchase, deposit or fee is needed to enter or to win. We never ask for money to take part or to receive a prize.</p>
      <p><b style="color:var(--text)">Demo accounts.</b> Each player receives a demo trading account with virtual funds for one battle. The account and its funds have no cash value and belong to the account provider.</p>
      <p><b style="color:var(--text)">Eligibility.</b> One entry per person per day, verified by phone number. Prizes are paid only to players aged 18 or older whose name and phone match the entry. Players must follow the laws of their own country.</p>
      <p><b style="color:var(--text)">Results and prizes.</b> Results are reviewed before they are final. We may disqualify any entry that breaks the Rules. Prize amounts and payment methods are listed on the site and may change for future battles. [PAYMENT METHOD AND TIMEFRAME]</p>
      <p><b style="color:var(--text)">Changes.</b> We may change, pause or cancel a battle, for example if the trading server fails. If a battle is cancelled before results are final, no prizes are paid for it.</p>
      <p><b style="color:var(--text)">Contact.</b> [CONTACT EMAIL] · @PipClashBot on Telegram. Governing law: [JURISDICTION].</p></article>
    <article id="privacy" style="display:flex;flex-direction:column;gap:12px"><h2 style="font-size:28px;color:var(--text)">Privacy policy</h2>
      <p><b style="color:var(--text)">What we collect.</b> Your Telegram ID and first name, the phone number you share with our bot, the demo account we assign to you and its trading activity during the battle, and – only for winners – the payment details needed to send a prize.</p>
      <p><b style="color:var(--text)">Why.</b> To run battles, stop duplicate entries and cheating, show rankings, and pay prizes. On public leaderboards you appear only as your first name and the last three digits of your phone number (for example “Ali-210”).</p>
      <p><b style="color:var(--text)">Sharing.</b> We do not sell your data. Demo accounts are opened with a third-party trading platform provider. We share data only when the law requires it.</p>
      <p><b style="color:var(--text)">How long.</b> We keep entry and result records for [X MONTHS] and then delete them. You can ask us to delete your data at any time through the bot or by email.</p></article>
    <article id="disclaimer" style="display:flex;flex-direction:column;gap:12px"><h2 style="font-size:28px;color:var(--text)">Risk disclaimer</h2>
      <p>PipClash is a skill competition on demo accounts. It is not a broker, does not hold client money and does not offer real trading or investment services.</p>
      <p>Nothing on this site or in our bot is financial advice. Results on a demo account do not predict results with real money. Trading real leveraged products such as forex, gold and indices carries a high risk of losing money.</p></article>
  </div>
</div></section>
''')

open(os.path.join(HERE, "site.webmanifest"), "w", encoding="utf-8").write(
    '{"name":"PipClash","short_name":"PipClash","start_url":"index.html","display":"standalone","background_color":"#0B1120","theme_color":"#0B1120",'
    '"icons":[{"src":"assets/icon-192.png","sizes":"192x192","type":"image/png"},{"src":"assets/icon-512.png","sizes":"512x512","type":"image/png"}]}')
print("built:", [f for f in os.listdir(HERE) if f.endswith(".html")])
