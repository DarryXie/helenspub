import type { PropsWithChildren } from 'react';

export function PlaceholderCard({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        border: '1px solid rgba(15, 23, 42, 0.12)',
        borderRadius: 16,
        padding: 16,
        background: '#ffffff',
      }}
    >
      {children}
    </div>
  );
}
