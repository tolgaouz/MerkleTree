import { sha256AsU8a } from '@polkadot/util-crypto'
import { ReadableLeaf, Proof, Header, AnyJson, IU8a } from '../types'

export default class MerkleTree {
  public leaves: Buffer[] = []
  private hashes: Buffer[] = []
  public depth: number

  constructor(headers: Header[]) {
    this.leaves = headers.map(this.headerToLeaf)
    this.hashes = this.leaves.map(this.hashLeaf)
    this.depth = Math.log2(this.leaves.length)
    this.generateTree()
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

  hashLeaf(leaf: Buffer): Buffer {
    return Buffer.from(sha256AsU8a(leaf))
  }

  leafToObject(leaf: Buffer): ReadableLeaf {
    return JSON.parse(leaf.toString())
  }

  mergeAndHashLeaves(left: Buffer, right: Buffer): Buffer {
    return Buffer.from(sha256AsU8a(Buffer.concat([left, right])))
  }

  getLeafByBlockNumber(
    number: Header['number'] | number
  ): ReadableLeaf | undefined {
    if (typeof number === 'object') number = number.toHuman() as number
    return this.humanReadableLeaves.find(leaf => leaf.number == number)
  }

  getLeafByHash(hash: IU8a | string): ReadableLeaf | undefined {
    if (typeof hash === 'object') hash = hash.toHuman()
    return this.humanReadableLeaves.find(leaf => leaf.hash === hash)
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
    console.log('Successfully generated tree')
  }

  generateProof(header: Header, leafIndex = -1): Proof {
    const proof: Proof = []
    const bufferLeaf: Buffer = this.headerToLeaf(header)
    // Find the index of the leaf
    if (leafIndex === -1) {
      this.leaves.forEach((currentLeaf, idx) => {
        if (Buffer.compare(bufferLeaf, currentLeaf) === 0) leafIndex = idx
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

  validate(header: Header) {
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
