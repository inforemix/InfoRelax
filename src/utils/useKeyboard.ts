import { useEffect, useState } from 'react'

interface KeyState {
  forward: boolean  // W
  backward: boolean // S
  left: boolean     // A
  right: boolean    // D
  boost: boolean    // Shift
  toggleCamera: boolean // V (press event only)
}

export function useKeyboard(): KeyState {
  const [keys, setKeys] = useState<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
    toggleCamera: false,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((k) => ({ ...k, forward: true }))
          break
        case 'KeyS':
        case 'ArrowDown':
          setKeys((k) => ({ ...k, backward: true }))
          break
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((k) => ({ ...k, left: true }))
          break
        case 'KeyD':
        case 'ArrowRight':
          setKeys((k) => ({ ...k, right: true }))
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys((k) => ({ ...k, boost: true }))
          break
        case 'KeyV':
          // Toggle camera mode (one-shot, reset immediately)
          setKeys((k) => ({ ...k, toggleCamera: true }))
          // Reset after a short delay to allow detection
          setTimeout(() => setKeys((k) => ({ ...k, toggleCamera: false })), 100)
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((k) => ({ ...k, forward: false }))
          break
        case 'KeyS':
        case 'ArrowDown':
          setKeys((k) => ({ ...k, backward: false }))
          break
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((k) => ({ ...k, left: false }))
          break
        case 'KeyD':
        case 'ArrowRight':
          setKeys((k) => ({ ...k, right: false }))
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys((k) => ({ ...k, boost: false }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return keys
}
