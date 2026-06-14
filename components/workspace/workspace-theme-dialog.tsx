'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DEFAULT_WORKSPACE_THEME_ID,
  WORKSPACE_THEMES,
  customColorGradient,
  isCustomColor,
  workspaceThemeGradient,
} from '@/lib/workspace-themes';

interface WorkspaceThemeDialogProps {
  open: boolean;
  /** 현재 적용된 테마 키 */
  initialThemeId?: string;
  onClose: () => void;
  onSubmit: (themeId: string) => Promise<void> | void;
}

export function WorkspaceThemeDialog({
  open,
  initialThemeId,
  onClose,
  onSubmit,
}: WorkspaceThemeDialogProps) {
  const [selected, setSelected] = useState(initialThemeId ?? DEFAULT_WORKSPACE_THEME_ID);
  // 컬러 피커에 보여줄 커스텀 HEX. 프리셋 선택 중에도 마지막 커스텀 값을 기억한다.
  const [customHex, setCustomHex] = useState(
    isCustomColor(initialThemeId) ? initialThemeId : '#2563eb',
  );
  const [busy, setBusy] = useState(false);

  // 다이얼로그가 열릴 때 현재 테마로 동기화. 의도된 setState in effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setSelected(initialThemeId ?? DEFAULT_WORKSPACE_THEME_ID);
      if (isCustomColor(initialThemeId)) setCustomHex(initialThemeId);
      setBusy(false);
    }
  }, [open, initialThemeId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const customActive = isCustomColor(selected);

  async function handleSave() {
    if (busy) return;
    const current = initialThemeId ?? DEFAULT_WORKSPACE_THEME_ID;
    if (selected === current) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      await onSubmit(selected);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>밴드 색상 변경</DialogTitle>
          <DialogDescription>
            워크스페이스 제목 위에 표시되는 색깔 띠의 테마를 선택하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 py-1">
          {WORKSPACE_THEMES.map((theme) => {
            const isActive = selected === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelected(theme.id)}
                className={`relative flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition-colors ${
                  isActive ? 'ring-2 ring-indigo-500 ring-offset-1' : 'hover:bg-gray-50'
                }`}
                aria-pressed={isActive}
                aria-label={`${theme.label} 테마`}
              >
                <span
                  className="flex h-10 w-full items-center justify-center rounded-md"
                  style={{ background: workspaceThemeGradient(theme) }}
                >
                  {isActive && <Check size={18} className="text-white" strokeWidth={3} />}
                </span>
                <span className="text-xs font-medium text-gray-700">{theme.label}</span>
              </button>
            );
          })}
        </div>

        {/* 직접 색상 지정 */}
        <div
          className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${
            customActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'
          }`}
        >
          <span
            className="h-10 w-10 flex-shrink-0 rounded-md"
            style={{ background: customColorGradient(customHex) }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700">직접 색상 지정</p>
            <p className="text-xs text-gray-400">원하는 색을 골라 띠 색상을 만들 수 있어요.</p>
          </div>
          <label className="flex-shrink-0 cursor-pointer" title="색상 선택">
            <span className="sr-only">색상 선택</span>
            <input
              type="color"
              value={customHex}
              onChange={(e) => {
                const v = e.target.value;
                setCustomHex(v);
                setSelected(v);
              }}
              className="h-9 w-12 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
            />
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {busy ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
