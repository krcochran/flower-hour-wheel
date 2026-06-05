/**
 * confetti.js — Petal confetti celebration effect
 */

const FHConfetti = (() => {
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');

  const COLORS = ['#f4a95a', '#e8637a', '#f0b8c5', '#3d4a1f', '#2d1b69', '#a8d4e6', '#fcd9b0'];
  const SHAPES = ['✿', '❀', '✾', '·', '▪'];

  let particles = [];
  let animId = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  function burst(count = 80) {
    resize();
    particles = [];
    const cx = window.innerWidth / 2;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: cx + (Math.random() - 0.5) * 200,
        y: window.innerHeight * 0.4,
        vx: (Math.random() - 0.5) * 12,
        vy: -(Math.random() * 14 + 4),
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        size: 12 + Math.random() * 16,
        life: 1,
        decay: 0.012 + Math.random() * 0.008,
        gravity: 0.35 + Math.random() * 0.2,
      });
    }

    if (animId) cancelAnimationFrame(animId);
    animate();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.rot += p.rotV;
      p.life -= p.decay;

      if (p.life > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.font = `${p.size}px serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.shape, 0, 0);
        ctx.restore();
      }
    });

    particles = particles.filter(p => p.life > 0);
    if (particles.length > 0) {
      animId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return { burst };
})();
