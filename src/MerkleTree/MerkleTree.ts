import { sha256AsU8a } from '@polkadot/util-crypto'
import { isEqual } from 'lodash'
import { ReadableLeaf, Leaf, Proof, Header, AnyJson } from '../types'

export default class MerkleTree {
  private leaves: Buffer[] = []
  private hashes: Buffer[] = []
  private depth: number
  constructor(headers: Header[]) {
    this.leaves = headers.map(this.headerToBuffer)
    this.hashes = this.leaves.map(this.hashLeaf)
    this.depth = Math.log2(this.leaves.length)
    this.generateTree()
  }

  headerToBuffer(header: Header): Buffer {
    return Buffer.from(header.toString())
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

  get hashFn() {
    return sha256AsU8a
  }

  getLeafByPropertyValue(
    property: string,
    value: AnyJson
  ): ReadableLeaf | undefined {
    return this.humanReadableLeaves.find(leaf => isEqual(leaf[property], value))
  }

  getLeafByHash(hash: Uint8Array): ReadableLeaf | undefined {
    const idx = this.hashes.findIndex(
      currentHash => Buffer.compare(currentHash, Buffer.from(hash)) === 0
    )
    if (idx !== -1) return this.humanReadableLeaves[idx]
    return undefined
  }

  // For type safety
  toBuffer(v: Leaf): Buffer {
    // Type object means v is given as a Header type.
    if (typeof v === 'object') return Buffer.from(v.toString())
    if (typeof v === 'string') return Buffer.from(v)
    return v
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

  generateProof(leaf: Leaf, leafIndex = -1): { inclusionProof: Proof } {
    const proof: Proof = []
    const bufferLeaf: Buffer = this.toBuffer(leaf)
    // Find the index of the leaf
    if (leafIndex === -1) {
      this.leaves.forEach((currentLeaf, idx) => {
        if (Buffer.compare(bufferLeaf, currentLeaf) === 0) leafIndex = idx
      })
    }
    if (leafIndex === -1) return { inclusionProof: proof }
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
      // Compare
    }
    return { inclusionProof: proof }
  }

  validate(leaf: Buffer | string | Header) {
    const proof = this.generateProof(leaf)
    if (proof.inclusionProof.length === 0) return false
    proof.inclusionProof.forEach((step, idx) => {
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
}
