import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import { useActiveProject, useStore } from "../store";
import { WardrobeElement } from "../types";
import * as THREE from "three";

const MM = 0.001; // milimetry -> metry sceny

function ElementMesh({ el }: { el: WardrobeElement }) {
  const selectedId = useStore((s) => s.selectedElementId);
  const setSelected = useStore((s) => s.setSelected);
  const isSelected = selectedId === el.id;

  const w = el.width * MM;
  const h = el.height * MM;
  const d = el.depth * MM;

  const boxGeom = useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);
  const edgesGeom = useMemo(() => new THREE.EdgesGeometry(boxGeom), [boxGeom]);

  useEffect(() => {
    return () => {
      boxGeom.dispose();
      edgesGeom.dispose();
    };
  }, [boxGeom, edgesGeom]);

  return (
    <group
      position={[el.x * MM, el.y * MM, el.z * MM]}
      onClick={(e) => {
        e.stopPropagation();
        setSelected(el.id);
      }}
    >
      <mesh geometry={boxGeom} castShadow receiveShadow>
        <meshStandardMaterial
          color={el.color}
          roughness={el.type === "drazek" ? 0.3 : 0.75}
          metalness={el.type === "drazek" ? 0.8 : 0.05}
          emissive={isSelected ? new THREE.Color("#3b82f6") : new THREE.Color("#000")}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      <lineSegments geometry={edgesGeom}>
        <lineBasicMaterial
          color={isSelected ? "#1d4ed8" : "#3b3023"}
          transparent
          opacity={0.55}
        />
      </lineSegments>
    </group>
  );
}

export function Wardrobe3D() {
  const project = useActiveProject();
  const setSelected = useStore((s) => s.setSelected);

  const center = useMemo(
    () => [0, (project.outerHeight * MM) / 2, 0] as [number, number, number],
    [project.outerHeight]
  );

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: [
          project.outerWidth * MM * 1.4,
          project.outerHeight * MM * 0.9,
          project.outerDepth * MM * 3.2,
        ],
        fov: 35,
        near: 0.01,
        far: 100,
      }}
      onPointerMissed={() => setSelected(null)}
    >
      <color attach="background" args={["#1a1f2b"]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />

      <Suspense fallback={null}>
        <Environment preset="apartment" />
        <group>
          {project.elements
            .filter((el) => !el.hidden)
            .map((el) => (
              <ElementMesh key={el.id} el={el} />
            ))}
        </group>
      </Suspense>

      {/* Podłoga */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2b3140" roughness={1} />
      </mesh>

      <Grid
        args={[20, 20]}
        position={[0, 0.001, 0]}
        cellSize={0.1}
        cellThickness={0.5}
        cellColor="#3b4252"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#5b6478"
        fadeDistance={12}
        fadeStrength={1}
        infiniteGrid
      />

      <OrbitControls
        target={center}
        enableDamping
        dampingFactor={0.08}
        minDistance={0.5}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  );
}
