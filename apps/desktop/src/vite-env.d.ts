/// <reference types="vite/client" />

export type OsBridge = {
  toggleSheet: () => Promise<{ ok: boolean }>;
  openDesktop: (loopId?: string | null) => Promise<{ ok: boolean }>;
  undock: () => Promise<{ ok: boolean }>;
  closeSheet: () => Promise<{ ok: boolean }>;
  /** Tell the float that Approve just closed a context. */
  contextClosed?: () => Promise<{ ok: boolean }>;
  onContextClosed?: (cb: () => void) => () => void;
  stubAction: (action: string) => Promise<{ ok: boolean; action: string; stub: boolean }>;
  openExternal: (url: string) => Promise<{ ok: boolean; error?: string }>;
  ambientSample: () => Promise<{
    ok: boolean;
    idleSeconds: number;
    app: string;
    title: string | null;
    url: string | null;
  }>;
  episodicContext?: () => Promise<{
    ok: boolean;
    app: string;
    title: string | null;
    text: string | null;
    axTrusted?: boolean;
  }>;
  clipContext: () => Promise<{
    ok: boolean;
    idleSeconds: number;
    app: string;
    title: string;
    summary: string;
  }>;
  onClipHotkey: (cb: () => void) => () => void;
  onVoiceTranscript?: (cb: (text: string) => void) => () => void;
  voiceResult?: (result: { ok: boolean; message: string }) => Promise<{ ok: boolean }>;
  platform: string;
};

declare global {
  interface Window {
    juvantageOs?: OsBridge;
  }
}

export {};
