const AUTH_CHANNEL = 'kanban-auth';

type AuthMessage = { type: 'logout' } | { type: 'token'; token: string };

const channel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(AUTH_CHANNEL) : null;

export const broadcastLogout = () => channel?.postMessage({ type: 'logout' } satisfies AuthMessage);

export const broadcastToken = (token: string) =>
  channel?.postMessage({ type: 'token', token } satisfies AuthMessage);

export const subscribeAuth = (handler: (msg: AuthMessage) => void) => {
  if (!channel) return () => {};
  const listener = (e: MessageEvent<AuthMessage>) => handler(e.data);
  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
};
