document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvasOfInspiration");
  const ctx = canvas.getContext("2d");
  let width,
    height,
    mouseX = 0,
    mouseY = 0;
  const brushstrokes = [];

  // Tagline Rotation
  const taglines = [
    "Paint your world, frame by frame.",
    "Every post is a stroke of genius.",
    "Inspiration flows through every reel.",
    "Create, connect, captivate.",
  ];
  let taglineIndex = 0;

  function resizeCanvas() {
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    initBrushstrokes();
  }

  function initBrushstrokes() {
    brushstrokes.length = 0;
    for (let i = 0; i < 10; i++) {
      // Fewer strokes for performance
      brushstrokes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 100 + 50,
        angle: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.3 + 0.1,
        speed: Math.random() * 0.02 + 0.01,
      });
    }
  }

  function drawBrushstrokes() {
    ctx.clearRect(0, 0, width, height);
    brushstrokes.forEach((stroke) => {
      ctx.beginPath();
      ctx.moveTo(stroke.x, stroke.y);
      const endX = stroke.x + Math.cos(stroke.angle) * stroke.length;
      const endY = stroke.y + Math.sin(stroke.angle) * stroke.length;
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = `rgba(147, 197, 253, ${stroke.opacity})`;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();

      // Animate strokes
      stroke.angle += stroke.speed;
      stroke.opacity = Math.sin(Date.now() * 0.001 + stroke.x) * 0.2 + 0.2;
    });
  }

  function animateCanvas() {
    drawBrushstrokes();
    requestAnimationFrame(animateCanvas);
  }

  // Mouse/Touch Interaction
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    brushstrokes.forEach((stroke) => {
      const dist = Math.hypot(mouseX - stroke.x, mouseY - stroke.y);
      if (dist < 150) stroke.opacity = Math.min(stroke.opacity + 0.1, 0.5);
    });
  });

  // Mobile tilt support (optional)
  window.addEventListener("deviceorientation", (e) => {
    mouseX = ((e.gamma + 90) / 180) * width; // Left-right tilt
    mouseY = ((e.beta + 90) / 180) * height; // Forward-back tilt
  });

  // Tagline Rotation
  function rotateTagline() {
    const tagline = document.getElementById("canvasTagline");
    tagline.style.opacity = 0;
    tagline.style.transform = "translateY(10px)";
    setTimeout(() => {
      taglineIndex = (taglineIndex + 1) % taglines.length;
      tagline.textContent = taglines[taglineIndex];
      tagline.style.opacity = 1;
      tagline.style.transform = "translateY(0)";
    }, 500);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  animateCanvas();
  setInterval(rotateTagline, 6000); // Rotate every 6 seconds
});
