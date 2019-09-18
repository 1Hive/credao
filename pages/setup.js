import React, { useState, useEffect } from 'react'
import { getCred } from '../utils'
import { auth } from '../utils/auth'
import { getInstallation, updateInstallationDAO } from '../utils/installation'
import fetch from 'isomorphic-unfetch'
import createDAO from '../utils/createDAO'
import Loading from '../components/Loading'
import Header from '../components/Header'

const Setup = props => {
  const [cred, setCred] = useState()
  const [dao, setDao] = useState(props.installation && props.installation.dao)

  useEffect(()=>{
    if(props.installation)
      getCred({target: props.installation.target, githubToken: props.githubToken}).then(setCred)
  }, [])

  return (
    <div>
      <Header user={props.user} />
      <p>{props.installation ? props.installation.name : 'no installation'}</p>
      <button onClick={()=>createDAO({userId: props.user.id, installationId: props.installation.id}, setDao)}>create dao</button>
      {dao && <p><a target="_blank" href={`http://localhost:3000/#/${dao}`}>dao for {props.installation.name}</a></p>}
      {cred && <p>{JSON.stringify(cred)}</p>}
      {cred && <button>assign cred to dao</button>}
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
