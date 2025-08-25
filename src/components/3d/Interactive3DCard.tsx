import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text3D, MeshDistortMaterial, Environment, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface Interactive3DCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  index: number;
}

const Card3D = ({ color, isHovered }: { color: string; isHovered: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      if (isHovered) {
        meshRef.current.scale.setScalar(1.1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <boxGeometry args={[2, 2.5, 0.2]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.9}
          distort={isHovered ? 0.2 : 0.1}
          speed={2}
          roughness={0.1}
          metalness={0.7}
        />
      </mesh>
    </Float>
  );
};

export const Interactive3DCard = ({ icon: Icon, title, description, color, index }: Interactive3DCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Background */}
      <div className="absolute inset-0 w-full h-full">
        <Canvas camera={{ position: [0, 0, 4], fov: 75 }}>
          <Environment preset="city" />
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.8} color={color} />
          <Card3D color={color} isHovered={isHovered} />
        </Canvas>
      </div>

      {/* Glass Card Overlay */}
      <motion.div
        whileHover={{ 
          scale: 1.05,
          rotateY: 10,
          rotateX: 5
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative z-10 h-80 p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl hover:shadow-4xl transition-all duration-500"
        style={{
          background: `linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)`,
          boxShadow: `0 25px 50px -12px ${color}40`,
        }}
      >
        {/* Animated Border */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${color}, transparent)`,
              animation: 'spin 4s linear infinite'
            }}
          />
        </div>

        {/* Icon with 3D Effect */}
        <motion.div
          whileHover={{ 
            scale: 1.2,
            rotateZ: 10
          }}
          className="relative z-20 w-16 h-16 mb-6 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${color}20, ${color}40)`,
            backdropFilter: 'blur(10px)',
            boxShadow: `0 10px 30px ${color}30`
          }}
        >
          <div style={{ color }}>
            <Icon className="w-8 h-8" />
          </div>
        </motion.div>

        {/* Content */}
        <div className="relative z-20">
          <motion.h3 
            className="text-2xl font-bold text-white mb-4"
            whileHover={{ scale: 1.05 }}
          >
            {title}
          </motion.h3>
          <motion.p 
            className="text-white/80 leading-relaxed"
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
          >
            {description}
          </motion.p>
        </div>

        {/* Hover Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at center, ${color}15, transparent 70%)`,
          }}
        />

        {/* Floating Particles */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{ backgroundColor: color }}
                initial={{ 
                  x: '50%', 
                  y: '50%',
                  opacity: 0 
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};