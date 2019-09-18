import Header from '../components/Header'
import { auth } from '../utils/auth'
import { getUserInstallationsByUserId } from '../utils/installation'

const Index = (props) =>
  <div>
    <Header user={props.user} />
    <p>{props.user ? `Welcome, ${props.user.username}` : `please login`}</p>
    <p>This is the home page</p>
    {props.installations.length ?
      <React.Fragment>
        <p>Your organizations:</p>
        <ul>{props.installations.map(i=><li key={i.id}>{i.name}</li>)}</ul>
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
