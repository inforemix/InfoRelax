import { Perlin } from '../utils/Perlin';

export type WorldDifficulty = 'peaceful' | 'moderate' | 'challenging' | 'extreme';

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
  bounds: { min: [number, number]; max: [number, number] };
  islands: Island[];
  icebergs: Iceberg[];
  windZones: WindZone[];
  pois: POI[];
  marina: Marina;
  races: RaceRoute[];
}

const perlin = new Perlin(0);

// Difficulty settings for iceberg generation
const DIFFICULTY_SETTINGS: Record<WorldDifficulty, {
  icebergCount: number;
  minRadius: number;
  maxRadius: number;
  minHeight: number;
  maxHeight: number;
  minSpawnDist: number;   // Minimum distance from marina
  maxSpawnDist: number;   // Maximum distance from marina
}> = {
  peaceful: { icebergCount: 12, minRadius: 12, maxRadius: 30, minHeight: 10, maxHeight: 25, minSpawnDist: 800, maxSpawnDist: 4000 },
  moderate: { icebergCount: 35, minRadius: 15, maxRadius: 40, minHeight: 15, maxHeight: 35, minSpawnDist: 500, maxSpawnDist: 4500 },
  challenging: { icebergCount: 60, minRadius: 20, maxRadius: 50, minHeight: 20, maxHeight: 45, minSpawnDist: 400, maxSpawnDist: 5000 },
  extreme: { icebergCount: 100, minRadius: 25, maxRadius: 60, minHeight: 25, maxHeight: 55, minSpawnDist: 300, maxSpawnDist: 5000 },
};

export function generateWorld(seed: number, worldSize: number = 10000, difficulty: WorldDifficulty = 'moderate'): WorldData {
  perlin.reseed(seed);

  const bounds: WorldData['bounds'] = {
    min: [-worldSize / 2, -worldSize / 2],
    max: [worldSize / 2, worldSize / 2],
  };

  const islands = generateIslands(seed, bounds);
  const icebergs = generateIcebergs(seed, bounds, difficulty, islands);
  const windZones = generateWindZones(seed, bounds);
  const pois = generatePOIs(seed, bounds, islands);
  const marina = generateMarina(bounds);
  const races = generateRaces(seed, bounds, islands, icebergs);

  return {
    seed,
    difficulty,
    bounds,
    islands,
    icebergs,
    windZones,
    pois,
    marina,
    races,
  };
}

