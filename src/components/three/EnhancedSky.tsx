import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useControls } from 'leva'

export function EnhancedSky() {
  const meshRef = useRef<THREE.Mesh>(null)

  const skyControls = useControls('Sky', {
    timeOfDay: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Time of Day' },
    skyBrightness: { value: 1.0, min: 0, max: 2, step: 0.1, label: 'Brightness' },
    sunsetIntensity: { value: 1.2, min: 0, max: 2, step: 0.1, label: 'Sunset Intensity' },
    cloudiness: { value: 0.3, min: 0, max: 1, step: 0.05, label: 'Cloudiness' },
  })

  const skyMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTimeOfDay: { value: skyControls.timeOfDay },
        uSkyBrightness: { value: skyControls.skyBrightness },
        uSunsetIntensity: { value: skyControls.sunsetIntensity },
        uCloudiness: { value: skyControls.cloudiness },
        uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vNormal = normalize(normalMatrix * normal);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTimeOfDay;
        uniform float uSkyBrightness;
        uniform float uSunsetIntensity;
        uniform float uCloudiness;
        uniform vec3 uSunPosition;

        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        // Simplex noise for clouds
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          // Normalize direction to sky
          vec3 direction = normalize(vWorldPosition);
          float elevation = direction.y;

          // Calculate sun position based on time of day
          float sunAngle = (uTimeOfDay - 0.5) * 3.14159;
          vec3 sunDir = normalize(vec3(cos(sunAngle) * 0.5, sin(sunAngle), 0.3));

          // Distance to sun (for sun disc and horizon glow)
          float sunDist = length(direction - sunDir);
          float sunInfluence = smoothstep(0.5, 0.0, sunDist);

          // Sky colors for different times of day
          // Night (0.0 - 0.15)
          vec3 nightSky = vec3(0.02, 0.03, 0.08);
          vec3 nightHorizon = vec3(0.05, 0.08, 0.15);

          // Dawn (0.15 - 0.3)
          vec3 dawnSky = vec3(0.3, 0.4, 0.6);
          vec3 dawnHorizon = vec3(0.9, 0.6, 0.4);

          // Day (0.3 - 0.7)
          vec3 daySky = vec3(0.3, 0.6, 1.0);
          vec3 dayHorizon = vec3(0.6, 0.75, 0.95);

          // Dusk (0.7 - 0.85)
          vec3 duskSky = vec3(0.2, 0.3, 0.5);
          vec3 duskHorizon = vec3(1.0, 0.5, 0.3);

          // Blend sky colors based on time of day
          vec3 skyColor, horizonColor;

          if (uTimeOfDay < 0.15) {
            // Night
            float t = uTimeOfDay / 0.15;
            skyColor = nightSky;
            horizonColor = nightHorizon;
          } else if (uTimeOfDay < 0.3) {
            // Dawn transition
            float t = (uTimeOfDay - 0.15) / 0.15;
            skyColor = mix(nightSky, dawnSky, t);
            horizonColor = mix(nightHorizon, dawnHorizon, t);
          } else if (uTimeOfDay < 0.7) {
            // Day
            float t = (uTimeOfDay - 0.3) / 0.4;
            skyColor = mix(dawnSky, daySky, smoothstep(0.0, 0.3, t));
            horizonColor = mix(dawnHorizon, dayHorizon, smoothstep(0.0, 0.3, t));
          } else if (uTimeOfDay < 0.85) {
            // Dusk transition
            float t = (uTimeOfDay - 0.7) / 0.15;
            skyColor = mix(daySky, duskSky, t);
            horizonColor = mix(dayHorizon, duskHorizon, t);
          } else {
            // Late evening to night
            float t = (uTimeOfDay - 0.85) / 0.15;
            skyColor = mix(duskSky, nightSky, t);
            horizonColor = mix(duskHorizon, nightHorizon, t);
          }

          // Gradient from horizon to zenith
          float horizonBlend = smoothstep(-0.2, 0.4, elevation);
          vec3 baseColor = mix(horizonColor, skyColor, horizonBlend);

          // Sunset/sunrise glow around the sun
          if (uTimeOfDay > 0.15 && uTimeOfDay < 0.85) {
            float sunriseSunsetFactor = 0.0;
            if (uTimeOfDay < 0.35) {
              // Dawn glow
              sunriseSunsetFactor = smoothstep(0.15, 0.3, uTimeOfDay) * smoothstep(0.35, 0.3, uTimeOfDay);
            } else if (uTimeOfDay > 0.65) {
              // Dusk glow
              sunriseSunsetFactor = smoothstep(0.65, 0.7, uTimeOfDay) * smoothstep(0.85, 0.7, uTimeOfDay);
            }

            // Sunset colors
            vec3 sunsetOrange = vec3(1.0, 0.5, 0.2);
            vec3 sunsetPink = vec3(1.0, 0.3, 0.5);
            vec3 sunsetPurple = vec3(0.6, 0.2, 0.8);

            // Create sunset gradient
            float sunsetGlow = exp(-sunDist * 2.0) * sunriseSunsetFactor * uSunsetIntensity;
            vec3 sunsetColor = mix(
              mix(sunsetOrange, sunsetPink, smoothstep(0.0, 0.3, sunDist)),
              sunsetPurple,
              smoothstep(0.3, 0.8, sunDist)
            );

            baseColor += sunsetColor * sunsetGlow;
          }

          // Sun disc
          if (uTimeOfDay > 0.2 && uTimeOfDay < 0.8) {
            float sunDisc = smoothstep(0.05, 0.02, sunDist);
            vec3 sunColor = vec3(1.0, 0.95, 0.8);
            baseColor = mix(baseColor, sunColor, sunDisc);
          }

          // Moon (opposite of sun)
          vec3 moonDir = -sunDir;
          float moonDist = length(direction - moonDir);
          float moonDisc = smoothstep(0.03, 0.01, moonDist);
          if (uTimeOfDay < 0.3 || uTimeOfDay > 0.7) {
            vec3 moonColor = vec3(0.9, 0.9, 1.0);
            baseColor = mix(baseColor, moonColor, moonDisc * 0.8);
          }

          // Atmospheric clouds
          vec2 cloudUV = direction.xz / direction.y * 0.5;
          float cloudNoise = snoise(cloudUV * 3.0) * 0.5 + 0.5;
          cloudNoise += snoise(cloudUV * 6.0) * 0.25;
          cloudNoise = smoothstep(0.4, 0.8, cloudNoise) * uCloudiness;

          // Cloud color based on time of day
          vec3 cloudColor = mix(baseColor * 0.8, baseColor * 1.2, cloudNoise);
          baseColor = mix(baseColor, cloudColor, cloudNoise * 0.6 * smoothstep(-0.1, 0.3, elevation));

          // Apply overall brightness
          baseColor *= uSkyBrightness;

          // Stars at night
          if (uTimeOfDay < 0.2 || uTimeOfDay > 0.8) {
            float starField = snoise(direction.xz * 100.0);
            float stars = smoothstep(0.98, 0.99, starField);
            float starBrightness = 1.0;
            if (uTimeOfDay < 0.2) {
              starBrightness = smoothstep(0.2, 0.0, uTimeOfDay);
            } else {
              starBrightness = smoothstep(0.8, 1.0, uTimeOfDay);
            }
            baseColor += vec3(1.0) * stars * starBrightness * 0.8;
          }

          gl_FragColor = vec4(baseColor, 1.0);
        }
      `,
    })
  }, [])

  // Update uniforms
  useFrame(() => {
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTimeOfDay.value = skyControls.timeOfDay
      material.uniforms.uSkyBrightness.value = skyControls.skyBrightness
      material.uniforms.uSunsetIntensity.value = skyControls.sunsetIntensity
      material.uniforms.uCloudiness.value = skyControls.cloudiness
    }
  })

  return (
    <mesh ref={meshRef} renderOrder={-1000}>
      <sphereGeometry args={[9000, 32, 32]} />
      <primitive object={skyMaterial} attach="material" />
    </mesh>
  )
}
