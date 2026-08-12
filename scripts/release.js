// Pushes the release tag, which is what triggers .github/workflows/release.yml
// and therefore the npm publish.
//
// This is deliberately not part of `release`. Bumping the version and
// publishing it are two decisions here, because the release commit is not on
// `main` at the moment bumpp makes it — it gets there by pull request like
// everything else. So the tag goes out afterwards, once the commit has landed.
//
// The ancestry check below is load-bearing rather than defensive. The branch
// ruleset protects `refs/heads/*`; nothing protects `refs/tags/*`. A tag
// pointing at a commit `main` cannot reach would be accepted without complaint,
// and the release workflow would publish from it. This is the only place that
// is checked.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
// Imported rather than taken as a global: eslint lints this repo's .js with
// browser globals, and this is the only file in it that runs under Node.
import process from 'node:process'

const REMOTE = 'gh'
const BASE = 'main'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

// Derived from the file bumpp rewrites, so the tag name cannot drift from the
// version that is about to be published.
const { version } = JSON.parse(
  readFileSync(new URL('../package/package.json', import.meta.url), 'utf8')
)
const tag = `v${version}`

try {
  git('rev-parse', '--verify', `refs/tags/${tag}`)
} catch {
  fail(`No local tag ${tag}.

package/package.json says ${version}, but nothing is tagged for it. Run
\`pnpm release\` to bump and tag, then re-run this once the commit is on
${BASE}.`)
}

try {
  git('fetch', REMOTE, BASE)
} catch (error) {
  fail(`Could not fetch ${BASE} from '${REMOTE}':\n${error.stderr || error.message}`)
}

// `^{commit}` so an annotated tag is compared as the commit it points at.
let landed = true
try {
  git('merge-base', '--is-ancestor', `${tag}^{commit}`, `${REMOTE}/${BASE}`)
} catch {
  landed = false
}

if (!landed) {
  fail(`${tag} is not on ${REMOTE}/${BASE}.

The commit ${tag} points at has not landed yet, so publishing from it would
ship code that ${BASE} does not have. Land the release commit first, then
re-run.

If it looks like it did land, check that the pull request was merged with a
merge commit — squashing rewrites the commit, which leaves ${tag} pointing at
one that no longer exists on ${BASE}.`)
}

try {
  git('push', REMOTE, tag)
} catch (error) {
  fail(`Could not push ${tag} to '${REMOTE}':\n${error.stderr || error.message}`)
}

console.log(`Pushed ${tag}. Publishing is now up to GitHub Actions:
  https://github.com/ayo-run/astro-resume/actions/workflows/release.yml`)
