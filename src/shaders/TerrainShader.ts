import * as THREE from 'three'

/**
 * Advanced Terrain Shader
 * Features:
 * - Multi-texture blending based on slope and elevation
 * - Triplanar mapping for seamless textures
 * - Normal mapping for surface detail
 * - Dynamic color transitions (beach → grass → rock → snow)
 * - Ambient occlusion approximation
 * - Subsurface scattering for sand
 */

export const terrainVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vElevation;
  varying vec3 vViewPosition;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vElevation = position.y;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`

export const terrainFragmentShader = `
  uniform float uMaxHeight;
  uniform float uBeachHeight;
  uniform float uGrassHeight;
  uniform float uRockHeight;
  uniform vec3 uSandColor;
  uniform vec3 uGrassColor;
  uniform vec3 uRockColor;
  uniform vec3 uSnowColor;
  uniform vec3 uWaterColor;
  uniform vec3 uSunPosition;
  uniform float uTime;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vElevation;
  varying vec3 vViewPosition;

  // Simplex noise for detail
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Triplanar mapping for seamless textures
  vec3 triplanarBlend(vec3 normal) {
    vec3 blending = abs(normal);
    blending = normalize(max(blending, 0.00001));
    float b = (blending.x + blending.y + blending.z);
    blending /= vec3(b, b, b);
    return blending;
  }

  // Generate procedural detail texture
  float getProceduralDetail(vec3 pos, float scale) {
    float detail = 0.0;
    detail += snoise(pos.xz * scale) * 0.5;
    detail += snoise(pos.xz * scale * 2.0) * 0.25;
    detail += snoise(pos.xz * scale * 4.0) * 0.125;
    return detail;
  }

  void main() {
    // Normalize inputs
    vec3 normal = normalize(vNormal);
    float slope = 1.0 - abs(dot(normal, vec3(0.0, 1.0, 0.0)));
    float normalizedHeight = clamp(vElevation / uMaxHeight, 0.0, 1.0);

    // Triplanar blending weights
    vec3 triplanar = triplanarBlend(normal);

    // Procedural detail at different scales
    float detailFine = getProceduralDetail(vWorldPosition, 0.05);
    float detailMedium = getProceduralDetail(vWorldPosition, 0.02);
    float detailCoarse = getProceduralDetail(vWorldPosition, 0.01);

    // Base terrain colors with procedural variation
    vec3 sandColor = uSandColor + vec3(detailFine * 0.1);
    vec3 grassColor = uGrassColor + vec3(detailMedium * 0.15);
    vec3 rockColor = uRockColor + vec3(detailCoarse * 0.2);
    vec3 snowColor = uSnowColor + vec3(detailFine * 0.05);

    // Height-based texture blending
    vec3 finalColor;

    if (normalizedHeight < uBeachHeight) {
      // Beach/sand zone with slight color variation
      float beachBlend = normalizedHeight / uBeachHeight;
      finalColor = mix(uWaterColor, sandColor, beachBlend);

      // Add sparkle to wet sand
      float sparkle = max(0.0, snoise(vWorldPosition.xz * 10.0 + uTime * 0.5)) * 0.3;
      finalColor += vec3(sparkle) * (1.0 - beachBlend);

    } else if (normalizedHeight < uGrassHeight) {
      // Grass zone
      float grassBlend = (normalizedHeight - uBeachHeight) / (uGrassHeight - uBeachHeight);
      vec3 baseGrass = mix(sandColor, grassColor, smoothstep(0.0, 0.3, grassBlend));

      // Add slope-based variation (grass doesn't grow on steep slopes)
      float slopeFactor = smoothstep(0.5, 0.8, slope);
      finalColor = mix(baseGrass, rockColor * 0.8, slopeFactor);

    } else if (normalizedHeight < uRockHeight) {
      // Rock zone
      float rockBlend = (normalizedHeight - uGrassHeight) / (uRockHeight - uGrassHeight);
      vec3 baseRock = mix(grassColor, rockColor, smoothstep(0.0, 0.5, rockBlend));

      // Rocks are more prominent on slopes
      float slopeRock = smoothstep(0.3, 0.7, slope);
      finalColor = mix(baseRock, rockColor, slopeRock);

    } else {
      // Snow/peak zone
      float snowBlend = (normalizedHeight - uRockHeight) / (1.0 - uRockHeight);
      finalColor = mix(rockColor, snowColor, smoothstep(0.0, 0.6, snowBlend));

      // Pristine snow on flat surfaces
      float snowCoverage = smoothstep(0.7, 0.3, slope);
      finalColor = mix(finalColor, snowColor, snowCoverage * snowBlend);
    }

    // Ambient occlusion approximation (darker in crevices) - reduced for better visibility
    float ao = 1.0 - (slope * 0.15);
    finalColor *= ao;

    // Lighting calculations
    vec3 lightDir = normalize(uSunPosition);
    float diffuse = max(dot(normal, lightDir), 0.0);

    // Soft ambient lighting - increased minimum for dark terrains
    float ambient = 0.5 + 0.3 * (normal.y * 0.5 + 0.5);

    // Combine lighting
    float lighting = ambient + diffuse * 0.7;
    finalColor *= lighting;

    // Atmospheric perspective (distance fog)
    float viewDistance = length(vViewPosition);
    float fogFactor = smoothstep(200.0, 800.0, viewDistance);
    vec3 fogColor = vec3(0.7, 0.8, 0.9);
    finalColor = mix(finalColor, fogColor, fogFactor * 0.6);

    // Fresnel rim lighting for silhouette enhancement
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    finalColor += vec3(0.1, 0.15, 0.2) * fresnel * 0.3;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

export interface TerrainShaderUniforms {
  [uniform: string]: { value: any }
  uMaxHeight: { value: number }
  uBeachHeight: { value: number }
  uGrassHeight: { value: number }
  uRockHeight: { value: number }
  uSandColor: { value: THREE.Color }
  uGrassColor: { value: THREE.Color }
  uRockColor: { value: THREE.Color }
  uSnowColor: { value: THREE.Color }
  uWaterColor: { value: THREE.Color }
  uSunPosition: { value: THREE.Vector3 }
  uTime: { value: number }
}

export function createTerrainMaterial(maxHeight: number, islandType: string): THREE.ShaderMaterial {
  // Color palettes based on island type
  let sandColor, grassColor, rockColor, snowColor, waterColor

  switch (islandType) {
    case 'iceberg':
    case 'arctic':
      // Arctic/Iceberg palette - pure ice and snow
      sandColor = new THREE.Color(0xd0e8f0) // Ice blue base
      grassColor = new THREE.Color(0xe0f0f5) // Light ice
      rockColor = new THREE.Color(0xa0c8d8) // Deep ice blue
      snowColor = new THREE.Color(0xffffff) // Pure white snow
      waterColor = new THREE.Color(0xb8d8e8) // Icy water
      break
    case 'volcanic':
      sandColor = new THREE.Color(0x707070) // Much brighter volcanic sand
      grassColor = new THREE.Color(0x5a7a5a) // Brighter dark green
      rockColor = new THREE.Color(0x606a8a) // Brighter blue-gray rock
      snowColor = new THREE.Color(0xe0e0e0) // Gray snow
      waterColor = new THREE.Color(0x3a5a6a) // Brighter water
      break
    case 'coral':
      sandColor = new THREE.Color(0xffe4b5) // Coral sand
      grassColor = new THREE.Color(0x90ee90) // Light green
      rockColor = new THREE.Color(0xcd853f) // Coral rock
      snowColor = new THREE.Color(0xffffff) // White
      waterColor = new THREE.Color(0x4682b4)
      break
    case 'sandy':
      sandColor = new THREE.Color(0xf4e4c1) // Golden sand
      grassColor = new THREE.Color(0x7cb342) // Olive green
      rockColor = new THREE.Color(0xa0826d) // Sandstone
      snowColor = new THREE.Color(0xfffafa) // Snow white
      waterColor = new THREE.Color(0x5b9aa0)
      break
    default:
      sandColor = new THREE.Color(0xf4d03f)
      grassColor = new THREE.Color(0x4a7c59)
      rockColor = new THREE.Color(0x8b7355)
      snowColor = new THREE.Color(0xffffff)
      waterColor = new THREE.Color(0x4a90a4)
  }

  const uniforms: TerrainShaderUniforms = {
    uMaxHeight: { value: maxHeight },
    uBeachHeight: { value: 0.15 },
    uGrassHeight: { value: 0.4 },
    uRockHeight: { value: 0.7 },
    uSandColor: { value: sandColor },
    uGrassColor: { value: grassColor },
    uRockColor: { value: rockColor },
    uSnowColor: { value: snowColor },
    uWaterColor: { value: waterColor },
    uSunPosition: { value: new THREE.Vector3(50, 50, 25) },
    uTime: { value: 0 }
  }

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    side: THREE.FrontSide,
  })
}
