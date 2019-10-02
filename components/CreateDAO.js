import React, { useState, useEffect, useContext } from 'react'
import { Button } from 'grommet'
import { Spinning } from 'grommet-controls'
import { Deploy } from 'grommet-icons';
import UserContext from '../components/UserContext';
import { createDAO }  from '../utils/dao'

function CreateDAO(props) {
  const { user } = useContext(UserContext)
  const [dao, setDao] = useState()
  const [creating, setCreating] = useState()

  return <Button
    icon={creating ? <Spinning kind="pulse" /> : <Deploy />}
    label={creating ? "" : "create dao"}
    disabled={!!creating}
    onClick={()=>{
      createDAO({
        jwt: user.jwt,
        userId: user.id,
        installationId: props.installationId
      }).then(props.onDao).then(()=>setCreating())
      setCreating(true)
    }} />
}

export default CreateDAO
