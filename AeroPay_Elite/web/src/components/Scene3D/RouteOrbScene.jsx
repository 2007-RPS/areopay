import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function OrbitSphere({ speed, riskTone, glowTone }) {
  const groupRef = useRef(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * speed;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1.15, 24, 24]} />
        <meshStandardMaterial color={glowTone} metalness={0.35} roughness={0.24} emissive="#0c3351" emissiveIntensity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2.7, 0.2, 0]}>
        <torusGeometry args={[1.8, 0.04, 12, 64]} />
        <meshStandardMaterial color={riskTone} emissive="#43280d" emissiveIntensity={0.24} />
      </mesh>
      <mesh position={[0.25, 0.34, 1.16]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#8aa8ff" emissiveIntensity={1.0} />
      </mesh>
    </group>
  );
}

export default function RouteOrbScene({ delayRiskLabel = "Medium", weatherSeverity = "moderate" }) {
  const highRisk = delayRiskLabel === "High" || weatherSeverity === "elevated";
  const speed = highRisk ? 0.36 : 0.24;
  const riskTone = highRisk ? "#ff8e8e" : "#ffbe5a";
  const glowTone = highRisk ? "#8aa8ff" : "#38d8ff";

  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 42 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#060b16"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3.2, 2.4, 4]} intensity={1.1} color="#b8f2ff" />
      <pointLight position={[-3, -1, 1.5]} intensity={0.7} color="#ffbe5a" />
      <OrbitSphere speed={speed} riskTone={riskTone} glowTone={glowTone} />
    </Canvas>
  );
}
