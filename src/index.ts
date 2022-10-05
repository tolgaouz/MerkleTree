import { ApiPromise, WsProvider } from '@polkadot/api'
import * as lodash from 'lodash'
import { Header } from '@polkadot/types/interfaces/runtime'
import MerkleTree from './MerkleTree'

const { isEqual } = lodash

const wsProvider = new WsProvider('ws://localhost:9944')
// initialise via static create
const api = await ApiPromise.create({ provider: wsProvider })

const BATCH_SIZE = 4
const TREES: MerkleTree[] = []
const BATCH: Header[] = []
// make a call to retrieve the current network head
api.rpc.chain.subscribeNewHeads(header => {
  if (BATCH.length < BATCH_SIZE) {
    BATCH.push(header)
  }
  if (BATCH.length === BATCH_SIZE) {
    TREES.push(new MerkleTree(BATCH))
    console.log(TREES[0].generateProof(BATCH[1]))
    console.log(TREES[0].validate(BATCH[1]))
  }
})
