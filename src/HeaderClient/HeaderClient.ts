import { AnyJson, IU8a } from '../types'
import MerkleTree from '../MerkleTree'

/**
 * This client could also subscribe to headers by using the
 * Polkadot API to abstract away the batching functionality
 * but I preferred to keep it and the index level.
 */
export default class HeaderClient {
  private trees: MerkleTree[]
  constructor() {
    this.trees = []
  }

  addTree(tree: MerkleTree) {
    this.trees.push(tree)
  }

  queryHeader(
    property: 'hash' | 'blockNumber',
    value: IU8a | AnyJson
  ): {
    tree?: MerkleTree
    header?: AnyJson
  } {
    for (let i = 0; i < this.trees.length; i++) {
      const tree = this.trees[i]
      switch (property) {
        case 'hash': {
          const header = tree.getLeafByHash(value as IU8a)
          if (header != null) return { header, tree }
          break
        }
        case 'blockNumber': {
          const header = tree.getLeafByBlockNumber(value as number)
          if (header != null) return { header, tree }
          break
        }
        default:
          throw new Error('Please specify a property')
      }
    }
    return {}
  }
}
