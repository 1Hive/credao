import React, { useState, useEffect } from 'react'
import fetch from 'isomorphic-unfetch';

const Repo = props => (
  <label style={{display: "block"}}>
    <input type="checkbox" value={props.id} checked={props.checked} onChange={props.toggle} />
    <span>{props.full_name}</span>
  </label>
)

const Repos = props => {
  const [selected, setSelected] = useState({})

  return (
    <React.Fragment>
      <p>{Object.values(selected).map(r=>r.name).join(", ")}</p>
      <button onClick={()=>initReport(Object.keys(selected))}>submit</button>
      <h3>Repos:</h3>
      <div>
        {props.repos.map(r=><Repo {...r} key={r.id} checked={!!selected[r.id]} toggle={()=>{!!selected[r.id] ? delete selected[r.id] : selected[r.id]=r; setSelected({...selected})}} />)}
      </div>
    </React.Fragment>
  )
}

export default Repos

async function initReport(ids){
  const params = getQueryString({id:ids})
  let res = await Promise.all(ids.map(id=>fetch(`/api/cred/${id}`)))
  console.log(res)
}
