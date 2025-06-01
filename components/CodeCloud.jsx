import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Vertex Shader
const combinedVertex = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normal;
    vPosition = position;
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader
const combinedFragment = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform sampler2D texture3;
  uniform sampler2D texture4;
  uniform sampler2D texture5;
  uniform sampler2D texture6;
  uniform sampler2D texture7;
  uniform sampler2D texture8;
  uniform sampler2D texture9;
  uniform float random;

  void main() {
    float selfRandom = vUv.y - fract(vUv.y);
    float k = abs(sin(selfRandom * random)) * 10.0;

    vec4 textureColor;
    // Fixed texture selection logic using floor to get integer ranges
    int textureIndex = int(floor(k));
    
    if (textureIndex == 0) {
      textureColor = texture2D(texture1, vec2(fract(vUv.x), fract(vUv.y)));
    } else if (textureIndex == 1) {
      textureColor = texture2D(texture2, vec2(fract(vUv.x), fract(vUv.y)));
    } else if (textureIndex == 2) {
      textureColor = texture2D(texture3, vec2(fract(vUv.x), fract(vUv.y)));
    } else if (textureIndex == 3) {
      textureColor = texture2D(texture4, vec2(fract(vUv.x), fract(vUv.y)));
    } else if (textureIndex == 4) {
      textureColor = texture2D(texture5, vec2(fract(vUv.x), fract(vUv.y)));
    } else if (textureIndex == 5) {
      textureColor = texture2D(texture6, vec2(fract(vUv.x), fract(vUv.y)));
    } else if (textureIndex == 6) {
      textureColor = texture2D(texture7, vec2(fract(vUv.x), fract(vUv.y)));
    } else if (textureIndex == 7) {
      textureColor = texture2D(texture8, vec2(fract(vUv.x), fract(vUv.y)));
    } else {
      textureColor = texture2D(texture9, vec2(fract(vUv.x), fract(vUv.y)));
    }

    float fogDistance = length(vWorldPosition - cameraPosition);
    float fogAlpha = 1.0 - smoothstep(10.0, 30.0, fogDistance);

    vec3 finalColor = mix(vec3(0.0, 0.0, 0.05), textureColor.rgb, fogAlpha);

    gl_FragColor = vec4(finalColor, textureColor.a * fogAlpha);
  }
`;

// Cloud Component
const Cloud = () => {
  const cloudRef = useRef();
  const range = 50;

  // Load textures
  const textures = useTexture([
    'https://z2586300277.github.io/3d-file-server/threeExamples/application/codeCloud/1.png',
    'https://z2586300277.github.io/3d-file-server/threeExamples/application/codeCloud/2.png',
    'https://z2586300277.github.io/3d-file-server/threeExamples/application/codeCloud/3.png',
    'https://z2586300277.github.io/3d-file-server/threeExamples/application/codeCloud/4.png',
    'https://z2586300277.github.io/3d-file-server/threeExamples/application/codeCloud/5.png',
    'https://z2586300277.github.io/3d-file-server/threeExamples/application/codeCloud/6.png',
    'https://z2586300277.github.io/3d-file-server/threeExamples/application/codeCloud/7.png',
    'https://z2586300277.github.io/3d-file-server/threeExamples/application/codeCloud/8.png',
    'https://z2586300277.github.io/3d-file-server/threeExamples/application/codeCloud/9.png',
  ]);

  // Generate planes with unique materials
 const planes = useMemo(() => {
    return Array.from({ length: 200 }).map(() => {
      const position = new THREE.Vector3(
        Math.random() * range - range / 2,
        Math.random() * 150.0,
        Math.random() * range - range / 2
      );
      const vY = 0.005 + Math.random() * 0.01;

      const material = new THREE.ShaderMaterial({
        vertexShader: combinedVertex,
        fragmentShader: combinedFragment,
        uniforms: {
          texture1: { value: textures[0] },
          // ... initialize all texture uniforms up to texture9
          random: { value: Math.random() },
        },
        transparent: true,
        depthWrite: false,
      });

      return {
        position,
        velocity: vY,
        material,
        initialRandom: Math.random(), // Store initial random for variation
      };
    });
  }, [textures]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    cloudRef.current?.children.forEach((plane) => {
      // Update position
      plane.position.y += plane.userData.velocity*10;
      if (plane.position.y > range / 10) plane.position.y = -10;

      // Update random uniform with time-based variation
      plane.material.uniforms.random.value = time + plane.userData.initialRandom;
    });
  });

  return (
    <group position={[0,2,0]} ref={cloudRef}>
      {planes.map((plane, i) => (
        <mesh
          key={i}
          position={plane.position}
          userData={{ velocity: plane.velocity }}
          material={plane.material}
        >
          <planeGeometry args={[5, 5]} />
        </mesh>
      ))}
    </group>
  );
};

// Main Component
const CodeCloud = () => {
  return <Cloud />;
};

export default CodeCloud;