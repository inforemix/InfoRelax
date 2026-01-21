import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useControls } from 'leva'
import { useGameStore } from '../../state/useGameStore'

export function ProceduralClouds() {
  const cloudLayerRef = useRef<THREE.Mesh>(null)
  const playerPosition = useGameStore((state) => state.player.position)
  const weather = useGameStore((state) => state.weather)

  const cloudControls = useControls('Clouds', {
    cloudCoverage: { value: 0.5, min: 0, max: 1, step: 0.05 },
    cloudHeight: { value: 120, min: 50, max: 300, step: 10 },
    cloudThickness: { value: 40, min: 10, max: 100, step: 5 },
    cloudSpeed: { value: 2, min: 0, max: 10, step: 0.5 },
    cloudOpacity: { value: 0.7, min: 0, max: 1, step: 0.05 },
  })

  // Cloud shader material
  const cloudMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uCoverage: { value: cloudControls.cloudCoverage },
        uOpacity: { value: cloudControls.cloudOpacity },
        uWeatherIntensity: { value: weather === 'storm' ? 0.9 : weather === 'cloudy' ? 0.6 : 0.3 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uCoverage;
        uniform float uOpacity;
        uniform float uWeatherIntensity;

        varying vec2 vUv;
        varying vec3 vPosition;

        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);

          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);

          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;

          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));

          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);

          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);

          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;

          for (int i = 0; i < 4; i++) {
            value += amplitude * snoise(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }

          return value;
        }

        void main() {
          vec3 pos = vPosition * 0.001;
          pos.x += uTime * 0.02;

          // Multi-octave noise for cloud density
          float noise1 = fbm(pos * 2.0);
          float noise2 = fbm(pos * 4.0 + vec3(100.0));
          float noise3 = fbm(pos * 8.0 + vec3(200.0));

          float cloudDensity = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

          // Apply coverage threshold
          cloudDensity = smoothstep(1.0 - uCoverage * uWeatherIntensity, 1.0, cloudDensity + 0.5);

          // Edge fade
          float edgeFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) *
                           smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);

          cloudDensity *= edgeFade;

          // Cloud color based on weather
          vec3 cloudColor = mix(
            vec3(1.0, 1.0, 1.0),
            vec3(0.4, 0.45, 0.5),
            uWeatherIntensity
          );

          float alpha = cloudDensity * uOpacity;

          gl_FragColor = vec4(cloudColor, alpha);
        }
      `,
    })
  }, [cloudControls.cloudCoverage, cloudControls.cloudOpacity, weather])

  // Update uniforms
  useFrame((state) => {
    if (cloudMaterial) {
      cloudMaterial.uniforms.uTime.value = state.clock.elapsedTime * cloudControls.cloudSpeed
      cloudMaterial.uniforms.uCoverage.value = cloudControls.cloudCoverage
      cloudMaterial.uniforms.uOpacity.value = cloudControls.cloudOpacity
      cloudMaterial.uniforms.uWeatherIntensity.value =
        weather === 'storm' ? 0.9 : weather === 'cloudy' ? 0.6 : 0.3
    }

    // Follow player
    if (cloudLayerRef.current) {
      cloudLayerRef.current.position.x = playerPosition[0]
      cloudLayerRef.current.position.z = playerPosition[2]
    }
  })

  return (
    <group>
      {/* Main cloud layer */}
      <mesh
        ref={cloudLayerRef}
        position={[0, cloudControls.cloudHeight, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[2000, 2000, 32, 32]} />
        <primitive object={cloudMaterial} attach="material" />
      </mesh>

      {/* Additional cloud layer for depth */}
      <mesh
        position={[playerPosition[0], cloudControls.cloudHeight + cloudControls.cloudThickness, playerPosition[2]]}
        rotation={[-Math.PI / 2, Math.PI / 4, 0]}
      >
        <planeGeometry args={[1800, 1800, 32, 32]} />
        <primitive object={cloudMaterial} attach="material" />
      </mesh>
    </group>
  )
}
