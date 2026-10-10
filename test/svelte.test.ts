import { reset } from '@murkio/html';
import { afterEach, describe, expect, it } from 'vitest';
import { auth, initMurkio, murkioEvents, type AuthState } from '../src';

const fetch = (async () => new Response('{}', { status: 503 })) as typeof globalThis.fetch;

function jwt(claims: Record<string, unknown>) {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=+$/, '');
  return `${encode({ alg: 'EdDSA' })}.${encode(claims)}.sig`;
}

afterEach(() => {
  localStorage.clear();
  reset();
});

describe('@murkio/svelte', () => {
  it('the auth store waits for the client and follows the session', () => {
    const states: AuthState[] = [];
    const stop = auth.subscribe((state) => states.push(state));
    expect(states.at(-1)).toEqual({ isLoaded: false, isSignedIn: false, claims: null });

    const murkio = initMurkio({ publishableKey: 'pk_svelte', apiUrl: 'https://api.example.com', fetch })!;
    expect(customElements.get('murkio-identity-canvas')).toBeDefined();
    expect(states.at(-1)).toMatchObject({ isLoaded: true, isSignedIn: false });

    murkio.session.setSession(
      { access_token: jwt({ sub: 'u', sid: 's', exp: Math.floor(Date.now() / 1000) + 900, roles: [] }), token_type: 'Bearer', expires_in: 900, refresh_token: 'rt', session_id: 's' },
      true,
    );
    expect(states.at(-1)).toMatchObject({ isLoaded: true, isSignedIn: true });
    stop();
  });

  it('maps the element events with the action', () => {
    const node = document.createElement('murkio-identity-canvas');
    const seen: string[] = [];
    const action = murkioEvents(node, { onLogin: () => seen.push('login'), onStep: (step) => seen.push(step) });
    node.dispatchEvent(new CustomEvent('murkio-login'));
    node.dispatchEvent(new CustomEvent('murkio-step', { detail: { step: 'mfa' } }));
    action.update({ onLogin: () => seen.push('again') });
    node.dispatchEvent(new CustomEvent('murkio-login'));
    action.destroy();
    node.dispatchEvent(new CustomEvent('murkio-login'));
    expect(seen).toEqual(['login', 'mfa', 'again']);
  });
});
