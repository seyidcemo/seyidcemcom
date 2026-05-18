// Ensure fade-in animations replay correctly if page is loaded from cache
document.addEventListener('DOMContentLoaded', () => {
  const fadeElements = document.querySelectorAll('.fade-in');
  fadeElements.forEach((el) => {
    el.style.animationPlayState = 'running';
  });
});
