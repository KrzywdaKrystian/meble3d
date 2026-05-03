import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, Html } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import { useActiveProject, useActiveRoomLayout, useStore } from "../store";
import { Cabinet, WardrobeElement } from "../types";
import { WallsAndRoom } from "./WallsAndRoom";
import * as THREE from "three";

const MM = 0.001; // milimetry -> metry sceny

function ElementMesh({ el }: { el: WardrobeElement }) {
  const selectedId = useStore((s) => s.selectedElementId);
  const setSelected = useStore((s) => s.setSelected);
  const showDimensions = useStore((s) => s.showDimensions);
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

  const deg = Math.PI / 180;
  const rotation: [number, number, number] = [
    (el.rotationX ?? 0) * deg,
    (el.rotationY ?? 0) * deg,
    (el.rotationZ ?? 0) * deg,
  ];

  return (
    <group
      position={[el.x * MM, el.y * MM, el.z * MM]}
      rotation={rotation}
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
          emissive={
            isSelected ? new THREE.Color("#3b82f6") : new THREE.Color("#000")
          }
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
      {(showDimensions || isSelected) && (
        <Html
          position={[0, 0, d / 2 + 0.005]}
          center
          zIndexRange={[10, 0]}
          wrapperClass="dim-label-wrap"
        >
          <div
            className={
              "dim-label" +
              (isSelected ? " dim-label-selected" : "") +
              (!showDimensions && isSelected ? " dim-label-only-selected" : "")
            }
          >
            {Math.round(el.width)}×{Math.round(el.height)}×
            {Math.round(el.depth)}
          </div>
        </Html>
      )}
    </group>
  );
}

function CabinetGroup({
  cabinet,
  active,
}: {
  cabinet: Cabinet;
  active: boolean;
}) {
  const showCabinetLabels = useStore((s) => s.showCabinetLabels);
  return (
    <group
      position={[
        cabinet.offsetX * MM,
        cabinet.offsetY * MM,
        cabinet.offsetZ * MM,
      ]}
    >
      {/* Lekka „aureola” pod aktywną szafą żeby było widać którą edytujesz */}
      {active && (
        <mesh
          position={[0, 0.001, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry
            args={[
              (Math.max(cabinet.outerWidth, cabinet.outerDepth) * MM) / 2,
              (Math.max(cabinet.outerWidth, cabinet.outerDepth) * MM) / 2 +
                0.04,
              48,
            ]}
          />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {showCabinetLabels && (
        <Html
          position={[0, cabinet.outerHeight * MM + 0.08, 0]}
          center
          zIndexRange={[20, 10]}
          wrapperClass="cab-label-wrap"
        >
          <div
            className={
              "cab-label" + (active ? " cab-label-active" : "")
            }
          >
            <div className="cab-label-name">{cabinet.name}</div>
            <div className="cab-label-dims">
              {cabinet.outerWidth} × {cabinet.outerHeight} ×{" "}
              {cabinet.outerDepth} mm
            </div>
          </div>
        </Html>
      )}
      {cabinet.elements
        .filter((el) => !el.hidden)
        .map((el) => (
          <ElementMesh key={el.id} el={el} />
        ))}
    </group>
  );
}

export function Wardrobe3D() {
  const project = useActiveProject();
  const layout = useActiveRoomLayout();
  const roomEnabled = !!layout?.enabled;
  const activeCabinetId = useStore((s) => s.activeCabinetId);
  const setSelected = useStore((s) => s.setSelected);

  // Bryła otaczająca wszystkie szafy w projekcie + pomieszczenie (gdy włączone)
  // – używana do ustawienia kamery.
  const bounds = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let maxH = 0;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const c of project.cabinets) {
      minX = Math.min(minX, c.offsetX - c.outerWidth / 2);
      maxX = Math.max(maxX, c.offsetX + c.outerWidth / 2);
      maxH = Math.max(maxH, c.offsetY + c.outerHeight);
      minZ = Math.min(minZ, c.offsetZ - c.outerDepth / 2);
      maxZ = Math.max(maxZ, c.offsetZ + c.outerDepth / 2);
    }
    if (layout && layout.enabled) {
      minX = Math.min(minX, -layout.width / 2);
      maxX = Math.max(maxX, layout.width / 2);
      maxH = Math.max(maxH, layout.height);
      minZ = Math.min(minZ, -layout.depth / 2);
      maxZ = Math.max(maxZ, layout.depth / 2);
    }
    if (!Number.isFinite(minX)) {
      return { centerX: 0, centerY: 1, maxSpan: 2 };
    }
    const centerX = (minX + maxX) / 2;
    const centerY = maxH / 2;
    const maxSpan = Math.max(maxX - minX, maxH, maxZ - minZ);
    return { centerX, centerY, maxSpan };
  }, [project, layout]);

  const target: [number, number, number] = [
    bounds.centerX * MM,
    bounds.centerY * MM,
    0,
  ];
  const cameraDist = bounds.maxSpan * MM * 1.6;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: [
          (bounds.centerX + bounds.maxSpan * 0.7) * MM,
          (bounds.centerY + bounds.maxSpan * 0.6) * MM,
          cameraDist + 1,
        ],
        fov: 35,
        near: 0.01,
        far: 200,
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
        <WallsAndRoom />
        {project.cabinets.map((cab) => (
          <CabinetGroup
            key={cab.id}
            cabinet={cab}
            active={cab.id === activeCabinetId}
          />
        ))}
      </Suspense>

      {!roomEnabled && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#2b3140" roughness={1} />
        </mesh>
      )}

      <Grid
        args={[40, 40]}
        position={[0, 0.001, 0]}
        cellSize={0.1}
        cellThickness={0.5}
        cellColor="#3b4252"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#5b6478"
        fadeDistance={20}
        fadeStrength={1}
        infiniteGrid
      />

      <OrbitControls
        target={target}
        enableDamping
        dampingFactor={0.08}
        minDistance={0.5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  );
}
