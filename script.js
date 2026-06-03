document.addEventListener('DOMContentLoaded', () => {
  const fadeElements = document.querySelectorAll('.fade-in');
  fadeElements.forEach((el) => {
    el.style.animationPlayState = 'running';
  });

  const logoWrapper = document.querySelector('.logo-wrapper');

  // Desktop: hover fades in the glow boost and pauses the breathe
  logoWrapper.addEventListener('mouseenter', () => {
    logoWrapper.classList.add('logo--active');
  });
  logoWrapper.addEventListener('mouseleave', () => {
    logoWrapper.classList.remove('logo--active');
  });

  // Mobile: tap toggles the effect briefly
  logoWrapper.addEventListener('touchstart', (e) => {
    e.preventDefault();
    logoWrapper.classList.add('logo--active');
  }, { passive: false });
  logoWrapper.addEventListener('touchend', () => {
    setTimeout(() => logoWrapper.classList.remove('logo--active'), 600);
  });
});
