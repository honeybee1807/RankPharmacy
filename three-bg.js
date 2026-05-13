// ============================================================
// Rank Pharmacy — Floating Pills background
// ============================================================
// Fatter, chunkier capsule pills drift very slowly across a
// clean white scene. Scroll adds only a whisper of extra
// movement — subtle, not distracting. Idle bob and spin are
// barely perceptible. Mobile drops pill count for 60fps.
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
  scene.fog = new THREE.Fog(0xFAFBFC, 14, 30);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 12);

  // ── Lighting ──────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xFFFFFF, 0.95));

  const key = new THREE.DirectionalLight(0xE8F4FF, 0.65);
  key.position.set(5, 8, 8);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xB8F0EA, 0.45);
  fill.position.set(-7, -3, 5);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xCFE9FF, 0.25);
  rim.position.set(0, -6, -8);
  scene.add(rim);

  // ── Group ─────────────────────────────────────────────────
  const group = new THREE.Group();
  scene.add(group);

  // ── Pill colour palette (brand) ───────────────────────────
  const pillConfigs = [
    { color: 0x003087, opacity: 0.20, transmission: 0.58 }, // navy
    { color: 0x003087, opacity: 0.12, transmission: 0.68 }, // navy ghost
    { color: 0x00B8A9, opacity: 0.18, transmission: 0.58 }, // teal
    { color: 0x00B8A9, opacity: 0.11, transmission: 0.68 }, // teal ghost
    { color: 0xA3D9C9, opacity: 0.16, transmission: 0.62 }, // sage
    { color: 0x6EA8CC, opacity: 0.14, transmission: 0.62 }, // soft blue
  ];

  // ── Pill builder ──────────────────────────────────────────
  // R = radius (girth)  — nearly double the previous value
  // H = half-length of cylinder body
  // Keeping R:H ~1:2 so they still read as capsules, not spheres
  function makePill(cfg) {
    const pill = new THREE.Group();

    const mat = new THREE.MeshPhysicalMaterial({
      color:              cfg.color,
      transparent:        true,
      opacity:            cfg.opacity,
      roughness:          0.10,
      metalness:          0.0,
      transmission:       cfg.transmission,
      thickness:          1.2,
      clearcoat:          0.6,
      clearcoatRoughness: 0.06,
      side:               THREE.FrontSide,
    });

    const R = 0.32;   // was 0.18 — much fatter
    const H = 0.68;   // was 0.52 — slightly longer

    const bodyGeo = new THREE.CylinderGeometry(R, R, H * 2, 24, 1);
    pill.add(new THREE.Mesh(bodyGeo, mat));

    const topGeo = new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const top = new THREE.Mesh(topGeo, mat);
    top.position.y = H;
    pill.add(top);

    const botGeo = new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bot = new THREE.Mesh(botGeo, mat);
    bot.position.y = -H;
    pill.add(bot);

    return pill;
  }

  // ── Spawn pills ───────────────────────────────────────────
  // Fewer pills — they're bigger now, fewer looks cleaner
  const pills       = [];
  const pillCount   = isMobile ? 8 : 18;
  const depthLayers = isMobile ? [-1, -3, -5] : [-1, -2.5, -4, -6];

  for (let i = 0; i < pillCount; i++) {
    const cfg   = pillConfigs[i % pillConfigs.length];
    const pill  = makePill(cfg);
    const layer = depthLayers[i % depthLayers.length];

    pill.position.set(
      (Math.random() - 0.5) * 24,
      (Math.random() - 0.5) * 14,
      layer + (Math.random() - 0.5) * 0.6
    );

    // Gentle, natural-looking tilt angles — not fully tumbling
    pill.rotation.set(
      (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 1.4
    );

    // ── Very slow idle motion ──────────────────────────────
    pill.userData.vx         = (Math.random() - 0.5) * 0.0006;  // drift X
    pill.userData.vy         = (Math.random() - 0.5) * 0.0004;  // drift Y
    pill.userData.spinX      = (Math.random() - 0.5) * 0.0004;  // tumble X
    pill.userData.spinY      = (Math.random() - 0.5) * 0.0003;  // tumble Y
    pill.userData.spinZ      = (Math.random() - 0.5) * 0.0002;  // tumble Z
    pill.userData.floatOff   = Math.random() * Math.PI * 2;
    pill.userData.depthFactor = 1 - (layer / Math.min(...depthLayers));

    group.add(pill);
    pills.push(pill);
  }

  // ── Scroll velocity tracking ──────────────────────────────
  let lastScrollY = window.scrollY;
  let scrollVel   = 0;
  let smoothVel   = 0;

  // ── Mouse parallax ────────────────────────────────────────
  let mx = 0, my = 0, pmx = 0, pmy = 0;
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth  - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
  });

  // ── GSAP camera drift — barely noticeable ─────────────────
  if (typeof gsap !== 'undefined' && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(camera.position, {
      z: 9.5, y: -0.6, ease: 'none',
      scrollTrigger: {
        trigger: 'body', start: 'top top', end: 'bottom bottom',
        scrub: 6   // extremely sluggish scrub — camera barely follows
      }
    });
  }

  // ── Bounds ────────────────────────────────────────────────
  const BX = 13, BY = 9;

  // ── Animation loop ────────────────────────────────────────
  let last = performance.now();

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    // Scroll delta — sampled each frame
    const currentScrollY = window.scrollY;
    scrollVel   = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    // Scale factor 0.008  (was 0.065) — 8× less scroll influence
    // Attack 0.06          (was 0.25)  — slow pickup
    // Decay  0.02          (was 0.06)  — very slow fade back to idle
    const target = scrollVel * 0.004;
    smoothVel += (target - smoothVel) * (scrollVel !== 0 ? 0.03 : 0.01);

    // Mouse parallax — barely-there group tilt
    pmx += (mx - pmx) * 0.015;
    pmy += (my - pmy) * 0.015;
    group.rotation.x += (pmy * 0.03 - group.rotation.x) * 0.015;
    group.rotation.y += (pmx * 0.02 - group.rotation.y) * 0.015;

    pills.forEach((pill) => {
      const u = pill.userData;

      // Slow idle drift
      pill.position.x += u.vx;
      pill.position.y += u.vy;

      // Whisper-level scroll nudge
      pill.position.y -= smoothVel * u.depthFactor;

      // Extremely gentle sine bob — period ~94 seconds per cycle
      pill.position.y += Math.sin(now * 0.00018 + u.floatOff) * 0.00022;

      // Slow tumble only — no scroll spin boost
      pill.rotation.x += u.spinX;
      pill.rotation.y += u.spinY;
      pill.rotation.z += u.spinZ;

      // Wrap at scene edges
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