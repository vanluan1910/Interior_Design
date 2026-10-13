'use client';

import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

interface Furniture3DProps {
  woodType: 'walnut' | 'oak' | 'ash';
  cushionType: 'cream' | 'cognac' | 'olive';
}

const WOOD_CONFIG = {
  walnut: { color: '#442617', name: 'Gỗ Óc Chó Bắc Mỹ', roughness: 0.35, price: 24500000 },
  oak: { color: '#b58d5f', name: 'Gỗ Sồi Trắng Tự Nhiên', roughness: 0.42, price: 16800000 },
  ash: { color: '#272524', name: 'Gỗ Tần Bì Hun Khói', roughness: 0.32, price: 19500000 },
};

const CUSHION_CONFIG = {
  cream: { color: '#f3ece2', name: 'Vải Dệt Bouclé Sợi Kem' },
  cognac: { color: '#884b25', name: 'Da Bò Ý Cao Cấp Cognac' },
  olive: { color: '#3d4838', name: 'Nỉ Nhung Phong Cách Japandi' },
};

function LuxuryArmchair({ woodType, cushionType }: Furniture3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  const woodMat = new THREE.MeshStandardMaterial({
    color: WOOD_CONFIG[woodType].color,
    roughness: WOOD_CONFIG[woodType].roughness,
    metalness: 0.05,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: '#d4af37',
    metalness: 0.85,
    roughness: 0.25,
  });

  const cushionMat = new THREE.MeshStandardMaterial({
    color: CUSHION_CONFIG[cushionType].color,
    roughness: 0.75,
    metalness: 0.05,
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} rotation={[0, -0.4, 0]}>
      {/* --- SEAT CUSHION --- */}
      <mesh position={[0, 0, 0]} material={cushionMat} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.28, 1.4]} />
      </mesh>

      {/* --- BACKREST CUSHION (Curved / Angled) --- */}
      <mesh
        position={[0, 0.7, -0.6]}
        rotation={[-0.15, 0, 0]}
        material={cushionMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.42, 1.15, 0.24]} />
      </mesh>

      {/* --- WOODEN FRAME SEAT BASE --- */}
      <mesh position={[0, -0.18, 0]} material={woodMat} castShadow>
        <boxGeometry args={[1.56, 0.08, 1.46]} />
      </mesh>

      {/* --- WOODEN ARMRESTS --- */}
      {/* Left Armrest */}
      <group position={[-0.82, 0.35, 0]}>
        <mesh position={[0, 0.05, 0]} material={woodMat} castShadow>
          <boxGeometry args={[0.1, 0.06, 1.5]} />
        </mesh>
        <mesh position={[0, -0.25, 0.5]} material={woodMat} castShadow>
          <boxGeometry args={[0.07, 0.5, 0.07]} />
        </mesh>
        <mesh position={[0, -0.25, -0.5]} material={woodMat} castShadow>
          <boxGeometry args={[0.07, 0.5, 0.07]} />
        </mesh>
      </group>

      {/* Right Armrest */}
      <group position={[0.82, 0.35, 0]}>
        <mesh position={[0, 0.05, 0]} material={woodMat} castShadow>
          <boxGeometry args={[0.1, 0.06, 1.5]} />
        </mesh>
        <mesh position={[0, -0.25, 0.5]} material={woodMat} castShadow>
          <boxGeometry args={[0.07, 0.5, 0.07]} />
        </mesh>
        <mesh position={[0, -0.25, -0.5]} material={woodMat} castShadow>
          <boxGeometry args={[0.07, 0.5, 0.07]} />
        </mesh>
      </group>

      {/* --- 4 ANGLED LEGS WITH BRASS FEET --- */}
      {/* Front Left */}
      <group position={[-0.68, -0.62, 0.55]} rotation={[0.08, 0, -0.08]}>
        <mesh material={woodMat} castShadow>
          <cylinderGeometry args={[0.038, 0.026, 0.85, 16]} />
        </mesh>
        <mesh position={[0, -0.38, 0]} material={brassMat} castShadow>
          <cylinderGeometry args={[0.027, 0.025, 0.1, 16]} />
        </mesh>
      </group>

      {/* Front Right */}
      <group position={[0.68, -0.62, 0.55]} rotation={[0.08, 0, 0.08]}>
        <mesh material={woodMat} castShadow>
          <cylinderGeometry args={[0.038, 0.026, 0.85, 16]} />
        </mesh>
        <mesh position={[0, -0.38, 0]} material={brassMat} castShadow>
          <cylinderGeometry args={[0.027, 0.025, 0.1, 16]} />
        </mesh>
      </group>

      {/* Back Left */}
      <group position={[-0.68, -0.62, -0.55]} rotation={[-0.12, 0, -0.08]}>
        <mesh material={woodMat} castShadow>
          <cylinderGeometry args={[0.038, 0.026, 0.85, 16]} />
        </mesh>
        <mesh position={[0, -0.38, 0]} material={brassMat} castShadow>
          <cylinderGeometry args={[0.027, 0.025, 0.1, 16]} />
        </mesh>
      </group>

      {/* Back Right */}
      <group position={[0.68, -0.62, -0.55]} rotation={[-0.12, 0, 0.08]}>
        <mesh material={woodMat} castShadow>
          <cylinderGeometry args={[0.038, 0.026, 0.85, 16]} />
        </mesh>
        <mesh position={[0, -0.38, 0]} material={brassMat} castShadow>
          <cylinderGeometry args={[0.027, 0.025, 0.1, 16]} />
        </mesh>
      </group>

      {/* --- INTERACTIVE 3D HOTSPOTS --- */}
      {/* Hotspot 1: Đệm ngồi */}
      <Html position={[0, 0.35, 0.4]} center distanceFactor={8}>
        <div className="relative group">
          <button
            onClick={() => setActiveHotspot(activeHotspot === 1 ? null : 1)}
            className="w-7 h-7 rounded-full bg-[#5d371f]/90 text-white flex items-center justify-center border-2 border-white/90 shadow-lg cursor-pointer hover:scale-110 transition-transform animate-pulse"
            title="Xem chi tiết đệm"
          >
            <span className="text-xs font-bold">+</span>
          </button>
          <div
            className={`absolute left-9 top-1/2 -translate-y-1/2 w-48 bg-[#1f1b19]/90 backdrop-blur-md text-white p-2.5 rounded-lg shadow-2xl text-[11px] pointer-events-none transition-all duration-300 border border-white/10 ${
              activeHotspot === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
            }`}
          >
            <p className="font-semibold text-[#c5a880] mb-0.5">{CUSHION_CONFIG[cushionType].name}</p>
            <p className="text-white/80 leading-tight">Đệm mút D40 chống xẹp, đàn hồi êm ái tiêu chuẩn khách sạn 5 sao.</p>
          </div>
        </div>
      </Html>

      {/* Hotspot 2: Khung gỗ & Mộng ghép */}
      <Html position={[0.82, 0.45, 0]} center distanceFactor={8}>
        <div className="relative group">
          <button
            onClick={() => setActiveHotspot(activeHotspot === 2 ? null : 2)}
            className="w-7 h-7 rounded-full bg-[#5d371f]/90 text-white flex items-center justify-center border-2 border-white/90 shadow-lg cursor-pointer hover:scale-110 transition-transform animate-pulse"
            title="Xem chi tiết mộng gỗ"
          >
            <span className="text-xs font-bold">+</span>
          </button>
          <div
            className={`absolute right-9 top-1/2 -translate-y-1/2 w-52 bg-[#1f1b19]/90 backdrop-blur-md text-white p-2.5 rounded-lg shadow-2xl text-[11px] pointer-events-none transition-all duration-300 border border-white/10 ${
              activeHotspot === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
            }`}
          >
            <p className="font-semibold text-[#c5a880] mb-0.5">{WOOD_CONFIG[woodType].name}</p>
            <p className="text-white/80 leading-tight">Liên kết mộng mòi truyền thống không lộ đinh ốc, bảo hành 5 năm.</p>
          </div>
        </div>
      </Html>
    </group>
  );
}

