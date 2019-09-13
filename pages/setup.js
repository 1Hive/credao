import React, { useState, useEffect } from 'react'
// import { PrivatePage } from 'next-github-auth'
import fetch from 'isomorphic-unfetch'
import { auth, createInstallationToken, getInstallationRepos, getCred } from '../utils'
import createDAO from '../utils/createDAO'
import Loading from '../components/Loading';

const resultsBoxStyle = {
  width: "50%",
  paddingLeft: "2em",
  boxSizing: "border-box"
}

const Setup = props => {
  const [repos, setRepos] = useState(props.repos || [])
  const [cred, setCred] = useState([])
  const [dao, setDao] = useState(props.dao)
  const [orgName, setOrgName] = useState(props.repos[0].owner.login)
  const [status, setStatus] = useState()

  useEffect(()=>{
    let repoNames = props.repos.map(r=>r.full_name)
    getCred(props.installationId, repoNames).then(setCred)
  }, [])

  return (
    <div user={props.name}>
      <h4>Hi {props.name}!</h4>
      <div style={{textAlign: "center", marginBottom: "1.5em"}}>
        <h1 style={{margin: "0.25em 0"}}>{orgName}</h1>
        {!status && !dao && cred.length && <button onClick={()=>createDAO(props.installationId, orgName, cred, setDao, setStatus)}>Continue</button>}
        {!status && dao && <h2><a target="_blank" href={`http://localhost:3000/#/${dao}`}>Your DAO</a></h2>}
        {status && <Loading>{status}</Loading>}
      </div>
      <div style={{display: "flex"}}>
        <div style={resultsBoxStyle}>
          <h3 style={{marginTop: "0"}}>repos:</h3>
          <ul style={{padding: "0", listStyle: "none"}}>
            {repos.sort((a,b)=>b.full_name-a.full_name).map(r=><li key={r.id}>{r.name}</li>)}
          </ul>
        </div>
        <div style={resultsBoxStyle}>
          <h3 style={{marginTop: "0"}}>cred:</h3>
          {cred.length ?
            <table>
              <tbody>
                {cred.sort((a,b)=>b.cred-a.cred).map(c=><tr key={c.name}><td>{c.name}</td><td style={{textAlign:"right"}}>{c.cred.toFixed(4)}</td></tr>)}
              </tbody>
            </table> :
            <div>
              <Loading>calculating cred</Loading>
              <p>(may take some time)</p>
            </div>
          }
        </div>
      </div>
    </div>
  )
}

// http://localhost:3000/setup?installation_id=1884491&setup_action=install
Setup.getInitialProps = async function(ctx) {
  const { query } = ctx
  const { name, token } = await auth(ctx)
  let installationId = query["installation_id"]
  let installationToken = await createInstallationToken(installationId)
  console.log("installationToken", installationToken)
  let repos = await getInstallationRepos(installationToken)
  return { name, repos, installationId }
}

export default Setup
