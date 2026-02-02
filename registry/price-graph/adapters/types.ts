import type { PricePoint } from '../lib/types'

export interface PriceAdapter {
  priceData: PricePoint | null
  isConnected: boolean
  error: string | null
}
