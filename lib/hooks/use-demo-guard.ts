'use client';

import { toast } from 'sonner';

export function useDemoGuard(isDemo: boolean) {
  function guard<T extends unknown[]>(fn: (...args: T) => void, featureName?: string) {
    return (...args: T) => {
      if (isDemo) {
        toast.warning(
          featureName
            ? `"${featureName}"은 데모 모드에서 지원되지 않습니다.`
            : '데모 모드에서는 지원되지 않는 기능입니다.',
          {
            description: '정식 운영자로 전환하면 모든 기능을 사용할 수 있습니다.',
            action: {
              label: '정식 시작하기',
              onClick: () => { window.location.href = '/dashboard'; },
            },
            duration: 4000,
          },
        );
        return;
      }
      fn(...args);
    };
  }

  return { guard };
}
