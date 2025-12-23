
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface PhysicsMeshProps {
  isDark: boolean;
}

class Particle {
  x: number; y: number; oldX: number; oldY: number; pinned: boolean;
  constructor(x: number, y: number, pinned = false) {
    this.x = x; this.y = y; this.oldX = x; this.oldY = y; this.pinned = pinned;
  }
}

class Constraint {
  p1: Particle; p2: Particle; length: number; active: boolean;
  constructor(p1: Particle, p2: Particle) {
    this.p1 = p1; this.p2 = p2; this.active = true;
    this.length = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }
}

const PhysicsMesh: React.FC<PhysicsMeshProps> = ({ isDark }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0, down: false, prevX: 0, prevY: 0 });
  const materialRef = useRef<THREE.LineBasicMaterial | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0, 10);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    containerRef.current.appendChild(renderer.domElement);

    const isMobile = window.innerWidth < 768;
    const aspect = window.innerWidth / window.innerHeight;
    
    // Adjusted grid density: even less dense on mobile for a cleaner look
    const cols = isMobile ? 14 : 45; 
    const rows = Math.round(cols / aspect);
    
    const particles: Particle[] = [];
    const constraints: Constraint[] = [];

    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * 2.4 - 1.2;
        const y = (j / rows) * 2.4 - 1.2;
        const pinned = i === 0 || i === cols || j === 0 || j === rows;
        particles.push(new Particle(x, y, pinned));
      }
    }

    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const idx = j * (cols + 1) + i;
        if (i < cols) constraints.push(new Constraint(particles[idx], particles[idx + 1]));
        if (j < rows) constraints.push(new Constraint(particles[idx], particles[idx + (cols + 1)]));
      }
    }

    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ 
      color: isDark ? 0x2563eb : 0xffffff, 
      transparent: true, 
      opacity: isDark ? 0.35 : 0.45,
    });
    materialRef.current = material;
    
    const lineMesh = new THREE.LineSegments(geometry, material);
    scene.add(lineMesh);

    const updateGeometry = () => {
      const positions = [];
      for (const c of constraints) {
        if (c.active) {
          positions.push(c.p1.x, c.p1.y, 0, c.p2.x, c.p2.y, 0);
        }
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.attributes.position.needsUpdate = true;
    };

    const solve = () => {
      const substeps = isMobile ? 4 : 6;
      for (const p of particles) {
        if (p.pinned) continue;
        const vx = (p.x - p.oldX) * 0.985;
        const vy = (p.y - p.oldY) * 0.985;
        p.oldX = p.x;
        p.oldY = p.y;
        p.x += vx;
        p.y += vy - 0.00004;
      }

      for (let step = 0; step < substeps; step++) {
        for (const c of constraints) {
          if (!c.active) continue;
          const dx = c.p2.x - c.p1.x;
          const dy = c.p2.y - c.p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const diff = (c.length - dist) / dist;
          const offsetX = dx * diff * 0.5;
          const offsetY = dy * diff * 0.5;

          if (!c.p1.pinned) { c.p1.x -= offsetX; c.p1.y -= offsetY; }
          if (!c.p2.pinned) { c.p2.x += offsetX; c.p2.y += offsetY; }
        }
      }
    };

    const intersect = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
      const det = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1);
      if (det === 0) return false;
      const lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y1)) / det;
      const gamma = ((y1 - y2) * (x4 - x1) + (x2 - x1) * (y4 - y1)) / det;
      return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    };

    const handleMouseDown = (e: any) => { 
      mouse.current.down = true; 
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.current.prevX = (clientX / window.innerWidth) * 2.4 - 1.2;
      mouse.current.prevY = -((clientY / window.innerHeight) * 2.4 - 1.2);
    };
    const handleMouseUp = () => { mouse.current.down = false; };
    const handleMove = (e: any) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const nx = (clientX / window.innerWidth) * 2.4 - 1.2;
      const ny = -((clientY / window.innerHeight) * 2.4 - 1.2);
      
      if (mouse.current.down || e.touches) {
        for (const c of constraints) {
          if (!c.active) continue;
          if (intersect(nx, ny, mouse.current.prevX, mouse.current.prevY, c.p1.x, c.p1.y, c.p2.x, c.p2.y)) {
            c.active = false;
          }
        }
      }
      mouse.current.prevX = nx;
      mouse.current.prevY = ny;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchstart', handleMouseDown, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleMove, { passive: false });

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      solve();
      updateGeometry();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchstart', handleMouseDown);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.color.set(isDark ? 0x3b82f6 : 0xffffff);
      materialRef.current.opacity = isDark ? 0.25 : 0.4;
    }
  }, [isDark]);

  return (
    <div className={`fixed inset-0 z-0 transition-all duration-1000 ${isDark ? 'bg-[#020617]' : 'bg-[#1e3a8a]'}`}>
      <div ref={containerRef} className="w-full h-full opacity-70" />
      <div className={`absolute bottom-4 left-6 hidden sm:block font-mono text-[9px] uppercase tracking-[0.2em] pointer-events-none transition-colors duration-1000 ${isDark ? 'text-blue-900/60' : 'text-blue-100/30'}`}>
        Blueprint.Engine // Stable
      </div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default PhysicsMesh;
