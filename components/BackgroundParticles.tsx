
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const BackgroundParticles: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothedMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const particleCount = window.innerWidth > 768 ? 4000 : 1500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 12;
      const y = (Math.random() - 0.5) * 12;
      const z = (Math.random() - 0.5) * 8;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;

      const mix = Math.random();
      colors[i * 3] = 0.1 + mix * 0.1; // R (暗色调)
      colors[i * 3 + 1] = 0.2 + mix * 0.3; // G
      colors[i * 3 + 2] = 0.6 + mix * 0.4; // B
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.02, // 减小尺寸
      vertexColors: true,
      transparent: true,
      opacity: 0.4, // 降低透明度更柔和
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = {
        x: (event.clientX / window.innerWidth - 0.5),
        y: -(event.clientY / window.innerHeight - 0.5),
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
      const elapsedTime = clock.getElapsedTime();

      // 平滑鼠标数据 (Lerp)
      smoothedMouse.current.x += (mouseRef.current.x - smoothedMouse.current.x) * 0.05;
      smoothedMouse.current.y += (mouseRef.current.y - smoothedMouse.current.y) * 0.05;

      if (!prefersReducedMotion) {
        const positionsAttr = geometry.attributes.position;
        for (let i = 0; i < particleCount; i++) {
          const ix = i * 3;
          const iy = i * 3 + 1;

          // 减慢波浪频率和幅度 (0.5 -> 0.2)
          positions[ix] = initialPositions[ix] + Math.sin(elapsedTime * 0.2 + initialPositions[ix]) * 0.05;
          positions[iy] = initialPositions[iy] + Math.cos(elapsedTime * 0.15 + initialPositions[iy]) * 0.05;

          // 鼠标影响变得更加深沉
          positions[ix] += smoothedMouse.current.x * 0.4;
          positions[iy] += smoothedMouse.current.y * 0.4;
        }
        positionsAttr.needsUpdate = true;
        
        // 极慢的整体旋转 (0.05 -> 0.015)
        points.rotation.y = elapsedTime * 0.015;
        points.rotation.x = elapsedTime * 0.01;
      }

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
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 pointer-events-none" 
      style={{ 
        background: 'radial-gradient(circle at 50% 50%, #080d1a 0%, #030712 100%)' 
      }} 
    />
  );
};

export default BackgroundParticles;
