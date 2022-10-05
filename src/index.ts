import { ApiPromise, WsProvider } from '@polkadot/api'
import * as lodash from 'lodash'
import * as crypto from 'crypto'
import { Header } from '@polkadot/types/interfaces/runtime'
import MerkleTree from './MerkleTree'

const { isEqual } = lodash

const wsProvider = new WsProvider('ws://localhost:9944')
// initialise via static create
const api = await ApiPromise.create({ provider: wsProvider })

function toHexString(byteArray: Uint8Array) {
  return Array.prototype.map
    .call(byteArray, function (byte) {
      return ('0x' + (byte & 0xff).toString(16)).slice(-2)
    })
    .join('')
}

const BATCH_SIZE = 4
const TREES: MerkleTree[] = []
const BATCH: Header[] = []
// make a call to retrieve the current network head
api.rpc.chain.subscribeNewHeads(header => {
  const withHash = {
    ...header.toHuman(),
    hash: header.hash.toHuman(),
    number: header.number,
  }
  const parsed = JSON.parse(JSON.stringify(withHash))
  console.log(header.stateRoot)
  console.log(u8aToHex(crypto.webcrypto.getRandomValues(new Uint8Array(32))))
  console.log(Buffer.from(header.hash))
  console.log(
    Buffer.compare(Buffer.from(header.hash.toHuman()), Buffer.from(parsed.hash))
  )
})
