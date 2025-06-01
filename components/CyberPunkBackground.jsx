
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CyberpunkBackground = () => {
  // Create a reference to the shader material
  const materialRef = useRef();
  
  // Create shader material with custom shaders
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform vec2 u_resolution;
        varying vec2 vUv;
        
        // Hash function for noise
        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        
        // Grid with glow effect
        float grid(vec2 uv, float scale) {
          vec2 grid = fract(uv * scale);
          vec2 smoothGrid = smoothstep(0.95, 0.99, grid) + smoothstep(0.05, 0.01, grid);
          return smoothGrid.x + smoothGrid.y;
        }
        
        // Distance field for a line
        float line(vec2 uv, vec2 start, vec2 end, float thickness) {
          vec2 dir = end - start;
          float len = length(dir);
          dir = dir / len;
          
          // vec2 perpDir = vec2(-dir.y, dir.x);
          
          vec2 pos = uv - start;
          float projection = (dot(pos, dir));
          float distance = length(pos - dir * projection);
          
          return smoothstep(thickness, thickness * 0.1, distance);
        }
        
        void main() {
          vec2 uv = vUv;
          vec2 centered = uv * 2.0 - 1.0;
          
          // Base dark blue gradient background
          vec3 color = mix(
            vec3(0.02, 0.01, 0.08),
            vec3(0.05, 0.02, 0.12),
            pow(uv.y, 2.0)
          );
          
          // Grid pattern
          float gridEffect = grid(uv, 40.0) * 0.02;
          color += vec3(0.0, 0.3, 0.5) * gridEffect;
          
          // Add some subtle noise
          float noise = hash(uv * 100.0 + u_time * 0.05) * 0.015;
          color += vec3(noise);
          
          // Add some horizontal lines
          for (int i = 0; i < 5; i++) {
            float y = float(i) / 5.0;
            float offset = hash(vec2(float(i), 345.67)) * 0.1 + sin(u_time * 0.2 + float(i)) * 0.03;
            y = y + offset;
            
            float line = smoothstep(0.003, 0.0, abs(uv.y - y));
            color += vec3(0.0, 0.4, 0.6) * line * 0.3;
          }
          
          // Add some vertical lines
          for (int i = 0; i < 8; i++) {
            float x = float(i) / 8.0;
            float offset = hash(vec2(float(i), 123.45)) * 0.1 + sin(u_time * 0.1 + float(i) * 2.0) * 0.05;
            x = x + offset;
            
            float line = smoothstep(0.002, 0.0, abs(uv.x - x));
            color += vec3(0.0, 0.3, 0.5) * line * 0.15;
          }
          
          // Add a subtle vignette effect
          float vignette = smoothstep(1.0, 0.3, length(centered));
          color *= vignette;
          
          // Add a pulsing glow in the center
          float pulse = sin(u_time * 0.5) * 0.5 + 0.5;
          float centerGlow = smoothstep(0.7, 0.0, length(centered));
          color += vec3(pulse * 0.05, pulse * 0.1, pulse * 0.2) * centerGlow;
          
          // Add some moving tech-like lines
          for (int i = 0; i < 3; i++) {
            float t = u_time * 0.2 + float(i) * 2.0;
            vec2 start = vec2(sin(t) * 0.5 + 0.5, cos(t * 1.3) * 0.5 + 0.5);
            vec2 end = vec2(sin(t + 1.0) * 0.5 + 0.5, cos(t * 0.7 + 1.0) * 0.5 + 0.5);
            
            float techLine = line(uv, start, end, 0.004);
            color += vec3(0.0, 0.5, 0.8) * techLine * 0.3;
          }
          
          // Add cyberpunk pink accent glow
          float pinkGlow = smoothstep(0.7, 0.0, abs(uv.y - 0.3) + abs(uv.x - 0.7) * 2.0);
          pinkGlow *= sin(u_time) * 0.5 + 0.5;
          color += vec3(0.8, 0.1, 0.5) * pinkGlow * 0.15;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      depthWrite: false
    });
  }, []);

  // Update time uniform on each frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
    }
  });

  return (
    <>
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[50, 50]} />
        <primitive object={shaderMaterial} ref={materialRef} />
      </mesh>
    </>
  );
};

export default CyberpunkBackground;
