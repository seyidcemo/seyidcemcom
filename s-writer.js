// S logosunu kalemle yazan ortak yardımcı — intro ve logoya tıklayınca yeniden yazım kullanır.
//
// Kalem iki vuruşta ilerler: A = kanca, üst kavis, çapraz iniş, alt halka;
// B = halkadan yükselip kesişmeden geçen kuyruk. logo-a.png, kuyruğa ait pikselleri
// çıkarılmış logodur; kalem A vuruşunda kesişmeden geçerken kuyruğun parçaları erkenden
// görünmesin diye A katmanı ondan, B katmanı asıl logodan açılır.
window.SWriter = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const PATH_A = 'M 612 405 C 618 399, 637 382, 648 370 C 659 358, 669 343, 677 330 C 685 317, 692 301, 696 290 C 700 279, 704 271, 702 262 C 700 253, 696 241, 684 234 C 672 227, 651 221, 630 222 C 609 223, 579 230, 560 238 C 541 246, 530 256, 514 268 C 498 280, 477 296, 463 310 C 449 324, 440 337, 432 350 C 424 363, 418 378, 415 390 C 412 402, 411 410, 413 420 C 415 430, 420 440, 428 452 C 436 464, 448 477, 462 490 C 476 503, 496 517, 512 530 C 528 543, 546 558, 560 570 C 574 582, 590 593, 598 605 C 606 617, 610 628, 611 640 C 612 652, 609 663, 605 675 C 601 687, 593 698, 585 710 C 577 722, 566 734, 555 745 C 544 756, 532 768, 520 778 C 508 788, 495 798, 480 805 C 465 812, 447 818, 430 818 C 413 818, 390 813, 378 808 C 366 803, 360 794, 360 786 C 360 778, 369 771, 376 762 C 383 753, 389 742, 402 730 C 415 718, 437 703, 455 690';
  const PATH_B = 'M 455 690 C 473 677, 491 663, 510 650 C 529 637, 548 622, 570 610 C 592 598, 615 586, 640 575 C 665 564, 708 548, 722 543';
  const PEN_WIDTH = 84; // harfin en kalın yerini örtecek kalem genişliği (1080'lik görselde)
  const CAP = 100;      // yuvarlak uç başlangıçta nokta gibi görünmesin

  // Zaman → yol ilerlemesi. Logodan ölçüldü: kalem açtığı yeni mürekkep miktarına göre
  // hızlanıp yavaşlar, zaten yazılmış yerlerden (kuyruğun kesişmeden geçtiği an) hızla geçer.
  const PACE = [0,0.0074,0.0163,0.0255,0.0342,0.0425,0.0506,0.0584,0.0661,0.0736,0.0811,0.0893,0.0992,0.1096,0.1195,0.1286,0.1373,0.1461,0.1548,0.1634,0.1719,0.1804,0.189,0.1974,0.2056,0.2136,0.2213,0.2288,0.2362,0.2436,0.251,0.2583,0.2657,0.2731,0.2804,0.2878,0.2952,0.3025,0.3099,0.3172,0.3246,0.332,0.3393,0.3467,0.3541,0.3614,0.3688,0.3762,0.3835,0.3909,0.3983,0.4056,0.413,0.4204,0.4277,0.4351,0.4424,0.4498,0.4572,0.4645,0.4719,0.4793,0.4866,0.494,0.5014,0.5087,0.5161,0.5235,0.5308,0.5382,0.5456,0.5529,0.5603,0.5677,0.575,0.5824,0.5897,0.5971,0.6045,0.6118,0.6192,0.6266,0.6341,0.642,0.6501,0.6585,0.6672,0.6758,0.6839,0.6912,0.6986,0.706,0.7133,0.722,0.7322,0.7407,0.7481,0.7555,0.7629,0.7705,0.7781,0.7856,0.7929,0.8004,0.8098,0.8172,0.8245,0.8319,0.8395,0.8471,0.855,0.8632,0.8753,0.9071,0.9211,0.9304,0.9401,0.9501,0.961,0.9745,1];
  const pace = u => {
    const f = Math.min(1, Math.max(0, u)) * (PACE.length - 1), i = Math.floor(f);
    return i >= PACE.length - 1 ? 1 : PACE[i] + (PACE[i + 1] - PACE[i]) * (f - i);
  };
  // Yumuşak başlangıç ve bitiş; bitişte kalem tamamen durmaz, kuyruk akarak biter
  const ease = t => pace(0.5 * t + 0.25 * (1 - Math.cos(Math.PI * t)));

  let uid = 0;

  function create(parent, className) {
    const id = `swriter-${uid++}`;
    const mask = (key, d) =>
      `<mask id="${id}-${key}" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1080">` +
      `<path d="${d}" fill="none" stroke="#fff" stroke-width="${PEN_WIDTH}" stroke-linecap="round" stroke-linejoin="round" /></mask>`;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1080 1080');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML =
      `<defs>${mask('a', PATH_A)}${mask('b', PATH_B)}</defs>` +
      `<image href="logo-a.png" width="1080" height="1080" mask="url(#${id}-a)" />` +
      `<image href="logo.png" width="1080" height="1080" mask="url(#${id}-b)" />`;
    parent.appendChild(svg);

    const [penA, penB] = svg.querySelectorAll('mask path');
    const LA = penA.getTotalLength(), LB = penB.getTotalLength(), LEN = LA + LB;
    penA.setAttribute('stroke-dasharray', `${LA} ${LA + 2 * CAP}`);
    penB.setAttribute('stroke-dasharray', `${LB} ${LB + 2 * CAP}`);

    function setProgress(p) {
      const s = p * LEN;
      const a = Math.min(s, LA) / LA, b = Math.max(0, s - LA) / LB;
      penA.setAttribute('stroke-dashoffset', (LA + CAP) * (1 - a));
      penB.setAttribute('stroke-dashoffset', (LB + CAP) * (1 - b));
    }
    setProgress(0);

    // duration ms içinde baştan sona yazar; isSkipped() true dönerse hemen tamamlar
    function play(duration, isSkipped = () => false) {
      return new Promise(resolve => {
        let start = null;
        const frame = now => {
          if (start === null) start = now;
          const t = isSkipped() ? 1 : Math.min(1, (now - start) / duration);
          setProgress(ease(t));
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
    }

    return { svg, setProgress, play };
  }

  return { create };
})();
