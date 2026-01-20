/**
 * Simpified Perlin noise implementation
 * Based on improved Perlin noise algorithm
 */
export class Perlin {
  private permutation: number[];
  private p: number[];

  constructor(seed: number = 0) {
    this.permutation = this.generatePermutation(seed);
    this.p = [...this.permutation, ...this.permutation];
  }

  private generatePermutation(seed: number): number[] {
    const p = Array.from({ length: 256 }, (_, i) => i);
    // Seeded shuffle using seed
    let random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    return p;
  }

  private seededRandom(seed: number) {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  reseed(seed: number): void {
    this.permutation = this.generatePermutation(seed);
    this.p = [...this.permutation, ...this.permutation];
  }

  noise(x: number, y: number, z: number = 0): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);

    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);

    const a = this.p[xi] + yi;
    const aa = this.p[a] + zi;
    const ab = this.p[a + 1] + zi;
    const b = this.p[xi + 1] + yi;
    const ba = this.p[b] + zi;
    const bb = this.p[b + 1] + zi;

    const g000 = this.grad(this.p[aa], xf, yf, zf);
    const g100 = this.grad(this.p[ba], xf - 1, yf, zf);
    const g010 = this.grad(this.p[ab], xf, yf - 1, zf);
    const g110 = this.grad(this.p[bb], xf - 1, yf - 1, zf);
    const g001 = this.grad(this.p[aa + 1], xf, yf, zf - 1);
    const g101 = this.grad(this.p[ba + 1], xf - 1, yf, zf - 1);
    const g011 = this.grad(this.p[ab + 1], xf, yf - 1, zf - 1);
    const g111 = this.grad(this.p[bb + 1], xf - 1, yf - 1, zf - 1);

    const x1 = this.lerp(g000, g100, u);
    const x2 = this.lerp(g010, g110, u);
    const y1 = this.lerp(x1, x2, v);

    const x3 = this.lerp(g001, g101, u);
    const x4 = this.lerp(g011, g111, u);
    const y2 = this.lerp(x3, x4, v);

    return this.lerp(y1, y2, w);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 8 ? y : z;

    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}
