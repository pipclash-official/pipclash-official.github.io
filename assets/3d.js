/* PipClash 3D – live gold trophy (three.js). Agar WebGL na chale to trophy.png photo dikhti rehti hai. */
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

export const M = {
  gold: () => new THREE.MeshStandardMaterial({ color: 0xF2C14E, metalness: 1, roughness: .22 }),
  silver: () => new THREE.MeshStandardMaterial({ color: 0xD6DCE6, metalness: 1, roughness: .25 }),
  bronze: () => new THREE.MeshStandardMaterial({ color: 0xC0804A, metalness: 1, roughness: .3 }),
  dark: () => new THREE.MeshStandardMaterial({ color: 0x1A2340, metalness: .4, roughness: .5 }),
};

export function setup(cv, w, h, fov = 30, keep = false) {
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: keep });
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(w, h, false);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Scene(); const pm = new THREE.PMREMGenerator(r);
  s.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const c = new THREE.PerspectiveCamera(fov, w / h, .1, 100);
  const k = new THREE.DirectionalLight(0xffffff, 2.2); k.position.set(3, 5, 4); s.add(k);
  return { r, s, c };
}

export function label(txt, col = '#2B1C02', bg = null, w = 512, h = 512, font = '700 200px "Chakra Petch", sans-serif') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = col; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function trophy(prize = '$200') {
  const g = new THREE.Group(), gold = M.gold();
  const outer = new THREE.SplineCurve([[0, 0], [.95, 0], [.95, .12], [.62, .22], [.24, .4], [.15, .7], [.16, .92], [.32, 1.04], [.6, 1.2], [.82, 1.48], [.95, 1.85], [1.0, 2.3]]
    .map(p => new THREE.Vector2(p[0], p[1]))).getPoints(80);
  const pts = [...outer, new THREE.Vector2(1.03, 2.34), new THREE.Vector2(.95, 2.34), new THREE.Vector2(.9, 1.9), new THREE.Vector2(.76, 1.55), new THREE.Vector2(.5, 1.3), new THREE.Vector2(0, 1.24)];
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 128), gold));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.99, .04, 16, 128), gold); rim.rotation.x = Math.PI / 2; rim.position.y = 2.34; g.add(rim);
  for (const sd of [-1, 1]) {
    const cv = new THREE.CatmullRomCurve3([[.9, 2.1], [1.3, 2.08], [1.48, 1.78], [1.25, 1.45], [.72, 1.33]].map(p => new THREE.Vector3(sd * p[0], p[1], 0)));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 64, .075, 20, false), gold));
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, .5, 1.2), M.dark()); base.position.y = -.25; g.add(base);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .4), new THREE.MeshStandardMaterial({ map: label(prize, '#D6A84F', '#1A2340', 520, 160, '700 120px "Chakra Petch", sans-serif'), metalness: .3, roughness: .4 }));
  plate.position.set(0, -.25, .61); g.add(plate);
  const back = plate.clone(); back.position.z = -.61; back.rotation.y = Math.PI; g.add(back);
  const sh = new THREE.Shape();
  for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? .11 : .26; k ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const starGeo = new THREE.ExtrudeGeometry(sh, { depth: .06, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 2 });
  const starMat = new THREE.MeshStandardMaterial({ color: 0xFFF1B8, metalness: 1, roughness: .15 });
  const st = new THREE.Mesh(starGeo, starMat); st.position.set(0, 1.78, .9); g.add(st);
  const st2 = new THREE.Mesh(starGeo, starMat); st2.position.set(0, 1.78, -.9); st2.rotation.y = Math.PI; g.add(st2);
  return g;
}

export function coin(r = .34) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, .07, 48), new THREE.MeshStandardMaterial({ color: 0xE9B53F, metalness: 1, roughness: .32 }));
}

function prizeText() {
  const p = window.PC_DATA && window.PC_DATA.prizes && window.PC_DATA.prizes['1'];
  return p ? '$' + p : '$200';
}

function liveTrophy(cv) {
  const wrap = cv.parentElement;
  let W = wrap.clientWidth, H = wrap.clientHeight;
  if (!W || !H) return;
  const sq = W / H < 1.2;
  const { r, s, c } = setup(cv, W, H, sq ? 32 : 28);
  const t = trophy(prizeText()); t.position.set(0, -.95, 0); s.add(t);
  const coins = (cv.hasAttribute('data-coins') ? [[-1.9, 1.1, -.5, .9], [-1.5, -.2, .4, .4], [1.9, 1.5, -1, 1.2], [1.7, .1, .3, .6]] : []).map(([x, y, z, rx]) => {
    const co = coin(); co.position.set(x, y, z); co.rotation.set(rx, .3, .5); s.add(co); return co;
  });
  if (sq) { c.position.set(0, .7, 7.6); c.lookAt(0, .45, 0); } else { c.position.set(0, .6, 7.4); c.lookAt(0, .35, 0); }
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches, still = false, SP = calm ? .25 : .55;
  let on = true, t0 = performance.now(), last = t0, rotY = -.3, vel = SP, drag = null;
  cv.style.pointerEvents = 'auto'; cv.style.touchAction = 'pan-y'; cv.style.cursor = 'grab';
  cv.addEventListener('pointerdown', e => { e.preventDefault(); drag = { x: e.clientX }; vel = 0; });
  window.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; drag.x = e.clientX; rotY += dx * .012; vel = dx * .6; });
  window.addEventListener('pointerup', () => { if (drag) { drag = null; if (Math.abs(vel) < SP) vel = SP * Math.sign(vel || 1); } });
  const frame = (now) => {
    const k = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!still && !drag) { rotY += vel * dt; vel += (SP * Math.sign(vel || 1) - vel) * Math.min(1, dt * 1.5); }
    t.rotation.y = rotY; t.position.y = -.95 + (calm ? 0 : Math.sin(k * 1.2) * .05);
    coins.forEach((co, i) => { co.rotation.y = still ? .3 : k * (.8 + i * .2); co.position.y += still ? 0 : Math.sin(k * 1.4 + i) * .0015; });
    r.render(s, c);
  };
  wrap.classList.add('live3d');
  const poster = wrap.querySelector('img'); if (poster) setTimeout(() => poster.remove(), 500);
  if (still) { frame(t0); return; }
  const loop = (now) => { if (on) frame(now); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { on = es[0].isIntersecting; }).observe(wrap);
  window.addEventListener('resize', () => {
    const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h || (w === W && h === H)) return;
    W = w; H = h; r.setSize(W, H, false); c.aspect = W / H; c.updateProjectionMatrix();
  });
}

async function boot() {
  const els = document.querySelectorAll('canvas[data-3d="trophy"]');
  if (!els.length) return;
  try { await document.fonts.load('700 40px "Chakra Petch"'); } catch (e) { }
  els.forEach(cv => { try { liveTrophy(cv); } catch (e) { /* photo hi dikhegi */ } });
}
if (!window.PC_3D_NO_BOOT) boot();
