
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface PhysicsMeshProps {
  isDark: boolean;
}

/**
 * High-performance Physics Engine for the Blueprint Grid
 * Uses Data-Oriented Design (TypedArrays) instead of Classes to maximize throughput
 */
const PhysicsMesh: React.FC<PhysicsMeshProps> = ({ isDark }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0, down: false, prevX: 0, prevY: 0 });
  const materialRef = useRef<THREE.LineBasicMaterial | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0, 10);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const isMobile = window.innerWidth < 768;
    const aspect = window.innerWidth / window.innerHeight;
    
    // Grid Setup
    const cols = isMobile ? 16 : 45; 
    const rows = Math.round(cols / aspect);
    const numParticles = (cols + 1) * (rows + 1);
    
    // Particle Data (Interleaved: x, y, oldX, oldY, pinnedFlag)
    const pData = new Float32Array(numParticles * 5);
    // Constraints (p1Index, p2Index)
    const constraints: number[] = [];

    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const idx = (j * (cols + 1) + i) * 5;
        const x = (i / cols) * 2.4 - 1.2;
        const y = (j / rows) * 2.4 - 1.2;
        const pinned = i === 0 || i === cols || j === 0 || j === rows;

        pData[idx] = x;     // curr x
        pData[idx + 1] = y; // curr y
        pData[idx + 2] = x; // old x
        pData[idx + 3] = y; // old y
        pData[idx + 4] = pinned ? 1 : 0;
      }
    }

    // Build constraints and calculate target lengths
    const constraintLengths: number[] = [];
    const addConstraint = (p1: number, p2: number) => {
      const idx1 = p1 * 5;
      const idx2 = p2 * 5;
      const dx = pData[idx1] - pData[idx2];
      const dy = pData[idx1 + 1] - pData[idx2 + 1];
      constraints.push(p1, p2);
      constraintLengths.push(Math.sqrt(dx * dx + dy * dy));
    };

    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const idx = j * (cols + 1) + i;
        if (i < cols) addConstraint(idx, idx + 1);
        if (j < rows) addConstraint(idx, idx + (cols + 1));
      }
    }

    const cTargetLengths = new Float32Array(constraintLengths);
    const cIndices = new Uint32Array(constraints);
    const cActive = new Uint8Array(cIndices.length / 2).fill(1);

    // Rendering Geometry
    const geometry = new THREE.BufferGeometry();
    const renderBuffer = new Float32Array(cActive.length * 6); // 2 points * 3 components
    geometry.setAttribute('position', new THREE.BufferAttribute(renderBuffer, 3));

    const material = new THREE.LineBasicMaterial({ 
      color: isDark ? 0x3b82f6 : 0xffffff, 
      transparent: true, 
      opacity: isDark ? 0.25 : 0.4,
      depthTest: false
    });
    materialRef.current = material;
    
    const lineMesh = new THREE.LineSegments(geometry, material);
    scene.add(lineMesh);

    // Intersection logic for cutting
    const intersect = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
      const det = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1);
      if (det === 0) return false;
      const lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y1)) / det;
      const gamma = ((y1 - y2) * (x4 - x1) + (x2 - x1) * (y4 - y1)) / det;
      return (lambda > 0 && lambda < 1) && (gamma > 0 && gamma < 1);
    };

    // --- Simulation Logic ---
    const fixedTimeStep = 1 / 60; // 60Hz Baseline
    const gravity = -0.000045;
    const friction = 0.982;
    const substeps = 8; // High precision for stability

    const solve = () => {
      // 1. Integration
      for (let i = 0; i < numParticles; i++) {
        const idx = i * 5;
        if (pData[idx + 4] === 1) continue;

        const vx = (pData[idx] - pData[idx + 2]) * friction;
        const vy = (pData[idx + 1] - pData[idx + 3]) * friction;

        pData[idx + 2] = pData[idx];
        pData[idx + 3] = pData[idx + 1];
        pData[idx] += vx;
        pData[idx + 1] += vy + gravity;
      }

      // 2. Constraints
      for (let s = 0; s < substeps; s++) {
        for (let i = 0; i < cActive.length; i++) {
          if (cActive[i] === 0) continue;

          const p1Idx = cIndices[i * 2] * 5;
          const p2Idx = cIndices[i * 2 + 1] * 5;
          const target = cTargetLengths[i];

          const dx = pData[p2Idx] - pData[p1Idx];
          const dy = pData[p2Idx + 1] - pData[p1Idx + 1];
          const dist = Math.sqrt(dx * dx + dy * dy);
          const diff = (target - dist) / dist * 0.5;

          const ox = dx * diff;
          const oy = dy * diff;

          if (pData[p1Idx + 4] === 0) {
            pData[p1Idx] -= ox;
            pData[p1Idx + 1] -= oy;
          }
          if (pData[p2Idx + 4] === 0) {
            pData[p2Idx] += ox;
            pData[p2Idx + 1] += oy;
          }
        }
      }
    };

    const updateRenderBuffer = () => {
      let vIdx = 0;
      for (let i = 0; i < cActive.length; i++) {
        if (cActive[i] === 1) {
          const p1 = cIndices[i * 2] * 5;
          const p2 = cIndices[i * 2 + 1] * 5;
          renderBuffer[vIdx++] = pData[p1];
          renderBuffer[vIdx++] = pData[p1 + 1];
          renderBuffer[vIdx++] = 0;
          renderBuffer[vIdx++] = pData[p2];
          renderBuffer[vIdx++] = pData[p2 + 1];
          renderBuffer[vIdx++] = 0;
        } else {
          renderBuffer[vIdx++] = 0; renderBuffer[vIdx++] = 0; renderBuffer[vIdx++] = 0;
          renderBuffer[vIdx++] = 0; renderBuffer[vIdx++] = 0; renderBuffer[vIdx++] = 0;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    };

    const handleMove = (e: any) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const nx = (clientX / window.innerWidth) * 2.4 - 1.2;
      const ny = -((clientY / window.innerHeight) * 2.4 - 1.2);
      
      if (mouse.current.down || e.touches) {
        const mx = mouse.current.prevX;
        const my = mouse.current.prevY;
        for (let i = 0; i < cActive.length; i++) {
          if (cActive[i] === 0) continue;
          const p1 = cIndices[i * 2] * 5;
          const p2 = cIndices[i * 2 + 1] * 5;
          if (intersect(nx, ny, mx, my, pData[p1], pData[p1 + 1], pData[p2], pData[p2 + 1])) {
            cActive[i] = 0;
          }
        }
      }
      mouse.current.prevX = nx;
      mouse.current.prevY = ny;
    };

    const setMouseDown = (e: any) => { 
      mouse.current.down = true; 
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.current.prevX = (clientX / window.innerWidth) * 2.4 - 1.2;
      mouse.current.prevY = -((clientY / window.innerHeight) * 2.4 - 1.2);
    };

    window.addEventListener('mousedown', setMouseDown);
    window.addEventListener('mouseup', () => mouse.current.down = false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchstart', setMouseDown, { passive: false });
    window.addEventListener('touchend', () => mouse.current.down = false);
    window.addEventListener('touchmove', handleMove, { passive: false });

    // --- Animation Loop with Accumulator ---
    let frameId: number;
    let lastTime = performance.now();
    let accumulator = 0;

    const animate = (time: number) => {
      frameId = requestAnimationFrame(animate);

      // Speed Up logic: Multiple delta by 2.0 to double the simulation speed
      const deltaTime = ((time - lastTime) / 1000) * 2.0;
      lastTime = time;

      // Accumulator caps: Increase slightly to 0.2 to handle the double speed without dropping frames
      accumulator += Math.min(deltaTime, 0.2);

      while (accumulator >= fixedTimeStep) {
        solve();
        accumulator -= fixedTimeStep;
      }

      updateRenderBuffer();
      renderer.render(scene, camera);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousedown', setMouseDown);
      window.removeEventListener('mousemove', handleMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.color.set(isDark ? 0x3b82f6 : 0xffffff);
      materialRef.current.opacity = isDark ? 0.3 : 0.45;
    }
  }, [isDark]);

  return (
    <div className={`fixed inset-0 z-0 transition-all duration-1000 ${isDark ? 'bg-[#0a1229]' : 'bg-[#1e3a8a]'}`}>
      <div ref={containerRef} className="w-full h-full opacity-70" />
      <div className={`absolute bottom-4 left-6 hidden sm:block font-mono text-[9px] uppercase tracking-[0.2em] pointer-events-none transition-colors duration-1000 ${isDark ? 'text-blue-400/30' : 'text-blue-100/30'}`}>
        Blueprint.Engine // Stable_v2.0_HighSpeed
      </div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default PhysicsMesh;
