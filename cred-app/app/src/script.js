import 'core-js/stable'
import 'regenerator-runtime/runtime'
import AragonApi from '@aragon/api'

const api = new AragonApi()

api.store(
  async (state, event) => {
    let newState

    console.log("distribution", event, state)

    switch (event.event) {
      case 'Started':
        let distribution = await marshalDistribution(parseInt(event.returnValues.id, 10))
        console.log("started", event.returnValues.id)
        newState = {...state, distributions: [distribution].concat((state && state.distributions) || []) }
        break
      case 'Received':
        newState = {...state}
        break
      default:
        newState = state
    }

    console.log("newState", newState)

    return newState
  },
  {
    init: async function(){
      return { distributions: [], source: await api.call('source').toPromise() }
    }
  }
)

async function marshalDistribution(id) {
  // let ipfsGateway = location.hostname === 'localhost' ? 'http://localhost:8080/ipfs' : 'https://ipfs.eth.aragon.network/ipfs'
  let {root, dataURI} = await api.call('distributions', id).toPromise()
  console.log(root, dataURI)
  // let data = await fetch(`${ipfsGateway}/${dataURI.split(':')[1]}`).then(r=>r.json())
  return { id, root, dataURI }
}
