import { Perlin } from '../utils/Perlin';

export type WorldDifficulty = 'peaceful' | 'moderate' | 'challenging' | 'extreme';

// ── Island distribution patterns ──
export type IslandDistribution = 'ring' | 'clustered' | 'scattered' | 'archipelago';

// ── Iceberg spread patterns ──
export type IcebergSpread = 'concentrated' | 'dispersed' | 'lanes' | 'random';

// ── Race length presets ──
export type RaceLength = 'short' | 'medium' | 'long';

// ── Full map configuration ──
export interface MapConfig {
  // Identity
  seed: number;
  name: string;

  // Map dimensions
  worldSize: number;             // 4000 – 20000 units

  // Difficulty base (still used for defaults)
  difficulty: WorldDifficulty;

  // ── Ice Mountain Islands ──
  islandCount: number;           // 2 – 25
  islandSizeScale: number;       // 0.3 – 2.5 multiplier on radius
  islandHeightScale: number;     // 0.3 – 2.5 multiplier on height
  islandDistribution: IslandDistribution;

  // ── Icebergs ──
  icebergCount: number;          // 0 – 250
  icebergSizeScale: number;      // 0.3 – 3.0 multiplier
  icebergSpread: IcebergSpread;

  // ── Floating Ice ──
  floatingIceDensity: number;    // 0 – 2500 pieces
  floatingIceSizeScale: number;  // 0.3 – 3.0 multiplier

  // ── Wind & Weather ──
  windZoneCount: number;         // 0 – 10
  windStrengthMultiplier: number;// 0.2 – 3.0
  weatherVolatility: number;     // 0.0 – 1.0 (how chaotic the weather is)

  // ── Race Routes ──
  raceCount: number;             // 0 – 8
  raceLength: RaceLength;
  routeComplexity: number;       // 0.2 – 3.0 (lateral checkpoint deviation)

  // ── Points of Interest ──
  poiDensity: number;            // 0.2 – 3.0 multiplier
  discoveryRewardMultiplier: number; // 0.5 – 5.0

  // ── Marina ──
  marinaChargeRate: number;      // 1 – 25 EC/s
  safeZoneRadius: number;        // 100 – 1500 units

  // ── Fun / Challenge Modifiers ──
  fogDensity: number;            // 0.0 – 1.0
  currentStrength: number;       // 0.0 – 1.0
  icebergDrift: boolean;         // icebergs slowly move
  nightMode: boolean;            // start the world at night
  energyMultiplier: number;      // 0.5 – 5.0
}

// ── Helper: build MapConfig from legacy parameters ──
export function buildMapConfig(
  seed: number,
  worldSize: number = 10000,
  difficulty: WorldDifficulty = 'moderate',
): MapConfig {
  const ds = DIFFICULTY_SETTINGS[difficulty];
  return {
    seed,
    name: 'Custom Map',
    worldSize,
    difficulty,
    islandCount: 10,
    islandSizeScale: 1.0,
    islandHeightScale: 1.0,
    islandDistribution: 'ring',
    icebergCount: ds.icebergCount,
    icebergSizeScale: 1.0,
    icebergSpread: 'random',
    floatingIceDensity: ds.floatingIceCount,
    floatingIceSizeScale: 1.0,
    windZoneCount: 4,
    windStrengthMultiplier: 1.0,
    weatherVolatility: 0.3,
    raceCount: 3,
    raceLength: 'medium',
    routeComplexity: 1.0,
    poiDensity: 1.0,
    discoveryRewardMultiplier: 1.0,
    marinaChargeRate: 5,
    safeZoneRadius: 400,
    fogDensity: 0.15,
    currentStrength: 0.0,
    icebergDrift: false,
    nightMode: false,
    energyMultiplier: 1.0,
  };
}

export interface Island {
  id: string;
  position: [number, number];
  radius: number;
  height: number;
  elevation: (x: number, z: number) => number;
  type: 'volcanic' | 'coral' | 'sandy';
}

export interface Iceberg {
  id: string;
  position: [number, number];
  radius: number;
  height: number;
  seed: number;
}

export interface FloatingIce {
  id: string;
  position: [number, number];
  radius: number;  // Smaller than icebergs (2-8 units)
  seed: number;
}

