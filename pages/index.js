import React, { useState, useEffect } from 'react'
import Loading from '../components/Loading'
import Header from '../components/Header'
import DAOLink from '../components/DAOLink'
import { collateCred } from '../utils'
import { create as createDAO, getAirdropper, airdrop } from '../utils/dao'
import { auth } from '../utils/auth'
import { getUserInstallationsByUserId } from '../utils/query'
import ipfsClient from 'ipfs-http-client'

const Installation = (props) => {
  const [latest, setLatest] = useState()
  const [dao, setDao] = useState(props.dao)
  const [cred, setCred] = useState(collateCred({cred: props.cred}))
  const [creatingDAO, setCreatingDAO] = useState()
  const userId = props.user.id
  const installationId = props.id

  useEffect(()=>{
    if(!dao) return
    (async ()=>{
      let airdropper = await getAirdropper({dao: props.dao})
      let count = await airdropper.distributionsCount()
      if(count.isZero()) return
      let latest = await airdropper.distributions(count)
      let ipfsGateway = location.hostname === 'localhost' ? 'http://localhost:8080/ipfs' : 'https://ipfs.eth.aragon.network/ipfs'
      let data = await (await fetch(`${ipfsGateway}/${latest.dataURI.split(':')[1]}`)).json()
      latest.data = data
      setLatest(latest)
    })()
  }, [dao])

  return (
    <tr>
      <td>{props.name}</td>
      <td>
        {dao && <DAOLink dao={dao}/>}
        {!dao && creatingDAO && <Loading>creating dao</Loading>}
        {!dao && !creatingDAO && <button onClick={()=>{createDAO({userId, installationId}, setDao); setCreatingDAO(true)}}>create dao</button>}
      </td>
      <td>{cred && cred.collated.length ? <button onClick={()=>{airdrop({cred, userId, installationId})}}>airdrop cred</button> : null}</td>
      <td>{cred && JSON.stringify(cred)}</td>
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
        <table><tbody>{props.installations.map(i=><Installation user={props.user} key={i.id} {...i}/>)}</tbody></table>
      </React.Fragment>
      : null
    }
  </div>

Index.getInitialProps = async function(ctx) {
  const { query } = ctx
  const user = await auth(ctx)
  const installations = user ? await getUserInstallationsByUserId(user.id) : []
  console.log(installations)
  return { user, installations }
}

export default Index
