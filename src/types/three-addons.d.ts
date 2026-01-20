// Type declarations for Three.js addons

declare module 'three/addons/objects/Water.js' {
  import { Mesh, PlaneGeometry, ShaderMaterial, Texture, Vector3, Color, Side } from 'three';

  export interface WaterOptions {
    textureWidth?: number;
    textureHeight?: number;
    clipBias?: number;
    alpha?: number;
    time?: number;
    waterNormals?: Texture;
    sunDirection?: Vector3;
    sunColor?: Color | number | string;
    waterColor?: Color | number | string;
    eye?: Vector3;
    distortionScale?: number;
    side?: Side;
    fog?: boolean;
  }

  export class Water extends Mesh {
    constructor(geometry: PlaneGeometry, options: WaterOptions);
    material: ShaderMaterial;
  }
}

declare module 'three/addons/objects/Water2.js' {
  import { Mesh, BufferGeometry, ShaderMaterial, Texture, Vector2, Color } from 'three';

  export interface Water2Options {
    color?: Color | number | string;
    textureWidth?: number;
    textureHeight?: number;
    clipBias?: number;
    flowDirection?: Vector2;
    flowSpeed?: number;
    reflectivity?: number;
    scale?: number;
    shader?: object;
    flowMap?: Texture;
    normalMap0?: Texture;
    normalMap1?: Texture;
  }

  export class Water extends Mesh {
    constructor(geometry: BufferGeometry, options: Water2Options);
    material: ShaderMaterial;
  }
}

declare module 'three/addons/objects/Sky.js' {
  import { Mesh, BoxGeometry, ShaderMaterial, Vector3 } from 'three';

  export class Sky extends Mesh {
    constructor();
    geometry: BoxGeometry;
    material: ShaderMaterial;
    static SkyShader: object;
  }
}
