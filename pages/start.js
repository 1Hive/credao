import { PrivatePage } from 'next-github-auth'
import Layout from '../components/Layout';
import Repos from '../components/Repos';
import fetch from 'isomorphic-unfetch';
import parseLinkHeader from 'parse-link-header';

const Start = props => (
  <Layout user={props.user}>
    <Repos repos={props.repos} />
  </Layout>
)

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
