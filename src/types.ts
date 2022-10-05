import { AnyJson } from '@polkadot/types-codec/types'

export type ReadableLeaf = Record<string, AnyJson>
export type Proof = Array<{
  position: 'left' | 'right'
  pairHash: Buffer
  index: number
}>
export { Header } from '@polkadot/types/interfaces/runtime'
export { AnyJson, IU8a } from '@polkadot/types-codec/types'
