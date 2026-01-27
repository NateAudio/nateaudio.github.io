/*
  js/main.js — Visualizer and UI glue

  Key behaviors:
  - Renders an idle background via `drawStaticSky()` and an audio-driven scene via `drawScene()`.
  - Canvas is sized using `window.devicePixelRatio` in `resizeCanvas()` to preserve Retina fidelity.
  - Reactive page glows (nav and hero) are driven by CSS custom properties set on `:root` to minimize per-frame DOM writes:
      `--nav-text-shadow`, `--nav-translate`, `--hero-text-shadow`, `--hero-translate`.
  - Includes a small `CanvasRenderingContext2D.roundRect` polyfill for compatibility.
  - The idle and audio-driven animation loops are mutually exclusive: the idle loop is cancelled when audio playback starts and resumed on stop.
*/

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");
  const noteHotspot = document.querySelector(".note-hotspot");
  const navLogo = document.querySelector('.nav-logo');
  const heroName = document.querySelector('.hero-name');
  const accentGraphic = document.querySelector('.accent-graphic');
  const audio = document.getElementById("chiptune-audio");
  // ----- Config / state -----
  const CONFIG = {
    STAR_COUNT: 60,
    NOTE_COUNT: 18,
    NOTE_FONT: "14px system-ui, -apple-system, sans-serif",
    FFT_SAMPLE_LOW: 6,
    FFT_SAMPLE_AVG: 64
  };

  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let animationId = null;
  let staticAnimationId = null;
  let isPlaying = false;

  // Polyfill for CanvasRenderingContext2D.roundRect (small helper used when drawing bands)
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
      this.beginPath();
      this.moveTo(x + r.tl, y);
      this.lineTo(x + w - r.tr, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
      this.lineTo(x + w, y + h - r.br);
      this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
      this.lineTo(x + r.bl, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
      this.lineTo(x, y + r.tl);
      this.quadraticCurveTo(x, y, x + r.tl, y);
      this.closePath();
    };
  }

  // Helper to update CSS variables on :root with minimal DOM traffic
  const rootStyle = document.documentElement.style;
  function setRootVar(name, value) {
    rootStyle.setProperty(name, value);
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    initSky();
  });

  resizeCanvas();

  // Collections used by both the idle and audio-driven renderers
  const stars = [];
  const notes = [];
  const noteChars = ["♪", "♫", "♩", "♬"];

  function initSky() {
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    stars.length = 0;
    notes.length = 0;

    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * Math.PI * 2
      });
    }

    for (let i = 0; i < CONFIG.NOTE_COUNT; i++) {
      notes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        char: noteChars[Math.floor(Math.random() * noteChars.length)],
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4
      });
    }
  }

  initSky();

  function drawStaticSky() {
    /**
     * drawStaticSky — idle background loop
     * Renders a radial background, twinkling stars, and floating note glyphs.
     * This loop runs while no audio is playing; it is canceled when the visualizer starts.
     */
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, width, height);

    const bgGrad = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, height * 1.2);
    bgGrad.addColorStop(0, "#151530");
    bgGrad.addColorStop(0.55, "#050510");
    bgGrad.addColorStop(1, "#020208");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const time = performance.now() / 1000;

    stars.forEach(s => {
      const tw = (Math.sin(time * 2 + s.twinkle) + 1) / 2;
      const alpha = 0.3 + tw * 0.7;
      ctx.fillStyle = `rgba(245,245,247,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.font = CONFIG.NOTE_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    notes.forEach(n => {
      const wobble = Math.sin(time * 2 + n.phase) * 4;
      ctx.fillStyle = "rgba(245,245,247,0.8)";
      ctx.shadowColor = "rgba(60,244,255,0.8)";
      ctx.shadowBlur = 8;
      ctx.fillText(n.char, n.x + wobble, n.y);
      ctx.shadowBlur = 0;
    });

    staticAnimationId = requestAnimationFrame(drawStaticSky);
  }

  // Start with the idle sky animation; when audio plays we cancel this.
  drawStaticSky();

  function setupAudioAnalyser() {
    // Create or re-use an AudioContext and hook the HTMLAudioElement up to an AnalyserNode
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  function drawScene() {
    /**
     * drawScene — audio-driven render loop
     * Samples frequency data from the AnalyserNode, computes simple band averages
     * and uses them to drive the sun bands, rings, and reactive UI glows.
     */
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, width, height);

    const bgGrad = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, height * 1.2);
    bgGrad.addColorStop(0, "#151530");
    bgGrad.addColorStop(0.55, "#050510");
    bgGrad.addColorStop(1, "#020208");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    let bass = 0;
    let avg = 0;

    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);

      let lowSum = 0;
      for (let i = 0; i < CONFIG.FFT_SAMPLE_LOW; i++) lowSum += dataArray[i];
      bass = lowSum / CONFIG.FFT_SAMPLE_LOW;

      let total = 0;
      for (let i = 0; i < CONFIG.FFT_SAMPLE_AVG; i++) total += dataArray[i];
      avg = total / CONFIG.FFT_SAMPLE_AVG;
    }

    const bassNorm = bass / 255;
    const avgNorm = avg / 255;

    // Reactive logo glow while audio is playing: update inline text-shadow
    if (navLogo && analyser && dataArray) {
      // combine average and bass for a readable intensity
      const intensity = Math.min(1, avgNorm * 1.1 + bassNorm * 0.8);
      const cyanGlow = 0.18 + intensity * 0.9; // alpha for cyan shadow
      const magentaGlow = 0.06 + intensity * 0.8; // alpha for magenta shadow
      const blurBase = 6 + intensity * 28;
      const navShadow = `0 0 ${Math.round(blurBase)}px rgba(60,244,255,${cyanGlow}), 0 0 ${Math.round(blurBase/1.6)}px rgba(255,79,216,${magentaGlow})`;
      setRootVar('--nav-text-shadow', navShadow);
      setRootVar('--nav-translate', `${-Math.min(4, intensity * 6)}px`);
      // ensure `.nav-logo.playing` is applied so CSS vars are used
      navLogo.classList.add('playing');
    }

    // Reactive hero title glow (stronger) — amplify intensity so reaction is visible
    if (heroName && analyser && dataArray) {
      const intensity = Math.min(1.6, avgNorm * 2.2 + bassNorm * 1.8);
      const scaled = Math.min(1, intensity);
      const cyanA = 0.28 + scaled * 1.0;
      const magA = 0.12 + scaled * 1.0;
      const blur = 14 + scaled * 60;
      const heroShadow = `0 0 ${Math.round(blur)}px rgba(60,244,255,${cyanA}), 0 0 ${Math.round(blur/1.6)}px rgba(255,79,216,${magA})`;
      setRootVar('--hero-text-shadow', heroShadow);
      setRootVar('--hero-translate', `${-Math.min(10, scaled * 12)}px`);
      heroName.classList.add('playing');
    }

    const sunX = width * 0.5;
    const sunY = height * 0.5; // center the sun vertically in the circular graphic
    const baseSunR = height * 0.22;
    const sunR = baseSunR * (1 + bassNorm * 0.15);

    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
    sunGrad.addColorStop(0, "#ffb36a");
    sunGrad.addColorStop(0.4, "#ff6f9b");
    sunGrad.addColorStop(0.7, "#ff4fd8");
    sunGrad.addColorStop(1, "rgba(255,79,216,0)");
    ctx.fillStyle = sunGrad;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Replace the previous mountain silhouette + equalizer bars with
    // layered horizontal bands across the sun. Bands respond to audio
    // energy (bass/average) to pulse and shift widths, creating a
    // stylized retro-sun effect similar to the reference.
    const time = performance.now() / 1000;
    const bandCount = 7;
    const bandBaseHeight = sunR * 0.14;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < bandCount; i++) {
      const t = (i / (bandCount - 1)) - 0.5; // -0.5 .. 0.5
      // vertical offset spreads bands across the sun's radius
      const y = sunY + t * sunR * 0.9 + Math.sin(time * 1.2 + i) * (avgNorm * 6);
      // width grows toward the center; audio makes center bands breathe
      const centerFactor = 1 - Math.abs(t);
      const widthFactor = 1.2 * centerFactor + 0.3 * (avgNorm + bassNorm);
      const bandW = sunR * widthFactor * 2.2;
      const bandH = bandBaseHeight * (0.6 + centerFactor * 0.9);

      const bandGrad = ctx.createLinearGradient(sunX - bandW / 2, y, sunX + bandW / 2, y);
      bandGrad.addColorStop(0, 'rgba(60,244,255,' + (0.14 + centerFactor * 0.12) + ')');
      bandGrad.addColorStop(0.5, 'rgba(255,179,106,' + (0.18 + avgNorm * 0.18) + ')');
      bandGrad.addColorStop(1, 'rgba(255,79,216,' + (0.12 + centerFactor * 0.12) + ')');

      ctx.fillStyle = bandGrad;
      ctx.shadowColor = 'rgba(255,79,216,' + (0.06 + centerFactor * 0.06) + ')';
      ctx.shadowBlur = 18 * (0.6 + centerFactor * 0.8);
      ctx.beginPath();
      ctx.roundRect(sunX - bandW / 2, y - bandH / 2, bandW, bandH, bandH / 2);
      ctx.fill();
    }
    ctx.restore();

    // soft concentric rings for more depth
    for (let r = 1; r <= 3; r++) {
      const ringR = sunR * (1 + r * 0.14 + bassNorm * 0.06);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,120,180,' + (0.04 + r * 0.02 + avgNorm * 0.02) + ')';
      ctx.lineWidth = 2 + r;
      ctx.shadowColor = 'rgba(60,244,255,0.03)';
      ctx.shadowBlur = 12 * r;
      ctx.beginPath();
      ctx.arc(sunX, sunY, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // (Removed staff lines - notes now float across the full graphic.)

    stars.forEach(s => {
      const tw = (Math.sin(time * 2 + s.twinkle) + 1) / 2;
      const alpha = 0.3 + tw * 0.7 * (0.4 + avgNorm * 0.6);
      ctx.fillStyle = `rgba(245,245,247,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.font = "14px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    notes.forEach(n => {
      n.y -= n.speed * (0.5 + avgNorm * 1.5);
      if (n.y < -20) {
        // recycle from below the canvas so notes traverse the full area
        n.y = height + Math.random() * 40;
        n.x = Math.random() * width;
      }
      const wobble = Math.sin(time * 2 + n.phase) * 4;
      ctx.fillStyle = "rgba(245,245,247,0.8)";
      ctx.shadowColor = "rgba(60,244,255,0.8)";
      ctx.shadowBlur = 8;
      ctx.fillText(n.char, n.x + wobble, n.y);
      ctx.shadowBlur = 0;
    });

    animationId = requestAnimationFrame(drawScene);
  }

  function startVisualizer() {
    canvas.style.opacity = "1";
    if (accentGraphic) accentGraphic.classList.add('playing');
    if (noteHotspot) noteHotspot.classList.add('playing');
    if (heroName) heroName.classList.add('playing');
    if (navLogo) navLogo.classList.add('playing');
    // Stop the idle sky loop to avoid rendering twice.
    if (staticAnimationId) {
      cancelAnimationFrame(staticAnimationId);
      staticAnimationId = null;
    }
    if (!animationId) {
      drawScene();
    }
  }

  function stopVisualizer() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    canvas.style.opacity = "0";
    if (accentGraphic) accentGraphic.classList.remove('playing');
    if (noteHotspot) noteHotspot.classList.remove('playing');
    if (navLogo) {
      // clear reactive CSS vars and class so CSS idle animation returns
      rootStyle.removeProperty('--nav-text-shadow');
      rootStyle.removeProperty('--nav-translate');
      navLogo.classList.remove('playing');
    }
    if (heroName) {
      rootStyle.removeProperty('--hero-text-shadow');
      rootStyle.removeProperty('--hero-translate');
      heroName.classList.remove('playing');
    }
    // resume the idle sky loop for the static background
    if (!staticAnimationId) drawStaticSky();
  }

  // Clean up audio resources if the page is unloaded to avoid dangling contexts
  window.addEventListener('beforeunload', () => {
    if (audioContext && typeof audioContext.close === 'function') {
      audioContext.close().catch(() => {});
    }
  });

  if (noteHotspot && audio) {
    noteHotspot.addEventListener("click", async () => {
      if (!audioContext) {
        setupAudioAnalyser();
      }

      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (!isPlaying) {
        audio.currentTime = 0;
        audio.play().catch((err) => {
          console.error('audio.play() failed:', err);
          // Reveal native controls as a fallback so the user can start playback manually
          try {
            audio.controls = true;
          } catch (e) {
            console.warn('Unable to enable audio.controls fallback', e);
          }
        });
        isPlaying = true;
        startVisualizer();
      } else {
        audio.pause();
        isPlaying = false;
        stopVisualizer();
      }
    });

    audio.addEventListener("ended", () => {
      isPlaying = false;
      stopVisualizer();
    });
  }
});
