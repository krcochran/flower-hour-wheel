/**
 * wheel.js — Canvas-based spinning wheel renderer & animator
 */

const FHWheel = (() => {
  const COLORS = [
    '#3d4a1f', // olive
    '#f4a95a', // peach
    '#2d1b69', // navy
    '#e8637a', // pink
    '#8a7d2a', // olive-yellow
    '#a8d4e6', // sky
    '#5a6e2a', // olive-mid
    '#fcd9b0', // peach-light
    '#f0b8c5', // pink-light
    '#4a3590', // purple-mid
  ];

  const TEXT_COLORS = {
    '#3d4a1f': '#fdf8f0',
    '#f4a95a': '#3d4a1f',
    '#2d1b69': '#f4a95a',
    '#e8637a': '#fdf8f0',
    '#8a7d2a': '#fdf8f0',
    '#a8d4e6': '#2d1b69',
    '#5a6e2a': '#fdf8f0',
    '#fcd9b0': '#3d4a1f',
    '#f0b8c5': '#2d1b69',
    '#4a3590': '#fcd9b0',
  };

  let canvas, ctx;
  let currentAngle = 0;
  let spinning = false;
  let animationId = null;
  let onResultCb = null;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
  }

  function draw(segments, angle) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 8;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!segments || segments.length === 0) {
      // Empty state
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#f5eddf';
      ctx.fill();
      ctx.strokeStyle = '#fcd9b0';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#8a7d2a';
      ctx.font = 'italic 1rem "Cormorant Garamond", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add names to spin! ✿', cx, cy);
      return;
    }

    const numSegs = segments.length;
    const arc = (Math.PI * 2) / numSegs;

    segments.forEach((seg, i) => {
      const startAngle = angle + i * arc;
      const endAngle = startAngle + arc;
      const color = COLORS[i % COLORS.length];

      // Slice
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arc / 2);

      const textColor = TEXT_COLORS[color] || '#fdf8f0';
      ctx.fillStyle = textColor;

      // Dynamic font size based on segment count
      const maxLen = Math.max(...segments.map(s => s.length));
      let fontSize = numSegs > 20 ? 10 : numSegs > 12 ? 12 : numSegs > 8 ? 13 : 15;
      if (maxLen > 12) fontSize = Math.max(9, fontSize - 2);

      ctx.font = `600 ${fontSize}px "DM Sans", sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Truncate long names
      let label = seg;
      const maxWidth = r - 28;
      while (ctx.measureText(label).width > maxWidth && label.length > 3) {
        label = label.slice(0, -1);
      }
      if (label !== seg) label = label.slice(0, -1) + '…';

      ctx.fillText(label, r - 14, 0);
      ctx.restore();
    });

    // Center hub
    const hubR = 22;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubR);
    grad.addColorStop(0, '#fdf8f0');
    grad.addColorStop(1, '#fcd9b0');
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#f4a95a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Flower center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#e8637a';
    ctx.fill();
  }

  function spin(weightedPool, segments, onResult) {
    if (spinning || segments.length === 0) return;
    spinning = true;
    onResultCb = onResult;

    // Pick winner from FULL weighted pool — duplicates give higher probability
    const winner = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    const winnerIdx = segments.indexOf(winner);
    const numSegs = segments.length;
    const arc = (Math.PI * 2) / numSegs;

    // Target: winning segment should land at top (angle = -π/2 = pointer position)
    // Pointer is at top. Segment i occupies [currentAngle + i*arc, currentAngle + (i+1)*arc].
    // We want winnerIdx slice midpoint at top (-π/2).
    const targetSliceMid = -(winnerIdx + 0.5) * arc;
    const extraSpins = (8 + Math.floor(Math.random() * 6)) * Math.PI * 2;
    const finalAngle = targetSliceMid + extraSpins;

    const startAngle = currentAngle;
    const totalDelta = finalAngle - (startAngle % (Math.PI * 2));
    const adjustedFinal = startAngle + totalDelta + extraSpins;

    const duration = 4000 + Math.random() * 1500;
    const startTime = performance.now();

    function easeOut(t) {
      // Cubic ease-out
      return 1 - Math.pow(1 - t, 3);
    }

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOut(t);
      currentAngle = startAngle + (adjustedFinal - startAngle) * eased;
      draw(segments, currentAngle);

      if (t < 1) {
        animationId = requestAnimationFrame(frame);
      } else {
        currentAngle = adjustedFinal % (Math.PI * 2);
        draw(segments, currentAngle);
        spinning = false;

        // Determine actual winner from final angle
        // After spinning, pointer at top = angle 0 relative to canvas top
        // Segment at pointer = the one whose arc covers -π/2 (top)
        const normalised = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const pointerAngle = (Math.PI * 1.5 - normalised + Math.PI * 2) % (Math.PI * 2);
        const winIdx = Math.floor(pointerAngle / arc) % numSegs;
        if (onResultCb) onResultCb(segments[winIdx]);
      }
    }

    animationId = requestAnimationFrame(frame);
  }

  function isSpinning() { return spinning; }

  function redraw(segments) {
    draw(segments, currentAngle);
  }

  return { init, draw, spin, isSpinning, redraw };
})();
