document.addEventListener('DOMContentLoaded', () => {
  const logoWrapper = document.querySelector('.logo-wrapper');
  const logo = document.getElementById('logo');

  // Click / tap: S rewrites itself in place, once per tap
  const REWRITE = 1700;
  let writer = null;
  let writing = false;
  const rewrite = () => {
    const root = document.documentElement;
    if (writing || root.classList.contains('intro-playing')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    writing = true;
    writer ??= SWriter.create(logo, 'logo__write');
    writer.setProgress(0);
    logo.classList.add('logo--writing');
    writer.play(REWRITE).then(() => {
      logo.classList.remove('logo--writing');
      writing = false;
    });
  };
  logo.addEventListener('click', rewrite);

  // Desktop: hover fades in the glow boost and pauses the breathe
  logoWrapper.addEventListener('mouseenter', () => {
    logoWrapper.classList.add('logo--active');
  });
  logoWrapper.addEventListener('mouseleave', () => {
    logoWrapper.classList.remove('logo--active');
  });

  // Mobile: tap toggles the effect briefly
  // (preventDefault suppresses the synthetic click, so trigger the rewrite here)
  logoWrapper.addEventListener('touchstart', (e) => {
    e.preventDefault();
    logoWrapper.classList.add('logo--active');
    if (logo.contains(e.target)) rewrite();
  }, { passive: false });
  logoWrapper.addEventListener('touchend', () => {
    setTimeout(() => logoWrapper.classList.remove('logo--active'), 600);
  });
});
