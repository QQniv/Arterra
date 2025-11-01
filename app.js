/* -------------------------------------------------------
   ARTERRA — RU default + EN toggle + overlay menu
   + Smooth loader transition
   + PBR coffee bean (стабильно, без кастомных шейдеров)
   + Auto-rotation, замедление при скролле
------------------------------------------------------- */

const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

// ===== Year
const yearEl = qs('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Translations
const translations = {
  ru: {
    menu: "Меню",
    nav_tech: "Технология",
    nav_sustain: "Устойчивость",
    nav_products: "Продукты",
    nav_contact: "Контакты",
    h1_line1: "Искусственная природа.",
    h1_line2: "Настоящий кофе.",
    hero_p: "Мы выращиваем кофе в искусственных плантациях, чтобы прекратить вырубку лесов, стабилизировать качество и открыть новое поколение устойчивого вкуса.",
    cta_method: "Посмотреть метод",
    cta_shop: "Магазин (Москва)",

    tech_h2: "Как устроены искусственные плантации",
    tech_lead: "Контролируемый свет. Точные питательные элементы. Рециркуляция воды. Нулевая потеря леса. Наши биотех-теплицы создают стабильный микроклимат и повторяемый профиль вкуса.",

    card1_h: "Точная вегетация",
    card1_p: "Сетки датчиков отслеживают влажность, pH, EC и транспирацию кроны. ИИ держит микроклимат в ±0,2°C.",

    card2_h: "Круговорот воды",
    card2_p: "Замкнутое орошение возвращает >90% конденсата. Меньше воды — чище выражение терруара.",

    card3_h: "Без вырубки",
    card3_p: "Выход с м² превосходит традиционные плантации — кофе больше не зависит от лесных площадей.",

    sustain_h2: "Устойчивость и влияние",
    sustain_lead: "Счётчики в реальном времени (сохранённые гектары, СО₂, вода) появятся в следующей итерации.",

    products_h2: "Продукты",
    products_lead: "Чистая сетка для запуска в Москве. Оплата/интеграции подключим позже.",

    prodA_h: "Прототип РОСТ A",
    prodA_p: "Карамель, цитрус, какао. 250 г",

    prodB_h: "Прототип РОСТ B",
    prodB_p: "Красные ягоды, цветы, шёлковистое тело. 250 г",

    prodC_h: "Зелёный кофе (B2B)",
    prodC_p: "Ровные лоты для кофеен и обжарщиков.",

    prod_soon: "Скоро",
    prod_inquiry: "Запрос",

    contact_h2: "Контакты",
    contact_lead: "Опт и пресса: hello@arterra.coffee (временный адрес)",
  },
  en: {
    menu: "Menu",
    nav_tech: "Technology",
    nav_sustain: "Sustainability",
    nav_products: "Products",
    nav_contact: "Contact",
    h1_line1: "Artificial nature.",
    h1_line2: "Real coffee.",
    hero_p: "We cultivate coffee in artificial plantations to end deforestation, stabilize quality and unlock a new generation of sustainable taste.",
    cta_method: "Explore our method",
    cta_shop: "Shop (Moscow)",

    tech_h2: "Artificial plantations explained",
    tech_lead: "Controlled light. Precise nutrients. Recycled water. Zero forest loss. Our bio-tech greenhouses create stable microclimates and repeatable flavor profiles.",

    card1_h: "Precision Growth",
    card1_p: "Sensor grids monitor humidity, pH, EC and canopy transpiration. AI nudges the microclimate within ±0.2°C.",

    card2_h: "Water Circularity",
    card2_p: "Closed-loop irrigation recovers >90% condensate. Less water, better terroir expression.",

    card3_h: "No Deforestation",
    card3_p: "Yield per m² exceeds traditional plantations, decoupling coffee from forest land use.",

    sustain_h2: "Sustainability & Impact",
    sustain_lead: "Live counters (hectares saved, CO₂ avoided, water preserved) coming in the next iteration.",

    products_h2: "Products",
    products_lead: "Clean grid shop for Moscow launch. Payments/integration to be wired later.",

    prodA_h: "Prototype Roast A",
    prodA_p: "Caramel, citrus, cocoa. 250g",

    prodB_h: "Prototype Roast B",
    prodB_p: "Red fruit, florals, silky body. 250g",

    prodC_h: "Green Coffee (B2B)",
    prodC_p: "Uniform lots for cafés & roasters.",

    prod_soon: "Coming soon",
    prod_inquiry: "Inquiry",

    contact_h2: "Contact",
    contact_lead: "Wholesale & press: hello@arterra.coffee (placeholder)",
  }
};

// ===== Language
function setLang(lang){
  const dict = translations[lang] || translations.ru;
  qsa('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  const toggle = qs('#langToggle');
  if (toggle) toggle.textContent = lang.toUpperCase();
  localStorage.setItem('lang', lang);
}
function initLang(){
  const saved = localStorage.getItem('lang');
  const start = saved || 'ru';
  setLang(start);
  const btn = qs('#langToggle');
  if (btn){
    btn.addEventListener('click', () => {
      const current = localStorage.getItem('lang') || 'ru';
      setLang(current === 'ru' ? 'en' : 'ru');
    });
  }
}

// ===== Menu overlay
function initMenu(){
  const overlay = qs('#menuOverlay');
  const openBtn = qs('#menuToggle');
  const closeBtn = qs('#menuClose');
  const toggle = (state) => {
    overlay.classList.toggle('open', state);
    overlay.setAttribute('aria-hidden', state ? 'false' : 'true');
  };
  openBtn.addEventListener('click', () => toggle(true));
  closeBtn.addEventListener('click', () => toggle(false));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) toggle(false); });
}

