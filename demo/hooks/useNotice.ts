import { useCallback, useState } from 'react';

export type NoticeAction = { label: string; onClick: () => void };
type Notice = { text: string; action?: NoticeAction };

/** The message the toast shows, with an optional button. A new message replaces the old one, button included. */
export function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);

  const show = useCallback((text: string, action?: NoticeAction) => setNotice({ text, action }), []);
  const clear = useCallback(() => setNotice(null), []);
  /** For code that only knows plain messages: `null` clears. */
  const set = useCallback((text: string | null) => setNotice(text === null ? null : { text }), []);

  return { text: notice?.text ?? null, action: notice?.action, show, clear, set };
}
