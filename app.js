/* -------------------------------------------------------
   ARTERRA — interactions + fail-safe loader
   - Dust preloader with fake progress
   - Smooth transition: preloader fades, page reveals
   - Three.js procedural coffee bean + soft shadow
------------------------------------------------------- */

const qs = (s, el=document) => el.querySelector(s);

// Footer year
const yearEl = qs('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Preloader: dust particles + progress ---------- */
(() => {
  const canvas = qs('#dust');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.min(140, Math.floor((w*h)/18000));
    particles = Array.from({length: count}).map(() => ({
      x: Math.random()*w, y: Math.random()*h,
      r: Math.random()*1.7 + 0.6,
      vx: (Math.random()-.5)*0.2, vy: (Math.random()-.5)*0.2,
      a: Math.random()*0.6 + 0.2
    }));
  }
  function tick() {
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#a58869';
    for (const p of particles){
      p.x += p.vx; p.y += p.vy;
      if(p.x<0) p.x=w; if(p.x>w) p.x=0;
      if(p.y<0) p.y=h; if(p.y>h) p.y=0;
      ctx.globalAlpha = p.a;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', resize);
  resize(); tick();

  // Simulated progress
  const progressEl = qs('#progressText');
  let p = 0;
  const iv = setInterval(() => {
    p += Math.random()*12;
    if (p >= 100){ p = 100; clearInterval(iv); }
    if (progressEl) progressEl.textContent = `Loading ${Math.floor(p)}%`;
  }, 120);
})();

/* ---------- Three.js mock coffee bean ---------- */
let renderer, scene, camera, bean, light, ground;
const beanCanvas = qs('#bean');

function initThree() {
  renderer = new THREE.WebGLRenderer({canvas: beanCanvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  fitRenderer();

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(35, beanCanvas.clientWidth/beanCanvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0.7, 3.2);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb99b7a, 0.6);
  scene.add(hemi);

  light = new THREE.DirectionalLight(0xffffff, 0.85);
  light.position.set(2.2, 3.5, 2.5);
  light.castShadow = true;
  light.shadow.mapSize.set(1024,1024);
  scene.add(light);

  // Ground shadow catcher
  const groundGeo = new THREE.PlaneGeometry(6,6);
  const groundMat = new THREE.ShadowMaterial({opacity:0.18});
  ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -0.9;
  ground.receiveShadow = true;
  scene.add(ground);

  // Bean material
  const beanMat = new THREE.MeshStandardMaterial({
    color: 0x6f4e37, roughness: 0.55, metalness: 0.15
  });

  // Geometry: sphere sculpted into bean with central groove
  const g = new THREE.SphereGeometry(1, 96, 96);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i=0; i<pos.count; i++){
    v.fromBufferAttribute(pos, i);
    // almond shape
    v.y *= 0.78; v.x *= 0.94; v.z *= 1.08;
    // groove along Z=0
    const groove = Math.exp(-Math.pow(v.z*1.8, 2)) * 0.24;
    const side = Math.sign(v.x) || 1;
    v.x -= side * groove;
    // micro-dents
    const nudge = (Math.sin(v.x*6)+Math.cos(v.y*7)+Math.sin(v.z*5))*0.0025;
    v.addScaledVector(v.clone().normalize(), nudge);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();

  bean = new THREE.Mesh(g, beanMat);
  bean.castShadow = true;
  scene.add(bean);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  const t = performance.now()*0.0015;
  if (bean){
    bean.rotation.y += 0.0042;      // auto spin
    bean.rotation.x = Math.sin(t)*0.06;
  }
  renderer.render(scene, camera);
}

function fitRenderer(){
  const {clientWidth, clientHeight} = beanCanvas;
  if (!clientWidth || !clientHeight) return;
  renderer.setSize(clientWidth, clientHeight, false);
  if (camera){
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }
}

/* ---------- Scroll scale (subtle) ---------- */
function setupScroll() {
  const hero = qs('#hero');
  if (!hero) return;
  const onScroll = () => {
    const rect = hero.getBoundingClientRect();
    const visible = Math.max(0, Math.min(1, rect.bottom / window.innerHeight));
    const scale = 0.9 + visible*0.12; // 0.9–1.02
    if (bean) bean.scale.setScalar(scale);
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
}

/* ---------- Transition helpers ---------- */
function hidePreloader() {
  const p = qs('#preloader');
  if (!p) { document.body.classList.add('loaded'); return; }
  p.classList.add('fade-out');            // запускаем анимацию исчезновения
  setTimeout(() => {
    p.remove();                           // убираем прелоадер из DOM
    document.body.classList.add('loaded');/* включаем появление контента */
  }, 1100);
}

/* ---------- Boot with fail-safe ---------- */
window.addEventListener('load', () => {
  let ok = true;
  try {
    if (!beanCanvas) throw new Error('Bean canvas not found');
    initThree();
    setupScroll();
  } catch (e) {
    ok = false;
    console.error('[Arterra] Init error:', e);
  } finally {
    setTimeout(hidePreloader, ok ? 900 : 300);
  }
});

window.addEventListener('resize', () => {
  if (renderer) fitRenderer();
});

// Extra safety: hide loader after 4s even if something goes wrong
setTimeout(() => {
  const p = qs('#preloader');
  if (p && !document.body.classList.contains('loaded')) hidePreloader();
}, 4000);
