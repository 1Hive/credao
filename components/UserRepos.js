import React, { useState, useEffect } from 'react'
import fetch from 'isomorphic-unfetch';

const Repo = props => (
  <label style={{display: "block"}}>
    <input type="checkbox" value={props.name} checked={props.checked} onChange={e=>props.onToggle(e.target.value)} />
    <span>{props.name}</span>
  </label>
)

const UserRepos = props => {
  const [selected, setSelected] = useState({})

  return (
    <React.Fragment>
      <p>{Object.keys(selected).join(",")}</p>
      <button onClick={()=>initReport(Object.keys(selected))}>submit</button>
      <h3>Repos:</h3>
      <div>
        {props.repos.map(r=><Repo {...r} key={r.id} checked={!!selected[r.name]} onToggle={name=>{!!selected[name] ? delete selected[name] : selected[name]=true; setSelected({...selected})}} />)}
      </div>
    </React.Fragment>
  )
}

export default UserRepos

async function initReport(repos){
  const params = getQueryString({repos})
  let res = await fetch(`/api/cred?${params}`)
}

function getQueryString(params) {
    return Object
    .keys(params)
    .map(k => {
        if (Array.isArray(params[k])) {
            return `${encodeURIComponent(k)}[]=` + params[k]
                .map((val,i) => `${encodeURIComponent(val)}`)
                .join(',')
        }

        return `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`
    })
    .join('&')
}
