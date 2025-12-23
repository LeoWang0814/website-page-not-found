
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const SpatialGravityGrid: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const targetMouse = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 2. Geometry - High resolution plane for smooth deformation
    const width = 24;
    const height = 18;
    const segmentsX = 60;
    const segmentsY = 45;
    const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);

    // Store original positions for reference during deformation
    const originalPositions = geometry.attributes.position.array.slice() as Float32Array;

    // 3. Materials - Ultra-thin, low opacity lines for "High-End" feel
    const material = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.08, // Very subtle grid
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Points at intersections for more structure (optional but adds detail)
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.015,
      transparent: true,
      opacity: 0.15,
    });
    const points = new THREE.Points(geometry, pointsMaterial);
    scene.add(points);

    // 4. Interaction logic
    const handleMouseMove = (event: MouseEvent) => {
      // Map screen coords to approximate plane coords
      targetMouse.current.x = (event.clientX / window.innerWidth - 0.5) * 16;
      targetMouse.current.y = -(event.clientY / window.innerHeight - 0.5) * 12;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth mouse follow
      mouse.current.lerp(targetMouse.current, 0.08);

      const positions = geometry.attributes.position;
      const count = positions.count;

      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        const ox = originalPositions[ix];
        const oy = originalPositions[iy];
        const oz = originalPositions[iz];

        // 1. Organic Base Wave (Breathing effect)
        const baseWave = Math.sin(ox * 0.3 + time * 0.5) * 0.1 + 
                         Math.cos(oy * 0.4 + time * 0.4) * 0.1;

        // 2. Gravity Field Displacement
        const dx = ox - mouse.current.x;
        const dy = oy - mouse.current.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // Bell curve force for deformation
        const influence = 1.2;
        const radius = 3.5;
        const force = Math.max(0, (radius - dist) / radius);
        const deformation = Math.pow(force, 2) * influence;

        // Apply deformation to Z and slightly pull vertices towards mouse in X/Y
        // This creates a "pucker" or gravity well effect
        const pull = 0.15;
        const nx = ox - (dx * deformation * pull);
        const ny = oy - (dy * deformation * pull);
        const nz = oz + baseWave + deformation;

        positions.setXYZ(i, nx, ny, nz);
      }
      
      positions.needsUpdate = true;
      
      // Gentle overall scene rotation for depth
      mesh.rotation.x = -Math.PI * 0.05 + mouse.current.y * 0.01;
      mesh.rotation.y = mouse.current.x * 0.01;
      points.rotation.copy(mesh.rotation);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      pointsMaterial.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-[#02040a] overflow-hidden">
      {/* Deep Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0a1428_0%,#02040a_100%)]"></div>
      
      {/* Grid Canvas */}
      <div 
        ref={containerRef} 
        className="w-full h-full opacity-60 scale-110"
      />
      
      {/* Subtle Fog / Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(2,4,10,0.8)_100%)]"></div>
      
      {/* High-end Film Grain */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
};

export default SpatialGravityGrid;
