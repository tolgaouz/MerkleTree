import { Header } from '@polkadot/types/interfaces/runtime'
import { AnyJson } from '@polkadot/types-codec/types'

export type ReadableLeaf = Record<string, AnyJson>
export type Proof = Array<{
  position: 'left' | 'right'
  pairHash: Buffer
  index: number
}>
export type Leaf = Buffer | string | Header
export { Header } from '@polkadot/types/interfaces/runtime'
export { AnyJson } from '@polkadot/types-codec/types'
