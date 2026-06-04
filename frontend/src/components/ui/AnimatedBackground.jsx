import { useEffect, useRef, useState } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width, height;
    let nodes = [];
    const NODE_COUNT = 70;
    const MAX_DISTANCE = 130;

    let mouse = { x: -9999, y: -9999 };
    let isInputFocused = false;
    
    const handleMouseMove = (e) => {
      if (isInputFocused) return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      document.documentElement.style.setProperty("--spotlight-x", e.clientX + "px");
      document.documentElement.style.setProperty("--spotlight-y", e.clientY + "px");
    };

    const handleMouseLeave = () => {
      if (isInputFocused) return;
      mouse.x = -9999;
      mouse.y = -9999;
      document.documentElement.style.setProperty("--spotlight-x", "-9999px");
      document.documentElement.style.setProperty("--spotlight-y", "-9999px");
    };

    const handleFocusIn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        isInputFocused = true;
        mouse.x = -9999;
        mouse.y = -9999;
        document.documentElement.style.setProperty("--spotlight-x", "-9999px");
        document.documentElement.style.setProperty("--spotlight-y", "-9999px");
      }
    };

    const handleFocusOut = () => {
      isInputFocused = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    class Node {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
      }

      move() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fill();
      }
    }

    const init = () => {
      resize();
      nodes = Array.from({ length: NODE_COUNT }, () => new Node());
    };

    const drawLines = () => {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < MAX_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${1 - distance / MAX_DISTANCE})`;

            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      nodes.forEach((node) => {
        node.move();
        node.draw();
      });

      drawLines();

      requestAnimationFrame(animate);
    };

    init();
    animate();

    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("resize", init);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      />
      {/* CSS-driven spotlight overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: `radial-gradient(312px at var(--spotlight-x, -999px) var(--spotlight-y, -999px), rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.4) 100%)`,
        }}
      />
    </>
  );
}
