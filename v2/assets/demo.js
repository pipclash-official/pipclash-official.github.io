/* PREVIEW DEMO – sirf laptop (localhost) ya /v2/ preview pe, aur sirf ?demo=1 se chalu (?demo=0 band).
   PDF (design/PipClash_Final_Design.pdf) wale bilkul wahi namoona numbers – asli site pe kabhi nahi chalta. */
(function () {
  var preview = location.hostname === 'localhost' || location.pathname.indexOf('/v2/') === 0;
  var m = /[?&]demo=(\w+)/.exec(location.search);
  try { if (m) sessionStorage.setItem('pcDemo', m[1] === '0' ? '' : '1'); } catch (e) {}
  var on = false; try { on = preview && sessionStorage.getItem('pcDemo') === '1'; } catch (e) {}
  if (!on) return;
  var page = (location.pathname.split('/').pop() || 'index.html');
  window.PC_DEMO = {
    at: { 'arena.html': '18:05', 'account.html': '16:27' }[page] || '12:47',   // PDF wali screen ka time
    user: { name: 'Sultan-777', bal: 15, kyc: 'approved' },
    perf: { rank: 18, pnl: 127, win: 64, battles: 12 },
    tables: [{ tier: 10, taken: 63 }, { tier: 25, taken: 88 }, { tier: 50, taken: 41 }],
    entries: [{ tier: 10, paid_fee: 10, status: 'joined', public_name: 'Sultan-777' }, { tier: 25, paid_fee: 25, status: 'joined', public_name: 'Sultan-777' }],
    wallet: { total: 50, avail: 15, inb: 35, wdable: 15, wdp: 0,
      tx: [['Entry · PRO $25', -25, 15, 0], ['Entry · STARTER $10', -10, 40, 0], ['Deposit · TRC20', 50, 50, 0], ['Withdraw · BEP20', -20, null, 1]] },
    creds: { server: 'Broker-Live01', login: '5051234', password: 'Ab*12xY' },
    past: [['27 Oct', 10, 4, 96, 9.6], ['26 Oct', 25, 18, -140, -14.0], ['23 Oct', 10, 2, 305, 30.5]],
    live: { players: 87, in_profit: 40, update_no: 9, updates_total: 19, next: '18:10',
      rows: [['ALPHA', 'ae', 842], ['TRADER X', 'in', 731], ['PIPKING', 'pk', 694], ['Arif-092', 'bd', 512], ['Tolu-551', 'ng', 488], ['Meera-310', 'in', 401], ['Ravi-883', 'in', 377]],
      you: [18, 127] },
    result: { table: 'PRO $25', fee: 25, traders: 88, you: 3, pnl: 184.2, top: [['ALPHA', 612.5], ['TRADER X', 401.2], ['YOU', 184.2]] },
    refer: { link: 'pipclash.live/?ref=15B268C', friends: 12, played: 7, earned: 3.40, due: 0.35, list: [['Ravi-883', 5, 0.50], ['Meera-310', 2, 0.35]] }
  };
})();
