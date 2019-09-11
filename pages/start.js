import React, { useState, useEffect } from 'react'
import { PrivatePage } from 'next-github-auth'
import Layout from '../components/Layout';
import Repos from '../components/Repos';
import CredList from '../components/CredList';
import fetch from 'isomorphic-unfetch';
import parseLinkHeader from 'parse-link-header';
const STARTED = "started"
const COMPLETED = "completed"
const FAILED = "failed"

const hasCred = {backgroundColor: "green", marginRight: "10px", padding: "4px"}
const waitingCred = {backgroundColor: "yellow", marginRight: "10px", padding: "4px"}

const Selected = props =>
  <span style={props.cred ? hasCred : waitingCred}>
    {props.name}
  </span>

const Start = props => {
  const [selected, setSelected] = useState([])

  const [repos, setRepos] = useState(props.repos)
  useEffect(()=>{
    setSelected(repos.filter(r=>r.selected))
  }, [repos])

  const [changed, setChanged] = useState()
  useEffect(()=>{
    if(!changed) return
    console.log(changed)
    setRepos(arrayReplaceByKey(repos, changed, "id").slice())
    setChanged()
  }, [changed])

  return (
    <Layout user={props.user}>
      <p>{selected.map(r=><Selected key={r.id} {...r}/>)}</p>
      <h3>Repos:</h3>
      <div style={{display: "flex"}}>
        <Repos repos={repos} onSelect={(r)=>{r.selected=!r.selected; setChanged(r); if(!r.cred) attachCred(r, setChanged)}} />
        <CredList repos={selected.filter(s=>s.cred)} />
      </div>
    </Layout>
  )
}

Start.getInitialProps = async function({ github }) {
  const repos = await getUserRepos(github.accessToken)
  return { repos, user: github.user }
}

export default PrivatePage(Start)

async function getUserRepos(token){
  let res = await getJSON("https://api.github.com/user/repos", token)
  let repos = res.data
  let next = res.next

  while(next){
    let res = await getJSON(next, token)
    repos = repos.concat(res.data)
    next = res.next
  }

  return repos
}

async function getJSON(url, token){
  const res = await fetch(url, { headers: { 'Authorization': `token ${token}` } })
  const link = parseLinkHeader(res.headers.get("link"))
  return {next: link.next && link.next.url, data: await res.json()}
}

async function attachCred(repo, setChanged){
  // let all = await Promise.all(
  //   repos.map(async (r)=>{
  //     const cred = await getCred(r.id)
  //     r.cred = cred
  //     setChanged(r)
  //     return r
  //   }
  // ))
  // const creds = await Promise.all(res.map(r=>r.json()))

  const cred = await getCred(repo.id)
  repo.cred = cred
  setChanged(repo)
}

async function getCred(id){
  const res = await fetch(`/api/cred/${id}`)
  const cred = await res.json()
  if(cred.status === COMPLETED)
    return cred.data
  else {
    await timeout(10000)
    return await getCred(id)
  }
}

function arrayReplaceByKey(arr, item, key){
  let idx = arr.find(a=>a[key]===item[key])
  arr[idx] = item
  return arr
}

async function timeout(ms){
  return await new Promise(resolve => setTimeout(resolve, ms));
}
