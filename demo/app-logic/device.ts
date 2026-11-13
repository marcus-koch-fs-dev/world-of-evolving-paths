import type { Orientation } from 'world-of-evolving-paths';

export type DemoDevice = 'desktop' | 'mobile';

/** The demo shows itself inside a phone-sized frame. The page in the frame is told so by this parameter. */
export const EMBED_PARAM = 'embed';

/** Is this page the one inside the phone frame? Then it has no device toggle of its own. */
export const isEmbedded = (search: string): boolean => new URLSearchParams(search).get(EMBED_PARAM) === '1';

/** The address of the page in the frame: this page again, marked as embedded. */
export function embeddedUrl(pathname: string): string {
  return `${pathname}?${EMBED_PARAM}=1`;
}

/** How time runs on the phone: bottom to top while it is held upright, left to right when it lies on its side. */
export function phoneOrientation(size: { width: number; height: number }): Orientation {
  return size.height > size.width ? 'vertical-inverted' : 'horizontal';
}

/**
 * Which set of settings the page uses. The phone (a narrow page, or the page in the phone frame) keeps its own, so
 * what is set up for the desktop does not change the phone, and the other way round.
 */
export const profileOf = (embedded: boolean, narrow: boolean): DemoDevice =>
  embedded || narrow ? 'mobile' : 'desktop';

/** The key a setting is stored under. The desktop keeps the plain keys, the phone has its own. */
export const settingKey = (profile: DemoDevice, name: string): string =>
  profile === 'mobile' ? `wep-demo:mobile:${name}` : `wep-demo:${name}`;

export const otherDevice = (device: DemoDevice): DemoDevice => (device === 'desktop' ? 'mobile' : 'desktop');
