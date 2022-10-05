import { sha256AsU8a } from '@polkadot/util-crypto'
import { ReadableLeaf, Proof, Header, AnyJson, IU8a } from '../types'

export default class MerkleTree {
  public leaves: Header[] = []
  private hashes: Buffer[] = []
  public depth: number

  constructor(headers: Header[]) {
    this.leaves = headers
    this.hashes = this.leaves.map(l => this.hashLeaf(l))
    this.depth = Math.log2(this.leaves.length)
    this.generateTree()
  }

  hashLeaf(leaf: Header): Buffer {
    const processed = this.headerToLeaf(leaf)
    return Buffer.from(sha256AsU8a(processed))
  }

  headerToLeaf(header: Header): Buffer {
    return Buffer.from(
      JSON.stringify({
        ...header.toHuman(),
        hash: header.hash.toString(),
        number: header.number.toNumber(),
      })
    )
  }

  leafToObject(leaf: Header): ReadableLeaf {
    return leaf.toHuman()
  }

  mergeAndHashLeaves(left: Buffer, right: Buffer): Buffer {
    return Buffer.from(sha256AsU8a(Buffer.concat([left, right])))
  }

  // I'm not sure how big this tree can be, depending on the size
  // We may need to use HashMaps instead of using .find() here,
  // But then we'll be sacrificing from space instead of time.

  getLeafByBlockNumber(number: Header['number'] | number): Header | undefined {
    if (typeof number === 'object') number = number.toHuman() as number
    const idx = this.humanReadableLeaves.findIndex(
      leaf => leaf.number == number
    )
    if (idx === -1) return undefined
    return this.leaves[idx]
  }

  getLeafByHash(hash: IU8a | string): Header | undefined {
    if (typeof hash === 'object') hash = hash.toHuman()
    const idx = this.humanReadableLeaves.findIndex(leaf => leaf.hash === hash)
    if (idx === -1) return undefined
    return this.leaves[idx]
  }

  /**
   * Generates the Merkle Tree by processing each layer of leaves
   */
  generateTree() {
    let offset = 0
    for (let iter = 0; iter < this.depth; iter++) {
      const loopLength = this.leaves.length / Math.pow(2, iter)
      for (let i = 0; i < loopLength; i += 2) {
        this.hashes.push(
          this.mergeAndHashLeaves(
            this.hashes[offset + i],
            this.hashes[offset + i + 1]
          )
        )
      }
      offset += loopLength
    }
  }

  generateProof(header: Header, leafIndex = -1): Proof {
    const proof: Proof = []
    const bufferLeaf: Buffer = this.headerToLeaf(header)
    // Find the index of the leaf
    if (leafIndex === -1) {
      this.leaves.forEach((currentLeaf, idx) => {
        if (Buffer.compare(bufferLeaf, this.headerToLeaf(currentLeaf)) === 0)
          leafIndex = idx
      })
    }
    if (leafIndex === -1) return proof
    let parentIndex = leafIndex
    for (let i = 0; i < this.depth; i++) {
      const isRightNode = parentIndex % 2
      const pair = isRightNode
        ? this.hashes[parentIndex - 1]
        : this.hashes[parentIndex + 1]
      // Get parent index
      proof.push({
        position: isRightNode ? 'right' : 'left',
        pairHash: pair,
        index: parentIndex,
      })
      parentIndex =
        parentIndex - isRightNode + this.leaves.length / Math.pow(2, i)
    }
    return proof
  }

  verify(header: Header) {
    const proof = this.generateProof(header)
    if (proof.length === 0) return false
    proof.forEach((step, idx) => {
      const isRightNode = step.position === 'right'
      const combinedHash = isRightNode
        ? Buffer.concat([step.pairHash, this.hashes[step.index]])
        : Buffer.concat([this.hashes[step.index], step.pairHash])
      const parentIndex =
        step.index - Number(isRightNode) + this.leaves.length / Math.pow(2, idx)
      const parentHash = this.hashes[parentIndex]
      if (Buffer.compare(combinedHash, parentHash) !== 0) return false
    })
    return true
  }

  get root(): Buffer {
    return this.hashes[this.hashes.length - 1]
  }

  get humanReadableLeaves(): Record<string, AnyJson>[] {
    return this.leaves.map(this.leafToObject)
  }

  get hashFn() {
    return sha256AsU8a
  }
}