export interface RaceRoute {
  id: string;
  name: string;
  checkpoints: Array<{
    id: string;
    position: [number, number];
    radius: number;
    order: number;
  }>;
  startPosition: [number, number];
  endPosition: [number, number];
}

export interface WindZone {
  id: string;
  position: [number, number];
  radius: number;
  direction: number;
  speed: number;
  pattern: 'trade-winds' | 'doldrums' | 'monsoon' | 'storm-path';
}

export interface POI {
  id: string;
  position: [number, number];
  type: 'reef' | 'wreck' | 'buoy' | 'wildlife' | 'research-station';
  name: string;
  discoveryReward: number; // Energy credits
}

export interface Marina {
  id: string;
  position: [number, number];
  name: string;
  dockingZoneRadius: number;
  chargeRate: number; // EC per second when docked
}

export interface WorldData {
  seed: number;
  difficulty: WorldDifficulty;
  mapConfig: MapConfig;
  bounds: { min: [number, number]; max: [number, number] };
  islands: Island[];
  icebergs: Iceberg[];
  floatingIce: FloatingIce[];  // Smaller ice chunks
  windZones: WindZone[];
  pois: POI[];
  marina: Marina;
  races: RaceRoute[];
}

const perlin = new Perlin(0);

// Difficulty settings for iceberg and floating ice generation
// Increased floating ice counts for more Antarctic feel with smaller pieces spread over the map
const DIFFICULTY_SETTINGS: Record<WorldDifficulty, {
  icebergCount: number;
  minRadius: number;
  maxRadius: number;
  minHeight: number;
  maxHeight: number;
  minSpawnDist: number;
  maxSpawnDist: number;
  floatingIceCount: number;  // Smaller ice chunks - increased for Antarctica feel
  floatingIceMinRadius: number;
  floatingIceMaxRadius: number;
}> = {
  peaceful: { icebergCount: 12, minRadius: 12, maxRadius: 30, minHeight: 10, maxHeight: 25, minSpawnDist: 800, maxSpawnDist: 4000, floatingIceCount: 300, floatingIceMinRadius: 1, floatingIceMaxRadius: 4 },
  moderate: { icebergCount: 35, minRadius: 15, maxRadius: 40, minHeight: 15, maxHeight: 35, minSpawnDist: 500, maxSpawnDist: 4500, floatingIceCount: 600, floatingIceMinRadius: 1, floatingIceMaxRadius: 5 },
  challenging: { icebergCount: 60, minRadius: 20, maxRadius: 50, minHeight: 20, maxHeight: 45, minSpawnDist: 400, maxSpawnDist: 5000, floatingIceCount: 900, floatingIceMinRadius: 1.5, floatingIceMaxRadius: 6 },
  extreme: { icebergCount: 100, minRadius: 25, maxRadius: 60, minHeight: 25, maxHeight: 55, minSpawnDist: 300, maxSpawnDist: 5000, floatingIceCount: 1500, floatingIceMinRadius: 1.5, floatingIceMaxRadius: 8 },
};

// ── Legacy entry point (backwards compat) ──
export function generateWorld(seed: number, worldSize?: number, difficulty?: WorldDifficulty): WorldData;
// ── New entry point with full MapConfig ──
export function generateWorld(config: MapConfig): WorldData;
export function generateWorld(
  seedOrConfig: number | MapConfig,
  worldSize: number = 10000,
  difficulty: WorldDifficulty = 'moderate',
): WorldData {
  const config: MapConfig =
    typeof seedOrConfig === 'number'
      ? buildMapConfig(seedOrConfig, worldSize, difficulty)
      : seedOrConfig;

  perlin.reseed(config.seed);

  const bounds: WorldData['bounds'] = {
    min: [-config.worldSize / 2, -config.worldSize / 2],
    max: [config.worldSize / 2, config.worldSize / 2],
  };

  const islands = generateIslands(config, bounds);
  const icebergs = generateIcebergs(config, bounds, islands);
  const floatingIce = generateFloatingIce(config, bounds, islands, icebergs);
  const windZones = generateWindZones(config, bounds);
  const pois = generatePOIs(config, bounds, islands);
  const marina = generateMarina(config);
  const races = generateRaces(config, bounds, islands, icebergs);

  return {
    seed: config.seed,
    difficulty: config.difficulty,
    mapConfig: config,
    bounds,
    islands,
    icebergs,
    floatingIce,
    windZones,
    pois,
    marina,
    races,
  };
}

