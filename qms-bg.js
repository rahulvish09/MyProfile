/* ============================================
   QMS CANVAS BACKGROUND
   Animated gears, nodes & connecting lines
   ============================================ */

(function () {
  const canvas = document.getElementById('qms-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight * 5;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Floating Nodes (Documents / Standards) ──
  const nodes = [];
  const NODE_COUNT = 35;
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: Math.random() * 2000,
      y: Math.random() * 12000,
      r: 2 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.15,
      opacity: 0.08 + Math.random() * 0.15,
    });
  }

  // ── Gears ──
  const gears = [];
  const GEAR_COUNT = 8;
  for (let i = 0; i < GEAR_COUNT; i++) {
    gears.push({
      x: Math.random() * 2000,
      y: 600 + Math.random() * 10000,
      radius: 20 + Math.random() * 40,
      teeth: 6 + Math.floor(Math.random() * 6),
      angle: Math.random() * Math.PI * 2,
      speed: (0.002 + Math.random() * 0.004) * (Math.random() > 0.5 ? 1 : -1),
      opacity: 0.04 + Math.random() * 0.06,
    });
  }

  // ── Draw Gear ──
  function drawGear(g) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.angle);
    ctx.strokeStyle = `rgba(34, 211, 238, ${g.opacity})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const innerR = g.radius * 0.65;
    const outerR = g.radius;
    const toothW = Math.PI / g.teeth;

    for (let i = 0; i < g.teeth; i++) {
      const a1 = (i * 2 * Math.PI) / g.teeth;
      const a2 = a1 + toothW * 0.3;
      const a3 = a1 + toothW * 0.7;
      const a4 = a1 + toothW;

      if (i === 0) ctx.moveTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
      ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
      ctx.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
      ctx.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);

      const a5 = a4 + toothW * 0.3;
      ctx.lineTo(Math.cos(a5) * innerR, Math.sin(a5) * innerR);
    }
    ctx.closePath();
    ctx.stroke();

    // Center hole
    ctx.beginPath();
    ctx.arc(0, 0, g.radius * 0.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // ── Draw Connecting Lines between nearby nodes ──
  function drawConnections() {
    const maxDist = 180;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < maxDist) {
          const alpha = (1 - d / maxDist) * 0.06;
          ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
  }

  // ── Animation Loop ──
  function animate() {
    ctx.clearRect(0, 0, W, H);

    // Update & draw nodes
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(96, 165, 250, ${n.opacity})`;
      ctx.fill();
    });

    drawConnections();

    // Update & draw gears
    gears.forEach(g => {
      g.angle += g.speed;
      drawGear(g);
    });

    requestAnimationFrame(animate);
  }

  animate();
})();
