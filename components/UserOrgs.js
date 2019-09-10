import React from 'react'

const org = props => (
  <li key={props.id}>
    {props.login}
  </li>
)

const UserOrgs = props => (
  <React.Fragment>
    <h3>Orgs:</h3>
    <ul>
      {props.orgs.map(org)}
    </ul>
  </React.Fragment>
)

export default UserOrgs
