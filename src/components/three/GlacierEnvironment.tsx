import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import { useGameStore } from '../../state/useGameStore'

interface GlacierEnvironmentProps {
  panoramaUrl?: string
  waterLevel?: number
  waterSize?: number
}

// 360 Panoramic Background Sphere
function PanoramicSky({ url }: { url: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Load the equirectangular panorama texture
  const texture = useTexture(url, (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
  })

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]} renderOrder={-1000}>
      <sphereGeometry args={[8000, 64, 32]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}

// Arctic-themed water shader that blends with the glacier scene
function ArcticWater({ size = 10000, waterLevel = -0.5 }: { size?: number; waterLevel?: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { player } = useGameStore()

  // Load water normal texture
  const waterNormals = useTexture('/textures/waternormals.jpg', (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  })

  const waterControls = useControls('Arctic Water', {
    waterColor: { value: '#1a3a4a', label: 'Deep Color' },
    shallowColor: { value: '#3a6a7a', label: 'Shallow Color' },
    foamColor: { value: '#d0e8f0', label: 'Foam Color' },
    transparency: { value: 0.85, min: 0, max: 1, step: 0.05, label: 'Transparency' },
    waveHeight: { value: 0.6, min: 0, max: 2, step: 0.1, label: 'Wave Height' },
    waveSpeed: { value: 0.4, min: 0.1, max: 2, step: 0.1, label: 'Wave Speed' },
    reflectivity: { value: 0.4, min: 0, max: 1, step: 0.05, label: 'Reflectivity' },
  })

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWaterNormals: { value: waterNormals },
        uWaterColor: { value: new THREE.Color(waterControls.waterColor) },
        uShallowColor: { value: new THREE.Color(waterControls.shallowColor) },
        uFoamColor: { value: new THREE.Color(waterControls.foamColor) },
        uWaveHeight: { value: waterControls.waveHeight },
        uReflectivity: { value: waterControls.reflectivity },
        uSunDirection: { value: new THREE.Vector3(0.5, 0.5, 0.3).normalize() },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWaveHeight;
        uniform sampler2D uWaterNormals;

        varying vec2 vUv;
        varying float vElevation;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vFoam;

        // Gerstner wave function for realistic arctic waters
        vec3 gerstnerWave(vec2 pos, float steepness, float wavelength, float speed, vec2 direction, float time) {
          float k = 2.0 * 3.14159 / wavelength;
          float c = sqrt(9.8 / k);
          vec2 d = normalize(direction);
          float f = k * (dot(d, pos) - c * speed * time);
          float a = steepness / k;

          return vec3(
            d.x * (a * cos(f)),
            a * sin(f),
            d.y * (a * cos(f))
          );
        }

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Calmer arctic waters - longer wavelengths, lower choppiness
          vec3 wave1 = gerstnerWave(pos.xz, 0.08, 80.0, 0.8, vec2(1.0, 0.3), uTime);
          vec3 wave2 = gerstnerWave(pos.xz, 0.06, 50.0, 1.0, vec2(-0.5, 0.8), uTime);
          vec3 wave3 = gerstnerWave(pos.xz, 0.04, 30.0, 0.6, vec2(0.7, -0.5), uTime);
          vec3 wave4 = gerstnerWave(pos.xz, 0.02, 15.0, 1.2, vec2(-0.3, -0.8), uTime);

          vec3 totalWave = (wave1 + wave2 + wave3 + wave4) * uWaveHeight;

          pos.x += totalWave.x;
          pos.y += totalWave.y;
          pos.z += totalWave.z;

          vElevation = totalWave.y;
          vFoam = smoothstep(0.2 * uWaveHeight, 0.5 * uWaveHeight, totalWave.y);

          // Calculate normal
          float eps = 0.5;
          vec3 waveX = gerstnerWave(pos.xz + vec2(eps, 0.0), 0.08, 80.0, 0.8, vec2(1.0, 0.3), uTime) * uWaveHeight;
          vec3 waveZ = gerstnerWave(pos.xz + vec2(0.0, eps), 0.08, 80.0, 0.8, vec2(1.0, 0.3), uTime) * uWaveHeight;

          vec3 tangent = normalize(vec3(2.0 * eps, waveX.y - totalWave.y, 0.0));
          vec3 bitangent = normalize(vec3(0.0, waveZ.y - totalWave.y, 2.0 * eps));
          vNormal = normalize(cross(bitangent, tangent));

          vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uWaterColor;
        uniform vec3 uShallowColor;
        uniform vec3 uFoamColor;
        uniform vec3 uSunDirection;
        uniform float uTime;
        uniform float uReflectivity;
        uniform sampler2D uWaterNormals;

        varying vec2 vUv;
        varying float vElevation;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vFoam;

        void main() {
          // Depth-based color (shallow vs deep arctic waters)
          float depthFactor = smoothstep(-0.8, 0.3, vElevation);
          vec3 waterColor = mix(uWaterColor, uShallowColor, depthFactor);

          // Add ice-like foam on crests
          waterColor = mix(waterColor, uFoamColor, vFoam * 0.5);

          // Enhanced fresnel for icy appearance
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 5.0);

          // Arctic sky reflection (cold blue-white tones)
          vec3 skyReflection = vec3(0.7, 0.8, 0.95);
          waterColor = mix(waterColor, skyReflection, fresnel * uReflectivity);

          // Subtle sun specular
          vec3 reflectDir = reflect(-uSunDirection, vNormal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 128.0);
          waterColor += vec3(1.0, 0.98, 0.95) * spec * 0.4;

          // Subsurface scattering (light through water)
          float sss = pow(max(dot(viewDir, -uSunDirection + vNormal * 0.5), 0.0), 4.0);
          waterColor += vec3(0.0, 0.2, 0.3) * sss * 0.2;

          // Subtle ice sparkle
          float sparkle = pow(max(dot(viewDir, reflect(-uSunDirection,
            vNormal + vec3(sin(uTime * 5.0 + vWorldPosition.x * 2.0) * 0.02, 0.0, cos(uTime * 4.0 + vWorldPosition.z * 2.0) * 0.02)
          )), 0.0), 256.0);
          waterColor += vec3(1.0) * sparkle * 0.3;

          gl_FragColor = vec4(waterColor, 0.9);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: true,
      depthTest: true,
    })
  }, [waterNormals])

  // Update uniforms
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * waterControls.waveSpeed
      materialRef.current.uniforms.uWaveHeight.value = waterControls.waveHeight
      materialRef.current.uniforms.uWaterColor.value.set(waterControls.waterColor)
      materialRef.current.uniforms.uShallowColor.value.set(waterControls.shallowColor)
      materialRef.current.uniforms.uFoamColor.value.set(waterControls.foamColor)
      materialRef.current.uniforms.uReflectivity.value = waterControls.reflectivity
    }
  })

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[player.position[0], waterLevel, player.position[2]]}
      receiveShadow
    >
      <planeGeometry args={[size, size, 256, 256]} />
      <primitive object={shaderMaterial} attach="material" ref={materialRef} />
    </mesh>
  )
}

// Main Glacier Environment component
export function GlacierEnvironment({
  panoramaUrl = '/assets/glaciers.png',
  waterLevel = -0.5,
  waterSize = 10000,
}: GlacierEnvironmentProps) {
  const { scene } = useThree()

  // Set scene fog for arctic atmosphere
  useEffect(() => {
    const originalFog = scene.fog
    scene.fog = new THREE.FogExp2('#b8d4e3', 0.0004)

    return () => {
      scene.fog = originalFog
    }
  }, [scene])

  return (
    <group name="glacier-environment">
      {/* 360 Panoramic Background */}
      <PanoramicSky url={panoramaUrl} />

      {/* Arctic Water Surface */}
      <ArcticWater size={waterSize} waterLevel={waterLevel} />

      {/* Ambient lighting for arctic scene */}
      <ambientLight intensity={0.6} color="#b8d4e3" />

      {/* Directional light mimicking low arctic sun */}
      <directionalLight
        position={[100, 50, 100]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />

      {/* Hemisphere light for ambient arctic sky */}
      <hemisphereLight
        args={['#87ceeb', '#1a3a4a', 0.4]}
      />
    </group>
  )
}

export default GlacierEnvironment
