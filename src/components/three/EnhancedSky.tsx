import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useControls, folder } from 'leva'

// Atmospheric scattering sky shader
const atmosphericSkyVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vSunDirection;
  varying float vSunE;
  varying vec3 vBetaR;
  varying vec3 vBetaM;

  uniform vec3 uSunPosition;

  // Rayleigh and Mie coefficients
  const float rayleighZenithLength = 8.4e3;
  const float mieZenithLength = 1.25e3;
  const vec3 lambda = vec3(680e-9, 550e-9, 450e-9);
  const vec3 K = vec3(0.686, 0.678, 0.666);
  const float v = 4.0;

  const float pi = 3.141592653589793;

  // Rayleigh coefficient
  vec3 totalRayleigh(vec3 lambda) {
    return (8.0 * pow(pi, 3.0) * pow(pow(1.0003, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * 0.035)) /
           (3.0 * 2.545e25 * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * 0.035));
  }

  // Mie coefficient
  vec3 totalMie(vec3 lambda, vec3 K, float T) {
    float c = (0.2 * T) * 10e-18;
    return 0.434 * c * pi * pow((2.0 * pi) / lambda, vec3(v - 2.0)) * K;
  }

  // Sun intensity
  float sunIntensity(float zenithAngleCos) {
    return 1000.0 * max(0.0, 1.0 - exp(-((acos(zenithAngleCos) * 180.0 / pi - 93.0) / -6.5)));
  }

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vSunDirection = normalize(uSunPosition);
    vSunE = sunIntensity(dot(vSunDirection, vec3(0.0, 1.0, 0.0)));

    // Calculate scattering coefficients
    float turbidity = 2.0;
    vBetaR = totalRayleigh(lambda);
    vBetaM = totalMie(lambda, K, turbidity);
  }
