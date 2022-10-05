import type { Header } from '../../types'
import MerkleTree from '..'
import MockHeader from '../../__mocks__/MockHeader'

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

  it('Verifies leaf if it exists in the tree', () => {
    const headers = [...new Array(8)].map(
      (_, i) => new MockHeader(i) as unknown as Header
    )
    const headerNotInTree = new MockHeader(9999) as unknown as Header
    const tree = new MerkleTree(headers)
    expect(tree.verify(headers[0])).toBe(true)
    expect(tree.verify(headerNotInTree)).toBe(false)
  })
})
