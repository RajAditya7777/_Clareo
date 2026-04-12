"use client";

import { useEffect, useRef, useState } from "react";

// ─── Spoke definitions ───────────────────────────────────────────────────────
const SPOKES = [
  { label: "Skills",     angle: -90,  color: "#ffffff" },
  { label: "Experience", angle: -30,  color: "#e5e5e5" },
  { label: "Seniority",  angle: 30,   color: "#cccccc" },
  { label: "Match",      angle: 90,   color: "#b3b3b3" },
  { label: "Gaps",       angle: 150,  color: "#999999" },
  { label: "Risk",       angle: 210,  color: "#808080" },
];

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export default function RadarScanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const sweepRef  = useRef<number>(-90);
  const [litSpoke, setLitSpoke] = useState<number>(-1);

  const SIZE   = 1400;
  const CENTER = SIZE / 2;
  const RINGS  = [180, 360, 520, 670];
  const OUTER  = 670;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const draw = (timestamp: number) => {
      // Constant sweeping speed decoupled from scroll
      sweepRef.current += 1.2;
      if (sweepRef.current > 270) sweepRef.current -= 360;
      const sweep = sweepRef.current;

      ctx.clearRect(0, 0, SIZE, SIZE);

      // Background glow (Brightened)
      const bg = ctx.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, OUTER);
      bg.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      bg.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, OUTER, 0, Math.PI * 2);
      ctx.fill();

      // Concentric rings (Brightened)
      RINGS.forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.35 + i * 0.13})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });

      // Crosshair
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER - OUTER); ctx.lineTo(CENTER, CENTER + OUTER);
      ctx.moveTo(CENTER - OUTER, CENTER); ctx.lineTo(CENTER + OUTER, CENTER);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Spoke lines (Brightened)
      let nextLit = -1;
      let bestDiff = 999;
      SPOKES.forEach((spoke, idx) => {
        const rad = toRad(spoke.angle);
        let diff = ((sweep - spoke.angle) % 360 + 360) % 360;
        if (diff > 180) diff -= 360;
        const inZone = Math.abs(diff) < 35;
        if (inZone && Math.abs(diff) < bestDiff) {
          bestDiff = Math.abs(diff);
          nextLit = idx;
        }

        ctx.beginPath();
        ctx.moveTo(CENTER + Math.cos(rad) * 90, CENTER + Math.sin(rad) * 90);
        ctx.lineTo(CENTER + Math.cos(rad) * OUTER, CENTER + Math.sin(rad) * OUTER);
        ctx.strokeStyle = inZone ? spoke.color : "rgba(255,255,255,0.55)";
        ctx.lineWidth = inZone ? 3.8 : 1.8;
        ctx.shadowColor = inZone ? spoke.color : "transparent";
        ctx.shadowBlur = inZone ? 28 : 8;
        ctx.globalAlpha = inZone ? 1 : 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      // Sweep trail (Brightened)
      for (let i = 1; i <= 80; i++) {
        const trailRad = toRad(sweep - i);
        const alpha = ((80 - i) / 80) * 0.90;
        ctx.beginPath();
        ctx.moveTo(CENTER, CENTER);
        ctx.lineTo(CENTER + Math.cos(trailRad) * OUTER, CENTER + Math.sin(trailRad) * OUTER);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Leading sweep line
      const sweepRad = toRad(sweep);
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.lineTo(CENTER + Math.cos(sweepRad) * OUTER, CENTER + Math.sin(sweepRad) * OUTER);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 35;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Outer pulse ring (Brightened)
      const pulseAlpha = 0.32 + Math.sin(timestamp / 900) * 0.18;
      const pulseR = OUTER + 12 + Math.sin(timestamp / 900) * 8;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${pulseAlpha})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Hub dot (Brightened)
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 42;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Hub outer ring (Brightened)
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, 38, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2.8;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Crosshair fixed above hub
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER - 120);
      ctx.lineTo(CENTER, CENTER - 160);
      ctx.moveTo(CENTER - 20, CENTER - 140);
      ctx.lineTo(CENTER + 20, CENTER - 140);
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      setLitSpoke(nextLit);
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE }}>
      <canvas ref={canvasRef} width={SIZE} height={SIZE} className="block" />
      {SPOKES.map((spoke, i) => {
        const labelR = OUTER + 60;
        const x = Math.cos(toRad(spoke.angle)) * labelR;
        const y = Math.sin(toRad(spoke.angle)) * labelR;
        return (
          <div
            key={spoke.label}
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: "translate(-50%, -50%)",
              color: litSpoke === i ? spoke.color : "rgba(255,255,255,0.90)",
              textShadow: litSpoke === i ? `0 0 30px ${spoke.color}, 0 0 12px #ffffff` : "0 0 6px rgba(255,255,255,0.25)",
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              transition: "color 0.3s, text-shadow 0.3s",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {spoke.label}
          </div>
        );
      })}
    </div>
  );
}
