'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_GEMINI_MODEL, saveGeminiSettings, useAppSettings } from '@/lib/firebase/settings';

interface Props {
  uid: string;
}

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (빠름·저렴)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (정확·느림)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
];

export function AiSettingsCard({ uid }: Props) {
  const { settings } = useAppSettings();
  const [model, setModel] = useState<string>(DEFAULT_GEMINI_MODEL);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.geminiModel) setModel(settings.geminiModel);
  }, [settings?.geminiModel]);

  async function handleModelChange(next: string) {
    setModel(next);
    setSaving(true);
    try {
      await saveGeminiSettings({ uid, model: next });
      toast.success('모델을 변경했습니다.');
    } catch {
      toast.error('변경 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-indigo-600" />
        <h2 className="text-base font-bold text-gray-900">AI 설정 (Gemini)</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        워크숍 종료 후 AI 인사이트 카드 생성에 사용됩니다. 호출은 서버에서만 이뤄지며 키가 브라우저에 노출되지 않습니다.
      </p>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 mb-4">
        <p className="text-xs text-amber-900 leading-relaxed">
          🔑 <strong>API 키는 서버 환경변수 <code className="font-mono">GEMINI_API_KEY</code></strong>로 설정합니다.
          Vercel 프로젝트의 Environment Variables에 추가한 뒤 재배포하세요. (보안상 키는 더 이상 화면에서 입력/조회하지 않습니다.)
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">모델</label>
        <select
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          disabled={saving}
          className="h-9 px-3 rounded-md border border-gray-200 text-sm bg-white focus:outline-none focus:border-indigo-400"
        >
          {GEMINI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
        🔑 키 발급:{' '}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 hover:underline"
        >
          Google AI Studio
        </a>
        에서 무료로 발급 가능합니다. 결제 없이도 일정 분량 무료 사용 가능.
      </p>
    </div>
  );
}
