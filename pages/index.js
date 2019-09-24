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
  const [loading, setLoading] = useState(true)
  const [cred, setCred] = useState()
  const [creatingDAO, setCreatingDAO] = useState()
  const userId = props.user.id
  const installationId = props.id

  useEffect(()=>{
    if(!dao) return
    (async ()=>{
      let airdropper = await getAirdropper({dao: props.dao})
      let count = await airdropper.distributionsCount()
      if(count.isZero()) {
        if(props.cred){
          setCred(collateCred({cred: props.cred}))
          setLoading(false)
        }
        return
      }
      let latest = await airdropper.distributions(count)
      let ipfsGateway = location.hostname === 'localhost' ? 'http://localhost:8080/ipfs' : 'https://ipfs.eth.aragon.network/ipfs'
      let data = await (await fetch(`${ipfsGateway}/${latest.dataURI.split(':')[1]}`)).json()
      latest.data = data
      setLatest(latest)
    })()
  }, [dao])

  useEffect(()=>{
    if(!dao || !props.cred || !latest || !latest.data.end) return
    setCred(collateCred({cred: props.cred, after: latest.data.end}))
    setLoading(false)
  }, [dao, latest])

  return (
    <tr>
      <td>{props.name}</td>
      <td>
        {dao && <DAOLink dao={dao}/>}
        {!dao && creatingDAO && <Loading>creating dao</Loading>}
        {!dao && !creatingDAO && <button onClick={()=>{createDAO({userId, installationId}, setDao); setCreatingDAO(true)}}>create dao</button>}
      </td>
      <td>
        {loading && <Loading>loading</Loading>}
        {cred && <button onClick={()=>{airdrop({cred, userId, installationId})}}>airdrop cred</button>}
        {!cred && !loading && 'no new cred'}
      </td>
    </tr>
  )
}
// <td></td>

const Index = (props) =>
  <div>
    <Header user={props.user} />
    <p>{props.user ? `Welcome, ${props.user.username}` : `please login`}</p>
    {props.installations.length ?
      <React.Fragment>
        <p>Your organizations:</p>
        <table>
          <tbody>
            {props.installations.map(i=><Installation user={props.user} key={i.id} {...i}/>)}
          </tbody>
        </table>
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
