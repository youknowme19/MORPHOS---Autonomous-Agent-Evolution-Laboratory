"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";
import { Color, IcosahedronGeometry, MeshStandardMaterial, SphereGeometry } from "three";

function Organism({ phase }: { phase: string }) {
  const group = useRef<Group>(null);
  const outerMesh = useRef<Mesh>(null);
  const coreMesh = useRef<Mesh>(null);
  const orbitGroup = useRef<Group>(null);

  const colors = useMemo(() => {
    if (phase === "failure") {
      return { main: new Color("#ff5722"), glow: new Color("#ff8a65"), inner: new Color("#ff3d00") };
    }
    if (phase === "running") {
      return { main: new Color("#06b6d4"), glow: new Color("#67e8f9"), inner: new Color("#0891b2") };
    }
    if (phase === "evolution") {
      return { main: new Color("#10b981"), glow: new Color("#6ee7b7"), inner: new Color("#059669") };
    }
    if (phase === "champion") {
      return { main: new Color("#facc15"), glow: new Color("#fef08a"), inner: new Color("#ca8a04") };
    }
    // discovery / default
    return { main: new Color("#8b5cf6"), glow: new Color("#c4b5fd"), inner: new Color("#7c3aed") };
  }, [phase]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (group.current) {
      group.current.rotation.y = t * 0.15;
    }

    if (outerMesh.current) {
      outerMesh.current.rotation.x = t * 0.22;
      outerMesh.current.rotation.z = t * 0.12;
      const scale = 1.12 + Math.sin(t * 1.5) * 0.06;
      outerMesh.current.scale.setScalar(scale);
      const mat = outerMesh.current.material as MeshStandardMaterial;
      mat.color.lerp(colors.main, 0.08);
      mat.emissive.lerp(colors.main, 0.08);
    }

    if (coreMesh.current) {
      coreMesh.current.rotation.y = -t * 0.3;
      const coreScale = 0.55 + Math.cos(t * 2.2) * 0.08;
      coreMesh.current.scale.setScalar(coreScale);
      const mat = coreMesh.current.material as MeshStandardMaterial;
      mat.color.lerp(colors.inner, 0.08);
      mat.emissive.lerp(colors.glow, 0.08);
    }

    if (orbitGroup.current) {
      orbitGroup.current.rotation.y = t * 0.45;
      orbitGroup.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
  });

  return (
    <group ref={group}>
      {/* Outer morphing cage */}
      <mesh ref={outerMesh} geometry={new IcosahedronGeometry(1.2, 2)}>
        <meshStandardMaterial
          roughness={0.2}
          metalness={0.6}
          emissiveIntensity={0.65}
          wireframe
        />
      </mesh>

      {/* Inner pulsating core */}
      <mesh ref={coreMesh} geometry={new IcosahedronGeometry(0.7, 1)}>
        <meshStandardMaterial
          roughness={0.1}
          metalness={0.8}
          emissiveIntensity={1.2}
          wireframe={false}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Orbiting specimen beads */}
      <group ref={orbitGroup}>
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2;
          const radius = 1.7;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * radius, Math.sin(angle * 2) * 0.3, Math.sin(angle) * radius]}
              geometry={new SphereGeometry(0.06, 12, 12)}
            >
              <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={1.5} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function MorphField({ phase = "discovery" }: { phase?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative h-[340px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-black/50 shadow-2xl backdrop-blur-md flex items-center justify-center">
      {/* Subtle state badge overlay */}
      <div className="absolute top-4 left-6 z-10 flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full animate-ping ${
            phase === "failure"
              ? "bg-orange-500"
              : phase === "running"
              ? "bg-cyan-400"
              : phase === "evolution"
              ? "bg-emerald-400"
              : phase === "champion"
              ? "bg-yellow-400"
              : "bg-purple-400"
          }`}
        />
        <span className="text-[10px] tracking-[0.25em] font-mono text-white/50">
          STATE: {phase.toUpperCase()}
        </span>
      </div>

      {mounted ? (
        <Canvas camera={{ position: [0, 0, 4.4], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[3, 3, 4]} intensity={25} color="#c4b5fd" />
          <pointLight position={[-3, -2, -3]} intensity={15} color="#38bdf8" />
          <Organism phase={phase} />
        </Canvas>
      ) : (
        <div className="text-[11px] font-mono tracking-widest text-cyan-200/40 animate-pulse">
          INITIALIZING NEURAL MORPH FIELD...
        </div>
      )}
    </div>
  );
}
