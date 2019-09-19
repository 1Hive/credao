import Header from '../components/Header'
import DAOLink from '../components/DAOLink'
import { auth } from '../utils/auth'
import { getUserInstallationsByUserId } from '../utils/installation'

const Installation = (props) =>
  <tr><td>{props.name}</td><td>{props.dao && <DAOLink dao={props.dao}/>}</td></tr>

const Index = (props) =>
  <div>
    <Header user={props.user} />
    <p>{props.user ? `Welcome, ${props.user.username}` : `please login`}</p>
    <p>This is the home page</p>
    {props.installations.length ?
      <React.Fragment>
        <p>Your organizations:</p>
        <table><tbody>{props.installations.map(i=><Installation key={i.id} {...i}/>)}</tbody></table>
      </React.Fragment>
      : null
    }
  </div>

Index.getInitialProps = async function(ctx) {
  const { query } = ctx
  const user = await auth(ctx)
  const installations = user ? await getUserInstallationsByUserId(user.id) : []
  return { user, installations }
}

export default Index
