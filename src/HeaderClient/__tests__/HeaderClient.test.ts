import MockHeader, { MockHash } from '../../__mocks__/MockHeader'
import { Header, IU8a } from '../../types'
import * as crypto from 'crypto'
import HeaderClient from '..'
import MerkleTree from '../../MerkleTree'

describe('HeaderClient', () => {
  it('Queries header by block number correctly', () => {
    const client = new HeaderClient()
    const header = new MockHeader(3) as unknown as Header
    ;[...new Array(3)].forEach((_, idx) => {
      const headers = [...new Array(8)].map(
        // Block Numbers should be unique
        (_, i) => {
          const num = idx * 8 + i
          const current = new MockHeader(num) as unknown as Header
          if (num === 3) return header
          return current
        }
      )
      client.addTree(new MerkleTree(headers))
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(client.queryByNumber(3)!.header?.toHuman()).toMatchObject(
      header.toHuman()
    )
    expect(client.queryByNumber(999)).toBe(undefined)
  })

  it('Queries header by hash correctly', () => {
    const client = new HeaderClient()
    const header = new MockHeader(3) as unknown as Header
    ;[...new Array(3)].forEach((_, idx) => {
      const headers = [...new Array(8)].map(
        // Block Numbers should be unique
        (_, i) => {
          const num = idx * 8 + i
          const current = new MockHeader(num) as unknown as Header
          if (num === 3) return header
          return current
        }
      )
      client.addTree(new MerkleTree(headers))
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(client.queryByHash(header.hash)!.header.toHuman()).toMatchObject(
      header.toHuman()
    )
    expect(
      client.queryByHash(
        new MockHash(
          crypto.webcrypto.getRandomValues(new Uint8Array(32))
        ) as IU8a
      )
    ).toBe(undefined)
  })
})
