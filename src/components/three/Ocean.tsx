import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useControls, folder } from 'leva'
import * as THREE from 'three'
import { Water } from 'three/addons/objects/Water.js'
import { useGameStore } from '../../state/useGameStore'

interface OceanProps {
  size?: number
  segments?: number
}

// Advanced ocean shader with physically-based rendering
const advancedOceanVertexShader = `
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uChoppiness;
  uniform float uWindDirection;
  uniform vec2 uPlayerPos;

  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vFoam;
  varying float vDepth;
  varying vec3 vViewDir;

  // Gerstner wave function with improved accuracy
  vec3 gerstnerWave(vec2 pos, float steepness, float wavelength, float speed, vec2 direction, float time) {
    float k = 6.28318530718 / wavelength;
    float c = sqrt(9.81 / k); // Deep water phase speed
    vec2 d = normalize(direction);
    float f = k * (dot(d, pos) - c * speed * time);
    float a = steepness / k;

    return vec3(
      d.x * (a * cos(f)),
      a * sin(f),
      d.y * (a * cos(f))
    );
  }

  // FBM noise for additional detail
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Wind direction affects wave propagation
    vec2 windDir = vec2(cos(uWindDirection), sin(uWindDirection));

    // Multiple Gerstner waves for realistic ocean
    // Wave 1: Primary swell (long wavelength, aligned with wind)
    vec3 wave1 = gerstnerWave(pos.xz, 0.18 * uChoppiness, 80.0, 0.8, windDir, uTime);

    // Wave 2: Secondary swell (medium wavelength, slight angle)
    vec2 dir2 = vec2(cos(uWindDirection + 0.4), sin(uWindDirection + 0.4));
    vec3 wave2 = gerstnerWave(pos.xz, 0.14 * uChoppiness, 45.0, 1.0, dir2, uTime);

    // Wave 3: Cross wave (shorter, perpendicular)
    vec2 dir3 = vec2(cos(uWindDirection + 1.57), sin(uWindDirection + 1.57));
    vec3 wave3 = gerstnerWave(pos.xz, 0.1 * uChoppiness, 28.0, 0.9, dir3, uTime);

    // Wave 4: Chop (short wavelength, adds texture)
    vec2 dir4 = vec2(cos(uWindDirection - 0.6), sin(uWindDirection - 0.6));
    vec3 wave4 = gerstnerWave(pos.xz, 0.06 * uChoppiness, 15.0, 1.3, dir4, uTime);

    // Wave 5: Fine detail
    vec3 wave5 = gerstnerWave(pos.xz, 0.04 * uChoppiness, 8.0, 1.6, windDir * -1.0, uTime);

    // Wave 6: Ultra-fine ripples
    vec2 dir6 = vec2(cos(uWindDirection + 0.8), sin(uWindDirection + 0.8));
    vec3 wave6 = gerstnerWave(pos.xz, 0.02 * uChoppiness, 4.0, 2.0, dir6, uTime);

    // Add FBM noise for small-scale detail
    float noiseDetail = fbm(pos.xz * 0.05 + uTime * 0.1) * 0.2;

    // Combine waves
    vec3 totalWave = (wave1 + wave2 + wave3 + wave4 + wave5 + wave6) * uWaveHeight;
    totalWave.y += noiseDetail * uWaveHeight * 0.3;

    pos.x += totalWave.x;
    pos.y += totalWave.y;
    pos.z += totalWave.z;

    vElevation = totalWave.y;

    // Distance from player for LOD and depth effects
    float distFromPlayer = length(pos.xz - uPlayerPos);
    vDepth = smoothstep(0.0, 500.0, distFromPlayer);

    // Foam appears on wave crests and near boat wake
    float crestFoam = smoothstep(0.4 * uWaveHeight, 0.9 * uWaveHeight, totalWave.y);
    float wakeFoam = smoothstep(30.0, 0.0, distFromPlayer) * 0.5;
    vFoam = max(crestFoam, wakeFoam);

    // Calculate normal from wave derivatives
    float eps = 0.5;
    vec3 waveX1 = (gerstnerWave(pos.xz + vec2(eps, 0.0), 0.18 * uChoppiness, 80.0, 0.8, windDir, uTime) +
                   gerstnerWave(pos.xz + vec2(eps, 0.0), 0.14 * uChoppiness, 45.0, 1.0, dir2, uTime)) * uWaveHeight;
    vec3 waveX2 = (gerstnerWave(pos.xz - vec2(eps, 0.0), 0.18 * uChoppiness, 80.0, 0.8, windDir, uTime) +
                   gerstnerWave(pos.xz - vec2(eps, 0.0), 0.14 * uChoppiness, 45.0, 1.0, dir2, uTime)) * uWaveHeight;
    vec3 waveZ1 = (gerstnerWave(pos.xz + vec2(0.0, eps), 0.18 * uChoppiness, 80.0, 0.8, windDir, uTime) +
                   gerstnerWave(pos.xz + vec2(0.0, eps), 0.14 * uChoppiness, 45.0, 1.0, dir2, uTime)) * uWaveHeight;
    vec3 waveZ2 = (gerstnerWave(pos.xz - vec2(0.0, eps), 0.18 * uChoppiness, 80.0, 0.8, windDir, uTime) +
                   gerstnerWave(pos.xz - vec2(0.0, eps), 0.14 * uChoppiness, 45.0, 1.0, dir2, uTime)) * uWaveHeight;

    vec3 tangent = normalize(vec3(2.0 * eps, waveX1.y - waveX2.y, 0.0));
    vec3 bitangent = normalize(vec3(0.0, waveZ1.y - waveZ2.y, 2.0 * eps));
    vNormal = normalize(cross(bitangent, tangent));

    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    vViewDir = normalize(cameraPosition - vWorldPosition);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const advancedOceanFragmentShader = `
  uniform vec3 uColorShallow;
  uniform vec3 uColorMid;
  uniform vec3 uColorDeep;
  uniform vec3 uColorFoam;
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform float uTime;
  uniform float uSunIntensity;
  uniform float uAmbientIntensity;
  uniform float uFresnelPower;
  uniform float uSpecularPower;
  uniform float uReflectionStrength;
  uniform float uScatterStrength;

  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vFoam;
  varying float vDepth;
  varying vec3 vViewDir;

  // Schlick's Fresnel approximation
  float fresnelSchlick(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
  }

  // Procedural foam pattern
  float foamNoise(vec2 uv, float time) {
    float n1 = fract(sin(dot(uv * 10.0 + time * 0.5, vec2(12.9898, 78.233))) * 43758.5453);
    float n2 = fract(sin(dot(uv * 20.0 - time * 0.3, vec2(93.9898, 67.345))) * 23421.631);
    float n3 = fract(sin(dot(uv * 40.0 + time * 0.2, vec2(45.233, 97.854))) * 54321.987);
    return (n1 + n2 * 0.5 + n3 * 0.25) / 1.75;
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);

    // Depth-based color gradient (shallow -> mid -> deep)
    float depthFactor = smoothstep(-1.5, 1.5, vElevation);
    vec3 waterColor;
    if (depthFactor > 0.5) {
      waterColor = mix(uColorMid, uColorShallow, (depthFactor - 0.5) * 2.0);
    } else {
      waterColor = mix(uColorDeep, uColorMid, depthFactor * 2.0);
    }

    // Distance-based depth coloring (far = deeper appearance)
    waterColor = mix(waterColor, uColorDeep, vDepth * 0.3);

    // Fresnel effect (more reflection at grazing angles)
    float NdotV = max(dot(normal, viewDir), 0.0);
    float fresnel = fresnelSchlick(NdotV, 0.02);

    // Sky/environment reflection color (approximation)
    vec3 reflectDir = reflect(-viewDir, normal);
    float skyGradient = reflectDir.y * 0.5 + 0.5;
    vec3 skyColor = mix(vec3(0.6, 0.75, 0.9), vec3(0.3, 0.5, 0.8), skyGradient);

    // Apply reflection
    waterColor = mix(waterColor, skyColor, fresnel * uReflectionStrength);

    // Sun specular highlight (Blinn-Phong)
    vec3 halfDir = normalize(uSunDirection + viewDir);
    float NdotH = max(dot(normal, halfDir), 0.0);
    float spec = pow(NdotH, uSpecularPower) * uSunIntensity;

    // Animated sparkle effect
    vec3 sparkleNormal = normal + vec3(
      sin(uTime * 12.0 + vWorldPosition.x * 5.0) * 0.02,
      0.0,
      cos(uTime * 10.0 + vWorldPosition.z * 5.0) * 0.02
    );
    vec3 sparkleHalf = normalize(uSunDirection + viewDir);
    float sparkle = pow(max(dot(normalize(sparkleNormal), sparkleHalf), 0.0), 512.0);

    // Add sun reflection
    waterColor += uSunColor * (spec * 0.6 + sparkle * 0.4);

    // Subsurface scattering approximation (light through waves)
    float scatter = pow(max(dot(viewDir, -uSunDirection + normal * 0.3), 0.0), 4.0);
    vec3 scatterColor = vec3(0.0, 0.4, 0.5) * scatter * uScatterStrength;
    waterColor += scatterColor;

    // Add foam with procedural pattern
    float foamPattern = foamNoise(vWorldPosition.xz * 0.1, uTime);
    float foamIntensity = vFoam * smoothstep(0.3, 0.7, foamPattern);
    vec3 foamColor = uColorFoam * (0.8 + 0.2 * foamPattern);
    waterColor = mix(waterColor, foamColor, foamIntensity * 0.7);

    // Rim lighting effect (backlighting from sun through wave edges)
    float rim = 1.0 - NdotV;
    rim = pow(rim, 3.0) * max(dot(normal, uSunDirection) * 0.5 + 0.5, 0.0);
    waterColor += uSunColor * rim * 0.15;

    // Ambient occlusion approximation in wave troughs
    float ao = smoothstep(-0.5, 0.5, vElevation) * 0.3 + 0.7;
    waterColor *= ao;

    // Add ambient light
    waterColor += uColorMid * uAmbientIntensity * 0.1;

    // Slight color shift at distance for atmospheric perspective
    vec3 fogColor = vec3(0.7, 0.8, 0.9);
    waterColor = mix(waterColor, fogColor, vDepth * 0.2);

    gl_FragColor = vec4(waterColor, 1.0);
  }
