import React, { useState, useEffect } from 'react'
import { getCred } from '../utils'
import { auth } from '../utils/auth'
import { getInstallation, updateInstallationDAO } from '../utils/installation'
import fetch from 'isomorphic-unfetch'
import { createDAO, airdrop }  from '../utils/createDAO'
import Loading from '../components/Loading'
import Header from '../components/Header'
import DAOLink from '../components/DAOLink'

const Setup = props => {
  const [cred, setCred] = useState()
  const [dao, setDao] = useState(props.installation && props.installation.dao)
  const [creatingDAO, setCreatingDAO] = useState()

  useEffect(()=>{
    if(props.installation)
      getCred({target: props.installation.target, githubToken: props.githubToken}).then(setCred)
  }, [])

  useEffect(()=>{
    if(dao) setCreatingDAO()
  }, [dao])

  return (
    <div>
      <Header user={props.user} />
      <p>{props.installation ? props.installation.name : 'no installation'}</p>
      {!dao && !creatingDAO && <button onClick={()=>{createDAO({userId: props.user.id, installationId: props.installation.id}, setDao); setCreatingDAO(true)}}>create dao</button>}
      {creatingDAO && <Loading>creating dao</Loading>}
      {dao && <p><DAOLink dao={dao}/></p>}
      {cred && <p>{JSON.stringify(cred)}</p>}
      {dao && cred && <button onClick={()=>{airdrop({cred, userId: props.user.id, installationId: props.installation.id})}}>airdrop cred</button>}
    </div>
  )
}

// http://localhost:3000/setup?code=A_USER_CODE&installation_id=1884491&setup_action=install
Setup.getInitialProps = async function(ctx) {
  const { query } = ctx
  const user = await auth(ctx)
  const installationId = query["installation_id"]
  const setupAction = query["setup_action"]
  if(setupAction !== "install"){
    ctx.res.redirect('/')
    return {}
  }
  const installation = await getInstallation({user, githubId: query["installation_id"]})
  return { user, installation, githubToken: ctx.req.session.githubToken }
}

export default Setup
