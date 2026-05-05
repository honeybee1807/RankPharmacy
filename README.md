# Rank Pharmacy — Website

Multi-page static site for Rank Pharmacy, Estcourt.

## File structure

```
index.html       Home
about.html       About / owner story
services.html    Services grid
products.html    Product categories
contact.html     Contact form + map
style.css        All styles (single shared file)
three-bg.js      Three.js light 3D background
script.js        Reveal-on-scroll, mobile menu, form handler
```

## Setup

No build step. Serve the folder over any static HTTP server:

```
npx serve .
# or
python3 -m http.server 8000
```

Then open http://localhost:8000/.

## CDN dependencies

Loaded via `<script>` tags in each page:

- Three.js 0.160.0
- GSAP 3.12.5 + ScrollTrigger
- Google Fonts: Manrope, Fraunces, JetBrains Mono

## EmailJS (contact form)

The contact form on `contact.html` is wired but stubbed. To go live:

1. Sign up at https://www.emailjs.com/
2. Add EmailJS to `contact.html` head:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
   ```
3. In `script.js`, replace the `setTimeout` stub inside the form submit handler with:
   ```js
   emailjs.init('YOUR_PUBLIC_KEY');
   emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', form)
     .then(() => { status.textContent = '✓ Sent.'; form.reset(); })
     .catch(err => { status.textContent = 'Error: ' + err.text; });
   ```

## Google Maps

`contact.html` ships with a hand-drawn SVG map placeholder. Replace the `.map-wrap` block with an iframe:
```html
<iframe src="https://www.google.com/maps/embed?pb=..." style="border:0;width:100%;height:100%;" allowfullscreen loading="lazy"></iframe>
```

## Performance tips

- Three.js auto-detects mobile and drops particle counts (220 vs 600).
- `prefers-reduced-motion` is respected — animation halts.
- Add `defer` to script tags if first-paint becomes a concern.
- For production, self-host fonts and Three/GSAP for offline + CSP control.

## Deployment

Drop the folder on Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any static host. No environment variables required.

## Brand

- Owner: Goolam Rassool Haroon Olideen, registered pharmacist
- Address: 158 Alexandra Street, Estcourt 3310, KZN
- WhatsApp: 072 132 4385
- Phone: 036 352 5201
- Email: rank51933@gmail.com