function generateIslands(config: MapConfig, bounds: WorldData['bounds']): Island[] {
  const islands: Island[] = [];
  const seed = config.seed;
  const islandCount = config.islandCount;
  const halfWorld = config.worldSize / 2;

  for (let i = 0; i < islandCount; i++) {
    let x: number, z: number;

    switch (config.islandDistribution) {
      case 'ring': {
        // Evenly spaced ring around the centre
        const angle = (i / islandCount) * Math.PI * 2;
        const distance = halfWorld * 0.4 + perlin.noise(seed + i, 1) * halfWorld * 0.3;
        x = Math.cos(angle) * distance;
        z = Math.sin(angle) * distance;
        break;
      }
      case 'clustered': {
        // 2-4 cluster centres, islands group around them
        const clusterCount = 2 + Math.floor(perlin.noise(seed, 77) * 3);
        const cluster = i % clusterCount;
        const clusterAngle = (cluster / clusterCount) * Math.PI * 2 + perlin.noise(seed + cluster, 78) * 0.5;
        const clusterDist = halfWorld * 0.35 + perlin.noise(seed + cluster, 79) * halfWorld * 0.2;
        const cx = Math.cos(clusterAngle) * clusterDist;
        const cz = Math.sin(clusterAngle) * clusterDist;
        const spread = halfWorld * 0.15;
        x = cx + (perlin.noise(seed + i * 5, 80) - 0.5) * spread * 2;
        z = cz + (perlin.noise(seed + i * 6, 81) - 0.5) * spread * 2;
        break;
      }
      case 'scattered': {
        // Random placement across the map
        x = (perlin.noise(seed + i * 10, 82) - 0.5) * config.worldSize * 0.8;
        z = (perlin.noise(seed + i * 11, 83) - 0.5) * config.worldSize * 0.8;
        break;
      }
      case 'archipelago': {
        // Chain of islands in a winding path
        const t = i / Math.max(1, islandCount - 1);
        const pathAngle = t * Math.PI * 3 + perlin.noise(seed + i, 84) * 1.5;
        const pathDist = halfWorld * 0.15 + t * halfWorld * 0.5;
        x = Math.cos(pathAngle) * pathDist + (perlin.noise(seed + i * 7, 85) - 0.5) * 400;
        z = Math.sin(pathAngle) * pathDist + (perlin.noise(seed + i * 8, 86) - 0.5) * 400;
        break;
      }
    }

    // Clamp to bounds
    const clampedX = Math.max(bounds.min[0] + 500, Math.min(bounds.max[0] - 500, x));
    const clampedZ = Math.max(bounds.min[1] + 500, Math.min(bounds.max[1] - 500, z));

    const baseRadius = 300 + perlin.noise(seed + i * 2, 2) * 200;
    const radius = baseRadius * config.islandSizeScale;
    const baseHeight = 100 + perlin.noise(seed + i * 3, 3) * 150;
    const height = baseHeight * config.islandHeightScale;
    const types: Array<Island['type']> = ['volcanic', 'coral', 'sandy'];
    const islandTypeIndex = Math.floor(Math.abs(perlin.noise(seed + i * 4, 4)) * types.length) % types.length;

    islands.push({
      id: `island-${i}`,
      position: [clampedX, clampedZ],
      radius,
      height,
      type: types[islandTypeIndex],
      elevation: createElevationFunction(clampedX, clampedZ, radius, height, seed + i),
    });
  }

  return islands;
}

function createElevationFunction(
  centerX: number,
  centerZ: number,
  radius: number,
  maxHeight: number,
  _seed: number
) {
  return (x: number, z: number): number => {
    try {
      const dx = x - centerX;
      const dz = z - centerZ;
      const distToCenter = Math.sqrt(dx * dx + dz * dz);

      if (distToCenter > radius) return 0;

      // Smooth falloff from center to edge
      const normalizedDist = distToCenter / radius;
      const falloff = Math.cos(normalizedDist * Math.PI * 0.5) ** 2;

      // Add Perlin noise for terrain variation
      const noiseVal = perlin.noise(x / 100, z / 100) * 0.5;

      const result = maxHeight * falloff * (0.8 + noiseVal);

      // Safety check for NaN or invalid values
      return isNaN(result) || !isFinite(result) ? 0 : result;
    } catch (error) {
      console.error('Error calculating elevation:', error);
      return 0;
    }
  };
}

