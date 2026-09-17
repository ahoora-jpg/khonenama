"use client";

import { Float, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function Curtain() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.35) * 0.07;
    group.current.rotation.x = Math.cos(t * 0.28) * 0.018;
  });

  return (
    <group ref={group} position={[0.45, 0.2, 0]} rotation={[0, -0.2, -0.02]}>
      {Array.from({ length: 11 }).map((_, index) => {
        const x = (index - 5) * 0.19;
        const depth = Math.sin(index * 1.35) * 0.11;
        const warm = index % 2 === 0 ? "#d29a74" : "#ad6f50";
        return (
          <RoundedBox
            key={index}
            args={[0.23, 3.15, 0.14]}
            radius={0.07}
            smoothness={4}
            position={[x, 0, depth]}
          >
            <meshStandardMaterial color={warm} roughness={0.58} metalness={0.04} />
          </RoundedBox>
        );
      })}
      <mesh position={[0, 1.66, 0]}>
        <boxGeometry args={[2.35, 0.08, 0.18]} />
        <meshStandardMaterial color="#3b3029" roughness={0.35} />
      </mesh>
    </group>
  );
}

function FloorSample() {
  return (
    <Float speed={1.1} rotationIntensity={0.22} floatIntensity={0.28}>
      <group position={[-1.55, -1.18, 0.65]} rotation={[0.24, 0.32, -0.16]}>
        {Array.from({ length: 7 }).map((_, index) => (
          <RoundedBox
            key={index}
            args={[0.33, 1.65, 0.11]}
            radius={0.035}
            smoothness={3}
            position={[(index - 3) * 0.27, 0, 0]}
          >
            <meshStandardMaterial
              color={index % 2 === 0 ? "#8b5c3e" : "#b7815a"}
              roughness={0.72}
            />
          </RoundedBox>
        ))}
      </group>
    </Float>
  );
}

function WallSample() {
  return (
    <Float speed={0.85} rotationIntensity={0.18} floatIntensity={0.22}>
      <group position={[-1.55, 1.1, -0.15]} rotation={[-0.06, 0.3, 0.12]}>
        <RoundedBox args={[1.7, 1.35, 0.18]} radius={0.12} smoothness={4}>
          <meshStandardMaterial color="#506555" roughness={0.8} />
        </RoundedBox>
        <mesh position={[0.25, 0.15, 0.14]}>
          <torusGeometry args={[0.35, 0.08, 22, 64]} />
          <meshStandardMaterial color="#d7b293" roughness={0.4} metalness={0.08} />
        </mesh>
      </group>
    </Float>
  );
}

function SceneGroup() {
  const root = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!root.current) return;
    const pointer = state.pointer;
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, pointer.x * 0.12, 0.04);
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -pointer.y * 0.07, 0.04);
  });

  return (
    <group ref={root}>
      <Curtain />
      <FloorSample />
      <WallSample />
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="hero-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.15, 5.9], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        performance={{ min: 0.65 }}
      >
        <ambientLight intensity={1.65} />
        <directionalLight position={[4, 6, 5]} intensity={3.2} color="#fff3df" />
        <directionalLight position={[-4, 1, 3]} intensity={1.55} color="#d7e5d5" />
        <pointLight position={[0, -2, 4]} intensity={1.4} color="#d58b5d" />
        <Suspense fallback={null}>
          <SceneGroup />
        </Suspense>
      </Canvas>
      <div className="scene-chip scene-chip-top">✦ فروشگاه‌های منتخب</div>
      <div className="scene-business glass-panel">
        <span className="scene-avatar">خ</span>
        <span>
          <strong>شروع از برغان</strong>
          <small>کرج · بورس پرده و دکوراسیون</small>
        </span>
      </div>
    </div>
  );
}
