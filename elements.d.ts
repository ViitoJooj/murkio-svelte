import type { HTMLAttributes } from 'svelte/elements';

type MurkioEvent<T = unknown> = (event: CustomEvent<T>) => void;

interface FieldAttributes extends HTMLAttributes<HTMLElement> {
  form?: string;
  placeholder?: string;
  label?: string;
  autocomplete?: string;
}

interface ActionAttributes extends HTMLAttributes<HTMLElement> {
  form?: string;
  label?: string;
  'onmurkio-login'?: MurkioEvent;
  'onmurkio-error'?: MurkioEvent<{ code: string }>;
  'onmurkio-step'?: MurkioEvent<{ step: string }>;
}

/**
 * Types for the <murkio-identity-*> tags in Svelte templates. Reference this
 * file once (src/app.d.ts: `/// <reference types="@murkio/svelte/elements" />`).
 */
declare module 'svelte/elements' {
  export interface SvelteHTMLElements {
    'murkio-identity-canvas': ActionAttributes & { screen?: 'sign_in' | 'sign_up'; locale?: string; 'light-dom'?: boolean | '' };
    'murkio-identity-email-input': FieldAttributes;
    'murkio-identity-password-input': FieldAttributes;
    'murkio-identity-keep-logged': FieldAttributes & { checked?: boolean | '' };
    'murkio-identity-login-button': ActionAttributes;
    'murkio-identity-register-button': ActionAttributes;
    'murkio-identity-error': HTMLAttributes<HTMLElement> & { form?: string };
  }
}

export {};
