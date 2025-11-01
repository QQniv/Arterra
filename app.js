/* ======================================================
   ARTERRA — app.module.js (ESM)
   - RU/EN, overlay menu, preloader dust
   - Three.js (module) + GLTFLoader + DRACOLoader
   - Centered bean (wrapper), auto camera framing
   - Scroll-damped rotation, shadow receiver, HUD
====================================================== */
export default function initApp({ THREE, GLTFLoader, DRACOLoader }) {
  const qs  = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];

  // -------- HUD
  (function(){
    const box=document.createElement('div');
    box.id='hud';
    box.style.cssText='position:fixed;top:10px;right:10px;z-index:9999;background:rgba(0,0,0,.6);color:#fff;font:12px/1.3 Inter,system-ui,sans-serif;padding:8px 10px;border-radius:10px;backdrop-filter:blur(4px);display:none';
    box.textContent='init…';
    document.body.appendChild(box);
  })();
  const hud = (msg)=>{ const el=qs('#hud'); if(el){ el.style.display='block'; el.textContent=msg; }};

  // -------- Year
  const y=qs('#year'); if(y) y.textContent=new Date().getFullYear();

  // -------- i18n
  const translations = {
    ru:{menu:"Меню",nav_tech:"Технология",nav_sustain:"Устойчивость",nav_products:"Продукты",nav_contact:"Контакты",
      h1_line1:"Искусственная природа.",h1_line2:"Настоящий кофе.",
      hero_p:"Мы выращиваем кофе в искусственных плантациях, чтобы прекратить вырубку лесов, стабилизировать качество и открыть новое поколение устойчивого вкуса.",
      cta_method:"Посмотреть метод",cta_shop:"Магазин (Москва)",tech_h2:"Как устроены искусственные плантации",
      tech_lead:"Контролируемый свет. Точные питательные элементы. Рециркуляция воды. Нулевая потеря леса. Наши биотех-теплицы создают стабильный микроклимат и повторяемый профиль вкуса.",
      card1_h:"Точная вегетация",card1_p:"Сетки датчиков отслеживают влажность, pH, EC и транспирацию кроны. ИИ держит микроклимат в ±0,2°C.",
      card2_h:"Круговорот воды",card2_p:"Замкнутое орошение возвращает >90% конденсата. Меньше воды — чище выражение терруара.",
      card3_h:"Без вырубки",card3_p:"Выход с м² превосходит традиционные плантации — кофе больше не зависит от лесных площадей.",
      products_h2:"Продукты",products_lead:"Чистая сетка для запуска в Москве. Оплата/интеграции подключим позже.",
      prodA_h:"Прототип РОСТ A",prodA_p:"Карамель, цитрус, какао. 250 г",prodB_h:"Прототип РОСТ B",prodB_p:"Красные ягоды, цветы, шёлковистое тело. 250 г",
      prodC_h:"Зелёный кофе (B2B)",prodC_p:"Ровные лоты для кофеен и обжарщиков.",prod_soon:"Скоро",prod_inquiry:"Запрос",
      contact_h2:"Контакты",contact_lead:"Опт и пресса: hello@arterra.coffee (временный адрес)"},
    en:{menu:"Menu",nav_tech:"Technology",nav_sustain:"Sustainability",nav_products:"Products",nav_contact:"Contact",
      h1_line1:"Artificial nature.",h1_line2:"Real coffee.",
      hero_p:"We cultivate coffee in artificial plantations to end deforestation, stabilize quality and unlock a new generation of sustainable taste.",
      cta_method:"Explore our method",cta_shop:"Shop (Moscow)",tech_h2:"Artificial plantations explained",
      tech_lead:"Controlled light. Precise nutrients. Recycled water. Zero forest loss. Our bio-tech greenhouses create stable microclimates and repeatable flavor profiles.",
      card1_h:"Precision Growth",card1_p:"Sensor grids monitor humidity, pH, EC and canopy transpiration. AI keeps ±0.2°C microclimate.",
      card2_h:"Water Circularity",card2_p:"Closed-loop irrigation recovers >90% condensate.",
      card3_h:"No Deforestation",card3_p:"Yield per m² exceeds traditional plantations.",
      products_h2:"Products",products_lead:"Clean grid shop for Moscow launch.",
      prodA_h:"Prototype Roast A",prodA_p:"Caramel, citrus, cocoa. 250g",
      prodB_h:"Prototype Roast B",prodB_p:"Red fruit, florals, silky body. 250g",
      prodC_h:"Green Coffee (B2B)",prodC_p:"Uniform lots for cafés & roasters.",
      prod_soon:"Coming soon",prod_inquiry:"Inquiry",
      contact_h2:"Contact",contact_lead:"Wholesale & press: hello@arterra.coffee (placeholder)"}
  };
  function setLang(lang){
    const dict = translations[lang] || translations.ru;
    qsa('[data-i18n]').forEach(el=>{ const k=el.getAttribute('data-i18n'); if(dict[k]!=null) el.textContent=dict[k]; });
    const t=qs('#langToggle'); if(t) t.textContent=lang.toUpperCase();
    localStorage.setItem('lang', lang);
  }
  (function initLang(){
    setLang(localStorage.getItem('lang')||'ru');
    const btn=qs('#langToggle');
    if(btn) btn.addEventListener('click', ()=>{ const cur=localStorage.getItem('lang')||'ru'; setLang(cur==='ru'?'en':'ru'); });
  })();

  // -------- menu
  (function initMenu(){
    const ov=qs('#menuOverlay'), open=qs('#menuToggle'), close=qs('#menuClose');
    const toggle = s => { ov.classList.toggle('open', s); ov.setAttribute('aria-hidden', s?'false':'true'); };
    open.addEventListener('click', ()=>toggle(true));
    close.addEventListener('click', ()=>toggle(false));
    ov.addEventListener('click', e=>{ if(e.target===ov) toggle(false); });
  })();

  // -------- preloader dust
  if (window.__arterraPreloaderBoot){ clearInterval(window.__arterraPreloaderBoot); window.__arterraPreloaderBoot=null; }
  (function(){
    const canvas=qs('#dust'); if(!canvas) return;
    const ctx=canvas.getContext('2d'); let w,h,parts=[];
    function resize(){ w=canvas.width=innerWidth; h=canvas.height=innerHeight;
      const count=Math.min(140,Math.floor((w*h)/18000));
      parts=Array.from({length:count}).map(()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.7+0.6,vx:(Math.random()-.5)*0.2,vy:(Math.random()-.5)*0.2,a:Math.random()*0.6+0.2}));
    }
    function tick(){ ctx.clearRect(0,0,w,h); ctx.fillStyle='#a58869';
      for(const p of parts){ p.x+=p.vx; p.y+=p.vy; if(p.x<0)p.x=w;if(p.x>w)p.x=0;if(p.y<0)p.y=h;if(p.y>h)p.y=0;
        ctx.globalAlpha=p.a; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
      requestAnimationFrame(tick);
    }
    addEventListener('resize',resize); resize(); tick();
    const el=qs('#progressText'); let pr=0;
    const iv=setInterval(()=>{ pr=Math.min(100,pr+Math.random()*12); if(el){ const lang=localStorage.getItem('lang')||'ru'; el.textContent=(lang==='en'?'Loading ':'Загрузка ')+Math.floor(pr)+'%'; } if(pr>=100)clearInterval(iv);},120);
  })();

  function hidePreloader(){ const p=qs('#preloader'); if(!p){document.body.classList.add('loaded');return;}
    p.classList.add('fade-out'); setTimeout(()=>{ p.remove(); document.body.classList.add('loaded'); }, 900); }

  // -------- THREE setup
  let renderer, scene, camera, bean, ground, keyLight;
  const beanCanvas = qs('#bean');
  const BEAN_URL = new URL('assets/coffee_bean.glb', document.baseURI).href;

  function enhanceMat(m){
    if(!m) return;
    if(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial){
      m.transparent=false; m.opacity=1; m.side=THREE.DoubleSide;
      m.roughness = m.roughness ?? 0.42; m.metalness = m.metalness ?? 0.08;
      if('clearcoat' in m){ m.clearcoat=Math.max(0.5,m.clearcoat??0.5); m.clearcoatRoughness=0.35; }
    }
  }

  function makeFallback(){
    const g=new THREE.SphereGeometry(1,144,144), v=new THREE.Vector3(), pos=g.attributes.position;
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i);
      v.y*=0.78; v.x*=0.94; v.z*=1.10;
      const groove=Math.exp(-Math.pow(v.z*1.9,2))*0.26; const side=Math.sign(v.x)||1; v.x-=side*groove;
      pos.setXYZ(i,v.x,v.y,v.z);
    }
    g.computeVertexNormals();
    const mat=new THREE.MeshPhysicalMaterial({color:0x6f4e37,roughness:0.44,metalness:0.08,clearcoat:0.5,clearcoatRoughness:0.35});
    bean=new THREE.Mesh(g,mat); bean.castShadow=true; scene.add(bean);
  }

  function fit(){
    const w=beanCanvas.clientWidth||600; renderer.setSize(w,w,false);
    camera.aspect=1; camera.updateProjectionMatrix();
  }

  function initThree(){
    hud('three ✔︎');

    renderer=new THREE.WebGLRenderer({canvas:beanCanvas,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setClearColor(0x000000,0);
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.physicallyCorrectLights=true;

    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(35,1,0.1,100);
    camera.position.set(0,0.65,3.0); camera.lookAt(0,0,0);

    keyLight=new THREE.DirectionalLight(0xffffff,1.0);
    keyLight.position.set(2,3,2); keyLight.castShadow=true; keyLight.shadow.mapSize.set(1024,1024); scene.add(keyLight);
    scene.add(new THREE.DirectionalLight(0xffffff,0.35)).position.set(-2,1,-2);
    scene.add(new THREE.PointLight(0xffe2c4,0.35,10,2)).position.set(-1.6,1.2,1.8);
    scene.add(new THREE.HemisphereLight(0xffffff,0xe6dccf,0.3));

    const g=new THREE.PlaneGeometry(6,6), m=new THREE.ShadowMaterial({opacity:0.16});
    ground=new THREE.Mesh(g,m); ground.rotation.x=-Math.PI/2; ground.position.y=-0.9; ground.receiveShadow=true; scene.add(ground);

    fit(); addEventListener('resize',()=>renderer&&fit(),{passive:true});

    // Load GLB
    const loader = new GLTFLoader();
    if (DRACOLoader){
      const draco=new DRACOLoader();
      draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
      loader.setDRACOLoader(draco);
    }

    const VIS_DEBUG = true; // set false after first success

    let loaded=false;
    const safety=setTimeout(()=>{ if(!loaded){ hud('GLB timeout → fallback'); makeFallback(); hidePreloader(); } },6000);

    loader.load(
      BEAN_URL,
      (gltf)=>{
        loaded=true; clearTimeout(safety); hud('model ✔︎');

        const wrapper=new THREE.Group();
        const model=gltf.scene||gltf.scenes?.[0];
        wrapper.add(model); scene.add(wrapper);

        model.traverse(o=>{
          if(o.isMesh){
            o.castShadow=true; o.receiveShadow=false;
            if(VIS_DEBUG){ o.material=new THREE.MeshNormalMaterial({side:THREE.DoubleSide}); }
            else{
              const mats=Array.isArray(o.material)?o.material:[o.material];
              mats.forEach(enhanceMat);
            }
          }
        });

        model.updateWorldMatrix(true,true);
        const raw=new THREE.Box3().setFromObject(model);
        const size=raw.getSize(new THREE.Vector3());
        const center=raw.getCenter(new THREE.Vector3());
        model.position.sub(center); model.updateWorldMatrix(true,true);

        const maxDim=Math.max(size.x,size.y,size.z)||1;
        const scale=2.1/maxDim; wrapper.scale.setScalar(scale);

        const box=new THREE.Box3().setFromObject(wrapper);
        const sphere=new THREE.Sphere(); box.getBoundingSphere(sphere);
        const fov=camera.fov*(Math.PI/180);
        const dist=sphere.radius/Math.tan(fov/2);
        camera.position.set(0, sphere.center.y+sphere.radius*0.3, dist*1.15);
        camera.lookAt(sphere.center.clone());
        camera.near=Math.max(0.01, dist - sphere.radius*4.0);
        camera.far = dist + sphere.radius*8.0;
        camera.updateProjectionMatrix();

        ground.position.y=sphere.center.y - sphere.radius*0.95;

        hidePreloader();
        bean=wrapper;
      },
      undefined,
      (err)=>{ loaded=true; clearTimeout(safety); hud('GLB error → fallback'); console.warn(err); makeFallback(); hidePreloader(); }
    );

    animate();
  }

  // -------- animation + scroll
  let lastY=scrollY, spinBoost=0, scrollProgress=0;
  function animate(){
    requestAnimationFrame(animate);
    spinBoost*=0.94;
    const base=0.006*(1.0 - scrollProgress*0.85), spin=base+spinBoost;
    if(bean){
      bean.rotation.y+=spin;
      bean.rotation.x=Math.sin(performance.now()*0.0012)*0.05*(1.0 - scrollProgress*0.9);
      keyLight.position.x=2 + Math.sin(performance.now()*0.0008)*0.6*(1.0 - scrollProgress);
    }
    renderer.render(scene,camera);
  }
  (function initScroll(){
    const onScroll=()=>{
      const vp=innerHeight, dy=Math.abs(scrollY-lastY); lastY=scrollY;
      spinBoost+=Math.min(0.02, dy/5000);
      scrollProgress=Math.min(1, Math.max(0, (scrollY%vp)/vp));
      if(ground&&ground.material) ground.material.opacity=0.16*(1.0 - Math.min(1, scrollProgress*0.9));
    };
    addEventListener('scroll',onScroll,{passive:true}); onScroll();
  })();

  // -------- boot
  try{ initThree(); }catch(e){ console.error(e); hud('init error'); }
  finally{
    setTimeout(()=>{ const p=qs('#preloader'); if(p && !document.body.classList.contains('loaded')) hidePreloader(); },7000);
  }
}
