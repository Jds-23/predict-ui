export interface PricePoint {
  price: number
  time: number // Unix ms
}

export type BoxTimeState = "past" | "current" | "future"

export interface BoxData {
  key: string
  x: number
  y: number
  width: number
  height: number
  priceIndex: number
  timeIndex: number
  timeState: BoxTimeState
}
