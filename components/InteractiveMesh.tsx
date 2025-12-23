
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const InteractiveMesh: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothedMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create a dense grid for the "Silk" effect
    const width = 16;
    const height = 12;
    const segmentsX = 40;
    const segmentsY = 30;
    const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    
    // Rotate geometry to lie flat-ish
    geometry.rotateX(-Math.PI * 0.25);

    const count = geometry.attributes.position.count;
    const originalPositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      originalPositions[i * 3] = geometry.attributes.position.getX(i);
      originalPositions[i * 3 + 1] = geometry.attributes.position.getY(i);
      originalPositions[i * 3 + 2] = geometry.attributes.position.getZ(i);
    }

    const material = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    const meshPoints = new THREE.Points(geometry, material);
    scene.add(meshPoints);

    // Subtle Grid Lines
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x1e3a8a,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const meshWireframe = new THREE.Mesh(geometry, wireframeMaterial);
    scene.add(meshWireframe);

    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse to 3D space coordinates (approximate plane size)
      mouseRef.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 10,
        y: -(event.clientY / window.innerHeight - 0.5) * 8,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth mouse movement
      smoothedMouse.current.x += (mouseRef.current.x - smoothedMouse.current.x) * 0.08;
      smoothedMouse.current.y += (mouseRef.current.y - smoothedMouse.current.y) * 0.08;

      const positions = geometry.attributes.position;
      
      for (let i = 0; i < count; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        // Wave motion
        const wave = Math.sin(ox * 0.5 + time * 0.8) * 0.15 + 
                     Math.cos(oy * 0.5 + time * 0.6) * 0.15;

        // Mouse interaction: Distance to point
        // Note: ox, oy are the flat plane coordinates before rotation, 
        // we adjust interaction to feel right in screen space
        const dx = ox - smoothedMouse.current.x;
        const dy = oy - smoothedMouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const interaction = Math.max(0, 1.5 - dist) * 0.6;

        positions.setXYZ(i, ox, oy, oz + wave + interaction);
      }
      positions.needsUpdate = true;

      // Adjust mesh opacity based on movement for "glimmer" effect
      material.opacity = 0.2 + Math.sin(time * 0.5) * 0.1;

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
      wireframeMaterial.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 pointer-events-none" 
      style={{ 
        background: 'linear-gradient(to bottom, #020617, #030712)' 
      }} 
    />
  );
};

export default InteractiveMesh;
