import React, { useState, useEffect } from 'react'
// import { getCred } from '../utils'
import { auth } from '../utils/auth'
import {
  getInstallationGithubToken,
  getInstallationRepos,
  createInstallation,
  getInstallationByGithubId,
  getInstallationUser,
  createInstallationUser
} from '../utils/query'
import fetch from 'isomorphic-unfetch'
import { collateCred } from '../utils'
import { create as createDAO, airdrop }  from '../utils/dao'
import Loading from '../components/Loading'
import Header from '../components/Header'
import DAOLink from '../components/DAOLink'

const Setup = props => {
  const [cred, setCred] = useState(props.installation && props.installation.cred ? collateCred({cred: props.installation.cred}) : null)
  const [dao, setDao] = useState(props.installation && props.installation.dao)
  const [creatingDAO, setCreatingDAO] = useState()

  useEffect(()=>{
    if(dao) setCreatingDAO()
  }, [dao])

  let userId = props.user.id
  let installationId = props.installation.id

  return (
    <div>
      <Header user={props.user} />
      <p>{props.installation ? props.installation.name : 'no installation'}</p>
      {!dao && !creatingDAO && <button onClick={()=>{createDAO({userId, installationId}, setDao); setCreatingDAO(true)}}>create dao</button>}
      {creatingDAO && <Loading>creating dao</Loading>}
      {dao && <p><DAOLink dao={dao}/></p>}
      {cred && <p>{JSON.stringify(cred)}</p>}
      {dao && cred && <button onClick={()=>{airdrop({cred, userId, installationId})}}>airdrop cred</button>}
    </div>
  )
}

// http://localhost:3000/setup?code=A_USER_CODE&installation_id=1884491&setup_action=install
Setup.getInitialProps = async function(ctx) {
  const { query } = ctx
  const user = await auth(ctx)
  const userId = user.id
  const githubInstallationId = query["installation_id"]
  const setupAction = query["setup_action"]
  if(setupAction !== "install"){
    ctx.res.redirect('/')
    return {}
  }
  let installation = await getInstallationByGithubId({githubInstallationId})

  if(!installation){
    const { githubToken, name, target } = await getInstallationDetails(githubInstallationId)
    installation = await createInstallation({githubInstallationId, githubToken, name, target, creatorId: userId})
  }

  const installationId = installation.id
  let installationUser = await getInstallationUser({userId, installationId})

  if(!installationUser)
    installationUser = await createInstallationUser({userId, installationId})
  console.log("installationUser", installationUser)

  return { user, installation }
}

export default Setup

async function getInstallationDetails(githubInstallationId){
  let githubToken = await getInstallationGithubToken(githubInstallationId)
  console.log("installation token", githubToken)
  let repos = await getInstallationRepos(githubToken)

  let name, target
  if(!repos.length) {
    // need some repos
  } else if(repos.length === 1) {
    // single repo use repo name as installation name
    name = repos[0].full_name.split("/")[1]
    target = repos[0].full_name
  } else {
    // multiple repos use first org name as installation name
    name = repos[0].owner.login
    target = `@${repos[0].owner.login}`
  }
  return { githubToken, name, target }
}
