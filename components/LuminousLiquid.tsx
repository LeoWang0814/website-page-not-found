
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const LuminousLiquid: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec2 uResolution;
      varying vec2 vUv;

      // Classic 2D noise
      vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                       dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                   mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                       dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
        vec2 uv = vUv;
        float ratio = uResolution.x / uResolution.y;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= ratio;

        vec2 m = uMouse * 2.0 - 1.0;
        m.x *= ratio;

        // Mouse distortion
        float d = distance(p, m);
        float force = 0.15 / (d + 0.4);
        vec2 dir = normalize(p - m);
        uv += dir * force * 0.1;

        // Layered noise for liquid effect
        float n = noise(uv * 3.0 + uTime * 0.2);
        n += noise(uv * 5.0 - uTime * 0.3) * 0.5;
        n += noise(uv * 10.0 + uTime * 0.5) * 0.25;

        // Colors
        vec3 color1 = vec3(0.1, 0.2, 0.5); // Royal Blue
        vec3 color2 = vec3(0.4, 0.1, 0.6); // Violet
        vec3 color3 = vec3(0.0, 0.7, 0.8); // Cyan
        vec3 color4 = vec3(0.9, 0.9, 1.0); // Highlight White

        vec3 color = mix(color1, color2, n * 0.5 + 0.5);
        color = mix(color, color3, sin(uTime * 0.1 + uv.x * 2.0) * 0.5 + 0.5);
        
        // Spotlight around mouse
        float spot = smoothstep(0.6, 0.0, d);
        color = mix(color, color4, spot * 0.3);

        // Brightness and contrast
        color *= 1.1;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.current.x = e.clientX / window.innerWidth;
      targetMouse.current.y = 1.0 - (e.clientY / window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime();
      
      // Smooth mouse
      mouse.current.lerp(targetMouse.current, 0.05);
      uniforms.uMouse.value.copy(mouse.current);

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
    <div className="fixed inset-0 z-0 bg-[#020617] overflow-hidden">
      <div 
        ref={containerRef} 
        className="w-full h-full opacity-90 scale-105"
        style={{ filter: 'blur(30px) saturate(1.2)' }}
      />
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
    </div>
  );
};

export default LuminousLiquid;
