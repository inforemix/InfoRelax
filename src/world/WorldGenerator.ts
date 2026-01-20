import { Perlin } from '../utils/Perlin';

export interface Island {
  id: string;
  position: [number, number];
  radius: number;
  height: number;
  elevation: (x: number, z: number) => number;
  type: 'volcanic' | 'coral' | 'sandy';
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
  bounds: { min: [number, number]; max: [number, number] };
  islands: Island[];
  windZones: WindZone[];
  pois: POI[];
  marina: Marina;
}

const perlin = new Perlin(0);

export function generateWorld(seed: number, worldSize: number = 10000): WorldData {
  perlin.reseed(seed);

  const bounds: WorldData['bounds'] = {
    min: [-worldSize / 2, -worldSize / 2],
    max: [worldSize / 2, worldSize / 2],
  };

  const islands = generateIslands(seed, bounds);
  const windZones = generateWindZones(seed, bounds);
  const pois = generatePOIs(seed, bounds, islands);
  const marina = generateMarina(bounds);

  return {
    seed,
    bounds,
    islands,
    windZones,
    pois,
    marina,
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
    const typeIndex = Math.floor(perlin.noise(seed + i * 4, 4) * 3);
    const types: Array<Island['type']> = ['volcanic', 'coral', 'sandy'];

    islands.push({
      id: `island-${i}`,
      position: [clampedX, clampedZ],
      radius,
      height,
      type: types[typeIndex],
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

    const type = types[Math.floor(perlin.noise(seed + i * 11, 11) * types.length)];

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
