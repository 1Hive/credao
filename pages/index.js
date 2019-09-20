import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import DAOLink from '../components/DAOLink'
import { getAirdropper } from '../utils/createDAO'
import { auth } from '../utils/auth'
import { getUserInstallationsByUserId } from '../utils/installation'
import ipfsClient from 'ipfs-http-client'

const Installation = (props) => {
  const [latest, setLatest] = useState()
  useEffect(()=>{
    (async ()=>{
      let airdropper = await getAirdropper({dao: props.dao})
      let count = await airdropper.distributionsCount()
      let latest = await airdropper.distributions(count)
      let ipfsGateway = location.hostname === 'localhost' ? 'http://localhost:8080/ipfs' : 'https://ipfs.eth.aragon.network/ipfs'
      let data = await (await fetch(`${ipfsGateway}/${latest.dataURI.split(':')[1]}`)).json()
      latest.data = data
      setLatest(latest)
    })()
  }, [])

  return (
    <tr>
      <td>{props.name}</td>
      <td>{props.dao && <DAOLink dao={props.dao}/>}</td>
      <td>{latest && latest.data && latest.data.end ? new Date(latest.data.end).toDateString() : 'unknown'}</td>
    </tr>
  )
}

const Index = (props) =>
  <div>
    <Header user={props.user} />
    <p>{props.user ? `Welcome, ${props.user.username}` : `please login`}</p>
    {props.installations.length ?
      <React.Fragment>
        <p>Your organizations:</p>
        <table><tbody>{props.installations.map(i=><Installation key={i.id} {...i}/>)}</tbody></table>
      </React.Fragment>
      : null
    }
  </div>

Index.getInitialProps = async function(ctx) {
  const { query } = ctx
  const user = await auth(ctx)
  const installations = user ? await getUserInstallationsByUserId(user.id) : []
  return { user, installations }
}

export default Index
