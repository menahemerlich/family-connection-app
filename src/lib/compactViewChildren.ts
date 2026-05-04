import { Children, type ReactNode } from 'react';

/** Strips whitespace-only strings so RN Web won't treat them as invalid <View> children. */
export function compactViewChildren(children: ReactNode): ReactNode {
  return Children.toArray(children).filter(
    (child) => typeof child !== 'string' || child.trim() !== '',
  );
}