`

export function Ocean({ size = 10000, segments = 256 }: OceanProps) {
  const waterRef = useRef<Water>(null)
  const { scene } = useThree()
  const { setWind, setWeather, player } = useGameStore()

  // Load water normal texture
  const waterNormals = useTexture('/textures/waternormals.jpg', (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  })

  // Leva controls for water tuning
  const {
    waterColor,
    sunColor,
    distortionScale,
    waveSpeed,
    waveSize,
  } = useControls('Ocean', {
    waterColor: { value: '#001e0f', label: 'Water Color' },
    sunColor: { value: '#ffffff', label: 'Sun Color' },
    distortionScale: { value: 3.7, min: 0, max: 10, step: 0.1, label: 'Distortion' },
    waveSpeed: { value: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Wave Speed' },
    waveSize: { value: 1.0, min: 0.1, max: 5, step: 0.1, label: 'Wave Size' },
  })

  // Add wind and environment controls to Leva
  const windControls = useControls('Wind & Environment', {
    windDirection: { value: 45, min: 0, max: 360, step: 5, label: 'Wind Direction (°)' },
    windSpeed: { value: 10, min: 0, max: 25, step: 0.5, label: 'Wind Speed (m/s)' },
    gustFactor: { value: 0.15, min: 0, max: 1, step: 0.05, label: 'Gust Factor' },
    weather: {
      value: 'trade-winds',
      options: ['clear', 'cloudy', 'trade-winds', 'storm', 'doldrums'],
      label: 'Weather'
    },
  })

  // Sync wind controls to game state
  useEffect(() => {
    setWind({
      direction: windControls.windDirection,
      speed: windControls.windSpeed,
      gustFactor: windControls.gustFactor,
    })
    setWeather(windControls.weather as any)
  }, [windControls.windDirection, windControls.windSpeed, windControls.gustFactor, windControls.weather, setWind, setWeather])

  // Create water geometry
  const waterGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(size, size, segments, segments)
  }, [size, segments])

  // Create water object
  const water = useMemo(() => {
    const waterObj = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals,
      sunDirection: new THREE.Vector3(1, 1, 1).normalize(),
      sunColor: new THREE.Color(sunColor),
      waterColor: new THREE.Color(waterColor),
      distortionScale: distortionScale,
      fog: scene.fog !== undefined,
    })

    waterObj.rotation.x = -Math.PI / 2
    waterObj.position.y = -0.5 // Slightly below sea level to prevent z-fighting

    // Fix rendering order and depth to prevent black clipping
    if (waterObj.material) {
      const mat = waterObj.material as THREE.ShaderMaterial
      mat.depthWrite = true
      mat.depthTest = true
      mat.side = THREE.FrontSide
    }

    return waterObj
  }, [waterGeometry, waterNormals, scene.fog, sunColor, waterColor, distortionScale])

  // Update water parameters when controls change
  useEffect(() => {
    if (water && water.material) {
      const uniforms = (water.material as THREE.ShaderMaterial).uniforms
      if (uniforms) {
        if (uniforms.waterColor) {
          uniforms.waterColor.value.set(waterColor)
        }
        if (uniforms.sunColor) {
          uniforms.sunColor.value.set(sunColor)
        }
        if (uniforms.distortionScale) {
          uniforms.distortionScale.value = distortionScale
        }
        if (uniforms.size) {
          uniforms.size.value = waveSize
        }
      }
    }
  }, [water, waterColor, sunColor, distortionScale, waveSize])

  // Animate the water and follow player for infinite ocean effect
  useFrame((_, delta) => {
    if (water && water.material) {
      const uniforms = (water.material as THREE.ShaderMaterial).uniforms
      if (uniforms && uniforms.time) {
        uniforms.time.value += delta * waveSpeed
      }

      // Make ocean follow player position (infinite ocean effect)
      // Only update X and Z, keep Y at 0 (sea level)
      water.position.x = player.position[0]
      water.position.z = player.position[2]
    }
  })

  return <primitive object={water} ref={waterRef} />
}

// Gerstner wave ocean with realistic rolling waves
export function GerstnerOcean({ size = 500, segments = 256 }: OceanProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { player } = useGameStore()

  // Leva controls for wave tuning
  const { waveHeight, waveSpeed, choppiness, windDirection } = useControls('Gerstner Ocean', {
    waveHeight: { value: 1.2, min: 0, max: 4, step: 0.1, label: 'Wave Height' },
    waveSpeed: { value: 0.8, min: 0.1, max: 2, step: 0.1, label: 'Wave Speed' },
    choppiness: { value: 0.8, min: 0, max: 2, step: 0.1, label: 'Choppiness' },
    windDirection: { value: 45, min: 0, max: 360, step: 5, label: 'Wind Dir (°)' },
  })

  // Gerstner wave shader for realistic ocean waves
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWaveHeight: { value: waveHeight },
        uChoppiness: { value: choppiness },
        uWindDirection: { value: windDirection * Math.PI / 180 },
        uColorShallow: { value: new THREE.Color('#0891b2') },
        uColorDeep: { value: new THREE.Color('#0c4a6e') },
        uColorFoam: { value: new THREE.Color('#e0f7fa') },
        uSunDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWaveHeight;
        uniform float uChoppiness;
        uniform float uWindDirection;

        varying vec2 vUv;
        varying float vElevation;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vFoam;

        // Gerstner wave function
        // Returns displacement and contributes to normal calculation
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

          // Wind direction affects wave propagation
          vec2 windDir = vec2(cos(uWindDirection), sin(uWindDirection));

          // Multiple Gerstner waves for realistic ocean
          // Wave 1: Primary swell (long wavelength, aligned with wind)
          vec3 wave1 = gerstnerWave(pos.xz, 0.15 * uChoppiness, 60.0, 1.0, windDir, uTime);

          // Wave 2: Secondary swell (medium wavelength, slight angle)
          vec2 dir2 = vec2(cos(uWindDirection + 0.3), sin(uWindDirection + 0.3));
          vec3 wave2 = gerstnerWave(pos.xz, 0.12 * uChoppiness, 35.0, 1.2, dir2, uTime);

          // Wave 3: Cross wave (shorter, perpendicular)
          vec2 dir3 = vec2(cos(uWindDirection + 1.57), sin(uWindDirection + 1.57));
          vec3 wave3 = gerstnerWave(pos.xz, 0.08 * uChoppiness, 20.0, 0.9, dir3, uTime);

          // Wave 4: Chop (short wavelength, adds texture)
          vec2 dir4 = vec2(cos(uWindDirection - 0.5), sin(uWindDirection - 0.5));
          vec3 wave4 = gerstnerWave(pos.xz, 0.05 * uChoppiness, 10.0, 1.5, dir4, uTime);

          // Wave 5: Fine detail
          vec3 wave5 = gerstnerWave(pos.xz, 0.03 * uChoppiness, 5.0, 2.0, windDir * -1.0, uTime);

          // Combine waves
          vec3 totalWave = (wave1 + wave2 + wave3 + wave4 + wave5) * uWaveHeight;

          pos.x += totalWave.x;
          pos.y += totalWave.y;
          pos.z += totalWave.z;

          vElevation = totalWave.y;

          // Foam appears on wave crests
          vFoam = smoothstep(0.3 * uWaveHeight, 0.8 * uWaveHeight, totalWave.y);

          // Calculate normal from wave derivatives
          float eps = 0.5;
          vec3 waveX1 = gerstnerWave(pos.xz + vec2(eps, 0.0), 0.15 * uChoppiness, 60.0, 1.0, windDir, uTime) * uWaveHeight;
          vec3 waveX2 = gerstnerWave(pos.xz - vec2(eps, 0.0), 0.15 * uChoppiness, 60.0, 1.0, windDir, uTime) * uWaveHeight;
          vec3 waveZ1 = gerstnerWave(pos.xz + vec2(0.0, eps), 0.15 * uChoppiness, 60.0, 1.0, windDir, uTime) * uWaveHeight;
          vec3 waveZ2 = gerstnerWave(pos.xz - vec2(0.0, eps), 0.15 * uChoppiness, 60.0, 1.0, windDir, uTime) * uWaveHeight;

          vec3 tangent = normalize(vec3(2.0 * eps, waveX1.y - waveX2.y, 0.0));
          vec3 bitangent = normalize(vec3(0.0, waveZ1.y - waveZ2.y, 2.0 * eps));
          vNormal = normalize(cross(bitangent, tangent));

          vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorShallow;
        uniform vec3 uColorDeep;
        uniform vec3 uColorFoam;
        uniform vec3 uSunDirection;
        uniform float uTime;

        varying vec2 vUv;
        varying float vElevation;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vFoam;

        void main() {
          // Depth-based color (shallow vs deep)
          float depthFactor = smoothstep(-1.0, 1.0, vElevation);
          vec3 waterColor = mix(uColorDeep, uColorShallow, depthFactor);

          // Add foam on crests
          waterColor = mix(waterColor, uColorFoam, vFoam * 0.6);

          // Fresnel effect (more reflection at grazing angles)
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 4.0);
          vec3 skyColor = vec3(0.5, 0.7, 0.9);
          waterColor = mix(waterColor, skyColor, fresnel * 0.4);

          // Sun specular highlight
          vec3 reflectDir = reflect(-uSunDirection, vNormal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 256.0);
          waterColor += vec3(1.0, 0.98, 0.9) * spec * 0.8;

          // Subsurface scattering approximation (light through waves)
          float sss = pow(max(dot(viewDir, -uSunDirection + vNormal * 0.5), 0.0), 3.0);
          waterColor += vec3(0.0, 0.3, 0.4) * sss * 0.3;

          // Sparkle effect
          float sparkle = pow(max(dot(viewDir, reflect(-uSunDirection,
            vNormal + vec3(sin(uTime * 8.0 + vWorldPosition.x * 3.0) * 0.03, 0.0, cos(uTime * 6.0 + vWorldPosition.z * 3.0) * 0.03)
          )), 0.0), 256.0);
          waterColor += vec3(1.0) * sparkle * 0.5;

          gl_FragColor = vec4(waterColor, 1.0);
        }
      `,
      transparent: false,
      side: THREE.FrontSide,
      depthWrite: true,
      depthTest: true,
    })
  }, [])

  // Animate the water and follow player
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * waveSpeed
      materialRef.current.uniforms.uWaveHeight.value = waveHeight
      materialRef.current.uniforms.uChoppiness.value = choppiness
      materialRef.current.uniforms.uWindDirection.value = windDirection * Math.PI / 180
    }
  })

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[player.position[0], -0.5, player.position[2]]}
      receiveShadow
    >
      <planeGeometry args={[size, size, segments, segments]} />
      <primitive object={shaderMaterial} attach="material" ref={materialRef} />
    </mesh>
  )
}