// ===== Preloader dust + progress
(() => {
  const canvas = qs('#dust'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, parts = [];
  function resize(){
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    const count = Math.min(140, Math.floor((w*h)/18000));
    parts = Array.from({length:count}).map(()=>({
      x: Math.random()*w, y: Math.random()*h,
      r: Math.random()*1.7+0.6,
      vx: (Math.random()-.5)*0.2, vy:(Math.random()-.5)*0.2,
      a: Math.random()*0.6+0.2
    }));
  }
  function tick(){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#a58869';
    for (const p of parts){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0) p.x=w; if(p.x>w) p.x=0;
      if(p.y<0) p.y=h; if(p.y>h) p.y=0;
      ctx.globalAlpha = p.a;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  addEventListener('resize', resize);
  resize(); tick();

  const progressEl = qs('#progressText');
  let p = 0; const iv = setInterval(()=>{
    p += Math.random()*12;
    if (p>=100){ p=100; clearInterval(iv); }
    const lang = localStorage.getItem('lang') || 'ru';
    if (progressEl) progressEl.textContent = (lang==='en'?'Loading ':'Загрузка ') + Math.floor(p) + '%';
  },120);
})();

// ===== Smooth transition: preloader -> page
function hidePreloader(){
  const p = qs('#preloader');
  if (!p){ document.body.classList.add('loaded'); return; }
  p.classList.add('fade-out');
  setTimeout(()=>{ p.remove(); document.body.classList.add('loaded'); }, 1100);
}

// ===== 3D: стабильное PBR-зерно без кастомных шейдеров
let renderer, scene, camera, bean, ground, lightKey, lightFill;
const beanCanvas = qs('#bean');

// Вставишь URL модели позже — подхватим реальную GLB
const BEAN_GLTF_URL = ""; // например: "https://cdn.yoursite.com/coffee_bean.glb"

function initThree(){
  if (!beanCanvas) throw new Error('Bean canvas not found');

  renderer = new THREE.WebGLRenderer({canvas: beanCanvas, antialias:true, alpha:true});
  renderer.setClearColor(0x000000, 0); // прозрачный фон
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  fitRenderer();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(35, beanCanvas.clientWidth/beanCanvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0.65, 3.0);

  // Studio lights
  lightKey = new THREE.DirectionalLight(0xffffff, 0.9);
  lightKey.position.set(2.0, 3.0, 2.0);
  lightKey.castShadow = true;
  lightKey.shadow.mapSize.set(1024,1024);
  scene.add(lightKey);

  lightFill = new THREE.DirectionalLight(0xffffff, 0.35);
  lightFill.position.set(-2.0, 1.0, -2.0);
  scene.add(lightFill);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xe6dccf, 0.4);
  scene.add(hemi);

  // Shadow catcher
  const groundGeo = new THREE.PlaneGeometry(6,6);
  const groundMat = new THREE.ShadowMaterial({opacity:0.18});
  ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -0.9;
  ground.receiveShadow = true;
  scene.add(ground);

  if (BEAN_GLTF_URL){
    const loader = new THREE.GLTFLoader();
    loader.load(BEAN_GLTF_URL, (gltf)=>{
      const model = gltf.scene;
      model.traverse(o=>{
        if (o.isMesh){
          o.castShadow = true; o.receiveShadow = false;
          if (o.material && o.material.isMeshStandardMaterial){
            o.material.roughness = 0.45;
            o.material.metalness = 0.1;
          }
        }
      });
      bean = model;
      scene.add(bean);
    }, undefined, (err)=>{
      console.warn('[Arterra] GLB load failed, fallback to procedural:', err);
      makeProceduralBean();
    });
  } else {
    makeProceduralBean();
  }

  animate();
}

function makeProceduralBean(){
  // Геометрия «миндаль + центральная борозда»
  const g = new THREE.SphereGeometry(1, 128, 128);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i=0;i<pos.count;i++){
    v.fromBufferAttribute(pos, i);
    v.y *= 0.78; v.x *= 0.94; v.z *= 1.10;
    const groove = Math.exp(-Math.pow(v.z*1.9,2)) * 0.26;
    const side = Math.sign(v.x) || 1;
    v.x -= side * groove;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();

  // Материал без кастомных шейдеров — устойчивый
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x6f4e37,          // кофейный
    roughness: 0.44,
    metalness: 0.08,
    clearcoat: 0.5,
    clearcoatRoughness: 0.35,
    sheen: 0.6,
    sheenColor: new THREE.Color(0x5e3f2b),
    sheenRoughness: 0.5
  });

  bean = new THREE.Mesh(g, mat);
  bean.castShadow = true;
  scene.add(bean);
}

