'use client';

import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_PROFILE_PROMPT_THRESHOLD,
  saveProfilePromptThreshold,
  useAppSettings,
} from '@/lib/firebase/settings';

interface Props {
  uid: string;
}

const THRESHOLD_OPTIONS = [
  { value: 0, label: '사용 안 함' },
  { value: 1, label: '1번째 보드부터 (즉시)' },
  { value: 2, label: '2번째 보드부터' },
  { value: 3, label: '3번째 보드부터 (권장)' },
  { value: 5, label: '5번째 보드부터' },
  { value: 7, label: '7번째 보드부터' },
  { value: 10, label: '10번째 보드부터' },
];

export function SiteSettingsCard({ uid }: Props) {
  const { settings, loading } = useAppSettings();
  const [value, setValue] = useState<number>(DEFAULT_PROFILE_PROMPT_THRESHOLD);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (loading) return;
    const next = settings?.profilePromptThresholdBoards ?? DEFAULT_PROFILE_PROMPT_THRESHOLD;
    setValue(next);
    setDirty(false);
  }, [loading, settings?.profilePromptThresholdBoards]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveProfilePromptThreshold({ uid, threshold: value });
      toast.success('프로필 임계치를 저장했습니다.');
      setDirty(false);
    } catch (err) {
      console.error('[site-settings] save failed', err);
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  function handleChange(next: number) {
    setValue(next);
    setDirty(next !== (settings?.profilePromptThresholdBoards ?? DEFAULT_PROFILE_PROMPT_THRESHOLD));
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Settings2 size={16} className="text-indigo-600" />
        <h2 className="text-base font-bold text-gray-900">사이트 설정</h2>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          프로필 완성 모달 노출 시점
        </label>
        <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
          퍼실리테이터가 본인 보드를 N개 이상 만들었을 때 프로필 완성 모달을 1회 띄웁니다.
          가치 경험 후 요청해 이탈률을 낮추려는 패턴입니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
            disabled={loading || saving}
            className="h-9 px-3 rounded-md border border-gray-200 text-sm bg-white focus:outline-none focus:border-indigo-400 flex-1"
          >
            {THRESHOLD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || saving || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 sm:w-24"
          >
            {saving ? '저장 중…' : '저장'}
          </Button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          현재 값: <span className="font-mono">{settings?.profilePromptThresholdBoards ?? DEFAULT_PROFILE_PROMPT_THRESHOLD}</span>
          {' '}
          (기본 {DEFAULT_PROFILE_PROMPT_THRESHOLD} · 0이면 비활성)
        </p>
      </div>
    </div>
  );
}