// Advanced physically-based ocean with beautiful shaders
export function AdvancedOcean({ size = 800, segments = 256 }: OceanProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const { player } = useGameStore()

  // Comprehensive ocean controls
  const oceanControls = useControls('Advanced Ocean', {
    'Waves': folder({
      waveHeight: { value: 1.5, min: 0, max: 5, step: 0.1, label: 'Wave Height' },
      waveSpeed: { value: 0.6, min: 0.1, max: 2, step: 0.05, label: 'Wave Speed' },
      choppiness: { value: 1.0, min: 0, max: 2, step: 0.1, label: 'Choppiness' },
      windDirection: { value: 45, min: 0, max: 360, step: 5, label: 'Wind Dir (°)' },
    }),
    'Colors': folder({
      shallowColor: { value: '#22d3ee', label: 'Shallow' },
      midColor: { value: '#0891b2', label: 'Mid' },
      deepColor: { value: '#164e63', label: 'Deep' },
      foamColor: { value: '#e0f7fa', label: 'Foam' },
    }),
    'Lighting': folder({
      sunIntensity: { value: 1.2, min: 0, max: 3, step: 0.1, label: 'Sun Intensity' },
      ambientIntensity: { value: 0.4, min: 0, max: 1, step: 0.05, label: 'Ambient' },
      fresnelPower: { value: 5.0, min: 1, max: 10, step: 0.5, label: 'Fresnel Power' },
      specularPower: { value: 256, min: 32, max: 512, step: 16, label: 'Specular Power' },
      reflectionStrength: { value: 0.4, min: 0, max: 1, step: 0.05, label: 'Reflection' },
      scatterStrength: { value: 0.3, min: 0, max: 1, step: 0.05, label: 'SSS Strength' },
    }),
  })

  // Create shader material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWaveHeight: { value: oceanControls.waveHeight },
        uChoppiness: { value: oceanControls.choppiness },
        uWindDirection: { value: oceanControls.windDirection * Math.PI / 180 },
        uPlayerPos: { value: new THREE.Vector2(0, 0) },
        uColorShallow: { value: new THREE.Color(oceanControls.shallowColor) },
        uColorMid: { value: new THREE.Color(oceanControls.midColor) },
        uColorDeep: { value: new THREE.Color(oceanControls.deepColor) },
        uColorFoam: { value: new THREE.Color(oceanControls.foamColor) },
        uSunDirection: { value: new THREE.Vector3(0.5, 0.7, 0.3).normalize() },
        uSunColor: { value: new THREE.Color('#fffdf0') },
        uSunIntensity: { value: oceanControls.sunIntensity },
        uAmbientIntensity: { value: oceanControls.ambientIntensity },
        uFresnelPower: { value: oceanControls.fresnelPower },
        uSpecularPower: { value: oceanControls.specularPower },
        uReflectionStrength: { value: oceanControls.reflectionStrength },
        uScatterStrength: { value: oceanControls.scatterStrength },
      },
      vertexShader: advancedOceanVertexShader,
      fragmentShader: advancedOceanFragmentShader,
      transparent: false,
      side: THREE.FrontSide,
      depthWrite: true,
      depthTest: true,
    })
  }, [])

  // Animate and update uniforms
  useFrame((state) => {
    if (materialRef.current) {
      const uniforms = materialRef.current.uniforms
      uniforms.uTime.value = state.clock.elapsedTime * oceanControls.waveSpeed
      uniforms.uWaveHeight.value = oceanControls.waveHeight
      uniforms.uChoppiness.value = oceanControls.choppiness
      uniforms.uWindDirection.value = oceanControls.windDirection * Math.PI / 180
      uniforms.uPlayerPos.value.set(player.position[0], player.position[2])
      uniforms.uColorShallow.value.set(oceanControls.shallowColor)
      uniforms.uColorMid.value.set(oceanControls.midColor)
      uniforms.uColorDeep.value.set(oceanControls.deepColor)
      uniforms.uColorFoam.value.set(oceanControls.foamColor)
      uniforms.uSunIntensity.value = oceanControls.sunIntensity
      uniforms.uAmbientIntensity.value = oceanControls.ambientIntensity
      uniforms.uFresnelPower.value = oceanControls.fresnelPower
      uniforms.uSpecularPower.value = oceanControls.specularPower
      uniforms.uReflectionStrength.value = oceanControls.reflectionStrength
      uniforms.uScatterStrength.value = oceanControls.scatterStrength

      // Update sun direction based on time of day (sync with sky if available)
      const sunAngle = (state.clock.elapsedTime * 0.01) % (Math.PI * 2)
      uniforms.uSunDirection.value.set(
        Math.cos(sunAngle) * 0.5,
        Math.max(0.1, Math.sin(sunAngle * 0.5) * 0.8 + 0.3),
        0.3
      ).normalize()
    }

    // Follow player for infinite ocean effect
    if (meshRef.current) {
      meshRef.current.position.x = player.position[0]
      meshRef.current.position.z = player.position[2]
    }
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
    >
      <planeGeometry args={[size, size, segments, segments]} />
      <primitive object={shaderMaterial} attach="material" ref={materialRef} />
    </mesh>
  )
}

