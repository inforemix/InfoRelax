import { useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'

// Custom water shader material
const WaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#0e7490'),
    uColorDeep: new THREE.Color('#0c4a6e'),
    uWaveHeight: 0.3,
    uWaveFrequency: 0.5,
  },
  // Vertex shader
  `
    uniform float uTime;
    uniform float uWaveHeight;
    uniform float uWaveFrequency;
    
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      
      vec3 pos = position;
      
      // Multiple wave layers for more natural look
      float wave1 = sin(pos.x * uWaveFrequency + uTime) * cos(pos.z * uWaveFrequency * 0.5 + uTime * 0.7);
      float wave2 = sin(pos.x * uWaveFrequency * 2.0 + uTime * 1.5) * 0.5;
      float wave3 = cos(pos.z * uWaveFrequency * 1.5 + uTime * 0.8) * 0.3;
      
      vElevation = (wave1 + wave2 + wave3) * uWaveHeight;
      pos.y += vElevation;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 uColor;
    uniform vec3 uColorDeep;
    uniform float uTime;
    
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      // Mix colors based on wave elevation
      float mixFactor = (vElevation + 0.5) * 0.5;
      vec3 color = mix(uColorDeep, uColor, mixFactor);
      
      // Add foam on wave peaks
      float foam = smoothstep(0.2, 0.4, vElevation);
      color = mix(color, vec3(1.0), foam * 0.3);
      
      // Fresnel-like effect for edges
      float fresnel = pow(1.0 - abs(vElevation), 2.0);
      color += vec3(0.1, 0.2, 0.3) * fresnel;
      
      gl_FragColor = vec4(color, 0.9);
    }
  `
)

// Extend Three.js with our custom material
extend({ WaterMaterial })

// TypeScript declaration for the material
declare global {
  namespace JSX {
    interface IntrinsicElements {
      waterMaterial: any
    }
  }
}

interface OceanProps {
  size?: number
  segments?: number
}

export function Ocean({ size = 500, segments = 256 }: OceanProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Leva controls for wave tuning
  const { waveHeight, waveFrequency, waveSpeed } = useControls('Ocean', {
    waveHeight: { value: 0.3, min: 0, max: 2, step: 0.1 },
    waveFrequency: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
    waveSpeed: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
  })

  // Animate the water
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * waveSpeed
      materialRef.current.uniforms.uWaveHeight.value = waveHeight
      materialRef.current.uniforms.uWaveFrequency.value = waveFrequency
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size, segments, segments]} />
      <waterMaterial
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
