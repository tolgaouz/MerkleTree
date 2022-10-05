import type { Header, AnyJson } from '../../types'
import * as crypto from 'crypto'
import MerkleTree from '../MerkleTree'
import { u8aToHex, u8aToU8a } from '@polkadot/util/u8a'

// These mocks definitely can be done much better,
// I saw @polkadot/base and @polkadot/util has some helpers and classes
// to initialize the classes used in the Header, but I didn't want to
// get too advanced for now.

class MockBlockNumber {
  num: number
  constructor(num: number) {
    this.num = num
  }

  toNumber() {
    return this.num
  }
}

class MockHash {
  hash: Uint8Array
  constructor(hash: Uint8Array) {
    this.hash = hash
  }

  toString() {
    return u8aToHex(this.hash)
  }
}

class MockHeader {
  private parentHash: Uint8Array
  private stateRoot: Uint8Array
  private extrinsicRoot: Uint8Array
  public hash: MockHash
  private digest: Record<string, AnyJson>
  private number: MockBlockNumber

  constructor(num: number) {
    this.parentHash = crypto.webcrypto.getRandomValues(new Uint8Array(32))
    this.stateRoot = crypto.webcrypto.getRandomValues(new Uint8Array(32))
    this.extrinsicRoot = crypto.webcrypto.getRandomValues(new Uint8Array(32))
    this.hash = new MockHash(
      crypto.webcrypto.getRandomValues(new Uint8Array(32))
    )
    this.number = new MockBlockNumber(num)
    this.digest = {}
  }

  toHuman() {
    return {
      parentHash: u8aToHex(this.parentHash),
      stateRoot: u8aToHex(this.stateRoot),
      extrinsicRoot: u8aToHex(this.extrinsicRoot),
      hash: this.hash.toString(),
      number: this.number.toNumber(),
      digest: this.digest,
    }
  }
}

describe('MerkleTree', () => {
  it('Generates a tree successfully', () => {
    const BATCH_SIZES = [2, 4, 8, 16, 32]
    BATCH_SIZES.forEach(batchSize => {
      const headers = [...new Array(batchSize)].map(
        (_, i) => new MockHeader(i) as unknown as Header
      )
      const humanReadableHeaders = headers.map(h => h.toHuman())
      const tree = new MerkleTree(headers)
      expect(tree.humanReadableLeaves).toMatchObject(humanReadableHeaders)
      expect(tree.depth).toBe(Math.log2(batchSize))
    })
  })

  it('Generates inclusion proof correctly', () => {
    const headers = [...new Array(8)].map(
      (_, i) => new MockHeader(i) as unknown as Header
    )
    const tree = new MerkleTree(headers)
    const proof = tree.generateProof(headers[0])
    const expectedProof = [
      {
        position: 'left',
        index: 0,
      },
      {
        position: 'left',
        index: 8,
      },
      {
        position: 'left',
        index: 12,
      },
    ]
    expectedProof.forEach((step, idx) => {
      expect(proof[idx].position === step.position).toBe(true)
      expect(proof[idx].index === step.index).toBe(true)
    })
  })

  it('returns empty inclusion proof if header not exists in tree', () => {
    const headers = [...new Array(8)].map(
      (_, i) => new MockHeader(i) as unknown as Header
    )
    const headerNotInTree = new MockHeader(9999) as unknown as Header
    const tree = new MerkleTree(headers)
    const proof = tree.generateProof(headerNotInTree)
    expect(proof).toStrictEqual([])
  })

  it('Validates leaf if it exists in the tree', () => {
    const headers = [...new Array(8)].map(
      (_, i) => new MockHeader(i) as unknown as Header
    )
    const headerNotInTree = new MockHeader(9999) as unknown as Header
    const tree = new MerkleTree(headers)
    expect(tree.validate(headers[0])).toBe(true)
    expect(tree.validate(headerNotInTree)).toBe(false)
  })
})
