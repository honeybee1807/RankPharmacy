// ============================================================
// Rank Pharmacy — Floating Pills background
// ============================================================
// Translucent capsule pills drift slowly across a clean white
// scene. Scroll velocity is tracked each frame and injected
// directly into pill speed — the faster you scroll, the more
// the pills rush. When scrolling stops they ease back to idle.
// Mouse parallax adds a gentle depth tilt.
// Mobile reduces pill count for 60fps.
// ============================================================

(function () {
  if (typeof THREE === 'undefined') { console.warn('[three-bg] THREE not loaded'); return; }

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  // ── Renderer ──────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0xFFFFFF, 0);

  // ── Scene & Camera ────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xFAFBFC, 12, 28);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 12);

  // ── Lighting ──────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xFFFFFF, 0.92));

  const key = new THREE.DirectionalLight(0xE8F4FF, 0.7);
  key.position.set(5, 8, 8);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xB8F0EA, 0.5);
  fill.position.set(-7, -3, 5);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xCFE9FF, 0.28);
  rim.position.set(0, -6, -8);
  scene.add(rim);

  // ── Group ─────────────────────────────────────────────────
  const group = new THREE.Group();
  scene.add(group);

  // ── Pill colour palette (brand) ───────────────────────────
  const pillConfigs = [
    { color: 0x003087, opacity: 0.22, transmission: 0.55 }, // navy
    { color: 0x003087, opacity: 0.14, transmission: 0.65 }, // navy light
    { color: 0x00B8A9, opacity: 0.20, transmission: 0.55 }, // teal
    { color: 0x00B8A9, opacity: 0.13, transmission: 0.65 }, // teal light
    { color: 0xA3D9C9, opacity: 0.18, transmission: 0.60 }, // sage
    { color: 0x6EA8CC, opacity: 0.16, transmission: 0.60 }, // soft blue
  ];

  // ── Pill builder ──────────────────────────────────────────
  // Two hemisphere endcaps + a cylinder body grouped as one object.
  function makePill(cfg) {
    const pill = new THREE.Group();

    const mat = new THREE.MeshPhysicalMaterial({
      color: cfg.color,
      transparent: true,
      opacity: cfg.opacity,
      roughness: 0.12,
      metalness: 0.0,
      transmission: cfg.transmission,
      thickness: 0.6,
      clearcoat: 0.5,
      clearcoatRoughness: 0.08,
      side: THREE.FrontSide,
    });

    const R = 0.18;
    const H = 0.52;

    const bodyGeo = new THREE.CylinderGeometry(R, R, H * 2, 20, 1);
    pill.add(new THREE.Mesh(bodyGeo, mat));

    const topGeo = new THREE.SphereGeometry(R, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const top = new THREE.Mesh(topGeo, mat);
    top.position.y = H;
    pill.add(top);

    const botGeo = new THREE.SphereGeometry(R, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bot = new THREE.Mesh(botGeo, mat);
    bot.position.y = -H;
    pill.add(bot);

    return pill;
  }

  // ── Spawn pills ───────────────────────────────────────────
  const pills = [];
  const pillCount = isMobile ? 14 : 32;
  const depthLayers = isMobile ? [-1, -3, -5] : [-1, -2.5, -4, -6];

  for (let i = 0; i < pillCount; i++) {
    const cfg = pillConfigs[i % pillConfigs.length];
    const pill = makePill(cfg);

    const layer = depthLayers[i % depthLayers.length];

    pill.position.set(
      (Math.random() - 0.5) * 24,
      (Math.random() - 0.5) * 14,
      layer + (Math.random() - 0.5) * 0.8
    );

    pill.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      (Math.random() - 0.5) * 1.2
    );

    pill.userData.vx         = (Math.random() - 0.5) * 0.0025;
    pill.userData.vy         = (Math.random() - 0.5) * 0.0018;
    pill.userData.spinX      = (Math.random() - 0.5) * 0.002;
    pill.userData.spinY      = (Math.random() - 0.5) * 0.0015;
    pill.userData.spinZ      = (Math.random() - 0.5) * 0.001;
    pill.userData.floatOff   = Math.random() * Math.PI * 2;
    // Closer pills respond more to scroll — reinforces parallax depth
    pill.userData.depthFactor = 1 - (layer / Math.min(...depthLayers));

    group.add(pill);
    pills.push(pill);
  }

  // ── Scroll velocity tracking ──────────────────────────────
  // Sampled per-frame for smooth results. Raw delta is scaled and
  // then exponentially smoothed — fast attack, slow decay.
  let lastScrollY = window.scrollY;
  let scrollVel   = 0;
  let smoothVel   = 0;

  // ── Mouse parallax state ──────────────────────────────────
  let mx = 0, my = 0, pmx = 0, pmy = 0;
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth  - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
  });

  // ── GSAP camera drift on scroll ───────────────────────────
  // Very gentle — the scroll velocity on pills is the main effect.
  if (typeof gsap !== 'undefined' && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(camera.position, {
      z: 8, y: -1.0, ease: 'none',
      scrollTrigger: {
        trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1.8
      }
    });
  }

  // ── Bounds ────────────────────────────────────────────────
  const BX = 13, BY = 8;

  // ── Animation loop ────────────────────────────────────────
  let last = performance.now();

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    // Sample scroll delta this frame
    const currentScrollY = window.scrollY;
    scrollVel  = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    // Smooth: fast attack when scrolling, slow decay when stopped
    const target = scrollVel * 0.065;
    smoothVel += (target - smoothVel) * (scrollVel !== 0 ? 0.25 : 0.06);

    // Mouse parallax → group tilt
    pmx += (mx - pmx) * 0.032;
    pmy += (my - pmy) * 0.032;
    group.rotation.x += (pmy * 0.07 - group.rotation.x) * 0.032;
    group.rotation.y += (pmx * 0.05 - group.rotation.y) * 0.032;

    pills.forEach((pill) => {
      const u = pill.userData;

      // Idle drift
      pill.position.x += u.vx;
      pill.position.y += u.vy;

      // Scroll velocity — depth-adjusted
      pill.position.y -= smoothVel * u.depthFactor;

      // Sine bob (unique phase per pill)
      pill.position.y += Math.sin(now * 0.00042 + u.floatOff) * 0.00055;

      // Spin — spins up slightly with scroll speed
      const spinBoost = Math.abs(smoothVel) * 0.4;
      pill.rotation.x += u.spinX + spinBoost * 0.008;
      pill.rotation.y += u.spinY + spinBoost * 0.005;
      pill.rotation.z += u.spinZ;

      // Wrap at bounds
      if (pill.position.x >  BX) pill.position.x = -BX;
      if (pill.position.x < -BX) pill.position.x =  BX;
      if (pill.position.y >  BY) pill.position.y = -BY;
      if (pill.position.y < -BY) pill.position.y =  BY;
    });

    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // ── Resize ────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });

})();