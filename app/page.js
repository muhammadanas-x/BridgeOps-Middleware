'use client';
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import CodeCloud from "@/components/CodeCloud";
import CyberpunkBackground from "@/components/CyberPunkBackground";

// Shader code
const vertexShader = `
uniform float uTime;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

vec2 random2D(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() {
    vUv = uv;
    
    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    // Glitch effect
    float glitchTime = uTime * 0.5;
    float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) + sin(glitchTime * 8.76);
    glitchStrength *= 0.05; // Reduced strength
    
    vec2 randomOffset = random2D(modelPosition.xz + uTime) - 0.5;
    modelPosition.xz += randomOffset * glitchStrength;

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // Varyings
    vPosition = modelPosition.xyz;
    vNormal = normalMatrix * normal;
}
`;

const fragmentShader = `
uniform vec3 uColor;
uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    // Normal
    vec3 normal = normalize(vNormal);
    if(!gl_FrontFacing)
        normal *= - 1.0;

    // Stripes
    float stripes = mod((vPosition.y - uTime * 0.02) * 20.0, 1.0);
    stripes = pow(stripes, 3.0);

    // Fresnel
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float fresnel = dot(viewDirection, normal) + 1.0;
    fresnel = pow(fresnel, 2.0);

    // Falloff
    float falloff = smoothstep(0.8, 0.2, fresnel);

    // Holographic
    float holographic = stripes * fresnel;
    holographic += fresnel * 1.25;
    holographic *= falloff;

    // Final color
    vec3 color = vec3(0.0, 1.0, 1.0); // Default blue holographic color
    gl_FragColor = vec4(color, holographic);
}
`;


const trailVertex = `
varying vec2 vUv;
uniform float uTime;
uniform float uSpeed;

void main()
{
  vec3 pos = position;
  float distanceUV = distance(uv, vec2(0.0,0.5)) * 0.01;
  vec3 normal = normalize(normalMatrix * normal);
  vec3 offset = normal * sin(uTime * 10.0 * uSpeed) *  0.01;
  pos += offset;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vUv = uv;
}

`

const trailFragment = `
uniform float uTime;
varying vec2 vUv;
uniform float uSpeed;


void main()
{
  float fraction = pow(fract(vUv.x + uTime * uSpeed),2.0);

  vec3 finalColor = vec3(0.0, 1.0, 1.0);
  
  gl_FragColor = vec4(finalColor * (fraction), fraction * sin(uTime * 2.0) * 0.5 + 0.5);
}
`



