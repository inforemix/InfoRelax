import { useMemo } from 'react'
import { generateCompleteHull } from '@/editor/ProceduralHullGenerator'
import type { ProceduralHullConfig } from '@/editor/HullTypes'

interface ProceduralHullProps {
  config: ProceduralHullConfig
}

export function ProceduralHull({ config }: ProceduralHullProps) {
  const hullGroup = useMemo(() => {
    return generateCompleteHull(config)
  }, [config])

  return <primitive object={hullGroup} />
}
