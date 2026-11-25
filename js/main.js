/*
  Nate Audio - Hero Atmosphere 2.0 v4

  V4 keeps the V3 musical timing but adds:
  - depth tiers among idle notes,
  - barely-there glitter,
  - a staff that fades into existence at the trigger,
  - moving notes that travel along the staff,
  - a wandering far end so the ribbon never feels pinned,
  - audio-reactive synthwave light bleeding in from the viewport edges.
*/

document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".section-hero");
  const canvas = document.getElementById("visualizer");
  const ctx = canvas?.getContext("2d");
  const trigger = document.querySelector(".note-hotspot");
  const heroName = document.querySelector(".hero-name");
  const navLogo = document.querySelector(".nav-logo");
  const audio = document.getElementById("chiptune-audio");

  if (!hero || !canvas || !ctx || !trigger || !audio) return;

  const rootStyle = document.documentElement.style;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const noteCharacters = ["♪", "♫", "♩", "♬"];

  const idleNotes = [];
  const glitter = [];
  const accents = [];
  const staffNotes = [];

  let audioContext = null;
  let analyser = null;
  let sourceNode = null;
  let frequencyData = null;
  let previousSpectrum = null;

  let playing = false;
  // Master opacity for the music-reactive layers. It rises when playback
  // begins and decays gently after pause/end instead of snapping off.
  let visualMix = 0;
  let lastFrame = performance.now();
  let reveal = 0;
  let pulse = 0;
  let previousEnergy = 0;
  let lastAccent = 0;
  let playbackStart = 0;

  const heroSize = () => ({ width: hero.clientWidth, height: hero.clientHeight });

  function resizeCanvas() {
    const { width, height } = heroSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    seedScene();
  }

  function seedScene() {
    const { width, height } = heroSize();
    const mobile = width < 768;
    const count = mobile ? 8 : 10;

    idleNotes.length = 0;
    glitter.length = 0;
    staffNotes.length = 0;

    // Explicit depth distribution: most notes far away, a few mid-depth,
    // and just one or two that can visually compete with the trigger.
    const depths = [];
    for (let index = 0; index < count; index += 1) {
      if (index < 2) depths.push(0.88 + Math.random() * 0.10);       // foreground
      else if (index < 5) depths.push(0.56 + Math.random() * 0.18); // middle
      else depths.push(0.24 + Math.random() * 0.22);                // distant
    }

    // Shuffle so foreground/middle notes land in random places each load.
    depths.sort(() => Math.random() - 0.5);

    depths.forEach((depth) => {
      idleNotes.push({
        x: width * (mobile ? 0.10 : 0.52) + Math.random() * width * (mobile ? 0.80 : 0.43),
        y: height * (0.20 + Math.random() * 0.62),
        character: noteCharacters[Math.floor(Math.random() * noteCharacters.length)],
        depth,
        size: (mobile ? 8.5 : 9) + depth * (mobile ? 12 : 15),
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * (1 + depth * 2.1),
        vy: -(0.9 + depth * 2.8 + Math.random() * 0.9),
        cyan: Math.random() > 0.5
      });
    });

    const glitterCount = mobile ? 24 : 42;
    for (let index = 0; index < glitterCount; index += 1) {
      glitter.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.25 + Math.random() * 0.65,
        phase: Math.random() * Math.PI * 2,
        tint: Math.random()
      });
    }

    // Notes that travel along the staff. Each begins at a different phase.
    for (let index = 0; index < (mobile ? 3 : 5); index += 1) {
      staffNotes.push({
        progress: index / (mobile ? 3 : 5),
        speed: 0.035 + Math.random() * 0.018,
        character: noteCharacters[index % noteCharacters.length],
        cyan: index % 2 === 0,
        lane: (index % 5) - 2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function setupAudio() {
    if (audioContext) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    previousSpectrum = new Uint8Array(analyser.frequencyBinCount);

    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  function averageBand(start, end) {
    let sum = 0;
    for (let i = start; i < end; i += 1) sum += frequencyData[i] || 0;
    return sum / Math.max(1, end - start) / 255;
  }

  function readMusic() {
    if (!playing || !analyser) return { bass: 0, mid: 0, high: 0, avg: 0, onset: 0 };

    analyser.getByteFrequencyData(frequencyData);

    const bass = averageBand(1, 9);
    const mid = averageBand(9, 38);
    const high = averageBand(38, 86);
    const avg = (bass + mid + high) / 3;

    let positiveChange = 0;
    for (let i = 1; i < 86; i += 1) {
      const difference = frequencyData[i] - previousSpectrum[i];
      if (difference > 0) positiveChange += difference;
      previousSpectrum[i] = frequencyData[i];
    }

    const spectralFlux = Math.min(1, positiveChange / 2200);
    const energyJump = Math.max(0, avg - previousEnergy);
    previousEnergy = avg;

    const onset = Math.min(1, spectralFlux * 0.75 + energyJump * 4.5 + bass * 0.18);
    return { bass, mid, high, avg, onset };
  }

  function triggerCenter() {
    const triggerRect = trigger.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    return {
      x: triggerRect.left - heroRect.left + triggerRect.width / 2,
      y: triggerRect.top - heroRect.top + triggerRect.height / 2
    };
  }

  function cubicBezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return {
      x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
      y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y
    };
  }

  function pathGeometry(width, height, time, music) {
    const start = triggerCenter();
    const mobile = width < 768;

    // Several slow independent movements keep the far end alive. Stronger
    // music adds a small additional wander without making the route chaotic.
    const live = music.avg * 0.04 + pulse * 0.025;

    if (mobile) {
      return [
        start,
        { x: width * (0.72 + Math.sin(time * 0.18) * 0.10), y: height * (0.56 + Math.cos(time * 0.15) * 0.06) },
        { x: width * (0.24 + Math.sin(time * 0.11 + 1.3) * 0.12), y: height * (0.42 + Math.sin(time * 0.16) * 0.08) },
        { x: -width * 0.12, y: height * (0.20 + Math.sin(time * 0.13) * (0.09 + live)) }
      ];
    }

    return [
      start,
      { x: width * (0.78 + Math.sin(time * 0.17) * 0.08), y: height * (0.52 + Math.cos(time * 0.14) * (0.07 + live)) },
      { x: width * (0.38 + Math.sin(time * 0.10 + 1.1) * 0.12), y: height * (0.29 + Math.sin(time * 0.15) * (0.08 + live)) },
      { x: -width * 0.12, y: height * (0.37 + Math.sin(time * 0.12 + 2.0) * (0.12 + live)) }
    ];
  }

  function pathTangent(points, t) {
    const before = cubicBezier(...points, Math.max(0, t - 0.005));
    const after = cubicBezier(...points, Math.min(1, t + 0.005));
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length, normalX: -dy / length, normalY: dx / length };
  }

  function drawGlitter(music, time) {
    glitter.forEach((particle) => {
      const twinkle = (Math.sin(time * (0.55 + particle.tint * 0.35) + particle.phase) + 1) / 2;
      const attackFlash = playing ? pulse * (0.04 + particle.tint * 0.04) : 0;
      const alpha = 0.012 + twinkle * 0.045 + attackFlash;
      const color = particle.tint < .45 ? [60,244,255] : particle.tint < .78 ? [140,92,255] : [255,79,216];

      ctx.fillStyle = `rgba(${color.join(",")},${alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius + pulse * 0.25, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawIdleNotes(width, height, music, time, delta) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    idleNotes.forEach((note) => {
      const sustained = playing ? 1.15 + music.avg * 1.9 : 0.42;
      const impulse = playing ? 1 + pulse * 1.8 : 1;

      if (!reducedMotion) {
        note.x += note.vx * delta * sustained * impulse;
        note.y += note.vy * delta * sustained * impulse;
        note.x += Math.sin(time * 0.42 + note.phase) * note.depth * 2.2 * delta;
      }

      if (note.y < -35 || note.x < -45 || note.x > width + 45) {
        note.y = height + 30;
        note.x = width * (width < 768 ? .10 : .52) + Math.random() * width * (width < 768 ? .80 : .43);
      }

      const alpha = Math.min(.80, .10 + note.depth * .50 + (playing ? music.avg * .13 + pulse * .06 : 0));
      const color = note.cyan ? [60,244,255] : [255,79,216];
      const wobble = Math.sin(time * .68 + note.phase) * (2 + note.depth * 2 + music.mid * 3 + pulse * 1.5);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${note.size}px system-ui, sans-serif`;
      ctx.fillStyle = `rgb(${color.join(",")})`;
      ctx.shadowColor = `rgba(${color.join(",")},${.16 + note.depth * .24})`;
      ctx.shadowBlur = 1 + note.depth * 7 + pulse * 2;
      ctx.fillText(note.character, note.x + wobble, note.y);
      ctx.restore();
    });
  }

  function endpointFade(t) {
    // The first ~12% softly materializes from the trigger instead of showing
    // five vibrating cut-off line ends. The last ~16% fades into distance.
    const fadeIn = Math.min(1, Math.max(0, (t - 0.02) / 0.12));
    const fadeOut = Math.min(1, Math.max(0, (1 - t) / 0.16));
    return fadeIn * fadeOut;
  }

  function drawStaff(width, height, music, time) {
    if (visualMix < .005 || reveal < .005) return;

    const points = pathGeometry(width, height, time, music);
    const lineBaseSpacing = width < 768 ? 5 : 7;
    const spacing = lineBaseSpacing * (1 + pulse * .38);
    const revealEnd = Math.min(1, reveal);
    const segments = 130;

    ctx.save();
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "lighter";

    for (let line = 0; line < 5; line += 1) {
      const lineOffset = (line - 2) * spacing;
      const color = line % 2 === 0 ? [60,244,255] : [255,79,216];

      // Draw as short connected pieces so opacity can fade at the trigger and
      // distant edge. This avoids the visibly dancing raw endpoints from V3.
      for (let segment = 1; segment <= Math.floor(segments * revealEnd); segment += 1) {
        const t0 = (segment - 1) / segments;
        const t1 = segment / segments;
        const p0 = cubicBezier(...points, t0);
        const p1 = cubicBezier(...points, t1);
        const tangent0 = pathTangent(points, t0);
        const tangent1 = pathTangent(points, t1);

        const central0 = Math.sin(Math.PI * t0);
        const central1 = Math.sin(Math.PI * t1);
        const wave0 = Math.sin(t0 * 15 - time * (2.25 + music.mid * 1.7) + line * .35) * central0 * (4 + music.bass * 4 + pulse * 7);
        const wave1 = Math.sin(t1 * 15 - time * (2.25 + music.mid * 1.7) + line * .35) * central1 * (4 + music.bass * 4 + pulse * 7);

        const x0 = p0.x + tangent0.normalX * lineOffset;
        const y0 = p0.y + tangent0.normalY * lineOffset + wave0;
        const x1 = p1.x + tangent1.normalX * lineOffset;
        const y1 = p1.y + tangent1.normalY * lineOffset + wave1;

        const fade = Math.min(endpointFade(t0), endpointFade(t1));
        const alpha = fade * (.07 + music.avg * .10 + pulse * .045);
        if (alpha <= .002) continue;

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = `rgba(${color.join(",")},${alpha})`;
        ctx.lineWidth = .75 + music.high * .55 + pulse * .22;
        ctx.shadowColor = `rgba(${color.join(",")},${fade * (.15 + music.avg * .12)})`;
        ctx.shadowBlur = 3 + music.avg * 5 + pulse * 3;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function drawStaffNotes(width, height, music, time, delta) {
    if (visualMix < .005 || reveal < .18) return;

    const points = pathGeometry(width, height, time, music);
    const spacing = width < 768 ? 5 : 7;

    staffNotes.forEach((note) => {
      const speedBoost = 1 + music.mid * 1.5 + pulse * 2.2;
      if (!reducedMotion) note.progress += note.speed * delta * speedBoost;
      if (note.progress > .94) note.progress = .10 + Math.random() * .10;

      // Do not draw a staff note before the revealed ribbon has reached it.
      if (note.progress > reveal || note.progress < .09) return;

      const point = cubicBezier(...points, note.progress);
      const tangent = pathTangent(points, note.progress);
      const lineOffset = note.lane * spacing;
      const x = point.x + tangent.normalX * lineOffset;
      const y = point.y + tangent.normalY * lineOffset;
      const color = note.cyan ? [60,244,255] : [255,79,216];
      const fade = endpointFade(note.progress);
      const size = 11 + music.mid * 4 + pulse * 3;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(tangent.y, tangent.x) * .16);
      ctx.globalAlpha = fade * (.46 + music.avg * .18 + pulse * .16);
      ctx.font = `${size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgb(${color.join(",")})`;
      ctx.shadowColor = `rgba(${color.join(",")},${.45 + pulse * .15})`;
      ctx.shadowBlur = 5 + pulse * 5;
      ctx.fillText(note.character, 0, 0);
      ctx.restore();
    });
  }

  function spawnAccent(music, time) {
    if (!playing) return;
    const now = performance.now();

    if (music.onset > .34 && now - lastAccent > 120) {
      lastAccent = now;
      const points = pathGeometry(hero.clientWidth, hero.clientHeight, time, music);
      const t = .15 + Math.random() * .68;
      const point = cubicBezier(...points, t);
      accents.push({ x: point.x, y: point.y, age: 0, life: .28 + Math.random() * .22, radius: 2 + music.onset * 5, cyan: Math.random() > .45 });
    }
  }

  function drawAccents(delta) {
    for (let i = accents.length - 1; i >= 0; i -= 1) {
      const accent = accents[i];
      accent.age += delta;
      if (accent.age >= accent.life) { accents.splice(i,1); continue; }

      const progress = accent.age / accent.life;
      const alpha = Math.sin(Math.PI * progress) * .45;
      const radius = accent.radius + progress * 10;
      const color = accent.cyan ? [60,244,255] : [255,79,216];
      const gradient = ctx.createRadialGradient(accent.x,accent.y,0,accent.x,accent.y,radius);
      gradient.addColorStop(0, `rgba(245,245,255,${alpha})`);
      gradient.addColorStop(.25, `rgba(${color.join(",")},${alpha*.5})`);
      gradient.addColorStop(1, `rgba(${color.join(",")},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(accent.x-radius, accent.y-radius, radius*2, radius*2);
    }
  }

  function drawEdgeGlow(width, height, music, time) {
    if (visualMix < .005) return;

    const kick = Math.min(1, music.bass * .75 + pulse * .9);
    const shimmer = Math.min(1, music.high * .55 + pulse * .45);
    const middle = Math.min(1, music.mid * .65 + pulse * .5);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const glows = [
      { x: width*.16, y: height*1.02, radius: height*.42, color: [255,154,90], strength: .032 + kick*.088 },
      { x: width*.39, y: height*1.03, radius: height*.46, color: [255,79,216], strength: .028 + middle*.076 },
      { x: width*.72, y: height*1.02, radius: height*.46, color: [140,92,255], strength: .028 + middle*.070 },
      { x: width*.91, y: height*.95, radius: height*.38, color: [60,244,255], strength: .028 + shimmer*.082 },
      { x: -width*.02, y: height*.55, radius: height*.35, color: [140,92,255], strength: .018 + kick*.041 },
      { x: width*1.02, y: height*.42, radius: height*.32, color: [255,79,216], strength: .018 + shimmer*.041 }
    ];

    glows.forEach((glow, index) => {
      const drift = Math.sin(time * (.16 + index*.025) + index) * 14;
      const gradient = ctx.createRadialGradient(glow.x+drift,glow.y,0,glow.x+drift,glow.y,glow.radius);
      gradient.addColorStop(0, `rgba(${glow.color.join(",")},${glow.strength})`);
      gradient.addColorStop(.35, `rgba(${glow.color.join(",")},${glow.strength*.45})`);
      gradient.addColorStop(1, `rgba(${glow.color.join(",")},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0,0,width,height);
    });

    ctx.restore();
  }

  function updatePageResponse(music) {
    const intensity = Math.min(1, music.avg + music.bass*.3 + pulse*.18);
    rootStyle.setProperty("--wash-cyan", String(.012 + intensity*.028));
    rootStyle.setProperty("--wash-magenta", String(.010 + intensity*.026));
    rootStyle.setProperty("--hero-shadow", `0 0 ${12+intensity*20}px rgba(60,244,255,${.22+intensity*.36}), 0 0 ${20+intensity*26}px rgba(255,79,216,${.08+intensity*.25})`);
    rootStyle.setProperty("--hero-y", `${-intensity*2.3}px`);
    rootStyle.setProperty("--nav-shadow", `0 0 ${7+intensity*11}px rgba(60,244,255,${.18+intensity*.32}), 0 0 ${12+intensity*15}px rgba(255,79,216,${.05+intensity*.19})`);
    rootStyle.setProperty("--nav-y", `${-intensity}px`);
  }

  function render(now) {
    const { width, height } = heroSize();
    const delta = Math.min(.034, (now-lastFrame)/1000 || .016);
    const time = now/1000;
    lastFrame = now;

    // Quick entrance, followed by a relaxed fade after pause or ending.
    visualMix = playing
      ? Math.min(1, visualMix + delta * 1.8)
      : Math.max(0, visualMix - delta * 0.56);

    const music = readMusic();

    if (playing) {
      pulse = Math.max(pulse * Math.pow(.045,delta), music.onset);
      reveal = Math.min(1, reveal + delta*.72);
    } else {
      pulse *= Math.pow(.035,delta);
      reveal = Math.max(0, reveal - delta*.45);
    }

    ctx.clearRect(0,0,width,height);

    // The idle constellation remains after playback.
    drawGlitter(music,time);
    drawIdleNotes(width,height,music,time,delta);

    // Staff, traveling notes, accents, and edge light fade together.
    if (visualMix > .001) {
      ctx.save();
      ctx.globalAlpha = visualMix;
      drawEdgeGlow(width,height,music,time);
      drawStaff(width,height,music,time);
      drawStaffNotes(width,height,music,time,delta);
      drawAccents(delta);
      ctx.restore();

      updatePageResponse({
        bass: music.bass * visualMix,
        mid: music.mid * visualMix,
        high: music.high * visualMix,
        avg: music.avg * visualMix,
        onset: music.onset * visualMix
      });
    } else if (!playing) {
      ["--wash-cyan","--wash-magenta","--hero-shadow","--hero-y","--nav-shadow","--nav-y"]
        .forEach((name) => rootStyle.removeProperty(name));
    }

    // New accents are spawned only while audio is actively playing.
    spawnAccent(music,time);
    requestAnimationFrame(render);
  }

  function setPlaying(next) {
    playing = next;
    if (next) playbackStart = performance.now();
    hero.classList.toggle("playing",next);
    trigger.classList.toggle("playing",next);
    heroName?.classList.toggle("playing",next);
    navLogo?.classList.toggle("playing",next);
    trigger.setAttribute("aria-pressed",String(next));
    trigger.setAttribute("aria-label",next ? "Stop the chiptune" : "Play a short chiptune");

    if (!next) {
      previousEnergy = 0;
    }
  }

  trigger.addEventListener("click", async () => {
    setupAudio();
    if (audioContext.state === "suspended") await audioContext.resume();

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      audio.currentTime = 0;
      await audio.play();
      setPlaying(true);
    } catch (error) {
      console.error("Audio playback could not start:", error);
      setPlaying(false);
    }
  });

  audio.addEventListener("ended", () => setPlaying(false));
  audio.addEventListener("pause", () => { if (!audio.ended) setPlaying(false); });
  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  requestAnimationFrame(render);
});
