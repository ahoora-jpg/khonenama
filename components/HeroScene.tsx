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
    group.current.rotation.y = Math.sin(t * 0.3) * 0.08;
    group.current.position.y = 0.05 + Math.sin(t * 0.5) * 0.025;
  });

  return (
    <group ref={group} position={[0.78, 0.28, 0.05]} rotation={[0, -0.3, -0.015]}>
      {Array.from({ length: 13 }).map((_, index) => {
        const x = (index - 6) * 0.165;
        const depth = Math.sin(index * 1.22) * 0.12;
        return (
          <RoundedBox key={index} args={[0.2, 3.35, 0.16]} radius={0.065} smoothness={4} position={[x, 0, depth]}>
            <meshPhysicalMaterial
              color={index % 2 === 0 ? "#cf8e68" : "#a65f42"}
              roughness={0.54}
              metalness={0.02}
              clearcoat={0.08}
            />
          </RoundedBox>
        );
      })}
      <mesh position={[0, 1.78, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 2.5, 28]} />
        <meshStandardMaterial color="#3d312a" roughness={0.28} metalness={0.35} />
      </mesh>
    </group>
  );
}

function FloorSample() {
  return (
    <Float speed={1} rotationIntensity={0.18} floatIntensity={0.26}>
      <group position={[-1.55, -1.26, 0.58]} rotation={[0.34, 0.25, -0.14]}>
        {Array.from({ length: 8 }).map((_, index) => (
          <RoundedBox key={index} args={[0.32, 1.75, 0.1]} radius={0.03} smoothness={3} position={[(index - 3.5) * 0.255, 0, 0]}>
            <meshStandardMaterial color={index % 2 === 0 ? "#7f5339" : "#ae7652"} roughness={0.68} />
          </RoundedBox>
        ))}
      </group>
    </Float>
  );
}

function AccentPanel() {
  return (
    <Float speed={0.8} rotationIntensity={0.12} floatIntensity={0.2}>
      <group position={[-1.55, 1.22, -0.2]} rotation={[-0.04, 0.28, 0.1]}>
        <RoundedBox args={[1.78, 1.42, 0.2]} radius={0.16} smoothness={5}>
          <meshPhysicalMaterial color="#4f6755" roughness={0.72} clearcoat={0.08} />
        </RoundedBox>
        <mesh position={[0.32, 0.18, 0.16]}>
          <torusGeometry args={[0.38, 0.075, 24, 72]} />
          <meshStandardMaterial color="#d8b08e" roughness={0.34} metalness={0.18} />
        </mesh>
      </group>
    </Float>
  );
}

function Pedestal() {
  return (
    <group position={[0.15, -1.72, -0.35]}>
      <mesh>
        <cylinderGeometry args={[1.95, 2.15, 0.38, 72]} />
        <meshPhysicalMaterial color="#eee5d8" roughness={0.6} clearcoat={0.12} />
      </mesh>
      <mesh position={[0, -0.19, 0]}>
        <cylinderGeometry args={[2.15, 2.15, 0.05, 72]} />
        <meshStandardMaterial color="#c6b4a3" roughness={0.45} />
      </mesh>
    </group>
  );
}

function SceneGroup() {
  const root = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!root.current) return;
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, state.pointer.x * 0.13, 0.035);
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -state.pointer.y * 0.075, 0.035);
  });

  return (
    <group ref={root}>
      <Pedestal />
      <Curtain />
      <FloorSample />
      <AccentPanel />
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="hero-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.35]}
        camera={{ position: [0, 0.2, 6.2], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        performance={{ min: 0.65 }}
      >
        <fog attach="fog" args={["#e8dfd3", 7.5, 11]} />
        <ambientLight intensity={1.45} />
        <directionalLight position={[4, 6, 5]} intensity={3.1} color="#fff1dc" />
        <directionalLight position={[-4, 2, 2]} intensity={1.35} color="#d4e0d2" />
        <pointLight position={[0, -1.2, 4]} intensity={1.15} color="#d27d50" />
        <Suspense fallback={null}>
          <SceneGroup />
        </Suspense>
      </Canvas>

      <div className="scene-chip scene-chip-top">✦ انتخاب‌های الهام‌بخش</div>
      <div className="scene-business glass-panel scene-business-premium">
        <span className="scene-avatar">خ</span>
        <span>
          <strong>شروع از برغان</strong>
          <small>کرج · پرده، دکور و اجرای تخصصی</small>
        </span>
      </div>
    </div>
  );
}
