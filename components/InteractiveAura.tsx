
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const InteractiveAura: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const prevMouse = useRef(new THREE.Vector2(0, 0));
  const velocity = useRef(new THREE.Vector2(0, 0));
  const lerpMouse = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 1. Background Blobs (The Blurred Layer)
    const blobGroup = new THREE.Group();
    scene.add(blobGroup);

    const createBlob = (color: number, size: number, x: number, y: number) => {
      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.18,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0);
      return { 
        mesh, 
        initialPos: new THREE.Vector3(x, y, 0), 
        speed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2
      };
    };

    const blobs = [
      createBlob(0x3b82f6, 3.8, -2.5, 1.5), // Blue
      createBlob(0x8b5cf6, 3.2, 2.5, -1.5), // Purple
      createBlob(0x06b6d4, 2.8, 0, -2.5),   // Cyan
    ];
    blobs.forEach(b => blobGroup.add(b.mesh));

    // 2. Interactive Embers (The Sharp Layer)
    const emberCount = 120;
    const emberGeometry = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    const emberVelocities = new Float32Array(emberCount * 3);
    
    for (let i = 0; i < emberCount; i++) {
      emberPositions[i * 3] = (Math.random() - 0.5) * 15;
      emberPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      emberPositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    
    emberGeometry.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
    const emberMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const embers = new THREE.Points(emberGeometry, emberMaterial);
    scene.add(embers);

    // Event Handlers
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth - 0.5) * 10;
      mouse.current.y = -(event.clientY / window.innerHeight - 0.5) * 8;
    };

    const handleMouseDown = () => {
      blobs.forEach(b => {
        b.mesh.scale.set(1.4, 1.4, 1.4);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;

      // Calculate Mouse Velocity
      velocity.current.subVectors(mouse.current, prevMouse.current);
      prevMouse.current.copy(mouse.current);
      lerpMouse.current.lerp(mouse.current, 0.05);

      // Update Blobs
      blobs.forEach((b, i) => {
        const wanderX = Math.sin(time * b.speed + b.phase) * 0.8;
        const wanderY = Math.cos(time * b.speed * 0.9 + b.phase) * 0.8;

        // Target position influenced by mouse
        const targetX = b.initialPos.x + wanderX + lerpMouse.current.x * (0.3 + i * 0.05);
        const targetY = b.initialPos.y + wanderY + lerpMouse.current.y * (0.3 + i * 0.05);
        
        b.mesh.position.x += (targetX - b.mesh.position.x) * 0.1;
        b.mesh.position.y += (targetY - b.mesh.position.y) * 0.1;

        // Velocity Stretching: Stretch blob based on mouse movement speed
        const speed = velocity.current.length();
        const stretch = 1 + speed * 1.5;
        const targetScale = new THREE.Vector3(stretch, 1 / Math.max(0.5, stretch), 1);
        b.mesh.scale.lerp(targetScale, 0.1);
        
        // Align rotation with velocity direction
        if (speed > 0.01) {
          const angle = Math.atan2(velocity.current.y, velocity.current.x);
          b.mesh.rotation.z = angle;
        }
      });

      // Update Embers (Magnet effect)
      const positions = emberGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < emberCount; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        const dx = lerpMouse.current.x - positions[ix];
        const dy = lerpMouse.current.y - positions[iy];
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 3) {
          // Attract
          positions[ix] += dx * 0.02;
          positions[iy] += dy * 0.02;
        } else {
          // Drift back or stay
          positions[ix] += Math.sin(time + i) * 0.002;
          positions[iy] += Math.cos(time + i) * 0.002;
        }
      }
      emberGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-[#02040a] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0a1428_0%,#02040a_100%)]"></div>
      
      {/* Heavy Blur Layer (The Aura) */}
      <div 
        ref={containerRef} 
        className="w-full h-full opacity-70 scale-110 pointer-events-none"
        style={{ filter: 'blur(90px) contrast(1.2)' }}
      />
      
      {/* Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      {/* Decorative center light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
};

export default InteractiveAura;