function generateWindZones(config: MapConfig, _bounds: WorldData['bounds']): WindZone[] {
  const zones: WindZone[] = [];
  const seed = config.seed;
  const zoneCount = config.windZoneCount;

  if (zoneCount === 0) return zones;

  const halfWorld = config.worldSize / 2;

  for (let i = 0; i < zoneCount; i++) {
    const angle = (i / zoneCount) * Math.PI * 2;
    const distance = halfWorld * 0.3;

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    const patterns: WindZone['pattern'][] = ['trade-winds', 'doldrums', 'monsoon', 'storm-path'];
    const pattern = patterns[i % patterns.length];

    const baseSpeed = 5 + perlin.noise(seed + i * 7, 7) * 5;

    zones.push({
      id: `wind-zone-${i}`,
      position: [x, z],
      radius: (2000 + perlin.noise(seed + i * 5, 5) * 1000) * (config.worldSize / 10000),
      direction: perlin.noise(seed + i * 6, 6) * Math.PI * 2,
      speed: baseSpeed * config.windStrengthMultiplier,
      pattern,
    });
  }

  return zones;
}

function generatePOIs(
  config: MapConfig,
  _bounds: WorldData['bounds'],
  _islands: Island[]
): POI[] {
  const pois: POI[] = [];
  const seed = config.seed;
  const basePOICount = 12 + Math.floor(perlin.noise(seed, 10) * 8);
  const poiCount = Math.round(basePOICount * config.poiDensity);

  if (poiCount === 0) return pois;

  const halfWorld = config.worldSize / 2;

  const types: POI['type'][] = ['reef', 'wreck', 'buoy', 'wildlife', 'research-station'];
  const baseRewards: Record<POI['type'], number> = {
    reef: 5,
    wreck: 15,
    buoy: 2,
    wildlife: 10,
    'research-station': 20,
  };

  for (let i = 0; i < poiCount; i++) {
    const angle = (i / poiCount) * Math.PI * 2 + perlin.noise(seed + i * 8, 8);
    const distance = halfWorld * 0.2 + perlin.noise(seed + i * 9, 9) * halfWorld * 0.6;

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    const noiseValue = perlin.noise(seed + i * 11, 11);
    const typeIndex = Math.floor(Math.abs(noiseValue) * types.length) % types.length;
    const type = types[typeIndex];

    pois.push({
      id: `poi-${i}`,
      position: [x, z],
      type,
      name: `${type.toUpperCase()} ${i}`,
      discoveryReward: Math.round(baseRewards[type] * config.discoveryRewardMultiplier),
    });
  }

  return pois;
}

function generateMarina(config: MapConfig): Marina {
  return {
    id: 'marina-hub',
    position: [0, 0],
    name: 'Lagoon Marina',
    dockingZoneRadius: config.safeZoneRadius,
    chargeRate: config.marinaChargeRate,
  };
}

export function getIslandAtPosition(islands: Island[], x: number, z: number): Island | null {
  for (const island of islands) {
    const dx = x - island.position[0];
    const dz = z - island.position[1];
    const distToCenter = Math.sqrt(dx * dx + dz * dz);
    if (distToCenter <= island.radius) {
      return island;
    }
  }
  return null;
}

export function getWindZoneAtPosition(zones: WindZone[], x: number, z: number): WindZone | null {
  for (const zone of zones) {
    const dx = x - zone.position[0];
    const dz = z - zone.position[1];
    const distToCenter = Math.sqrt(dx * dx + dz * dz);
    if (distToCenter <= zone.radius) {
      return zone;
    }
  }
  return null;
}

export function getDiscoveredPOIs(pois: POI[], discoveredIds: Set<string>): POI[] {
  return pois.filter((poi) => discoveredIds.has(poi.id));
}

