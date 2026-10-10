import { defineElements, init, type AccessClaims, type Me, type Murkio, type MurkioError, type MurkioOptions } from '@murkio/html';

type Subscriber<T> = (value: T) => void;

export interface Readable<T> {
  subscribe(run: Subscriber<T>): () => void;
}

/**
 * A minimal readable store (the Svelte store contract is only `subscribe`), so
 * the package works with Svelte 4 and 5 without depending on its runtime.
 */
function readable<T>(initial: T, start: (set: (value: T) => void) => () => void): Readable<T> {
  let value = initial;
  let stop: (() => void) | null = null;
  const subscribers = new Set<Subscriber<T>>();
  const set = (next: T) => {
    value = next;
    for (const run of subscribers) run(value);
  };
  return {
    subscribe(run) {
      subscribers.add(run);
      if (subscribers.size === 1) stop = start(set);
      run(value);
      return () => {
        subscribers.delete(run);
        if (subscribers.size === 0) {
          stop?.();
          stop = null;
        }
      };
    },
  };
}

let client: Murkio | null = null;
const ready = new Set<() => void>();

/**
 * Creates the page's client in the browser and registers the elements. Call
 * it once, in the root layout (`onMount` or `+layout.svelte`); on the server
 * it does nothing and returns null.
 */
export function initMurkio(options: MurkioOptions): Murkio | null {
  if (typeof window === 'undefined') return null;
  defineElements();
  client = init(options);
  for (const notify of ready) notify();
  return client;
}

export function getClient(): Murkio | null {
  return client;
}

export interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  claims: AccessClaims | null;
}

function onClient(callback: (murkio: Murkio) => () => void): () => void {
  if (client) return callback(client);
  let stop: (() => void) | null = null;
  const notify = () => {
    ready.delete(notify);
    if (client) stop = callback(client);
  };
  ready.add(notify);
  return () => {
    ready.delete(notify);
    stop?.();
  };
}

/** `$auth`: `{ isLoaded, isSignedIn, claims }`, following the session in every tab. */
export const auth: Readable<AuthState> = readable<AuthState>({ isLoaded: false, isSignedIn: false, claims: null }, (set) =>
  onClient((murkio) => murkio.onAuthChange((claims) => set({ isLoaded: true, isSignedIn: claims !== null, claims }))),
);

/** `$user`: the signed-in user's profile (POST /v1/me), or null. */
export const user: Readable<Me | null> = readable<Me | null>(null, (set) =>
  onClient((murkio) =>
    murkio.onAuthChange((claims) => {
      if (!claims) return set(null);
      murkio.getUser().then(set, () => set(null));
    }),
  ),
);

export interface MurkioEvents {
  onLogin?: () => void;
  onError?: (error: MurkioError) => void;
  onStep?: (step: string) => void;
}

/**
 * `<murkio-identity-canvas use:murkioEvents={{ onLogin, onError }} />`: the
 * murkio-* DOM events as callbacks, the same in Svelte 4 and 5. (Svelte 5 can
 * also bind them directly: `onmurkio-login={...}`.)
 */
export function murkioEvents(node: HTMLElement, handlers: MurkioEvents = {}) {
  let current = handlers;
  const login = () => current.onLogin?.();
  const error = (event: Event) => current.onError?.((event as CustomEvent<MurkioError>).detail);
  const step = (event: Event) => current.onStep?.((event as CustomEvent<{ step: string }>).detail.step);
  node.addEventListener('murkio-login', login);
  node.addEventListener('murkio-error', error);
  node.addEventListener('murkio-step', step);
  return {
    update(next: MurkioEvents) {
      current = next;
    },
    destroy() {
      node.removeEventListener('murkio-login', login);
      node.removeEventListener('murkio-error', error);
      node.removeEventListener('murkio-step', step);
    },
  };
}

export const signOut = () => client?.signOut() ?? Promise.resolve();
export const getToken = () => client?.getToken() ?? Promise.resolve(null);

export { MurkioError, translate } from '@murkio/html';
export type { AccessClaims, Me, MurkioOptions } from '@murkio/html';
