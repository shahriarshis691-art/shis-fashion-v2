import { useCallback, useState } from 'react'

/**
 * Gates Add to Bag / Buy Now with visible feedback instead of silent disabled buttons.
 */
export function usePdpActionGate(options: {
  isSizeSelected: boolean
  isColorSelected: boolean
  availableStock: number
  sizeHint?: string
  colorHint?: string
}) {
  const {
    isSizeSelected,
    isColorSelected,
    availableStock,
    sizeHint = 'Please select a size first',
    colorHint = 'Please select a color first',
  } = options

  const [actionError, setActionError] = useState('')
  const [shakeToken, setShakeToken] = useState(0)

  const clearActionError = useCallback(() => setActionError(''), [])

  const requireReadyToPurchase = useCallback(() => {
    if (availableStock <= 0) {
      setActionError('This item is out of stock.')
      setShakeToken((token) => token + 1)
      return false
    }

    if (!isSizeSelected) {
      setActionError(sizeHint)
      setShakeToken((token) => token + 1)
      return false
    }

    if (!isColorSelected) {
      setActionError(colorHint)
      setShakeToken((token) => token + 1)
      return false
    }

    setActionError('')
    return true
  }, [availableStock, colorHint, isColorSelected, isSizeSelected, sizeHint])

  return {
    actionError,
    shakeToken,
    clearActionError,
    requireReadyToPurchase,
  }
}