// Alternative simpler water for lower-end devices
export function SimpleOcean({ size = 500, segments = 128 }: OceanProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { player } = useGameStore()

  // Leva controls for wave tuning
  const { waveHeight, waveFrequency, waveSpeed } = useControls('Simple Ocean', {
    waveHeight: { value: 0.5, min: 0, max: 2, step: 0.1 },
    waveFrequency: { value: 0.3, min: 0.1, max: 2, step: 0.1 },
    waveSpeed: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
  })

  // Custom shader material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#0e7490') },
        uColorDeep: { value: new THREE.Color('#0c4a6e') },
        uColorFoam: { value: new THREE.Color('#e0f7fa') },
        uWaveHeight: { value: waveHeight },
        uWaveFrequency: { value: waveFrequency },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWaveHeight;
        uniform float uWaveFrequency;

        varying vec2 vUv;
        varying float vElevation;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        // Simplex noise functions for more natural waves
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

        void main() {
          vUv = uv;

          vec3 pos = position;

          // Multiple octaves of noise for realistic waves
          float wave1 = snoise(vec3(pos.x * uWaveFrequency * 0.5, pos.z * uWaveFrequency * 0.5, uTime * 0.3)) * 0.5;
          float wave2 = snoise(vec3(pos.x * uWaveFrequency, pos.z * uWaveFrequency, uTime * 0.5)) * 0.3;
          float wave3 = snoise(vec3(pos.x * uWaveFrequency * 2.0, pos.z * uWaveFrequency * 2.0, uTime * 0.7)) * 0.15;
          float wave4 = snoise(vec3(pos.x * uWaveFrequency * 4.0, pos.z * uWaveFrequency * 4.0, uTime)) * 0.05;

          vElevation = (wave1 + wave2 + wave3 + wave4) * uWaveHeight;
          pos.y += vElevation;

          // Calculate approximate normal for lighting
          float eps = 0.1;
          float h1 = snoise(vec3((position.x + eps) * uWaveFrequency * 0.5, position.z * uWaveFrequency * 0.5, uTime * 0.3)) * uWaveHeight;
          float h2 = snoise(vec3(position.x * uWaveFrequency * 0.5, (position.z + eps) * uWaveFrequency * 0.5, uTime * 0.3)) * uWaveHeight;

          vec3 tangent = normalize(vec3(eps, h1 - vElevation, 0.0));
          vec3 bitangent = normalize(vec3(0.0, h2 - vElevation, eps));
          vNormal = normalize(cross(bitangent, tangent));

          vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uColorDeep;
        uniform vec3 uColorFoam;
        uniform float uTime;

        varying vec2 vUv;
        varying float vElevation;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        void main() {
          // Base color mixing based on depth/elevation
          float depthFactor = smoothstep(-0.3, 0.3, vElevation);
          vec3 baseColor = mix(uColorDeep, uColor, depthFactor);

          // Foam on wave peaks
          float foam = smoothstep(0.15, 0.35, vElevation);
          baseColor = mix(baseColor, uColorFoam, foam * 0.4);

          // Simple fresnel effect
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
          baseColor += vec3(0.2, 0.3, 0.4) * fresnel * 0.3;

          // Sun reflection
          vec3 sunDir = normalize(vec3(1.0, 1.0, 1.0));
          vec3 reflectDir = reflect(-sunDir, vNormal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0);
          baseColor += vec3(1.0, 0.95, 0.8) * spec * 0.5;

          // Add subtle sparkle
          float sparkle = pow(max(dot(viewDir, reflect(-sunDir, vNormal + vec3(sin(uTime * 10.0 + vWorldPosition.x * 5.0) * 0.02))), 0.0), 128.0);
          baseColor += vec3(1.0) * sparkle * 0.3;

          gl_FragColor = vec4(baseColor, 1.0);
        }
      `,
      transparent: false,
      side: THREE.FrontSide,
      depthWrite: true,
      depthTest: true,
    })
  }, [])

  // Animate the water and follow player
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * waveSpeed
      materialRef.current.uniforms.uWaveHeight.value = waveHeight
      materialRef.current.uniforms.uWaveFrequency.value = waveFrequency
    }
  })

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[player.position[0], -0.5, player.position[2]]}
      receiveShadow
    >
      <planeGeometry args={[size, size, segments, segments]} />
      <primitive object={shaderMaterial} attach="material" ref={materialRef} />
    </mesh>
  )
}
