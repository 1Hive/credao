import { PrivatePage } from 'next-github-auth'
import Layout from '../components/Layout';
import UserRepos from '../components/UserRepos';
import UserOrgs from '../components/UserOrgs';
import fetch from 'isomorphic-unfetch';

const Start = props => (
  <Layout user={props.user}>
    <UserOrgs orgs={props.orgs} />
    <UserRepos repos={props.repos} />
  </Layout>
)

Start.getInitialProps = async function({ github }) {
  const [orgs, repos] = await Promise.all([
    getOrgs(github.accessToken),
    getRepos(github.accessToken)
  ])
  return { repos, orgs, user: github.user }
}

export default PrivatePage(Start)

async function getOrgs(accessToken){
  let orgs = await fetch("https://api.github.com/user/orgs", {
    headers: {
      'Authorization': `token ${accessToken}`
    }
  })
  return await orgs.json()
}

async function getRepos(accessToken){
  let repos = await fetch("https://api.github.com/user/repos", {
    headers: {
      'Authorization': `token ${accessToken}`
    }
  })
  return await repos.json()
}
