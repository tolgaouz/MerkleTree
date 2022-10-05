import { ApiPromise, WsProvider, Keyring } from '@polkadot/api'
import { mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto'
import SHA256 from 'crypto-js/sha256'

const mnemonic =
  'beyond purity spring limit step shrimp add interest oval ethics enforce slush'

const wsProvider = new WsProvider('ws://localhost:9944')
// initialise via static create
const api = await ApiPromise.create({ provider: wsProvider })

class MerkleTree {
  private leaves: Buffer[] = []
  private hashes: Buffer[] = []
  constructor(leaves: any[]) {
    this.leaves = leaves
    this.generateTree()
  }

  hashLeaf(leaf: Buffer): Buffer {
    return Buffer.from(SHA256(leaf.toString()).toString())
  }

  mergeAndHashLeaves(leaf1: Buffer, leaf2: Buffer): Buffer {
    return Buffer.from(
      SHA256(
        Buffer.concat([this.hashLeaf(leaf1), this.hashLeaf(leaf2)]).toString()
      ).toString()
    )
  }

  /**
   * Generates the Merkle Tree by processing each layer of leaves
   */
  generateTree() {
    const layerCount = Math.log2(this.leaves.length)
    // Hash each leaf
    this.leaves.forEach(leaf => this.hashes.push(this.hashLeaf(leaf)))
    let offset = 0
    let iter = 0
    while (iter < layerCount) {
      let loopLength = this.hashes.length / Math.pow(2, layerCount)
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

  get root(): Buffer {
    return this.hashes[this.hashes.length - 1]
  }
}

const BATCH_SIZE = 10
const BATCH: any[] = []
const ROOTS = {}

// make a call to retrieve the current network head
api.rpc.chain.subscribeNewHeads(header => {
  const leaf = JSON.stringify(header)

  BATCH.push(Buffer.from(leaf))
  if (BATCH.length === BATCH_SIZE) {
    const tree = new MerkleTree(BATCH)
  }
})