function Sphere() {
  const meshRef = useRef();
  const uniformsRef = useRef({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0.0, 1.0, 1.0) }
  });

  useFrame((state) => {
    const { clock } = state;
    uniformsRef.current.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        uniforms={uniformsRef.current}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.DoubleSide}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ...rest of the code remains the same


function Trail(props) {
  const uniformsRef = useRef({
    uTime: { value: 0 },
    uSpeed: { value: props.speed }
  });

  useFrame((state) => {
    uniformsRef.current.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh rotation={props.rotation}>
      <torusGeometry args={[1.3, 0.01]} />
      <shaderMaterial 
        vertexShader={trailVertex} 
        fragmentShader={trailFragment} 
        transparent 
        blending={THREE.AdditiveBlending}
        uniforms={uniformsRef.current}
      />
    </mesh>
  );
}

function GltfModel({ url, position = [0, 0, 0], scale = 1, rotation = [0, 0, 0] }) {
  console.log('Model URL:', {
    providedUrl: url,
    fullPath: window.location.origin + url,
    publicPath: process.cwd() + '/public' + url
  });
  
  const { scene } = useGLTF(url);
  const modelRef = useRef();

  useFrame(() => {
    if (modelRef.current) {
      // Optional: Add rotation animation
      modelRef.current.rotation.y += 0.005;
    }
  });

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      position={position} 
      scale={scale} 
      rotation={rotation}
    />
  );
}




export default function Home() {





  return (
    <div className="relative h-screen w-screen bg-black">
       <nav className="absolute top-0 left-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="font-mono text-4xl font-bold text-cyan-400 glitch-text-small flex items-center">
                <span className="mr-1 text-pink-500">[</span>
                BRIDGE<span className="text-pink-500">_</span>OPS
                <span className="ml-1 text-pink-500">]</span>
              </div>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                <a href="#" className="font-mono text-gray-300 hover:text-cyan-400 transition-colors duration-200 border-b border-transparent hover:border-cyan-400 px-1 py-1">HOME</a>
                <a href="#" className="font-mono text-gray-300 hover:text-cyan-400 transition-colors duration-200 border-b border-transparent hover:border-cyan-400 px-1 py-1">FEATURES</a>
                <a href="#" onClick={() => setIsDocsOpen(true)} className="font-mono text-gray-300 hover:text-cyan-400 transition-colors duration-200 border-b border-transparent hover:border-cyan-400 px-1 py-1">DOCS</a>
                <a href="#" className="font-mono text-gray-300 hover:text-cyan-400 transition-colors duration-200 border-b border-transparent hover:border-cyan-400 px-1 py-1">ABOUT</a>
                <a href="#" className="font-mono bg-pink-600/80 hover:bg-pink-700 text-white px-4 py-2 border-l border-t border-cyan-400 transition-all duration-300 hover:shadow-glow">CONNECT</a>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button className="text-gray-400 hover:text-white focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <Canvas 
        camera={{ 
          position: [0, 0, 3.5],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
      >
<       fog attach="fog" args={['#000000', 20, 50]} />
        <color attach="background" args={['#050510']} />
        <CyberpunkBackground />
        
           <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
        />
        <ambientLight intensity={0.5} />
        <group position={[1, 0, 0]}>
        <Sphere />
        <Trail speed={0.9}/>
        <Trail rotation={[Math.PI/ 3 , 0, 0]} speed={0.2}/>
        <Trail rotation={[-Math.PI/3 , 0 ,0]} speed={0.9}/>
        <Trail rotation={[0, Math.PI/3 , 0]} speed={0.6}/>
        <Trail rotation={[0, -Math.PI/3 , 0]} speed={2.0}/>
        <Trail rotation={[0, 0, Math.PI/3]} speed={0.4}/>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <GltfModel url="/key_card.glb" position={[0.1, 0, 0]} scale={0.003} rotation={[0, 0, 0]} />
        </Float>
        </group>
      
        <CodeCloud/>
        
        </Canvas>

 <div className="absolute top-0 left-0 w-3/5 h-full flex flex-col justify-center pl-24">
        <div className="mb-12">
          <h1 className="font-mono text-7xl font-bold text-cyan-400 mb-4 tracking-tight glitch-text">
            BRIDGE<span className="text-pink-500">_</span>OPS
          </h1>
          <h2 className="font-mono text-3xl text-cyan-100 mb-8 tracking-wider">
            ENTER THE <span className="text-pink-500">DATASTREAM</span>
          </h2>
          <p className="font-mono text-xl text-white max-w-lg">
Supercharge your Next.js apps with auto-generated middleware routes. Define rules, auth, redirects, and more — all in seconds. No boilerplate, no hassle.

          </p>
        </div>
        
        <div className="flex space-x-6">
          <button className="bg-pink-600 hover:bg-pink-700 text-white font-mono text-xl py-4 px-10 border-l-2 border-t-2 border-cyan-400 transition-all duration-300 transform hover:translate-y-1 hover:shadow-glow">
            INITIALIZE
          </button>
          <button className="bg-transparent hover:bg-cyan-900/30 text-cyan-400 font-mono text-xl py-4 px-10 border-2 border-cyan-500 transition-all duration-300 transform hover:translate-y-1 hover:shadow-glow">
            READ_DOCS
          </button>
        </div>
      </div>

      {/* CSS for additional effects */}
      <style jsx>{`
        @keyframes glitch {
          0% {
            text-shadow: 0.05em 0 0 rgba(255, 0, 255, 0.75),
                         -0.05em -0.025em 0 rgba(0, 255, 255, 0.75),
                         0.025em 0.05em 0 rgba(0, 255, 0, 0.75);
          }
          15% {
            text-shadow: -0.05em -0.025em 0 rgba(255, 0, 255, 0.75),
                         0.025em 0.025em 0 rgba(0, 255, 255, 0.75),
                         -0.05em -0.05em 0 rgba(0, 255, 0, 0.75);
          }
          50% {
            text-shadow: 0.025em 0.05em 0 rgba(255, 0, 255, 0.75),
                         0.05em 0 0 rgba(0, 255, 255, 0.75),
                         0 -0.05em 0 rgba(0, 255, 0, 0.75);
          }
          100% {
            text-shadow: -0.025em 0 0 rgba(255, 0, 255, 0.75),
                         -0.025em -0.025em 0 rgba(0, 255, 255, 0.75),
                         -0.025em -0.05em 0 rgba(0, 255, 0, 0.75);
          }
        }

        .glitch-text {
          animation: glitch 2.5s infinite;
        }

        .hover\\:shadow-glow:hover {
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </div>
  );
}