function generateIcebergs(
  config: MapConfig,
  bounds: WorldData['bounds'],
  islands: Island[]
): Iceberg[] {
  const icebergs: Iceberg[] = [];
  const seed = config.seed;
  const settings = DIFFICULTY_SETTINGS[config.difficulty];
  const targetCount = config.icebergCount;

  if (targetCount === 0) return icebergs;

  const minSpawnDist = config.safeZoneRadius;
  const maxSpawnDist = config.worldSize / 2 * 0.9;
  const spawnRange = maxSpawnDist - minSpawnDist;

  // Scale radius/height by user multiplier
  const minRadius = settings.minRadius * config.icebergSizeScale;
  const maxRadius = settings.maxRadius * config.icebergSizeScale;
  const minHeight = settings.minHeight * config.icebergSizeScale;
  const maxHeight = settings.maxHeight * config.icebergSizeScale;

  let attempts = 0;
  const maxAttempts = targetCount * 4;

  while (icebergs.length < targetCount && attempts < maxAttempts) {
    attempts++;

    let x: number, z: number;

    switch (config.icebergSpread) {
      case 'concentrated': {
        // Icebergs cluster near islands
        if (islands.length > 0) {
          const island = islands[attempts % islands.length];
          const angle = perlin.noise(seed + attempts, 50) * Math.PI * 2;
          const dist = island.radius + 200 + Math.abs(perlin.noise(seed + attempts * 100, 100)) * 800;
          x = island.position[0] + Math.cos(angle) * dist;
          z = island.position[1] + Math.sin(angle) * dist;
        } else {
          const angle = attempts * (Math.PI * (3 - Math.sqrt(5)));
          const dist = minSpawnDist + Math.abs(perlin.noise(seed + attempts * 100, 100)) * spawnRange;
          x = Math.cos(angle) * dist;
          z = Math.sin(angle) * dist;
        }
        break;
      }
      case 'lanes': {
        // Icebergs form navigable lanes/corridors
        const laneCount = 3 + Math.floor(perlin.noise(seed, 55) * 3);
        const lane = attempts % laneCount;
        const laneAngle = (lane / laneCount) * Math.PI * 2 + perlin.noise(seed + lane, 56) * 0.3;
        const dist = minSpawnDist + (attempts / maxAttempts) * spawnRange;
        const perpOffset = (perlin.noise(seed + attempts * 101, 101) - 0.5) * 300;
        const perpAngle = laneAngle + Math.PI / 2;
        x = Math.cos(laneAngle) * dist + Math.cos(perpAngle) * perpOffset;
        z = Math.sin(laneAngle) * dist + Math.sin(perpAngle) * perpOffset;
        break;
      }
      case 'dispersed': {
        // Uniform spread across the whole map
        x = (perlin.noise(seed + attempts * 101, 101) - 0.5) * config.worldSize * 0.9;
        z = (perlin.noise(seed + attempts * 102, 102) - 0.5) * config.worldSize * 0.9;
        break;
      }
      default: { // 'random'
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const angle = attempts * goldenAngle + perlin.noise(seed + attempts, 50) * 0.5;
        const distNoise = Math.abs(perlin.noise(seed + attempts * 100, 100));
        const spawnDist = minSpawnDist + distNoise * spawnRange;
        x = Math.cos(angle) * spawnDist;
        z = Math.sin(angle) * spawnDist;
        x += perlin.noise(seed + attempts * 101, 101) * 300;
        z += perlin.noise(seed + attempts * 102, 102) * 300;
        break;
      }
    }

    // Clamp to bounds
    x = Math.max(bounds.min[0] + 200, Math.min(bounds.max[0] - 200, x));
    z = Math.max(bounds.min[1] + 200, Math.min(bounds.max[1] - 200, z));

    // Skip if too close to marina (spawn area)
    const distToMarina = Math.sqrt(x * x + z * z);
    if (distToMarina < minSpawnDist) continue;

    // Skip if too close to any island
    let tooCloseToIsland = false;
    for (const island of islands) {
      const dx = x - island.position[0];
      const dz = z - island.position[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < island.radius + 80) {
        tooCloseToIsland = true;
        break;
      }
    }
    if (tooCloseToIsland) continue;

    // Skip if too close to existing icebergs
    let tooCloseToIceberg = false;
    for (const existing of icebergs) {
      const dx = x - existing.position[0];
      const dz = z - existing.position[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < existing.radius + minRadius + 50) {
        tooCloseToIceberg = true;
        break;
      }
    }
    if (tooCloseToIceberg) continue;

    const radius = minRadius + Math.abs(perlin.noise(seed + attempts * 103, 103)) * (maxRadius - minRadius);
    const height = minHeight + Math.abs(perlin.noise(seed + attempts * 104, 104)) * (maxHeight - minHeight);

    icebergs.push({
      id: `iceberg-${icebergs.length}`,
      position: [x, z],
      radius,
      height,
      seed: seed + attempts * 1000,
    });
  }

  return icebergs;
}

