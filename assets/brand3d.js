/* PipClash 3D logo (three.js) – <canvas data-brand3d>. Dheere-dheere hilta hai; WebGL na ho to SVG logo hi dikhta rehta hai. */
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const ex = (shape, depth, bev = 1.2) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * .8, bevelSegments: 6, curveSegments: 48 });
function rrect(x, y, w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function logo() {   // SVG logo (64x64) ka 3D roop: neeli batti + candle, chrome P, hara candle
  const blue = new THREE.MeshPhysicalMaterial({ color: 0x2F80FF, metalness: .55, roughness: .18, clearcoat: 1, clearcoatRoughness: .08 });
  const wick = new THREE.MeshPhysicalMaterial({ color: 0x6DB5FF, metalness: .8, roughness: .2, emissive: 0x2F80FF, emissiveIntensity: .35 });
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xF4F7FC, metalness: 1, roughness: .12, clearcoat: 1 });
  const green = new THREE.MeshPhysicalMaterial({ color: 0x22C55E, metalness: .4, roughness: .2, clearcoat: 1, emissive: 0x22C55E, emissiveIntensity: .25 });
  const g = new THREE.Group();
  const add = (geo, m, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.z = z; g.add(o); };
  add(ex(rrect(19.5, 5, 3, 54, 1.5), 3), wick, 1.5);
  add(ex(rrect(14, 12, 14, 40, 3), 6), blue);
  const bowl = new THREE.Shape();
  bowl.moveTo(28, 10); bowl.lineTo(37, 10); bowl.absarc(37, 27.5, 17.5, -Math.PI / 2, Math.PI / 2, false);
  bowl.lineTo(28, 45); bowl.lineTo(28, 37); bowl.lineTo(37, 37); bowl.absarc(37, 27.5, 9.5, Math.PI / 2, -Math.PI / 2, true);
  bowl.lineTo(28, 18); bowl.closePath();
  add(ex(bowl, 6), chrome);
  add(ex(rrect(46.75, 44, 2.5, 14, 1.2), 2.5), green, 1.75);
  add(ex(rrect(44, 47, 8, 8, 2), 5), green, .5);
  g.scale.set(1, -1, 1);
  g.traverse(o => { if (o.material) o.material.side = THREE.DoubleSide; });
  const c = new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3());
  g.position.sub(c);
  const pivot = new THREE.Group(); pivot.add(g);
  return pivot;
}

function run(cv) {
  let r;
  try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return; }
  r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 500); cam.position.set(0, 0, 150);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-30, 40, 60); scene.add(key);
  const rim = new THREE.DirectionalLight(0x4DA3FF, 3.5); rim.position.set(50, 10, -40); scene.add(rim);
  const warm = new THREE.DirectionalLight(0xF2C866, 1.2); warm.position.set(-40, -30, 20); scene.add(warm);
  const p = logo(); scene.add(p);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || cv.hasAttribute('data-still');
  function size() {
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  size(); addEventListener('resize', size);
  let vis = true;
  new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(cv);
  const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    p.rotation.set(-0.12 + Math.sin(t * .7) * .04, -0.5 + Math.sin(t * .45) * .32, 0.04);
    p.position.y = Math.sin(t * 1.1) * 1.2;
    r.render(scene, cam);
  }
  frame(t0);
  cv.parentElement.classList.add('gl');           // 3D chal gaya -> SVG fallback chhupao
  if (!still) r.setAnimationLoop(now => { if (vis && !document.hidden) frame(now); });
}

document.querySelectorAll('canvas[data-brand3d]').forEach(run);
