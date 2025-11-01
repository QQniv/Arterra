/* -------------------------------------------------------
   ARTERRA — starter interactions + Three.js mock bean
   - White preloader with dust particles + fake progress
   - Auto-rotating coffee bean (no GLB needed)
   - Soft shadow using ShadowMaterial
   - Subtle scroll scaling/parallax
------------------------------------------------------- */

// ---------- Utilities
const qs = (s, el=document) => el.querySelector(s);

// Footer year
qs('#year').textContent = new Date().getFullYear();

// ---------- Preloader: dust particles + fake progress
(() => {
  const canvas = qs('#dust');
  const ctx = canvas.getContext('2d');
  let w, h, particles;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    makeParticles();
  }
  function makeParticles() {
    const count = Math.min(140, Math.floor((w*h)/18000));
    particles = Array.from({length: count}).map(() => ({
      x: Math.random()*w,
      y: Math.random()*h,
      r: Math.random()*1.7 + 0.6,
      vx: (Math.random()-.5)*0.2,
      vy: (Math.random()-.5)*0.2,
      a: Math.random()*0.6 + 0.2
    }));
  }
  function tick() {
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#a58869';
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if(p.x<0) p.x=w; if(p.x>w) p.x=0;
      if(p.y<0) p.y=h; if(p.y>h) p.y=0;
      ctx.globalAlpha = p.a;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', resize);
  resize(); tick();

  // Simulated progress (fast, smooth)
  const progressEl = qs('#progressText');
  let p = 0;
  const iv = setInterval(() => {
    p += Math.random()*12;
    if(p >= 100){ p = 100; clearInterval(iv); }
    progressEl.textContent = `Loading ${Math.floor(p)}%`;
  }, 120);
})();

// ---------- Three.js Coffee Bean (procedural mock)
let renderer, scene, camera, bean, light, controls, ground;
const canvas = qs('#bean');

function initThree() {
  renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();

  // Camera
  const aspect = canvas.clientWidth / canvas.clientHeight;
  camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 100);
  camera.position.set(0, 0.7, 3.2);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb99b7a, 0.6);
  scene.add(hemi);

  light = new THREE.DirectionalLight(0xffffff, 0.8);
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

  // Material with subtle coffee sheen
  const beanMat = new THREE.MeshStandardMaterial({
    color: 0x6f4e37,               // coffee brown
    roughness: 0.55,
    metalness: 0.15,
  });

  // Geometry: start with a sphere and sculpt a "bean" with a center groove
  const g = new THREE.SphereGeometry(1, 96, 96);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i=0; i<pos.count; i++){
    v.fromBufferAttribute(pos, i);

    // Scale to oval / almond-like
    v.y *= 0.78;        // flatten vertically
    v.x *= 0.94;
    v.z *= 1.08;

    // Carve the central groove along Y using a soft pinch along Z=0
    const groove = Math.exp(-Math.pow(v.z*1.8, 2)) * 0.24; // width of groove
    const side = Math.sign(v.x) || 1;
    v.x -= side * groove; // pull vertices inward near center plane

    // Slight random micro-dents for natural look
    const nudge = (Math.sin(v.x*6)+Math.cos(v.y*7)+Math.sin(v.z*5))*0.0025;
    v.addScaledVector(v.clone().normalize(), nudge);

    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();

  bean = new THREE.Mesh(g, beanMat);
  bean.castShadow = true;
  scene.add(bean);

  // Optional: allow gentle inspection on mobile without UI
  controls = new THREE.OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.rotateSpeed = 0.2;
  controls.dampingFactor = 0.06;
  // keep auto-rotation vibe even if user touches
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  // Subtle wobble + auto-rotation
  const t = performance.now()*0.0015;
  bean.rotation.y += 0.0042;            // auto-spin
  bean.rotation.x = Math.sin(t)*0.06;   // slow wobble

  controls.update();
  renderer.render(scene, camera);
}

function resizeThree() {
  const {clientWidth, clientHeight} = canvas;
  if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }
}

// ---------- Scroll interactions (scale the bean slightly)
function setupScroll() {
  const hero = qs('#hero');
  const onScroll = () => {
    const rect = hero.getBoundingClientRect();
    const visible = Math.max(0, Math.min(1, rect.bottom / window.innerHeight));
    const scale = 0.9 + visible*0.12; // 0.9–1.02
    if (bean) bean.scale.setScalar(scale);
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
}

// ---------- Boot
window.addEventListener('load', () => {
  // mount three
  initThree();
  setupScroll();

  // gentle delay then hide preloader
  setTimeout(() => {
    qs('#preloader').classList.add('hidden');
  }, 1100);
});

window.addEventListener('resize', () => {
  resizeThree();
});
