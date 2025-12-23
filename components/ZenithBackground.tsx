
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ZenithBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const smoothedMouse = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 1. Zenith Plane (The Silk Mesh)
    const geometry = new THREE.PlaneGeometry(16, 12, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x0a1020,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 2. Lighting System (The "High-End" look)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // Reactive Spotlight
    const spotlight = new THREE.PointLight(0x3b82f6, 15, 12);
    spotlight.position.set(0, 0, 2);
    scene.add(spotlight);

    // Subtle side fill light
    const fillLight = new THREE.DirectionalLight(0x8b5cf6, 0.5);
    fillLight.position.set(-5, 5, 2);
    scene.add(fillLight);

    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth - 0.5) * 10;
      mouse.current.y = -(event.clientY / window.innerHeight - 0.5) * 8;
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

      // Ultra-smooth lerping
      smoothedMouse.current.lerp(mouse.current, 0.04);

      // Spotlight follows mouse
      spotlight.position.x = smoothedMouse.current.x;
      spotlight.position.y = smoothedMouse.current.y;
      spotlight.intensity = 15 + Math.sin(time) * 2; // Subtle breathing

      // Deform Geometry based on mouse
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        
        // Base organic wave
        const wave = Math.sin(x * 0.5 + time * 0.5) * 0.1 + 
                     Math.cos(y * 0.3 + time * 0.4) * 0.1;

        // Interaction "Dip"
        const dx = x - smoothedMouse.current.x;
        const dy = y - smoothedMouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const interaction = Math.exp(-dist * dist * 0.5) * 0.4;

        positions.setZ(i, wave + interaction);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals(); // Crucial for nice reflections

      // Gentle rotation parallax
      mesh.rotation.y = smoothedMouse.current.x * 0.02;
      mesh.rotation.x = -smoothedMouse.current.y * 0.02;

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
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-[#010205] overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1d] to-[#010205]"></div>
      
      {/* Three.js Layer with calibrated blur */}
      <div 
        ref={containerRef} 
        className="w-full h-full opacity-80 scale-105"
        style={{ filter: 'blur(40px) brightness(1.1)' }}
      />
      
      {/* High-end Film Grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
    </div>
  );
};

export default ZenithBackground;
