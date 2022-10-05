import { ApiPromise, WsProvider } from '@polkadot/api'
import { Header } from '@polkadot/types/interfaces/runtime'
import MerkleTree from './MerkleTree'
import HeaderClient from './HeaderClient'

const wsProvider = new WsProvider('ws://localhost:9944')
// initialise via static create
const api = await ApiPromise.create({ provider: wsProvider })

const BATCH_SIZE = 4
const BATCH: Header[] = []
// make a call to retrieve the current network head
api.rpc.chain.subscribeNewHeads(header => {
  const client = new HeaderClient()
  if (BATCH.length < BATCH_SIZE) {
    BATCH.push(header)
  }
  if (BATCH.length === BATCH_SIZE) {
    client.addTree(new MerkleTree(BATCH))
  }
  // Prove
  if (!client.isEmpty) {
    const queriedHeader = client.queryByNumber(BATCH[1].number)
    console.log('queried', queriedHeader)
    if (queriedHeader?.header) {
      const inclusionProof = queriedHeader?.tree?.generateProof(
        queriedHeader.header
      )
      console.log('inclusionProof', inclusionProof)
      console.log('verified', queriedHeader.tree?.verify(queriedHeader.header))
    }
  }
})
