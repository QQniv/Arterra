/* -------------------------------------------------------
   ARTERRA — центрированное 3D-зерно (fixed), боковые тексты
   RU/EN, overlay-меню, надёжный прелоадер
   GLB из assets/coffee_bean.glb + процедурный фоллбек
------------------------------------------------------- */

const qs  = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

// ===== Year
const yearEl = qs('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ===================== I18N ===================== */
const translations = {
  ru: {
    menu:"Меню", nav_tech:"Технология", nav_sustain:"Устойчивость", nav_products:"Продукты", nav_contact:"Контакты",
    h1_line1:"Искусственная природа.", h1_line2:"Настоящий кофе.",
    hero_p:"Мы выращиваем кофе в искусственных плантациях, чтобы прекратить вырубку лесов, стабилизировать качество и открыть новое поколение устойчивого вкуса.",
    cta_method:"Посмотреть метод", cta_shop:"Магазин (Москва)",
    tech_h2:"Как устроены искусственные плантации",
    tech_lead:"Контролируемый свет. Точные питательные элементы. Рециркуляция воды. Нулевая потеря леса. Наши биотех-теплицы создают стабильный микроклимат и повторяемый профиль вкуса.",
    card1_h:"Точная вегетация", card1_p:"Сетки датчиков отслеживают влажность, pH, EC и транспирацию кроны. ИИ держит микроклимат в ±0,2°C.",
    card2_h:"Круговорот воды", card2_p:"Замкнутое орошение возвращает >90% конденсата. Меньше воды — чище выражение терруара.",
    card3_h:"Без вырубки", card3_p:"Выход с м² превосходит традиционные плантации — кофе больше не зависит от лесных площадей.",
    products_h2:"Продукты", products_lead:"Чистая сетка для запуска в Москве. Оплата/интеграции подключим позже.",
    prodA_h:"Прототип РОСТ A", prodA_p:"Карамель, цитрус, какао. 250 г",
    prodB_h:"Прототип РОСТ B", prodB_p:"Красные ягоды, цветы, шёлковистое тело. 250 г",
    prodC_h:"Зелёный кофе (B2B)", prodC_p:"Ровные лоты для кофеен и обжарщиков.",
    prod_soon:"Скоро", prod_inquiry:"Запрос",
    contact_h2:"Контакты", contact_lead:"Опт и пресса: hello@arterra.coffee (временный адрес)"
  },
  en: {
    menu:"Menu", nav_tech:"Technology", nav_sustain:"Sustainability", nav_products:"Products", nav_contact:"Contact",
    h1_line1:"Artificial nature.", h1_line2:"Real coffee.",
    hero_p:"We cultivate coffee in artificial plantations to end deforestation, stabilize quality and unlock a new generation of sustainable taste.",
    cta_method:"Explore our method", cta_shop:"Shop (Moscow)",
    tech_h2:"Artificial plantations explained",
    tech_lead:"Controlled light. Precise nutrients. Recycled water. Zero forest loss. Our bio-tech greenhouses create stable microclimates and repeatable flavor profiles.",
    card1_h:"Precision Growth", card1_p:"Sensor grids monitor humidity, pH, EC and canopy transpiration. AI nudges the microclimate within ±0.2°C.",
    card2_h:"Water Circularity", card2_p:"Closed-loop irrigation recovers >90% condensate. Less water, better terroir expression.",
    card3_h:"No Deforestation", card3_p:"Yield per m² exceeds traditional plantations, decoupling coffee from forest land use.",
    products_h2:"Products", products_lead:"Clean grid shop for Moscow launch. Payments later.",
    prodA_h:"Prototype Roast A", prodA_p:"Caramel, citrus, cocoa. 250g",
    prodB_h:"Prototype Roast B", prodB_p:"Red fruit, florals, silky body. 250g",
    prodC_h:"Green Coffee (B2B)", prodC_p:"Uniform lots for cafés & roasters.",
    prod_soon:"Coming soon", prod_inquiry:"Inquiry",
    contact_h2:"Contact", contact_lead:"Wholesale & press: hello@arterra.coffee (placeholder)"
  }
};

function setLang(lang){
  const dict = translations[lang] || translations.ru;
  qsa('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  const toggle = qs('#langToggle'); if (toggle) toggle.textContent = lang.toUpperCase();
  localStorage.setItem('lang', lang);
}
function initLang(){
  const start = localStorage.getItem('lang') || 'ru';
  setLang(start);
  const btn = qs('#langToggle');
  if (btn) btn.addEventListener('click', () => {
    const cur = localStorage.getItem('lang') || 'ru';
    setLang(cur==='ru' ? 'en' : 'ru');
  });
}

/* ===================== Menu overlay ===================== */
function initMenu(){
  const overlay = qs('#menuOverlay'), openBtn = qs('#menuToggle'), closeBtn = qs('#menuClose');
  const toggle = (s) => { overlay.classList.toggle('open', s); overlay.setAttribute('aria-hidden', s?'false':'true'); };
  openBtn.addEventListener('click', () => toggle(true));
  closeBtn.addEventListener('click', () => toggle(false));
  overlay.addEventListener('click', e => { if (e.target === overlay) toggle(false); });
}

/* ===================== Preloader (dust + progress) ===================== */
// Stop boot interval from index.html, if any
if (window.__arterraPreloaderBoot){ clearInterval(window.__arterraPreloaderBoot); window.__arterraPreloaderBoot = null; }

(() => {
  const canvas = qs('#dust'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w,h,parts=[];
  function resize(){
    w = canvas.width = innerWidth; h = canvas.height = innerHeight;
    const count = Math.min(140, Math.floor((w*h)/18000));
    parts = Array.from({length:count}).map(()=>({
      x:Math.random()*w, y:Math.random()*h, r:Math.random()*1.7+0.6,
      vx:(Math.random()-.5)*0.2, vy:(Math.random()-.5)*0.2, a:Math.random()*0.6+0.2
    }));
  }
  function tick(){
    ctx.clearRect(0,0,w,h); ctx.fillStyle='#a58869';
    for(const p of parts){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=w; if(p.x>w)p.x=0; if(p.y<0)p.y=h; if(p.y>h)p.y=0;
      ctx.globalAlpha=p.a; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  addEventListener('resize', resize); resize(); tick();

  const el = qs('#progressText'); let pr = 0;
  const iv = setInterval(()=>{ pr = Math.min(100, pr + Math.random()*12); if (el){
    const lang = localStorage.getItem('lang') || 'ru';
    el.textContent = (lang==='en'?'Loading ':'Загрузка ') + Math.floor(pr) + '%';
  } if (pr>=100) clearInterval(iv); },120);
})();

function hidePreloader(){
  const p = qs('#preloader'); if (!p){ document.body.classList.add('loaded'); return; }
  p.classList.add('fade-out'); setTimeout(()=>{ p.remove(); document.body.classList.add('loaded'); }, 950);
}

/* ===================== THREE: fixed centered bean ===================== */
let renderer, scene, camera, bean, shadowPlane, lightKey, lightFill;
const beanCanvas = qs('#bean');
const BEAN_GLTF_URL = "assets/coffee_bean.glb";

function microRoughness(size=256){
  const cnv=document.createElement('canvas'); cnv.width=cnv.height=size;
  const ctx=cnv.getContext('2d'); const img=ctx.createImageData(size,size);
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const nx=x/size, ny=y/size;
      const v=0.55+0.18*Math.sin((nx*6.0+ny*3.7)*Math.PI)+0.12*Math.sin((nx*10.0+ny*11.0)*Math.PI)+0.06*Math.sin(((nx+ny)*14.0)*Math.PI);
      const g=Math.max(0,Math.min(1,v))*255|0, i=(y*size+x)*4;
      img.data[i]=img.data[i+1]=img.data[i+2]=g; img.data[i+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
  const tex=new THREE.CanvasTexture(cnv); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.repeat.set(3,3);
  return tex;
}
function enhance(mat){
  if(!mat || !mat.isMeshStandardMaterial) return;
  mat.roughness = Math.min(0.52, Math.max(0.28, mat.roughness ?? 0.44));
  mat.metalness = Math.min(0.12, Math.max(0.04, mat.metalness ?? 0.08));
  mat.clearcoat = Math.min(1.0, (mat.clearcoat ?? 0.35) + 0.25);
  mat.clearcoatRoughness = Math.min(1.0, (mat.clearcoatRoughness ?? 0.4) + 0.05);
  mat.sheen = 0.6; mat.sheenColor = new THREE.Color(0x5e3f2b); mat.sheenRoughness = 0.5;
  if(!mat.roughnessMap){ mat.roughnessMap = microRoughness(256); mat.needsUpdate = true; }
}

function initThree(){
  if (!beanCanvas) throw new Error('bean canvas not found');

  renderer = new THREE.WebGLRenderer({ canvas: beanCanvas, antialias:true, alpha:true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  fit();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.65, 3.0);

  // studio lights
  lightKey = new THREE.DirectionalLight(0xffffff, 0.95);
  lightKey.position.set(2.0, 3.0, 2.0);
  lightKey.castShadow = true; lightKey.shadow.mapSize.set(1024,1024);
  scene.add(lightKey);

  lightFill = new THREE.DirectionalLight(0xffffff, 0.35);
  lightFill.position.set(-2.0, 1.0, -2.0);
  scene.add(lightFill);

  const rim = new THREE.PointLight(0xffe2c4, 0.35, 10, 2.0);
  rim.position.set(-1.6, 1.2, 1.8);
  scene.add(rim);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xe6dccf, 0.3);
  scene.add(hemi);

  // soft shadow catcher
  const g = new THREE.PlaneGeometry(6,6);
  const m = new THREE.ShadowMaterial({opacity:0.16});
  shadowPlane = new THREE.Mesh(g,m);
  shadowPlane.rotation.x = -Math.PI/2;
  shadowPlane.position.y = -0.9;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // load GLB
  const loader = new THREE.GLTFLoader();
  loader.load(
    BEAN_GLTF_URL,
    (gltf)=>{
      const model=gltf.scene;
      model.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=false; enhance(o.material); } });
      bean=model;
      // normalize scale
      const box=new THREE.Box3().setFromObject(bean);
      const s = 2.1 / Math.max(...box.getSize(new THREE.Vector3()).toArray());
      bean.scale.setScalar(s);
      scene.add(bean);
      hidePreloader();
    },
    undefined,
    (err)=>{ console.warn('[Arterra] GLB failed, fallback to procedural', err); makeFallback(); hidePreloader(); }
  );

  animate();
}

function makeFallback(){
  const g=new THREE.SphereGeometry(1,144,144);
  const pos=g.attributes.position, v=new THREE.Vector3();
  for(let i=0;i<pos.count;i++){
    v.fromBufferAttribute(pos,i);
    v.y*=0.78; v.x*=0.94; v.z*=1.10;
    const groove=Math.exp(-Math.pow(v.z*1.9,2))*0.26;
    const side=Math.sign(v.x)||1; v.x-=side*groove;
    pos.setXYZ(i,v.x,v.y,v.z);
  }
  g.computeVertexNormals();
  const mat=new THREE.MeshPhysicalMaterial({
    color:0x6f4e37, roughness:0.44, metalness:0.08,
    clearcoat:0.5, clearcoatRoughness:0.35,
    sheen:0.6, sheenColor:new THREE.Color(0x5e3f2b), sheenRoughness:0.5
  });
  enhance(mat);
  bean=new THREE.Mesh(g,mat); bean.castShadow=true; scene.add(bean);
}

// rotation: base auto + scroll-driven boost w/ damping
let lastY = scrollY, spinBoost = 0, scrollProgress = 0;

function animate(){
  requestAnimationFrame(animate);
  const now = performance.now();

  // decay the boost
  spinBoost *= 0.94;

  const baseSpin = 0.006 * (1.0 - scrollProgress*0.85);
  const spin = baseSpin + spinBoost;

  if (bean){
    bean.rotation.y += spin;
    bean.rotation.x = Math.sin(now*0.0012) * 0.05 * (1.0 - scrollProgress*0.9);
    lightKey.position.x = 2.0 + Math.sin(now*0.0008)*0.6*(1.0 - scrollProgress);
  }
  renderer.render(scene, camera);
}

function fit(){
  // canvas is square visually; use its CSS width to compute size
  const w = beanCanvas.clientWidth || 600;
  renderer.setSize(w, w, false);
  if (camera){ camera.aspect = 1; camera.updateProjectionMatrix(); }
}

function initScroll(){
  const onScroll = ()=>{
    // compute progress relative to viewport height for shadow dim
    const vp = innerHeight;
    // boost spin from scroll delta
    const dy = Math.abs(scrollY - lastY); lastY = scrollY;
    spinBoost += Math.min(0.02, dy/5000); // quick flicks = faster spin
    scrollProgress = Math.min(1, Math.max(0, (scrollY % vp)/vp));
    if (shadowPlane && shadowPlane.material) shadowPlane.material.opacity = 0.16*(1.0 - Math.min(1, scrollProgress*0.9));
  };
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();
}

/* ===================== Boot ===================== */
window.addEventListener('load', ()=>{
  initLang(); initMenu();
  try{ initThree(); initScroll(); }
  catch(e){ console.error('[Arterra] init error', e); }
  finally{
    setTimeout(()=>{ const p=qs('#preloader'); if(p && !document.body.classList.contains('loaded')) hidePreloader(); }, 4000);
  }
});
addEventListener('resize', ()=>{ if (renderer) fit(); });
