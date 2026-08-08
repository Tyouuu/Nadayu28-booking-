'use client';

import { useRouter } from 'next/navigation';

export function useAppNavigate() {
  const router = useRouter();
  return (view: string) => router.push(`/${view}`);
}