export default function Hero3DCanvas({
  woodType,
  cushionType,
}: Furniture3DProps) {
  return (
    <div className="w-full h-full min-h-[380px] sm:min-h-[460px] md:min-h-[520px] lg:min-h-[580px] relative select-none">
      <Canvas
        camera={{ position: [3, 2.2, 3.8], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        {/* Ánh sáng Studio chuyên nghiệp */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[6, 8, 5]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
        <pointLight position={[-4, 2, -3]} intensity={0.5} color="#ffd4a3" />
        <spotLight
          position={[0, 6, 2]}
          intensity={0.8}
          angle={0.6}
          penumbra={0.8}
        />

        {/* Chuyển động lơ lửng nhẹ mượt mà */}
        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.35}>
          <LuxuryArmchair woodType={woodType} cushionType={cushionType} />
        </Float>

        {/* Đổ bóng nền sàn */}
        <ContactShadows
          position={[0, -1.18, 0]}
          opacity={0.7}
          scale={7}
          blur={2.5}
          far={3.5}
          color="#221915"
        />

        {/* Xoay 360 độ tự do bằng chuột */}
        <OrbitControls
          makeDefault
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 2 + 0.05}
          minPolarAngle={Math.PI / 6}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Badge hướng dẫn xoay 3D */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#d5c3ba]/60 shadow-sm pointer-events-none">
        <span className="material-symbols-outlined text-[16px] text-[#5d371f] animate-spin">360</span>
        <span className="text-[11px] font-medium text-[#51443d]">Kéo chuột để xoay 360° • Click dấu (+) để xem chi tiết</span>
      </div>
    </div>
  );
}
