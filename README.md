# @murkio/svelte

Murkio identity for Svelte 4/5 and SvelteKit. Svelte renders the
`<murkio-identity-*>` custom elements of [`@murkio/html`](../html/README.md) directly;
this package adds the setup, stores and typings.

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { onMount } from 'svelte';
  import { initMurkio } from '@murkio/svelte';
  onMount(() => initMurkio({ publishableKey: 'pk_...', afterLogin: '/dashboard' }));
</script>
<slot />

<!-- src/routes/login/+page.svelte -->
<script>
  import { auth, user, murkioEvents, signOut } from '@murkio/svelte';
</script>

{#if $auth.isSignedIn}
  <button on:click={signOut}>Sign out {$user?.email}</button>
{:else}
  <murkio-identity-canvas use:murkioEvents={{ onLogin: () => console.log('signed in') }}></murkio-identity-canvas>
{/if}
```

- Your own layout: `<murkio-identity-email-input class="input">`, `-password-input`,
  `-keep-logged`, `-login-button`, `-register-button`, `-error`.
- Types for the tags: add `/// <reference types="@murkio/svelte/elements" />` to
  `src/app.d.ts`. Svelte 5 can also bind `onmurkio-login={...}`.
- Server side (hooks, `+page.server.ts`): use `@murkio/node`'s `protect()` with the
  request (`await murkio.protect(event.request, { required: true })`).

## Developing

```sh
npm ci     # also builds the package (the `prepare` script)
npm test
```

`@murkio/html` is not on the npm registry yet, so `package.json` takes it from its
repository at a pinned commit, built on install; `.npmrc` allows that (npm 12 refuses git
dependencies by default) and `npm publish` refuses to run until the dependency is a plain
version. The tests run against that build, the same code an application gets.

The checks in `infra/pipeline/` are kept in the Murkio identity service and synced from
there, so they are not edited here.

Every pull request runs the workflows in `.github/workflows`. The same checks, locally:

| Workflow | What it runs |
| --- | --- |
| Build | `npm run build`, `npm run package:check` (publint) and `npm pack --dry-run`, on Node.js 20 and 24 |
| Format | `npm run format:check` (Biome; `npm run format` fixes) |
| Lint | `npm run lint` (Biome), `npm run typecheck` (strict TypeScript) |
| Tests | `npm test` on Node.js 20 and 24 |
| Quality & Governance Checks | `for check in infra/pipeline/*.py; do python3 "$check"; done` |
| Security | `npm audit --omit=dev`, `npm audit --audit-level=high`, `npm audit signatures`, `gitleaks git .`, `zizmor --pedantic .` |
| CodeQL, Dependency Review | run by GitHub on the pull request |

Security reports: see [SECURITY.md](SECURITY.md).
