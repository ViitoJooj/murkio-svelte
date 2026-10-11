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

This repository is a git submodule of the Murkio identity service
(`libs/external/svelte`) and is developed from there: the JavaScript packages share one
npm workspace, and the tests read the contract, the vectors and the fixtures every Murkio
SDK shares (`libs/spec`).

```sh
# in libs/ of the service repository, cloned with --recurse-submodules
npm ci
npm run build
npm test
```
