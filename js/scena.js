/* Scena 3D: blob liquido in Three.js con anelli e polvere di particelle.
   Espone window.Scena con lo stato che animazioni.js muove durante lo scroll. */
(() => {
  const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => innerWidth < 860;
  const $ = (s, el = document) => el.querySelector(s);

  const state = { x: 1.45, y: 0.1, z: 0, s: 1, d: 0.34, rot: 0, mix: 0, ring: 1, a: 1 };
  const boot = { s: 1, d: 0 };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let renderer, scene, camera, blob, rings, points, uni;

  function initGL() {
    if (!window.THREE) return false;
    try { renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: !isMobile(), alpha: true, powerPreference: 'high-performance' }); } catch (e) { return false; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile() ? 1.25 : 1.75));
    renderer.setSize(innerWidth, innerHeight, false);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 0, 7);
    const noise = `
      vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
      vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
      vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
        vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
        i=mod289(i);
        vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
        float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
        vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
        vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
        return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }`;

    uni = { uAlpha: { value: 1 }, uTime: { value: 0 }, uDistort: { value: state.d }, uMix: { value: 0 }, uMouse: { value: new THREE.Vector2() } };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni, transparent: true,
      vertexShader: noise + `
        uniform float uTime, uDistort; uniform vec2 uMouse;
        varying vec3 vN; varying vec3 vView; varying float vNoise;
        float f(vec3 p){ return snoise(p*.85 + vec3(uTime*.16, uTime*.11, 0.)) + .12*snoise(p*2.4 - uTime*.22); }
        void main(){
          vec3 p = position;
          float n = f(p + vec3(uMouse*.4, 0.));
          vec3 disp = p + normal * n * uDistort;
          vec3 t = normalize(cross(normal, vec3(0.,1.,.001)));
          vec3 b = normalize(cross(normal, t));
          float e = .02;
          vec3 pa = (p + t*e); pa += normalize(pa) * f(pa + vec3(uMouse*.4,0.)) * uDistort;
          vec3 pb = (p + b*e); pb += normalize(pb) * f(pb + vec3(uMouse*.4,0.)) * uDistort;
          vec3 nn = normalize(cross(pa - disp, pb - disp));
          if (dot(nn, normal) < 0.) nn = -nn;
          vNoise = n;
          vN = normalize(normalMatrix * nn);
          vec4 mv = modelViewMatrix * vec4(disp, 1.);
          vView = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform float uTime, uMix, uAlpha;
        varying vec3 vN; varying vec3 vView; varying float vNoise;
        vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d){ return a + b*cos(6.28318*(c*t+d)); }
        void main(){
          vec3 n = normalize(vN); vec3 v = normalize(vView);
          float fr = pow(1. - max(dot(n, v), 0.), 2.4);
          vec3 l1 = normalize(vec3(.6, .8, .6)); vec3 l2 = normalize(vec3(-.8, -.3, .4));
          float d1 = max(dot(n, l1), 0.); float d2 = max(dot(n, l2), 0.);
          float spec = pow(max(dot(reflect(-l1, n), v), 0.), 40.);
          vec3 base = vec3(.025, .028, .04);
          vec3 iri = pal(vNoise*.45 + fr*.6 + uTime*.03, vec3(.5), vec3(.5), vec3(1.), vec3(.0,.33,.67));
          vec3 acid = vec3(.92, .89, .82); vec3 ion = vec3(.55, .6, .7); vec3 coral = vec3(.85, .47, .34);
          vec3 rim = mix(mix(ion, acid, smoothstep(-.2, .6, vNoise)), iri, .18);
          rim = mix(rim, mix(coral, ion, .35), uMix*.75);
          vec3 col = base + ion*d1*.18 + acid*d2*.10 + rim*fr*1.25 + spec*.9;
          col += mix(acid, coral, uMix) * smoothstep(.55, .9, vNoise) * .25;
          gl_FragColor = vec4(col, uAlpha);
        }`
    });
    blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, isMobile() ? 28 : 72), mat);
    scene.add(blob);

    rings = new THREE.Group();
    [[2.05, .5, 0], [2.45, .22, 1.1], [2.9, .12, -.6]].forEach(([r, op, tilt], i) => {
      const pts = []; for (let k = 0; k <= 160; k++) { const a = k / 160 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineBasicMaterial({ color: 0xe9e3d5, transparent: true, opacity: op });
      const line = i === 0 ? new THREE.LineSegments(g, m) : new THREE.Line(g, m);
      line.rotation.x = Math.PI / 2.4 + tilt * .3; line.rotation.y = tilt; rings.add(line);
    });
    scene.add(rings);

    const N = isMobile() ? 450 : 1600, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const r = 3 + Math.random() * 9, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); pos[i * 3 + 2] = r * Math.cos(ph) - 3; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    points = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xdfe3ea, size: .018, transparent: true, opacity: .55, sizeAttenuation: true, depthWrite: false }));
    scene.add(points);

    addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
    return true;
  }
  const glOk = initGL();
  if (!glOk) document.documentElement.classList.add('no-gl');
  // Su telefono l'oggetto sta nella parte alta dello schermo, più piccolo e più tenue, lontano dai testi
  const k = () => isMobile() ? { x: .15, y: 1.25, s: .58, a: .7 } : { x: 1, y: 0, s: 1, a: 1 };

  let last = performance.now(), running = true;
  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, .05); last = now;
    
    if (glOk) {
      mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
      const kk = k();
      uni.uTime.value += ridotto ? 0 : dt;
      uni.uDistort.value = state.d + boot.d; uni.uMix.value = state.mix; uni.uAlpha.value = state.a * kk.a;
      rings.children.forEach((l, i) => (l.material.opacity = [.5, .22, .12][i] * state.a * kk.a)); uni.uMouse.value.set(mouse.x, mouse.y);
      blob.position.set(state.x * kk.x, state.y * (isMobile() ? .4 : 1) + kk.y, state.z);
      blob.scale.setScalar(state.s * kk.s * boot.s);
      blob.rotation.y += ridotto ? 0 : dt * .12; blob.rotation.x = state.rot + mouse.y * .25;
      rings.position.copy(blob.position); rings.scale.setScalar(state.s * kk.s * boot.s * state.ring);
      rings.rotation.z += ridotto ? 0 : dt * .08; rings.rotation.x = mouse.y * .3; rings.rotation.y = mouse.x * .3;
      points.rotation.y += ridotto ? 0 : dt * .015; points.rotation.x = mouse.y * .05;
      camera.position.x = mouse.x * .35; camera.position.y = -mouse.y * .25; camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(frame); } });
  addEventListener('pointermove', (e) => { mouse.tx = (e.clientX / innerWidth - .5) * 2; mouse.ty = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
  requestAnimationFrame(frame);

  window.Scena = { state, boot, ok: glOk };
})();
