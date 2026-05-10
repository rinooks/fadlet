'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const { settings, loading } = useAppSettings();
  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState<string>(DEFAULT_GEMINI_MODEL);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.geminiModel) setModel(settings.geminiModel);
  }, [settings?.geminiModel]);

  const hasKey = !!settings?.geminiApiKey;
  const masked = hasKey ? '●'.repeat(8) + ` (${settings!.geminiApiKey!.length}자)` : '설정되지 않음';

  async function handleSave() {
    if (!apiKey.trim()) {
      toast.error('API 키를 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      await saveGeminiSettings({ uid, apiKey: apiKey.trim(), model });
      toast.success('Gemini 설정을 저장했습니다.');
      setEditing(false);
      setApiKey('');
      setShow(false);
    } catch (err) {
      console.error('[ai-settings] save failed', err);
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (!confirm('저장된 Gemini API 키를 삭제하시겠습니까?')) return;
    setSaving(true);
    try {
      await saveGeminiSettings({ uid, apiKey: '' });
      toast.success('키를 삭제했습니다.');
    } catch (err) {
      console.error('[ai-settings] clear failed', err);
      toast.error('삭제에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleModelChange(next: string) {
    setModel(next);
    try {
      await saveGeminiSettings({ uid, model: next });
      toast.success('모델을 변경했습니다.');
    } catch {
      toast.error('변경 실패');
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-indigo-600" />
        <h2 className="text-base font-bold text-gray-900">AI 설정 (Gemini)</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        워크숍 종료 후 AI 인사이트 카드 생성에 사용됩니다.
        키는 Firestore에 저장되며 <strong>승인된 퍼실리테이터</strong>가 읽어 직접 호출합니다 — 노출 위험을 최소화하려면 Google Cloud에서 사용량 한도와 회전 주기를 설정하세요.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end mb-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Gemini API 키
          </label>
          {!editing ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-10 px-3 rounded-md border border-gray-200 bg-gray-50 font-mono text-sm text-gray-700 flex items-center">
                {loading ? '불러오는 중…' : masked}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditing(true); setApiKey(''); }}
                className="text-xs h-9"
              >
                {hasKey ? '변경' : '입력'}
              </Button>
              {hasKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={saving}
                  className="text-xs h-9 text-red-600 border-red-200 hover:bg-red-50"
                >
                  지우기
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={show ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="font-mono text-sm pr-9"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label={show ? '숨기기' : '표시'}
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !apiKey.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
              >
                저장
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditing(false); setApiKey(''); setShow(false); }}
                className="text-xs h-9"
              >
                취소
              </Button>
            </div>
          )}
        </div>
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
