// Kaleidoscope blade editor
export { KaleidoscopeCanvas, KaleidoscopeModal } from './KaleidoscopeCanvas'
export { BLADE_PRESETS, getPresetById, getPresetsByCategory, getUnlockedPresets } from './BladePresets'
export type { BladePreset } from './BladePresets'
export { interpolateSpline, applyKaleidoscope, normalizePoints, denormalizePoints } from './SplineUtils'
export { generateTurbineGeometry, generateBladeGeometry, generateHelixBlades, generateProceduralTurbine, createDefaultProceduralTurbineConfig } from './TurbineGenerator'

// Hull procedural builder
export { HullGridEditor, HullEditorModal } from './HullGridEditor'
export { HULL_PRESETS, HULL_CATEGORIES, getPresetsByCategory as getHullPresetsByCategory, getPresetById as getHullPresetById, createConfigFromPreset as createHullFromPreset, createDefaultConfig as createDefaultHullConfig } from './HullPresets'
export type { HullPreset } from './HullPresets'
export * from './HullTypes'
export { generateProceduralHullGeometry, generateCatamaranHulls, generateTrimaranHulls, generateDeck, generateCompleteHull } from './ProceduralHullGenerator'

// Turbine procedural builder
export { TurbineSectionEditor, TurbineSectionEditorModal } from './TurbineSectionEditor'
export { TURBINE_PRESETS, TURBINE_CATEGORIES, getTurbinePresetsByCategory, getTurbinePresetById, createTurbineConfigFromPreset, BLADE_STYLE_INFO, AIRFOIL_INFO } from './TurbineShapeLibrary'
export type { TurbinePreset } from './TurbineShapeLibrary'
export * from './TurbineTypes'
