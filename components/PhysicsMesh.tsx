
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface PhysicsMeshProps {
  isDark: boolean;
}

const PhysicsMesh: React.FC<PhysicsMeshProps> = ({ isDark }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.LineBasicMaterial | null>(null);
  const mouse = useRef({ x: 0, y: 0, down: false, prevX: 0, prevY: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Configuration ---
    const isMobile = window.innerWidth < 768;
    const aspect = window.innerWidth / window.innerHeight;
    const cols = isMobile ? 14 : 45;
    const rows = Math.round(cols / aspect);
    
    const particleCount = (cols + 1) * (rows + 1);
    const horizontalConstraints = cols * (rows + 1);
    const verticalConstraints = rows * (cols + 1);
    const constraintCount = horizontalConstraints + verticalConstraints;

    // --- Data-Oriented Buffers ---
    // Particle: [x, y, oldX, oldY, pinnedFlag] (5 slots)
    const particles = new Float32Array(particleCount * 5);
    // Constraint: [particleIndex1, particleIndex2] (2 slots)
    const constraintIndices = new Uint32Array(constraintCount * 2);
    // Constraint metadata: [length]
    const constraintLengths = new Float32Array(constraintCount);
    // Constraint state: [isActive]
    const constraintActive = new Uint8Array(constraintCount);
    
    // --- Initialization ---
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const idx = (j * (cols + 1) + i) * 5;
        const x = (i / cols) * 2.4 - 1.2;
        const y = (j / rows) * 2.4 - 1.2;
        particles[idx] = x;     // x
        particles[idx + 1] = y; // y
        particles[idx + 2] = x; // oldX
        particles[idx + 3] = y; // oldY
        particles[idx + 4] = (i === 0 || i === cols || j === 0 || j === rows) ? 1.0 : 0.0; // pinned
      }
    }

    let cIdx = 0;
    // Horizontal constraints
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i < cols; i++) {
        const p1 = j * (cols + 1) + i;
        const p2 = p1 + 1;
        constraintIndices[cIdx * 2] = p1;
        constraintIndices[cIdx * 2 + 1] = p2;
        const dx = particles[p1 * 5] - particles[p2 * 5];
        const dy = particles[p1 * 5 + 1] - particles[p2 * 5 + 1];
        constraintLengths[cIdx] = Math.sqrt(dx * dx + dy * dy);
        constraintActive[cIdx] = 1;
        cIdx++;
      }
    }
    // Vertical constraints
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const p1 = j * (cols + 1) + i;
        const p2 = p1 + (cols + 1);
        constraintIndices[cIdx * 2] = p1;
        constraintIndices[cIdx * 2 + 1] = p2;
        const dx = particles[p1 * 5] - particles[p2 * 5];
        const dy = particles[p1 * 5 + 1] - particles[p2 * 5 + 1];
        constraintLengths[cIdx] = Math.sqrt(dx * dx + dy * dy);
        constraintActive[cIdx] = 1;
        cIdx++;
      }
    }

    // --- Three.js Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0, 10);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    containerRef.current.appendChild(renderer.domElement);

    // Pre-allocated position buffer (2 vertices per constraint, 3 floats per vertex)
    const positionBuffer = new Float32Array(constraintCount * 2 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positionBuffer, 3));
    
    const material = new THREE.LineBasicMaterial({ 
      color: isDark ? 0x2563eb : 0xffffff, 
      transparent: true, 
      opacity: isDark ? 0.25 : 0.4,
    });
    materialRef.current = material;
    
    const lineMesh = new THREE.LineSegments(geometry, material);
    scene.add(lineMesh);

    // --- Physics Engine ---
    const GRAVITY = -0.000045;
    const FRICTION = 0.982;
    const SUBSTEPS = 8;
    const fixedTimeStep = 1 / 60;
    let accumulator = 0;
    let lastTime = performance.now();

    const updateParticles = () => {
      for (let i = 0; i < particleCount; i++) {
        const base = i * 5;
        if (particles[base + 4] === 1.0) continue; // Pinned

        const vx = (particles[base] - particles[base + 2]) * FRICTION;
        const vy = (particles[base + 1] - particles[base + 3]) * FRICTION;

        particles[base + 2] = particles[base]; // oldX
        particles[base + 3] = particles[base + 1]; // oldY

        particles[base] += vx;
        particles[base + 1] += vy + GRAVITY;
      }
    };

    const solveConstraints = () => {
      for (let s = 0; s < SUBSTEPS; s++) {
        for (let i = 0; i < constraintCount; i++) {
          if (constraintActive[i] === 0) continue;

          const p1Idx = constraintIndices[i * 2] * 5;
          const p2Idx = constraintIndices[i * 2 + 1] * 5;

          const dx = particles[p2Idx] - particles[p1Idx];
          const dy = particles[p2Idx + 1] - particles[p1Idx + 1];
          const dist = Math.sqrt(dx * dx + dy * dy);
          const diff = (constraintLengths[i] - dist) / dist;
          const offsetX = dx * diff * 0.5;
          const offsetY = dy * diff * 0.5;

          if (particles[p1Idx + 4] === 0.0) {
            particles[p1Idx] -= offsetX;
            particles[p1Idx + 1] -= offsetY;
          }
          if (particles[p2Idx + 4] === 0.0) {
            particles[p2Idx] += offsetX;
            particles[p2Idx + 1] += offsetY;
          }
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

    const handleInteraction = () => {
      if (mouse.current.down) {
        const mx = mouse.current.prevX;
        const my = mouse.current.prevY;
        const nx = mouse.current.x;
        const ny = mouse.current.y;

        for (let i = 0; i < constraintCount; i++) {
          if (constraintActive[i] === 0) continue;
          const p1Idx = constraintIndices[i * 2] * 5;
          const p2Idx = constraintIndices[i * 2 + 1] * 5;

          if (intersect(nx, ny, mx, my, particles[p1Idx], particles[p1Idx + 1], particles[p2Idx], particles[p2Idx + 1])) {
            constraintActive[i] = 0;
          }
        }
      }
    };

    const updateRenderBuffer = () => {
      const pos = positionBuffer;
      for (let i = 0; i < constraintCount; i++) {
        const vBase = i * 6;
        if (constraintActive[i] === 1) {
          const p1Idx = constraintIndices[i * 2] * 5;
          const p2Idx = constraintIndices[i * 2 + 1] * 5;
          pos[vBase] = particles[p1Idx];
          pos[vBase + 1] = particles[p1Idx + 1];
          pos[vBase + 2] = 0;
          pos[vBase + 3] = particles[p2Idx];
          pos[vBase + 4] = particles[p2Idx + 1];
          pos[vBase + 5] = 0;
        } else {
          // Zero out inactive constraints to hide them efficiently
          pos[vBase] = pos[vBase+1] = pos[vBase+2] = pos[vBase+3] = pos[vBase+4] = pos[vBase+5] = 0;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    };

    // --- Input Handlers ---
    const updateMouse = (e: any) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.current.prevX = mouse.current.x;
      mouse.current.prevY = mouse.current.y;
      mouse.current.x = (clientX / window.innerWidth) * 2.4 - 1.2;
      mouse.current.y = -((clientY / window.innerHeight) * 2.4 - 1.2);
    };

    const handleStart = (e: any) => {
      mouse.current.down = true;
      updateMouse(e);
    };

    const handleEnd = () => {
      mouse.current.down = false;
    };

    window.addEventListener('mousedown', handleStart);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('mousemove', updateMouse);
    window.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchmove', updateMouse, { passive: false });

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    let frameId: number;
    const animate = (time: number) => {
      frameId = requestAnimationFrame(animate);
      
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      // Double speed multiplier applied to accumulator increment
      accumulator += Math.min(deltaTime * 2.0, 0.2);

      while (accumulator >= fixedTimeStep) {
        updateParticles();
        solveConstraints();
        handleInteraction();
        accumulator -= fixedTimeStep;
      }

      updateRenderBuffer();
      renderer.render(scene, camera);
    };
    animate(performance.now());

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousedown', handleStart);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('mousemove', updateMouse);
      window.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchmove', updateMouse);
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
    <div className={`fixed inset-0 z-0 transition-all duration-1000 ${isDark ? 'bg-[#0a1229]' : 'bg-[#1e3a8a]'}`}>
      <div ref={containerRef} className="w-full h-full opacity-70" />
      <div className={`absolute bottom-4 left-6 hidden sm:block font-mono text-[9px] uppercase tracking-[0.2em] pointer-events-none transition-colors duration-1000 ${isDark ? 'text-blue-400/60' : 'text-blue-100/30'}`}>
        Blueprint.Engine // High-Performance Physics
      </div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default PhysicsMesh;