`

const atmosphericSkyFragmentShader = `
  uniform float uTimeOfDay;
  uniform float uSkyBrightness;
  uniform float uSunsetIntensity;
  uniform float uCloudiness;
  uniform float uRayleighCoeff;
  uniform float uMieCoeff;
  uniform float uMieDirectionalG;
  uniform vec3 uSunPosition;
  uniform float uTime;

  varying vec3 vWorldPosition;
  varying vec3 vSunDirection;
  varying float vSunE;
  varying vec3 vBetaR;
  varying vec3 vBetaM;

  const float pi = 3.141592653589793;
  const float n = 1.0003; // Refractive index of air
  const float N = 2.545e25; // Number of molecules per unit volume

  // Rayleigh and Mie scattering constants
  const float rayleighZenithLength = 8.4e3;
  const float mieZenithLength = 1.25e3;
  const vec3 up = vec3(0.0, 1.0, 0.0);

  // Rayleigh phase function
  float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * pi)) * (1.0 + pow(cosTheta, 2.0));
  }

  // Henyey-Greenstein phase function for Mie scattering
  float hgPhase(float cosTheta, float g) {
    float g2 = g * g;
    float inverse = 1.0 / pow(1.0 - 2.0 * g * cosTheta + g2, 1.5);
    return (1.0 / (4.0 * pi)) * ((1.0 - g2) * inverse);
  }

  // Simplex noise for clouds
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
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

  // FBM noise for volumetric clouds
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
      value += amplitude * (snoise(p * frequency) * 0.5 + 0.5);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 direction = normalize(vWorldPosition);

    // Calculate sun position based on time of day
    float sunAngle = (uTimeOfDay - 0.5) * pi;
    vec3 sunDirection = normalize(vec3(cos(sunAngle) * 0.7, sin(sunAngle), 0.4));

    // Optical length and zenith angle
    float zenithAngle = acos(max(0.0, dot(up, direction)));
    float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
    float sR = rayleighZenithLength * inverse;
    float sM = mieZenithLength * inverse;

    // Extinction factor
    vec3 Fex = exp(-(vBetaR * uRayleighCoeff * sR + vBetaM * uMieCoeff * sM));

    // Scattering
    float cosTheta = dot(direction, sunDirection);

    // Combined scattering
    float rPhase = rayleighPhase(cosTheta);
    vec3 betaRTheta = vBetaR * uRayleighCoeff * rPhase;

    float mPhase = hgPhase(cosTheta, uMieDirectionalG);
    vec3 betaMTheta = vBetaM * uMieCoeff * mPhase;

    // Sun intensity based on zenith angle
    float sunE = vSunE * uSkyBrightness;

    // In-scattering
    vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * (1.0 - Fex), vec3(1.5));
    Lin *= mix(vec3(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * Fex, vec3(0.5)), clamp(pow(1.0 - dot(up, sunDirection), 5.0), 0.0, 1.0));

    // Night sky gradient
    float nightMix = smoothstep(0.2, 0.0, sunDirection.y);
    vec3 nightSky = vec3(0.02, 0.03, 0.08);
    vec3 nightHorizon = vec3(0.05, 0.08, 0.15);
    float horizonMix = smoothstep(-0.1, 0.3, direction.y);
    vec3 nightColor = mix(nightHorizon, nightSky, horizonMix);

    // Composition
    vec3 skyColor = Lin;

    // Sun disc
    float sunDist = length(direction - sunDirection);
    float sunDisc = smoothstep(0.04, 0.02, sunDist);
    float sunGlow = exp(-sunDist * 3.0) * 0.5;
    vec3 sunColor = vec3(1.0, 0.95, 0.85) * sunE * 0.00001;
    skyColor += sunColor * (sunDisc + sunGlow);

    // Sunset/sunrise enhancement
    float sunsetFactor = pow(max(0.0, 1.0 - abs(sunDirection.y) * 2.0), 2.0);
    vec3 sunsetColors = mix(
      vec3(1.0, 0.5, 0.2),
      vec3(1.0, 0.3, 0.5),
      smoothstep(0.0, 0.5, sunDist)
    );
    float horizonGlow = exp(-pow(direction.y * 3.0, 2.0)) * sunsetFactor;
    skyColor += sunsetColors * horizonGlow * uSunsetIntensity * 2.0;

    // Blend with night sky
    skyColor = mix(skyColor, nightColor, nightMix);

    // Moon
    vec3 moonDir = -sunDirection;
    float moonDist = length(direction - moonDir);
    float moonDisc = smoothstep(0.025, 0.015, moonDist);
    vec3 moonColor = vec3(0.9, 0.92, 1.0);
    float moonGlow = exp(-moonDist * 8.0) * 0.1 * nightMix;
    skyColor += moonColor * (moonDisc * 0.7 + moonGlow) * nightMix;

    // Stars
    if (nightMix > 0.1) {
      float starNoise = snoise(direction.xz * 150.0 + direction.y * 50.0);
      float stars = smoothstep(0.97, 0.99, starNoise) * nightMix;
      float twinkle = sin(uTime * 3.0 + starNoise * 100.0) * 0.3 + 0.7;
      skyColor += vec3(1.0, 0.98, 0.95) * stars * twinkle * 0.8;

      // Milky way approximation
      float milkyWay = fbm(direction.xz * 5.0 + vec2(0.0, direction.y * 2.0)) * 0.3;
      milkyWay *= smoothstep(0.3, 0.7, direction.y) * smoothstep(0.9, 0.5, abs(direction.x));
      skyColor += vec3(0.6, 0.6, 0.8) * milkyWay * nightMix * 0.3;
    }

    // Volumetric clouds
    if (direction.y > 0.0 && uCloudiness > 0.0) {
      vec2 cloudUV = direction.xz / (direction.y + 0.1) * 0.5;
      cloudUV += uTime * 0.01;

      float cloudDensity = fbm(cloudUV * 2.0);
      cloudDensity = smoothstep(0.4 - uCloudiness * 0.3, 0.7, cloudDensity);

      // Cloud color based on sun position
      vec3 cloudLit = vec3(1.0, 0.98, 0.95);
      vec3 cloudShadow = vec3(0.5, 0.55, 0.65);

      // Sunset cloud colors
      vec3 sunsetCloudColor = mix(
        vec3(1.0, 0.6, 0.3),
        vec3(1.0, 0.4, 0.5),
        smoothstep(0.0, 0.3, cloudDensity)
      );
      cloudLit = mix(cloudLit, sunsetCloudColor, sunsetFactor * 1.5);

      // Cloud lighting based on sun position
      float cloudLight = dot(sunDirection, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
      vec3 cloudColor = mix(cloudShadow, cloudLit, cloudLight);

      // Night clouds
      cloudColor = mix(cloudColor, nightColor * 1.5, nightMix);

      // Apply clouds
      float cloudAlpha = cloudDensity * uCloudiness * smoothstep(0.0, 0.3, direction.y);
      skyColor = mix(skyColor, cloudColor, cloudAlpha * 0.8);
    }

    // Tone mapping and gamma correction
    skyColor = 1.0 - exp(-1.5 * skyColor);
    skyColor = pow(skyColor, vec3(1.0 / 2.2));

    // Final brightness adjustment
    skyColor *= uSkyBrightness;

    gl_FragColor = vec4(skyColor, 1.0);
  }