function generateIslands(seed: number, bounds: WorldData['bounds']): Island[] {
  const islands: Island[] = [];
  const islandCount = 8 + Math.floor(perlin.noise(seed, 0) * 4); // 8-12 islands

  for (let i = 0; i < islandCount; i++) {
    const angle = (i / islandCount) * Math.PI * 2;
    const distance = 2000 + perlin.noise(seed + i, 1) * 2000;

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    // Clamp to bounds
    const clampedX = Math.max(bounds.min[0] + 500, Math.min(bounds.max[0] - 500, x));
    const clampedZ = Math.max(bounds.min[1] + 500, Math.min(bounds.max[1] - 500, z));

    const radius = 300 + perlin.noise(seed + i * 2, 2) * 200;
    const height = 100 + perlin.noise(seed + i * 3, 3) * 150;
    const types: Array<Island['type']> = ['volcanic', 'coral', 'sandy'];
    // Clamp Perlin noise output to valid array index
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

function generateWindZones(seed: number, _bounds: WorldData['bounds']): WindZone[] {
  const zones: WindZone[] = [];
  const zoneCount = 4;

  for (let i = 0; i < zoneCount; i++) {
    const angle = (i / zoneCount) * Math.PI * 2;
    const distance = 1500;

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    const patterns: WindZone['pattern'][] = ['trade-winds', 'doldrums', 'monsoon', 'storm-path'];
    const pattern = patterns[i % patterns.length];

    zones.push({
      id: `wind-zone-${i}`,
      position: [x, z],
      radius: 2000 + perlin.noise(seed + i * 5, 5) * 1000,
      direction: perlin.noise(seed + i * 6, 6) * Math.PI * 2,
      speed: 5 + perlin.noise(seed + i * 7, 7) * 5, // 5-10 m/s base
      pattern,
    });
  }

  return zones;
}

function generatePOIs(
  seed: number,
  _bounds: WorldData['bounds'],
  _islands: Island[]
): POI[] {
  const pois: POI[] = [];
  const poiCount = 12 + Math.floor(perlin.noise(seed, 10) * 8);

  const types: POI['type'][] = ['reef', 'wreck', 'buoy', 'wildlife', 'research-station'];
  const rewards: Record<POI['type'], number> = {
    reef: 5,
    wreck: 15,
    buoy: 2,
    wildlife: 10,
    'research-station': 20,
  };

  for (let i = 0; i < poiCount; i++) {
    const angle = (i / poiCount) * Math.PI * 2 + perlin.noise(seed + i * 8, 8);
    const distance = 1000 + perlin.noise(seed + i * 9, 9) * 3000;

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    // Clamp Perlin noise output to valid array index (0 to types.length-1)
    const noiseValue = perlin.noise(seed + i * 11, 11);
    const typeIndex = Math.floor(Math.abs(noiseValue) * types.length) % types.length;
    const type = types[typeIndex];

    pois.push({
      id: `poi-${i}`,
      position: [x, z],
      type,
      name: `${type.toUpperCase()} ${i}`,
      discoveryReward: rewards[type],
    });
  }

  return pois;
}

function generateMarina(_bounds: WorldData['bounds']): Marina {
  // Marina at world origin (0, 0)
  return {
    id: 'marina-hub',
    position: [0, 0],
    name: 'Lagoon Marina',
    dockingZoneRadius: 400,
    chargeRate: 5, // 5 EC per second
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
  seed: number,
  bounds: WorldData['bounds'],
  difficulty: WorldDifficulty,
  islands: Island[]
): Iceberg[] {
  const icebergs: Iceberg[] = [];
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const spawnRange = settings.maxSpawnDist - settings.minSpawnDist;

  let attempts = 0;
  const maxAttempts = settings.icebergCount * 3; // Allow extra attempts for collisions

  while (icebergs.length < settings.icebergCount && attempts < maxAttempts) {
    attempts++;

    // Use golden angle for initial distribution in the valid spawn zone
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = attempts * goldenAngle + perlin.noise(seed + attempts, 50) * 0.5;

    // Distribute distance within spawn range - bias toward middle distances
    const distNoise = Math.abs(perlin.noise(seed + attempts * 100, 100));
    const spawnDist = settings.minSpawnDist + distNoise * spawnRange;

    let x = Math.cos(angle) * spawnDist;
    let z = Math.sin(angle) * spawnDist;

    // Add randomness using Perlin noise
    x += perlin.noise(seed + attempts * 101, 101) * 300;
    z += perlin.noise(seed + attempts * 102, 102) * 300;

    // Clamp to bounds
    x = Math.max(bounds.min[0] + 200, Math.min(bounds.max[0] - 200, x));
    z = Math.max(bounds.min[1] + 200, Math.min(bounds.max[1] - 200, z));

    // Skip if too close to marina (spawn area)
    const distToMarina = Math.sqrt(x * x + z * z);
    if (distToMarina < settings.minSpawnDist) continue;

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

    // Skip if too close to existing icebergs (prevents clustering)
    let tooCloseToIceberg = false;
    for (const existing of icebergs) {
      const dx = x - existing.position[0];
      const dz = z - existing.position[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < existing.radius + settings.minRadius + 50) {
        tooCloseToIceberg = true;
        break;
      }
    }
    if (tooCloseToIceberg) continue;

    // Generate iceberg properties
    const radius = settings.minRadius + Math.abs(perlin.noise(seed + attempts * 103, 103)) * (settings.maxRadius - settings.minRadius);
    const height = settings.minHeight + Math.abs(perlin.noise(seed + attempts * 104, 104)) * (settings.maxHeight - settings.minHeight);

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

function generateRaces(
  seed: number,
  bounds: WorldData['bounds'],
  islands: Island[],
  _icebergs: Iceberg[]
): RaceRoute[] {
  const races: RaceRoute[] = [];

  // Generate 3 procedural A-to-B races
  for (let raceIndex = 0; raceIndex < 3; raceIndex++) {
    const raceNames = ['Coastal Sprint', 'Island Run', 'Open Water Challenge'];
    const checkpointCounts = [4, 6, 8];
    const checkpointCount = checkpointCounts[raceIndex];

    // Generate start point (away from marina but not too far)
    const startAngle = perlin.noise(seed + raceIndex * 200, 200) * Math.PI * 2;
    const startDist = 800 + perlin.noise(seed + raceIndex * 201, 201) * 400;
    const startX = Math.cos(startAngle) * startDist;
    const startZ = Math.sin(startAngle) * startDist;

    // Generate end point (opposite side of world from start)
    const endAngle = startAngle + Math.PI + (perlin.noise(seed + raceIndex * 202, 202) - 0.5) * 0.8;
    const endDist = 2500 + perlin.noise(seed + raceIndex * 203, 203) * 1500;
    const endX = Math.cos(endAngle) * endDist;
    const endZ = Math.sin(endAngle) * endDist;

    // Generate intermediate checkpoints
    const checkpoints: RaceRoute['checkpoints'] = [];

    for (let cpIndex = 0; cpIndex < checkpointCount; cpIndex++) {
      const t = (cpIndex + 1) / (checkpointCount + 1); // Progress from start to end

      // Interpolate between start and end with some variation
      let cpX = startX + (endX - startX) * t;
      let cpZ = startZ + (endZ - startZ) * t;

      // Add perpendicular variation for interesting routes
      const perpX = -(endZ - startZ);
      const perpZ = endX - startX;
      const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ);
      const variation = (perlin.noise(seed + raceIndex * 300 + cpIndex, 300 + cpIndex) - 0.5) * 800;

      cpX += (perpX / perpLen) * variation;
      cpZ += (perpZ / perpLen) * variation;

      // Clamp to bounds
      cpX = Math.max(bounds.min[0] + 300, Math.min(bounds.max[0] - 300, cpX));
      cpZ = Math.max(bounds.min[1] + 300, Math.min(bounds.max[1] - 300, cpZ));

      // Avoid placing checkpoints inside islands
      for (const island of islands) {
        const dx = cpX - island.position[0];
        const dz = cpZ - island.position[1];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < island.radius + 150) {
          // Push checkpoint outside island
          const pushDir = dist > 0 ? 1 : 1;
          cpX = island.position[0] + (dx / dist) * (island.radius + 200) * pushDir;
          cpZ = island.position[1] + (dz / dist) * (island.radius + 200) * pushDir;
        }
      }

      checkpoints.push({
        id: `race-${raceIndex}-cp-${cpIndex}`,
        position: [cpX, cpZ],
        radius: 200 + cpIndex * 20, // Larger checkpoints for harder races
        order: cpIndex + 1,
      });
    }

    races.push({
      id: `race-${raceIndex}`,
      name: raceNames[raceIndex],
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
