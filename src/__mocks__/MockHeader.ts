import { u8aToHex } from '@polkadot/util/u8a'
import * as crypto from 'crypto'
import { AnyJson } from '../types'

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

export class MockHash {
  hash: Uint8Array
  constructor(hash: Uint8Array) {
    this.hash = hash
  }

  toString() {
    return u8aToHex(this.hash)
  }

  toHuman() {
    return u8aToHex(this.hash)
  }
}

export default class MockHeader {
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
