import React, { useEffect, useRef, useState } from 'react';
import Spline from '@splinetool/react-spline';
import { Layers, Sparkles, Box } from 'lucide-react';

const DEFAULT_SPLINE_SCENE = 'https://prod.spline.design/sCbspRJLWPB-atm7/scene.splinecode';

export default function Hero3D({ customSplineUrl = DEFAULT_SPLINE_SCENE }) {
  const canvasRef = useRef(null);
  const [useSpline, setUseSpline] = useState(true);
  const [splineUrl, setSplineUrl] = useState(customSplineUrl);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [splineError, setSplineError] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle Canvas Fallback Animation when Spline is toggled off or on error
  useEffect(() => {
    if (useSpline && !splineError) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const numParticles = 48;
    const particles = [];
    const radius = Math.min(width, height) * 0.32;

    for (let i = 0; i < numParticles; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      particles.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
        size: Math.random() * 2.5 + 1.5,
        color: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#10b981' : '#38bdf8',
        pulse: Math.random() * Math.PI,
      });
    }

    let angleX = 0;
    let angleY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      angleY += 0.008 + (mousePos.x * 0.00005);
      angleX += 0.004 + (mousePos.y * 0.00005);

      const cx = width / 2;
      const cy = height / 2;

      const radialGradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 1.4);
      radialGradient.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
      radialGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
      radialGradient.addColorStop(1, 'rgba(11, 15, 25, 0)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      const drawRing = (r, tiltX, tiltY, strokeStyle) => {
        ctx.beginPath();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 1.2;
        const steps = 60;
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2;
          let rx = r * Math.cos(a);
          let ry = r * Math.sin(a);
          let rz = 0;

          const y1 = ry * Math.cos(tiltX) - rz * Math.sin(tiltX);
          const z1 = ry * Math.sin(tiltX) + rz * Math.cos(tiltX);
          const x2 = rx * Math.cos(tiltY) + z1 * Math.sin(tiltY);
          const z2 = -rx * Math.sin(tiltY) + z1 * Math.cos(tiltY);

          const scale = 300 / (300 + z2);
          const px = cx + x2 * scale;
          const py = cy + y1 * scale;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      };

      drawRing(radius * 1.15, angleX, angleY, 'rgba(6, 182, 212, 0.35)');
      drawRing(radius * 0.95, -angleX * 1.2, angleY * 0.8, 'rgba(16, 185, 129, 0.25)');
      drawRing(radius * 1.35, angleX * 0.6, -angleY * 1.1, 'rgba(56, 189, 248, 0.2)');

      const projected = [];
      particles.forEach((p) => {
        p.pulse += 0.03;
        const y1 = p.y * Math.cos(angleX) - p.z * Math.sin(angleX);
        const z1 = p.y * Math.sin(angleX) + p.z * Math.cos(angleX);
        const x2 = p.x * Math.cos(angleY) + z1 * Math.sin(angleY);
        const z2 = -p.x * Math.sin(angleY) + z1 * Math.cos(angleY);

        const perspective = 340 / (340 + z2);
        projected.push({
          x: cx + x2 * perspective,
          y: cy + y1 * perspective,
          z: z2,
          size: p.size * perspective * (1 + 0.2 * Math.sin(p.pulse)),
          color: p.color,
          alpha: (z2 + radius) / (2 * radius) * 0.8 + 0.2,
        });
      });

      projected.sort((a, b) => a.z - b.z);

      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 65) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.25 * (1 - dist / 65)})`;
            ctx.lineWidth = 0.7;
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      projected.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(1, node.size), 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = Math.min(1, Math.max(0.1, node.alpha));
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      });

      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [useSpline, splineError, mousePos]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  };

  const handleSplineLoad = () => {
    setSplineLoaded(true);
    setSplineError(false);
  };

  const handleSplineError = (e) => {
    console.warn('Spline 3D load notice:', e);
    setSplineError(true);
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative w-full h-[420px] sm:h-[480px] lg:h-[530px] rounded-3xl overflow-hidden glass-card border border-cyan-500/30 shadow-2xl shadow-cyan-500/15 flex items-center justify-center group"
    >
      {/* Background Cyber Grid Accent */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.4) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Floating Status Badges */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/85 text-cyan-400 border border-cyan-500/30 backdrop-blur-md flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          {useSpline && !splineError ? 'Interactive Spline 3D' : '3D IT Diagnostics Core'}
        </span>
      </div>

      {/* Quick Spline 3D Switcher Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowConfig(!showConfig)}
          title="Spline 3D Scene Controls"
          className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/80 backdrop-blur-md transition flex items-center gap-1.5 text-xs font-medium shadow-md"
        >
          <Box className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">3D Controls</span>
        </button>
      </div>

      {/* Spline 3D Configuration Drawer */}
      {showConfig && (
        <div className="absolute top-16 right-4 z-30 w-80 p-4 rounded-2xl bg-slate-900/95 border border-cyan-500/30 text-white text-xs shadow-2xl backdrop-blur-lg animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold flex items-center gap-1.5 text-cyan-400">
              <Layers className="w-4 h-4" /> Spline 3D Scene Settings
            </span>
            <button
              onClick={() => setShowConfig(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300 mb-3 leading-relaxed">
            FixTrail is rendering your live Spline 3D scene directly in the hero section!
          </p>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800 border border-slate-700">
              <span>Spline 3D Active</span>
              <button
                type="button"
                onClick={() => {
                  setUseSpline(!useSpline);
                  setSplineError(false);
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  useSpline ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    useSpline ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Scene URL (.splinecode)
              </label>
              <input
                type="text"
                placeholder="https://prod.spline.design/.../scene.splinecode"
                value={splineUrl}
                onChange={(e) => {
                  setSplineUrl(e.target.value);
                  setSplineLoaded(false);
                  setSplineError(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-[11px] font-mono focus:ring-1 focus:ring-cyan-400 focus:outline-none truncate"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main 3D Display Container */}
      {useSpline && !splineError ? (
        <div className="w-full h-full relative flex items-center justify-center">
          {/* Loading Indicator while Spline 3D assets download */}
          {!splineLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <Sparkles className="w-5 h-5 text-cyan-400 absolute animate-pulse" />
              </div>
              <p className="text-xs font-mono text-cyan-300 tracking-wider">
                Loading 3D Spline Experience...
              </p>
            </div>
          )}

          {/* Spline 3D Component */}
          <Spline
            scene={splineUrl}
            onLoad={handleSplineLoad}
            onError={handleSplineError}
            className="w-full h-full"
          />
        </div>
      ) : (
        /* Fallback 3D Canvas Core */
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />
      )}

      {/* Bottom Interactive Overlay Ribbon */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 border border-slate-700/80 text-[11px] font-mono text-cyan-300 backdrop-blur-md shadow-sm">
          <span className="text-emerald-400">● </span>3D Interactive Scene Ready
        </div>
        <div className="hidden sm:block text-[10px] text-slate-300 font-mono bg-slate-900/70 px-2 py-1 rounded-lg backdrop-blur-sm border border-slate-800">
          Click & Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  );
}
