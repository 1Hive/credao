import React, { useState, useEffect, useContext } from 'react'
// import { getCred } from '../utils'
import { auth } from '../utils/auth'
import fetch from 'isomorphic-unfetch'
import { collateCred } from '../utils'
import { create as createDAO, airdrop }  from '../utils/dao'
import Loading from '../components/Loading'
import Header from '../components/Header'
import DAOLink from '../components/DAOLink'
import UserContext from '../components/UserContext';

const Setup = props => {
  const { user } = useContext(UserContext)
  const [installation, setInstallation] = useState()

  useEffect(()=>{
    if(!user) return
    (async ()=>{
      const urlParams = new URLSearchParams(window.location.search)
      let res = await fetch(`/installation?user_id=${user.id}&github_installation_id=${urlParams.get("installation_id")}`)
      setInstallation( await res.json() )
    })()
  }, [user])

  const [cred, setCred] = useState()
  const [dao, setDao] = useState()
  const [creatingDAO, setCreatingDAO] = useState()

  useEffect(()=>{
    if(!installation) return
    if(installation.dao) setDao(installation.dao)
    if(installation.cred) setCred( collateCred({cred: installation.cred}) )
  }, [installation])

  useEffect(()=>{
    if(dao) setCreatingDAO()
  }, [dao])

  return (
    <div>
      <Header />
      <p>{installation ? installation.name : 'no installation'}</p>
      {!dao && !creatingDAO && <button onClick={()=>{createDAO({userId: user.id, installationId: installation.id}, setDao); setCreatingDAO(true)}}>create dao</button>}
      {creatingDAO && <Loading>creating dao</Loading>}
      {dao && <p><DAOLink dao={dao}/></p>}
      {cred && <p>{JSON.stringify(cred)}</p>}
      {dao && cred && <button onClick={()=>{airdrop({cred, userId: user.id, installationId: installation.id})}}>airdrop cred</button>}
    </div>
  )
}

export default Setup
