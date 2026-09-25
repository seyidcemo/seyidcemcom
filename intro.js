// Açılış animasyonu: hiper uzaya sıçrayış → S logosu ışık çizgilerinin ortasında yazılır →
// hiper uzaydan çıkış: çizgiler yavaşlayıp sitenin gerçek yıldızlarına karışırken
// S küçülüp logonun yerine süzülür ve gerçek logoyla yer değiştirir.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('intro-playing')) return;

  const intro = document.getElementById('intro');
  const canvas = intro.querySelector('.intro__warp');
  const bgVideo = document.querySelector('.bg-video');
  const writer = SWriter.create(intro, 'intro__logo');
  const art = writer.svg;

  const JUMP = 1100;     // yıldızların ışık çizgisine dönüşme süresi
  const WRITE_AT = 450;  // sıçrayış başladıktan sonra yazımın başlaması
  const WRITE = 2300;    // yazım süresi
  const HOLD = 300;      // yazı bittikten sonra kısa bekleme
  const MAX_WAIT = 1500; // arka plan videosu için en fazla ek bekleme
  const EXIT = 1200;     // hiper uzaydan çıkış + logonun yerine süzülmesi

  // S'nin kenarlarını zeminden ayıran ince koyu gölge (style.css'teki .intro__logo ile aynı)
  const SHADOW = 'drop-shadow(0 2px 6px rgba(5, 10, 20, 0.7)) drop-shadow(0 0 18px rgba(5, 10, 20, 0.55))';
  // Sitedeki logonun gölgesi (style.css'teki .logo --logo-shadow ile aynı), px cinsinden:
  // [y kayması, bulanıklık, hale]
  const LOGO_SHADOW = [1, 2.5, 7];
  // Süzülme sonunda S, scale(s) ile küçülmüş olur; filtre ölçekten önce uygulandığı için
  // gölgeyi 1/s ile büyütürüz ki ekranda sitedeki logonun gölgesiyle birebir aynı görünsün
  const landedShadow = s => {
    const [y, blur, halo] = LOGO_SHADOW.map(v => v / s);
    return `drop-shadow(0 ${y}px ${blur}px rgba(5, 10, 20, 0.7)) drop-shadow(0 0 ${halo}px rgba(5, 10, 20, 0.55))`;
  };

  // Yenilemede sayfa aşağıda kaldıysa logo ekran dışında olur; intro her zaman en üstten başlar
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  const easeInCubic = k => k * k * k;
  const easeOutCubic = k => 1 - Math.pow(1 - k, 3);

  // ---- Hiper uzay ----
  function createWarp() {
    const ctx = canvas.getContext('2d');
    const K = 0.35;     // z = 1'deki yıldızların ekrana yayılımı
    const TRAIL = 0.07; // hızla orantılı iz uzunluğu
    let w = 0, h = 0, stars = [], glow = null, core = null;
    let speed = 0, ramp = null, last = null, raf = 0;

    const spawn = z => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z, tint: Math.random() });

    function resize() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(650, Math.round((w * h) / 1700));
      while (stars.length < n) stars.push(spawn(0.12 + Math.random() * 0.88));
      stars.length = n;
      // Merkezde marka mavisi, kenarlarda sitenin gece mavisi
      glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.hypot(w, h) / 2);
      glow.addColorStop(0, '#2A4F8C');
      glow.addColorStop(0.45, '#172D57');
      glow.addColorStop(1, '#0B1220');
      // S'nin arkasında koyu, yumuşak bir çekirdek: ışık çizgileri harfin arkasında söner, S öne çıkar
      const r = art.getBoundingClientRect().width * 0.62;
      core = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
      core.addColorStop(0, 'rgba(11, 18, 32, 0.62)');
      core.addColorStop(0.55, 'rgba(11, 18, 32, 0.38)');
      core.addColorStop(1, 'rgba(11, 18, 32, 0)');
    }

    const project = (s, z) => {
      const k = (K * Math.max(w, h) * 0.5) / z;
      return [w / 2 + s.x * k, h / 2 + s.y * k];
    };

    function frame(now) {
      const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      if (ramp) {
        const k = Math.min(1, (now - ramp.start) / ramp.dur);
        speed = ramp.from + (ramp.to - ramp.from) * ramp.ease(k);
        if (k >= 1) ramp = null;
      }

      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';

      for (const s of stars) {
        s.z -= speed * dt;
        let [x, y] = project(s, Math.max(s.z, 0.001));
        if (s.z <= 0.02 || x < -50 || x > w + 50 || y < -50 || y > h + 50) {
          Object.assign(s, spawn(1));
          continue;
        }
        const [tx, ty] = project(s, Math.min(1.3, s.z + speed * TRAIL));
        const near = 1 - s.z;
        const a = Math.min(1, near * 1.5);
        // Açık marka tonundan beyaza
        const r = 143 + (255 - 143) * s.tint, g = 176 + (255 - 176) * s.tint, b = 220 + (255 - 220) * s.tint;
        ctx.strokeStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})`;
        ctx.lineWidth = 0.6 + near * 2;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x + 0.01, y);
        ctx.stroke();
      }
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);
      raf = requestAnimationFrame(frame);
    }

    resize();
    addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);

    return {
      rampTo(to, dur, ease) { ramp = { from: speed, to, start: performance.now(), dur, ease }; },
      stop() { cancelAnimationFrame(raf); removeEventListener('resize', resize); },
    };
  }

  const warp = createWarp();

  // ---- Akış ----
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const loaded = src => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
  const videoReady = () => new Promise(resolve => {
    if (!bgVideo || bgVideo.readyState >= 3) return resolve();
    bgVideo.addEventListener('canplay', resolve, { once: true });
    setTimeout(resolve, MAX_WAIT);
  });

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    warp.stop();
    root.classList.remove('intro-playing', 'intro-warping');
    intro.remove();
  }

  function exit() {
    const logo = document.getElementById('logo');
    const from = art.getBoundingClientRect();
    const to = logo.getBoundingClientRect();
    const s = to.width / from.width;
    warp.rampTo(0.015, EXIT * 0.9, easeOutCubic);
    // Süzülürken ekran dönerse / boyut değişirse hedef eskir: doğrudan gerçek logoya geç
    addEventListener('resize', finish, { once: true });
    intro.classList.add('intro--leaving');
    root.classList.remove('intro-warping'); // arka plan videosu "varış" yakınlaşmasıyla yerine oturur
    return art.animate(
      [
        { transform: 'none', filter: SHADOW },
        // gölge yol boyunca sitedeki logonun gölgesine dönüşür; yer değiştirmede hiçbir şey değişmez
        { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${s})`, filter: landedShadow(s) },
      ],
      { duration: EXIT, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', fill: 'forwards' },
    ).finished;
  }

  // Dokununca / tıklayınca / tuşa basınca yazımı tamamla ve hemen çık
  let skip = false;
  const onSkip = () => { skip = true; };
  intro.addEventListener('click', onSkip);
  addEventListener('keydown', onSkip, { once: true });

  warp.rampTo(1.5, JUMP, easeInCubic);

  Promise.race([
    Promise.all([loaded('logo.png'), loaded('logo-a.png'), wait(WRITE_AT)]),
    wait(3000).then(() => { throw new Error('logo yüklenemedi'); }),
  ])
    .then(() => writer.play(WRITE, () => skip))
    .then(() => skip ? null : Promise.all([wait(HOLD), videoReady()]))
    .then(exit)
    .catch(() => {})
    .finally(finish);
})();