function generateFloatingIce(
  config: MapConfig,
  bounds: WorldData['bounds'],
  islands: Island[],
  icebergs: Iceberg[]
): FloatingIce[] {
  const floatingIce: FloatingIce[] = [];
  const seed = config.seed;
  const settings = DIFFICULTY_SETTINGS[config.difficulty];
  const targetCount = Math.round(config.floatingIceDensity);

  if (targetCount === 0) return floatingIce;

  let attempts = 0;
  const maxAttempts = targetCount * 3;

  const worldWidth = bounds.max[0] - bounds.min[0];
  const worldHeight = bounds.max[1] - bounds.min[1];

  const minRadius = settings.floatingIceMinRadius * config.floatingIceSizeScale;
  const maxRadius = settings.floatingIceMaxRadius * config.floatingIceSizeScale;

  while (floatingIce.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const gridX = (attempts * 17) % 50;
    const gridZ = Math.floor((attempts * 17) / 50) % 50;

    let x = bounds.min[0] + (gridX / 50) * worldWidth;
    let z = bounds.min[1] + (gridZ / 50) * worldHeight;

    x += perlin.noise(seed + attempts * 502, 502) * (worldWidth / 25);
    z += perlin.noise(seed + attempts * 503, 503) * (worldHeight / 25);

    x = Math.max(bounds.min[0] + 50, Math.min(bounds.max[0] - 50, x));
    z = Math.max(bounds.min[1] + 50, Math.min(bounds.max[1] - 50, z));

    const distToMarina = Math.sqrt(x * x + z * z);
    if (distToMarina < Math.max(120, config.safeZoneRadius * 0.3)) continue;

    let tooClose = false;
    for (const island of islands) {
      const dx = x - island.position[0];
      const dz = z - island.position[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < island.radius + 20) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    for (const iceberg of icebergs) {
      const dx = x - iceberg.position[0];
      const dz = z - iceberg.position[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < iceberg.radius + 15) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    const sizeNoise = Math.abs(perlin.noise(seed + attempts * 504, 504));
    const sizeFactor = Math.sqrt(sizeNoise);
    const radius = minRadius + sizeFactor * (maxRadius - minRadius);

    floatingIce.push({
      id: `floating-ice-${floatingIce.length}`,
      position: [x, z],
      radius,
      seed: seed + attempts * 2000,
    });
  }

  return floatingIce;
}

function generateRaces(
  config: MapConfig,
  bounds: WorldData['bounds'],
  islands: Island[],
  _icebergs: Iceberg[]
): RaceRoute[] {
  const races: RaceRoute[] = [];
  const seed = config.seed;
  const raceCount = config.raceCount;
  const halfWorld = config.worldSize / 2;

  if (raceCount === 0) return races;

  const raceNamePool = [
    'Coastal Sprint', 'Island Run', 'Open Water Challenge',
    'Glacier Dash', 'Arctic Circuit', 'Ice Corridor',
    'Frostbite Run', 'Polar Passage',
  ];

  // Checkpoint counts scale with race length
  const baseCpCounts: Record<RaceLength, number[]> = {
    short: [3, 4, 4, 3, 4, 3, 4, 3],
    medium: [4, 6, 8, 5, 7, 6, 5, 8],
    long: [7, 10, 12, 8, 11, 9, 10, 12],
  };
  const cpCounts = baseCpCounts[config.raceLength];

  // Distance scale based on race length
  const distMultiplier: Record<RaceLength, number> = { short: 0.4, medium: 0.7, long: 1.0 };
  const distScale = distMultiplier[config.raceLength];

  for (let raceIndex = 0; raceIndex < raceCount; raceIndex++) {
    const checkpointCount = cpCounts[raceIndex % cpCounts.length];

    const startAngle = perlin.noise(seed + raceIndex * 200, 200) * Math.PI * 2;
    const startDist = (halfWorld * 0.15 + perlin.noise(seed + raceIndex * 201, 201) * halfWorld * 0.1) * distScale;
    const startX = Math.cos(startAngle) * startDist;
    const startZ = Math.sin(startAngle) * startDist;

    const endAngle = startAngle + Math.PI + (perlin.noise(seed + raceIndex * 202, 202) - 0.5) * 0.8;
    const endDist = (halfWorld * 0.4 + perlin.noise(seed + raceIndex * 203, 203) * halfWorld * 0.3) * distScale;
    const endX = Math.cos(endAngle) * endDist;
    const endZ = Math.sin(endAngle) * endDist;

    const checkpoints: RaceRoute['checkpoints'] = [];

    for (let cpIndex = 0; cpIndex < checkpointCount; cpIndex++) {
      const t = (cpIndex + 1) / (checkpointCount + 1);

      let cpX = startX + (endX - startX) * t;
      let cpZ = startZ + (endZ - startZ) * t;

      // Perpendicular variation scaled by routeComplexity
      const perpX = -(endZ - startZ);
      const perpZ = endX - startX;
      const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1;
      const variation = (perlin.noise(seed + raceIndex * 300 + cpIndex, 300 + cpIndex) - 0.5) * 800 * config.routeComplexity;

      cpX += (perpX / perpLen) * variation;
      cpZ += (perpZ / perpLen) * variation;

      cpX = Math.max(bounds.min[0] + 300, Math.min(bounds.max[0] - 300, cpX));
      cpZ = Math.max(bounds.min[1] + 300, Math.min(bounds.max[1] - 300, cpZ));

      // Push checkpoints out of islands
      for (const island of islands) {
        const dx = cpX - island.position[0];
        const dz = cpZ - island.position[1];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < island.radius + 150) {
          cpX = island.position[0] + (dx / (dist || 1)) * (island.radius + 200);
          cpZ = island.position[1] + (dz / (dist || 1)) * (island.radius + 200);
        }
      }

      checkpoints.push({
        id: `race-${raceIndex}-cp-${cpIndex}`,
        position: [cpX, cpZ],
        radius: 200 + cpIndex * 20,
        order: cpIndex + 1,
      });
    }

    races.push({
      id: `race-${raceIndex}`,
      name: raceNamePool[raceIndex % raceNamePool.length],
      checkpoints,
      startPosition: [startX, startZ],
      endPosition: [endX, endZ],
    });
  }

  return races;
}

export function getIcebergsInRange(icebergs: Iceberg[], x: number, z: number, range: number): Iceberg[] {
  return icebergs.filter((iceberg) => {
    const dx = x - iceberg.position[0];
    const dz = z - iceberg.position[1];
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist <= range + iceberg.radius;
  });
}

export function checkIcebergCollision(
  icebergs: Iceberg[],
  x: number,
  z: number,
  boatRadius: number = 8
): { collided: boolean; iceberg: Iceberg | null; penetration: number; normal: [number, number] } {
  for (const iceberg of icebergs) {
    const dx = x - iceberg.position[0];
    const dz = z - iceberg.position[1];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const collisionDist = iceberg.radius + boatRadius;

    if (dist < collisionDist) {
      const penetration = collisionDist - dist;
      const normalX = dist > 0 ? dx / dist : 1;
      const normalZ = dist > 0 ? dz / dist : 0;
      return {
        collided: true,
        iceberg,
        penetration,
        normal: [normalX, normalZ],
      };
    }
  }

  return { collided: false, iceberg: null, penetration: 0, normal: [0, 0] };
}

export function checkFloatingIceCollision(
  floatingIce: FloatingIce[],
  x: number,
  z: number,
  boatRadius: number = 8
): { collided: boolean; ice: FloatingIce | null; penetration: number; normal: [number, number] } {
  for (const ice of floatingIce) {
    const dx = x - ice.position[0];
    const dz = z - ice.position[1];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const collisionDist = ice.radius + boatRadius;

    if (dist < collisionDist) {
      const penetration = collisionDist - dist;
      const normalX = dist > 0 ? dx / dist : 1;
      const normalZ = dist > 0 ? dz / dist : 0;
      return {
        collided: true,
        ice,
        penetration,
        normal: [normalX, normalZ],
      };
    }
  }

  return { collided: false, ice: null, penetration: 0, normal: [0, 0] };
}
