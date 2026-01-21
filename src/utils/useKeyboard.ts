import { useEffect, useState } from 'react'

interface KeyState {
  forward: boolean  // W
  backward: boolean // S
  left: boolean     // A
  right: boolean    // D
  boost: boolean    // Shift
  toggleCamera: boolean // V (press event only)
  resetCamera: boolean  // N (press event only)
  cameraPreset1: boolean // 1 (close-up view)
  cameraPreset2: boolean // 2 (side view)
  cameraPreset3: boolean // 3 (bird's eye view)
  cameraPreset4: boolean // 4 (default view - like start)
}

export function useKeyboard(): KeyState {
  const [keys, setKeys] = useState<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
    toggleCamera: false,
    resetCamera: false,
    cameraPreset1: false,
    cameraPreset2: false,
    cameraPreset3: false,
    cameraPreset4: false,
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
          setTimeout(() => setKeys((k) => ({ ...k, toggleCamera: false })), 100)
          break
        case 'KeyN':
          // Reset camera to default back view (one-shot)
          setKeys((k) => ({ ...k, resetCamera: true }))
          setTimeout(() => setKeys((k) => ({ ...k, resetCamera: false })), 100)
          break
        case 'Digit1':
          // Camera preset 1: Close-up view
          setKeys((k) => ({ ...k, cameraPreset1: true }))
          setTimeout(() => setKeys((k) => ({ ...k, cameraPreset1: false })), 100)
          break
        case 'Digit2':
          // Camera preset 2: Side view
          setKeys((k) => ({ ...k, cameraPreset2: true }))
          setTimeout(() => setKeys((k) => ({ ...k, cameraPreset2: false })), 100)
          break
        case 'Digit3':
          // Camera preset 3: Bird's eye view
          setKeys((k) => ({ ...k, cameraPreset3: true }))
          setTimeout(() => setKeys((k) => ({ ...k, cameraPreset3: false })), 100)
          break
        case 'Digit4':
          // Camera preset 4: Default view (like game start)
          setKeys((k) => ({ ...k, cameraPreset4: true }))
          setTimeout(() => setKeys((k) => ({ ...k, cameraPreset4: false })), 100)
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