`

export function EnhancedSky() {
  const meshRef = useRef<THREE.Mesh>(null)

  const skyControls = useControls('Sky', {
    'Time': folder({
      timeOfDay: { value: 0.45, min: 0, max: 1, step: 0.01, label: 'Time of Day' },
    }),
    'Atmosphere': folder({
      skyBrightness: { value: 1.0, min: 0, max: 2, step: 0.1, label: 'Brightness' },
      sunsetIntensity: { value: 1.0, min: 0, max: 2, step: 0.1, label: 'Sunset Intensity' },
      rayleighCoeff: { value: 2.0, min: 0.1, max: 10, step: 0.1, label: 'Rayleigh' },
      mieCoeff: { value: 0.005, min: 0.001, max: 0.1, step: 0.001, label: 'Mie' },
      mieDirectionalG: { value: 0.8, min: 0, max: 0.99, step: 0.01, label: 'Mie G' },
    }),
    'Clouds': folder({
      cloudiness: { value: 0.4, min: 0, max: 1, step: 0.05, label: 'Cloudiness' },
    }),
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
        uRayleighCoeff: { value: skyControls.rayleighCoeff },
        uMieCoeff: { value: skyControls.mieCoeff },
        uMieDirectionalG: { value: skyControls.mieDirectionalG },
        uSunPosition: { value: new THREE.Vector3(0, 1, 0) },
        uTime: { value: 0 },
      },
      vertexShader: atmosphericSkyVertexShader,
      fragmentShader: atmosphericSkyFragmentShader,
    })
  }, [])

  // Update uniforms
  useFrame((state) => {
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTimeOfDay.value = skyControls.timeOfDay
      material.uniforms.uSkyBrightness.value = skyControls.skyBrightness
      material.uniforms.uSunsetIntensity.value = skyControls.sunsetIntensity
      material.uniforms.uCloudiness.value = skyControls.cloudiness
      material.uniforms.uRayleighCoeff.value = skyControls.rayleighCoeff
      material.uniforms.uMieCoeff.value = skyControls.mieCoeff
      material.uniforms.uMieDirectionalG.value = skyControls.mieDirectionalG
      material.uniforms.uTime.value = state.clock.elapsedTime

      // Update sun position based on time of day
      const sunAngle = (skyControls.timeOfDay - 0.5) * Math.PI
      material.uniforms.uSunPosition.value.set(
        Math.cos(sunAngle) * 0.7,
        Math.sin(sunAngle),
        0.4
      ).normalize()
    }
  })

  return (
    <mesh ref={meshRef} renderOrder={-1000}>
      <sphereGeometry args={[8500, 64, 64]} />
      <primitive object={skyMaterial} attach="material" />
    </mesh>
  )
}
