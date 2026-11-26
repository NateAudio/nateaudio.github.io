/*
  Nate Audio - Responsive Perspective Grid 2.1

  One vanishing point. No repeated tiles. No fixed left/right clusters.

  Rays are spaced by ANGLE around the vanishing point, then extended until
  they hit the visible viewport boundary. This keeps the visual fan even on
  normal, wide, and ultrawide windows.
*/
document.addEventListener("DOMContentLoaded", () => {
  const gridCanvas = document.createElement("canvas");
  gridCanvas.id = "perspective-grid";
  gridCanvas.setAttribute("aria-hidden", "true");
  document.body.prepend(gridCanvas);

  const gridContext = gridCanvas.getContext("2d");
  if (!gridContext) return;

  function mixColor(left, middle, right, position) {
    const firstHalf = position <= 0.5;
    const localPosition = firstHalf
      ? position * 2
      : (position - 0.5) * 2;

    const startColor = firstHalf ? left : middle;
    const endColor = firstHalf ? middle : right;

    return startColor.map((channel, index) =>
      Math.round(channel + (endColor[index] - channel) * localPosition)
    );
  }

  function rayToViewportEdge(vanishingX, horizonY, angle, width, height) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const candidates = [];

    // Intersection with the bottom edge.
    if (dy > 0.0001) {
      const tBottom = (height - horizonY) / dy;
      const xBottom = vanishingX + dx * tBottom;

      if (xBottom >= 0 && xBottom <= width) {
        candidates.push({ t: tBottom, x: xBottom, y: height });
      }
    }

    // Intersection with the left edge.
    if (dx < -0.0001) {
      const tLeft = (0 - vanishingX) / dx;
      const yLeft = horizonY + dy * tLeft;

      if (yLeft >= horizonY && yLeft <= height) {
        candidates.push({ t: tLeft, x: 0, y: yLeft });
      }
    }

    // Intersection with the right edge.
    if (dx > 0.0001) {
      const tRight = (width - vanishingX) / dx;
      const yRight = horizonY + dy * tRight;

      if (yRight >= horizonY && yRight <= height) {
        candidates.push({ t: tRight, x: width, y: yRight });
      }
    }

    if (!candidates.length) return null;

    // The first positive boundary hit is the visible endpoint.
    candidates.sort((a, b) => a.t - b.t);
    return candidates[0];
  }

  function drawPerspectiveGrid() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    gridCanvas.width = Math.max(1, Math.round(width * dpr));
    gridCanvas.height = Math.max(1, Math.round(height * dpr));
    gridCanvas.style.width = `${width}px`;
    gridCanvas.style.height = `${height}px`;

    gridContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    gridContext.clearRect(0, 0, width, height);

    const vanishingX = width * 0.5;
    const horizonY = height * 0.43;
    const floorHeight = height - horizonY;

    const cyan = [60, 244, 255];
    const violet = [140, 92, 255];
    const magenta = [255, 79, 216];

    gridContext.save();
    gridContext.lineWidth = 1;

    // ----------------------------------------------------------
    // Perspective rays
    // ----------------------------------------------------------
    // Spread rays evenly by angle across the entire lower half-plane.
    // A small margin avoids drawing almost-horizontal lines directly on
    // the horizon while still making the floor feel unbounded laterally.
    const edgeMargin = 0.035;
    const startAngle = edgeMargin;
    const endAngle = Math.PI - edgeMargin;

    // More width means more rays, but angular spacing remains even.
    const rayCount = Math.max(
      24,
      Math.ceil(width / (width < 768 ? 58 : 82))
    );

    for (let index = 0; index <= rayCount; index += 1) {
      const progress = index / rayCount;
      const angle = startAngle + (endAngle - startAngle) * progress;
      const endpoint = rayToViewportEdge(
        vanishingX,
        horizonY,
        angle,
        width,
        height
      );

      if (!endpoint) continue;

      // Screen-left is cyan, center is violet, screen-right is magenta.
      const screenPosition = endpoint.x / Math.max(1, width);
      const color = mixColor(cyan, violet, magenta, screenPosition);

      gridContext.beginPath();
      gridContext.moveTo(vanishingX, horizonY);
      gridContext.lineTo(endpoint.x, endpoint.y);
      gridContext.strokeStyle = `rgba(${color.join(",")}, 0.22)`;
      gridContext.stroke();
    }

    // ----------------------------------------------------------
    // Horizontal depth lines
    // ----------------------------------------------------------
    const horizontalGradient = gridContext.createLinearGradient(0, 0, width, 0);
    horizontalGradient.addColorStop(0, "rgba(60,244,255,0.18)");
    horizontalGradient.addColorStop(0.5, "rgba(140,92,255,0.16)");
    horizontalGradient.addColorStop(1, "rgba(255,79,216,0.18)");
    gridContext.strokeStyle = horizontalGradient;

    const depthLineCount = height < 700 ? 8 : 10;

    for (let index = 1; index <= depthLineCount; index += 1) {
      const progress = index / depthLineCount;
      const y = horizonY + floorHeight * progress * progress;

      gridContext.beginPath();
      gridContext.moveTo(0, y);
      gridContext.lineTo(width, y);
      gridContext.stroke();
    }

    // Fade the whole grid gently into the horizon.
    gridContext.globalCompositeOperation = "destination-in";

    const fade = gridContext.createLinearGradient(0, horizonY, 0, height);
    fade.addColorStop(0, "rgba(255,255,255,0)");
    fade.addColorStop(0.18, "rgba(255,255,255,0.08)");
    fade.addColorStop(0.52, "rgba(255,255,255,0.44)");
    fade.addColorStop(1, "rgba(255,255,255,0.82)");

    gridContext.fillStyle = fade;
    gridContext.fillRect(0, horizonY, width, floorHeight);
    gridContext.restore();
  }

  let resizeFrame = null;

  function scheduleGridRedraw() {
    if (resizeFrame !== null) {
      cancelAnimationFrame(resizeFrame);
    }

    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      drawPerspectiveGrid();
    });
  }

  drawPerspectiveGrid();
  window.addEventListener("resize", scheduleGridRedraw);
});
