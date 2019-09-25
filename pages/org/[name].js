import React, { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router';
import Loading from '../../components/Loading'
import Layout from '../../components/Layout'
import DAOLink from '../../components/DAOLink'
import UserContext from '../../components/UserContext';
import { collateCred, ipfsFetch } from '../../utils'
import { getInstallationByName } from '../../utils/query'
import { create as createDAO, getAirdropper, airdrop }  from '../../utils/dao'

function InstallationDetail(props){
  const { user } = useContext(UserContext)
  const [cred, setCred] = useState(props.cred)
  const [dao, setDao] = useState(props.dao)
  const [creating, setCreating] = useState()
  const [airdropper, setAirdropper] = useState()
  const [count, setCount] = useState()
  const [latest, setLatest] = useState()
  const [diff, setDiff] = useState()
  const [showCred, setShowCred] = useState()
  const [email, setEmail] = useState()

  useEffect(()=>{
    if(!dao) return
    setCreating()
    getAirdropper({dao}).then(setAirdropper)
  }, [dao])

  useEffect(()=>{
    if(!airdropper) return
    (async()=>{
      const count = await airdropper.distributionsCount()
      setCount(count)
      if(count.isZero()) return
      const latest = await airdropper.distributions(count)
      latest.data = await (await ipfsFetch(latest.dataURI.split(':')[1])).json()
      setLatest(latest)
    })()
  }, [airdropper])

  useEffect(()=>{
    if(!count || !cred) return
    if(count.isZero()) return setDiff(collateCred({cred: props.cred}))
    else if(latest) return setDiff(collateCred({cred: props.cred, after: latest.data.end}))
  }, [cred, count, latest])

  return (
    <React.Fragment>
      <h1>{props.name}</h1>
      {dao && <p><DAOLink dao={dao}>visit dao</DAOLink></p>}
      {!dao && !creating && <button onClick={()=>{createDAO({userId: user.id, installationId: props.id}, setDao); setCreating(true)}}>create dao</button>}
      {creating && <Loading>creating dao</Loading>}
      {dao && count === undefined && <Loading>retreiving org details</Loading>}
      {count !== undefined && <p>{`there ${count.toNumber() === 1 ? 'has' : 'have'} been ${count} cred-drop${count.toNumber() === 1 ? '' : 's'}`}</p>}
      {latest && <p>{`the most recent cred-drop covers activity till ${new Date(latest.data.end).toDateString()}`}</p>}
      {!cred && <p>cred has not been collected yet. provide an <input type="text" onChange={(e)=>setEmail(e.target.value)} placeholder="email address" /> to be notified when it's ready.</p>}
      {email && `the notify:${email} feature has not been implemented yet`}
      {diff &&
        <div>
          <p>{`cred is available covering ${new Date(diff.start).toDateString()} to ${new Date(diff.end).toDateString()}`}</p>
          <p><button onClick={()=>airdrop({diff, userId: user.id, installationId: props.id})}>airdrop cred</button></p>
          <div>
            <button onClick={()=>setShowCred(!showCred)}>{showCred ? 'hide cred' : 'show cred'}</button>
            {showCred && <p>{JSON.stringify(diff)}</p>}
          </div>
        </div>
      }
    </React.Fragment>
  )
}

export default function Installation() {
  const { user } = useContext(UserContext)
  const [installation, setInstallation] = useState()
  const [error, setError] = useState()
  const router = useRouter();

  useEffect(()=>{
    if(!router.query.name) return
    console.log(router.query.name)
    getInstallationByName({name: router.query.name}).then(i=>i ? setInstallation(i) : setError(`${router.query.name} org not found`))
  }, [router])

  return (
    <Layout>
      {installation && <InstallationDetail {...installation} />}
      {error && <h3>{error}</h3>}
    </Layout>
  );
}
