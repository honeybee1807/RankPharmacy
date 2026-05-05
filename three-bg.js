// ============================================================
// Rank Pharmacy — light, clean medical 3D background
// ============================================================
// Renders a subtle full-screen scene (particles, translucent
// capsules, faint pharmacy crosses) that sits behind every page.
// GSAP + ScrollTrigger drive a slow camera tilt as the user scrolls.
// Mobile drops particle count for 60fps.
// ============================================================

(function () {
  if (typeof THREE === 'undefined') { console.warn('[three-bg] THREE not loaded'); return; }

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0xFFFFFF, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xFFFFFF, 8, 24);
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 10);

  scene.add(new THREE.AmbientLight(0xFFFFFF, 0.85));
  const key = new THREE.DirectionalLight(0xCFE9FF, 0.7); key.position.set(4, 6, 8); scene.add(key);
  const fill = new THREE.DirectionalLight(0xB8F0EA, 0.5); fill.position.set(-6, -2, 4); scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  // particles
  const particleCount = isMobile ? 220 : 600;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i*3]   = (Math.random() - 0.5) * 22;
    positions[i*3+1] = (Math.random() - 0.5) * 14;
    positions[i*3+2] = (Math.random() - 0.5) * 14;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x00B8A9, size: 0.045, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const points = new THREE.Points(pGeo, pMat);
  group.add(points);

  // translucent capsules
  const capsules = [];
  const capsuleCount = isMobile ? 4 : 8;
  for (let i = 0; i < capsuleCount; i++) {
    const g = new THREE.CapsuleGeometry(0.18, 0.55, 6, 12);
    const m = new THREE.MeshPhysicalMaterial({
      color: i % 2 === 0 ? 0x003087 : 0x00B8A9,
      transparent: true, opacity: 0.18,
      roughness: 0.25, transmission: 0.6, thickness: 0.5,
      clearcoat: 0.3
    });
    const cap = new THREE.Mesh(g, m);
    cap.position.set((Math.random()-0.5)*14, (Math.random()-0.5)*8, (Math.random()-0.5)*6 - 2);
    cap.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    cap.userData.spin = (Math.random() - 0.5) * 0.005;
    cap.userData.float = Math.random() * Math.PI * 2;
    group.add(cap);
    capsules.push(cap);
  }

  // faint pharmacy crosses
  const crosses = [];
  const crossCount = isMobile ? 2 : 4;
  for (let i = 0; i < crossCount; i++) {
    const cg = new THREE.Group();
    const matX = new THREE.MeshBasicMaterial({ color: 0x00B8A9, transparent: true, opacity: 0.10 });
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.05), matX);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.05), matX);
    cg.add(a); cg.add(b);
    cg.position.set((Math.random()-0.5)*16, (Math.random()-0.5)*10, (Math.random()-0.5)*4 - 4);
    cg.userData.spin = (Math.random() - 0.5) * 0.004;
    group.add(cg);
    crosses.push(cg);
  }

  // mouse parallax
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
  });

  // GSAP scroll-driven camera
  if (typeof gsap !== 'undefined' && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(camera.position, {
      z: 6, y: -1.5, ease: 'none',
      scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1.2 }
    });
    gsap.to(group.rotation, {
      y: Math.PI * 0.15, ease: 'none',
      scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1.2 }
    });
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    tx += (mx - tx) * 0.04;
    ty += (my - ty) * 0.04;
    group.rotation.x += (ty * 0.1 - group.rotation.x) * 0.04;

    points.rotation.y += 0.0006;
    points.rotation.x += 0.0002;

    capsules.forEach((c) => {
      c.rotation.x += c.userData.spin;
      c.rotation.y += c.userData.spin * 0.7;
      c.position.y += Math.sin(now * 0.0005 + c.userData.float) * 0.0008;
    });
    crosses.forEach((c) => { c.rotation.z += c.userData.spin; });

    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });
})();
