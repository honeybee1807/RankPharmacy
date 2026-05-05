// ============================================================
// Rank Pharmacy — site-wide UI behaviour
// ============================================================

(function () {
  // Reveal-on-scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Mobile menu toggle
  const mt = document.getElementById('mobile-toggle');
  const mm = document.getElementById('mobile-menu');
  if (mt && mm) {
    mt.addEventListener('click', () => mm.classList.toggle('open'));
    mm.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mm.classList.remove('open')));
  }

  // Highlight current nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.endsWith(path)) a.classList.add('active');
  });

  // Contact form (EmailJS-ready stub)
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (status) { status.classList.remove('ok'); status.textContent = 'Sending...'; }
      // EmailJS integration:
      //   emailjs.init('YOUR_PUBLIC_KEY');
      //   emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', form)
      //     .then(() => { status.textContent = '✓ Sent.'; form.reset(); })
      //     .catch(err => { status.textContent = 'Error: ' + err.text; });
      setTimeout(() => {
        if (status) { status.classList.add('ok'); status.textContent = '✓ Thank you. We will reply within one business day.'; }
        form.reset();
      }, 700);
    });
  }
})();