function animate(){
  requestAnimationFrame(animate);
  const slow = scrollProgress;               // 0..1
  const spin = 0.005 * (1.0 - slow*0.95);   // почти до остановки
  if (bean){
    bean.rotation.y += spin;
    bean.rotation.x = Math.sin(performance.now()*0.0012) * 0.05 * (1.0 - slow*0.9);
    // лёгкое движение ключевого света, пока вверху
    lightKey.position.x = 2.0 + Math.sin(performance.now()*0.0008)*0.6*(1.0 - slow);
  }
  renderer.render(scene, camera);
}

function fitRenderer(){
  const {clientWidth, clientHeight} = beanCanvas;
  if (!clientWidth || !clientHeight) return;
  renderer.setSize(clientWidth, clientHeight, false);
  if (camera){
    camera.aspect = clientWidth/clientHeight;
    camera.updateProjectionMatrix();
  }
}

// ===== Scroll: прогресс (0 top .. 1 после hero)
let scrollProgress = 0;
function initScrollDamping(){
  const hero = qs('#hero');
  const onScroll = () => {
    const rect = hero.getBoundingClientRect();
    const viewport = innerHeight;
    const passed = Math.min( Math.max((viewport - rect.bottom) / viewport, 0), 1);
    scrollProgress = passed; // 0..1
    const vis = Math.max(0, Math.min(1, rect.bottom/viewport));
    if (bean) bean.scale.setScalar(0.92 + vis*0.12);
    if (ground && ground.material && ground.material.opacity !== undefined){
      ground.material.opacity = 0.18 * (1.0 - scrollProgress*0.9);
    }
  };
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();
}

/* ===== Boot ===== */
window.addEventListener('load', () => {
  initLang();
  initMenu();
  try{
    initThree();
    initScrollDamping();
  }catch(e){
    console.error('[Arterra] Init error:', e);
  }finally{
    setTimeout(hidePreloader, 900);
  }
});

addEventListener('resize', () => { if (renderer) fitRenderer(); });

// Safety: на всякий случай спрятать прелоад через 4с
setTimeout(() => {
  const p = qs('#preloader');
  if (p && !document.body.classList.contains('loaded')) hidePreloader();
}, 4000);
