import { ApiPromise } from '@polkadot/api'

// initialise via static create
const api = await ApiPromise.create()

// make a call to retrieve the current network head
api.rpc.chain.subscribeNewHeads(header => {
  console.log(`Chain is at #${header.number}`)
})
