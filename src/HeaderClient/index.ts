import { Header, IU8a } from '../types'
import MerkleTree from '../MerkleTree'

export interface QueryResult {
  tree?: MerkleTree
  header?: Header
}

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

  get isEmpty() {
    return this.trees.length === 0
  }

  queryByNumber(value: Header['number'] | number): QueryResult | undefined {
    for (let i = 0; i < this.trees.length; i++) {
      const tree = this.trees[i]
      const leaf = tree.getLeafByBlockNumber(value as number)
      if (leaf != null) return { header: leaf, tree }
    }
    return undefined
  }

  queryByHash(value: IU8a | string) {
    for (let i = 0; i < this.trees.length; i++) {
      const tree = this.trees[i]
      const leaf = tree.getLeafByHash(value)
      if (leaf != null) return { header: leaf, tree }
    }
    return undefined
  }
}
