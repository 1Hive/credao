import React, { useState, useEffect } from 'react'
import fetch from 'isomorphic-unfetch';

const Repo = props =>
  <label style={{display: "block"}}>
    <input type="checkbox" value={props.id} checked={!!props.selected} onChange={props.toggle} />
    <span>{props.full_name}</span>
  </label>

const repoBox = {
  maxHeight: "50vh",
  overflowY: "auto",
  maxWidth: "25%",
  minWidth: "300px"
}

const Repos = props =>
  <React.Fragment>
    <div style={repoBox}>
      {props.repos.map(r=><Repo {...r} key={r.id} toggle={()=>props.onSelect(r)} />)}
    </div>
  </React.Fragment>

export default Repos

// ()=>{!!props.selected[r.id] ? delete props.selected[r.id] : props.selected[r.id]=r; props.setSelected({...props.selected})
