import Header from '../components/Header'
import { auth } from '../utils/auth'

const Index = (props) =>
  <div>
    <Header user={props.user} />
    <p>{props.user ? `Welcome, ${props.user.username}` : `please login`}</p>
    <p>This is the home page</p>
  </div>

Index.getInitialProps = async function(ctx) {
  const { query } = ctx
  const user = await auth(ctx)
  return { user }
}

export default Index
