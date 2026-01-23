import { useControls, folder } from 'leva'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
  BrightnessContrast,
  HueSaturation,
  SMAA,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

export function PostProcessing() {
  // Post-processing controls
  const ppControls = useControls('Post Processing', {
    'Bloom': folder({
      bloomIntensity: { value: 0.4, min: 0, max: 2, step: 0.05, label: 'Intensity' },
      bloomThreshold: { value: 0.85, min: 0, max: 1, step: 0.05, label: 'Threshold' },
      bloomSmoothing: { value: 0.3, min: 0, max: 1, step: 0.05, label: 'Smoothing' },
    }),
    'Color': folder({
      brightness: { value: 0.0, min: -0.5, max: 0.5, step: 0.01, label: 'Brightness' },
      contrast: { value: 0.05, min: -0.5, max: 0.5, step: 0.01, label: 'Contrast' },
      saturation: { value: 0.1, min: -1, max: 1, step: 0.05, label: 'Saturation' },
      hue: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Hue' },
    }),
    'Effects': folder({
      vignetteDarkness: { value: 0.35, min: 0, max: 1, step: 0.05, label: 'Vignette Darkness' },
    }),
  })

  return (
    <EffectComposer multisampling={0}>
      {/* Anti-aliasing */}
      <SMAA />

      {/* Tone mapping for HDR-like rendering */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />

      {/* Bloom for glowing effects (sun, reflections) */}
      <Bloom
        intensity={ppControls.bloomIntensity}
        luminanceThreshold={ppControls.bloomThreshold}
        luminanceSmoothing={ppControls.bloomSmoothing}
        mipmapBlur
      />

      {/* Color adjustments */}
      <BrightnessContrast
        brightness={ppControls.brightness}
        contrast={ppControls.contrast}
      />

      <HueSaturation
        hue={ppControls.hue}
        saturation={ppControls.saturation}
      />

      {/* Vignette for cinematic look */}
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={ppControls.vignetteDarkness}
      />
    </EffectComposer>
  )
}
