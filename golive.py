"""GO-LIVE ek command (Sat 7 Nov, GO-LIVE SQL + asli USDT address ke BAAD – docs/GO_LIVE_SAT_7NOV.md step 5).

  python website/golive.py            -> SIRF TEST: copy mein COMING_SOON=False build + check. Asli site/build.py ko nahi chhoota.
  python website/golive.py --publish  -> build.py mein COMING_SOON=False, build, check, sab OK ho to GitHub push + live check.

Wapas Coming Soon (emergency): build.py mein COMING_SOON = True, phir `python website/build.py` aur push.
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PAGES = ["index.html", "book.html", "join.html", "arena.html", "account.html", "wallet.html", "deposit.html",
         "withdraw.html", "transactions.html", "rules.html", "legal.html", "winners.html", "guide.html"]
BAD = [r"\bgame\b", r"guaranteed", r"cannot lose", r"Free entry", r"\$200(?!\+)"]   # "$200+" = bade deposit ka check, theek   # public text mein kabhi nahi


def flip(build_py):
    s = open(build_py, encoding="utf-8").read()
    s2, n = re.subn(r"^COMING_SOON = True", "COMING_SOON = False", s, count=1, flags=re.M)
    if n != 1:
        if re.search(r"^COMING_SOON = False", s, re.M):
            return  # pehle se live
        raise SystemExit("build.py mein 'COMING_SOON = True' line nahi mili – ruk gaye")
    open(build_py, "w", encoding="utf-8").write(s2)


def check(folder):
    """Sab page bane? home/join ab booking ki copy NAHI? galat shabd nahi? -> list of problems"""
    bad = []
    for p in PAGES:
        fp = os.path.join(folder, p)
        if not os.path.exists(fp):
            bad.append(f"{p} nahi bana")
            continue
        html = open(fp, encoding="utf-8").read()
        text = re.sub(r"<script.*?</script>|<style.*?</style>|<[^>]+>", " ", html, flags=re.S)
        for w in BAD:
            if re.search(w, text, re.I):
                bad.append(f"{p}: '{w}' likha hai")
    for p in ("index.html", "join.html"):
        fp = os.path.join(folder, p)
        if os.path.exists(fp) and "book.js" in open(fp, encoding="utf-8").read():
            bad.append(f"{p} abhi bhi booking page hai (Coming Soon)")
    return bad


def build(folder):
    env = dict(os.environ, PYTHONPATH=ROOT, PYTHONIOENCODING="utf-8")   # prizes.py, config.py yahan se
    r = subprocess.run([sys.executable, os.path.join(folder, "build.py")], cwd=folder, capture_output=True, text=True, env=env)
    if r.returncode != 0:
        raise SystemExit("build fail:\n" + r.stderr[-2000:])


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")   # Windows console pe ✅/❌
    except Exception:
        pass
    publish = "--publish" in sys.argv
    if not publish:
        tmp = os.path.join(tempfile.mkdtemp(prefix="golive_"), "website")
        shutil.copytree(HERE, tmp, ignore=shutil.ignore_patterns(".git", "__pycache__"))
        flip(os.path.join(tmp, "build.py"))
        build(tmp)
        bad = check(tmp)
        print("TEST copy:", tmp)
        print("✅ sab theek – Sat ko `python website/golive.py --publish`" if not bad else "❌ " + "\n❌ ".join(bad))
        return
    flip(os.path.join(HERE, "build.py"))
    build(HERE)
    bad = check(HERE)
    if bad:
        raise SystemExit("❌ push NAHI kiya:\n" + "\n".join(bad))
    sys.path.insert(0, ROOT)
    import ghpush
    ok, txt = ghpush.push_site(HERE, "GO-LIVE: COMING_SOON off")
    print(txt)
    if not ok:
        raise SystemExit("❌ GitHub push fail – dobara chalao")
    for i in range(20):                       # GitHub Pages ~1-3 min
        time.sleep(20)
        try:
            h = urllib.request.urlopen(f"https://pipclash.net/?v={int(time.time())}", timeout=20).read().decode("utf-8", "ignore")
            if "book.js" not in h:
                print("✅ LIVE: pipclash.net ab poori website hai")
                return
        except Exception:
            pass
    print("⚠️ push ho gaya par site abhi purani dikh rahi – 5 min baad phone pe dekho (cache)")


if __name__ == "__main__":
    main()
