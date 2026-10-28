import type { IFocusTarget } from '../components';

export function focusMovie(target: IFocusTarget | null | undefined) {
  if (!target) {
    return;
  }
  if (typeof target.requestTVFocus === 'function') {
    target.requestTVFocus();
    return;
  }
  target.setNativeProps?.({ hasTVPreferredFocus: true });
}
