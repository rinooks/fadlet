'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useDemoGuard } from '@/lib/hooks/use-demo-guard';
import { ArrowDown, ArrowUp, BarChart3, Plus, Trash2, X, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useStages } from '@/lib/hooks/use-stages';
import { useAnnouncement } from '@/lib/hooks/use-announcement';
import { useBannedWords } from '@/lib/hooks/use-banned-words';
import { SkinSelector } from '@/components/board/skin-selector';
import { BackgroundSelector } from '@/components/board/background-selector';
import { KanbanColumnEditor } from '@/components/board/kanban-column-editor';
import { TEMPLATES } from '@/lib/templates';
import type { ActivityType, BoardBackground, BoardMode, BoardSkin, BoardTemplate, KanbanColumn, PinnedAnnouncement, Stage } from '@/lib/types';

interface FacilitatorPanelProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  mode: BoardMode;
  stages: Stage[];
  pinnedAnnouncement: PinnedAnnouncement | null | undefined;
  bannedWords: string[] | undefined;
  currentUid: string;
  currentName: string;
  currentSkin: BoardSkin;
  onSkinChange: (skin: BoardSkin) => Promise<void>;
  currentBackground: BoardBackground;
  customBackgroundColor?: string;
  onBackgroundChange: (bg: BoardBackground) => Promise<void>;
  onCustomBackgroundColorChange: (color: string) => Promise<void>;
  boardTemplate: BoardTemplate;
  kanbanColumns?: KanbanColumn[];
  onKanbanColumnsChange: (columns: KanbanColumn[]) => Promise<void>;
  showReactionCounts: boolean;
  onToggleReactionCounts: (visible: boolean) => Promise<void>;
  isHostUser: boolean;
  isDemo?: boolean;
}

export function FacilitatorPanel({
  open,
  onClose,
  boardId,
  mode,
  stages,
  pinnedAnnouncement,
  bannedWords,
  currentUid,
  currentName,
  currentSkin,
  onSkinChange,
  currentBackground,
  customBackgroundColor,
  onBackgroundChange,
  onCustomBackgroundColorChange,
  boardTemplate,
  kanbanColumns,
  onKanbanColumnsChange,
  showReactionCounts,
  onToggleReactionCounts,
  isHostUser,
  isDemo = false,
}: FacilitatorPanelProps) {
  const { addStage, updateStage, removeStage, moveStage } = useStages(boardId);
  const { guard: demoGuard } = useDemoGuard(isDemo);
  const { pinAnnouncement, unpinAnnouncement } = useAnnouncement(boardId);
  const { addWord, removeWord } = useBannedWords(boardId, bannedWords);

  const isWorkshop = mode === 'workshop';
  const [newTitle, setNewTitle] = useState('');
  const [newMinutes, setNewMinutes] = useState('5');
  const [newActivity, setNewActivity] = useState<ActivityType>('brainstorming');
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptionsText, setNewPollOptionsText] = useState('');
  const [newWcPrompt, setNewWcPrompt] = useState('');
  const [newWcMaxLen, setNewWcMaxLen] = useState('20');
  const [newQnaPrompt, setNewQnaPrompt] = useState('');
  const [announcementDraft, setAnnouncementDraft] = useState(pinnedAnnouncement?.content ?? '');
  const [newWord, setNewWord] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const sorted = [...stages].sort((a, b) => a.order - b.order);

  async function handleAddStage() {
    const minutes = Number(newMinutes);
    if (Number.isNaN(minutes) || minutes < 0) return;
    let activityConfig;
    if (isWorkshop && newActivity === 'poll') {
      const opts = newPollOptionsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!newPollQuestion.trim() || opts.length < 2) return;
      activityConfig = { poll: { question: newPollQuestion.trim(), options: opts } };
    } else if (isWorkshop && newActivity === 'wordcloud') {
      if (!newWcPrompt.trim()) return;
      const maxLen = Number(newWcMaxLen);
      activityConfig = {
        wordcloud: {
          prompt: newWcPrompt.trim(),
          maxLength: Number.isFinite(maxLen) && maxLen > 0 ? Math.floor(maxLen) : 20,
        },
      };
    } else if (isWorkshop && newActivity === 'qna') {
      if (!newQnaPrompt.trim()) return;
      activityConfig = { qna: { prompt: newQnaPrompt.trim() } };
    }
    setBusy(true);
    try {
      await addStage(
        stages,
        newTitle,
        Math.floor(minutes * 60),
        isWorkshop ? newActivity : undefined,
        activityConfig,
      );
      setNewTitle('');
      setNewMinutes('5');
      setNewPollQuestion('');
      setNewPollOptionsText('');
      setNewWcPrompt('');
      setNewWcMaxLen('20');
      setNewQnaPrompt('');
    } finally {
      setBusy(false);
    }
  }

  async function handlePin() {
    if (!announcementDraft.trim()) return;
    setBusy(true);
    try {
      await pinAnnouncement(announcementDraft, currentUid, currentName);
    } finally {
      setBusy(false);
    }
  }

  async function handleUnpin() {
    setBusy(true);
    try {
      await unpinAnnouncement();
      setAnnouncementDraft('');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddWord() {
    if (!newWord.trim()) return;
    setBusy(true);
    try {
      await addWord(newWord);
      setNewWord('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="운영자 패널"
        className="w-full max-w-md bg-white shadow-xl flex flex-col h-full overflow-hidden"
      >
        <header className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">운영자 패널</h2>
            <p className="text-xs text-gray-500">단계 관리·공지를 설정합니다.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-700 p-1 focus-visible:outline focus-visible:outline-2"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 분석 바로가기 */}
          <Link
            href={`/boards/${boardId}/analytics`}
            target="_blank"
            className="flex items-center justify-between gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-4 py-3 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <BarChart3 size={14} />
              분석 대시보드
            </span>
            <span className="text-[11px] text-indigo-600">참여도·활동량 보기 →</span>
          </Link>

          {/* 스킨 변경 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">🎨 보드 스킨</h3>
            <SkinSelector
              value={currentSkin}
              onChange={async (skin) => { await onSkinChange(skin); }}
            />
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">🖼️ 보드 배경</h3>
            <BackgroundSelector
              value={currentBackground}
              customColor={customBackgroundColor}
              onChange={async (bg) => { await onBackgroundChange(bg); }}
              onCustomColorChange={async (color) => { await onCustomBackgroundColorChange(color); }}
            />
          </section>

          {boardTemplate === 'kanban' && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">🗂️ 칸반 컬럼</h3>
              <p className="text-xs text-gray-500 mb-3">
                컬럼을 자유롭게 추가/편집/삭제하고 색상을 지정합니다.
              </p>
              <KanbanColumnEditor
                columns={kanbanColumns}
                onChange={onKanbanColumnsChange}
              />
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">👍 포스트 표시 옵션</h3>
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={showReactionCounts}
                onChange={async (e) => {
                  if (demoGuard()) return;
                  await onToggleReactionCounts(e.target.checked);
                }}
                className="mt-0.5 h-4 w-4 accent-indigo-600"
              />
              <span className="flex-1">
                <span className="block text-sm font-medium text-gray-900">참여자에게 반응 수 표시</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  꺼두면 참여자에게 좋아요·이모지 카운트가 숨겨집니다. 운영자에게는 항상 표시됩니다.
                </span>
              </span>
            </label>
          </section>

          {/* 단계 관리·공지·키워드 — 호스트(보드 소유자)만 */}
          {isHostUser && (<><section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {isWorkshop ? '🎬 워크숍 단계' : '📍 워크숍 단계'}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {isWorkshop
                ? '단계마다 활동이 자동 전환됩니다. 시작 시 타이머가 부여됩니다.'
                : '참여자에게 현재 단계와 남은 시간이 표시됩니다.'}
            </p>

            {sorted.length === 0 && (
              <p className="text-xs text-gray-400 mb-3 py-3 text-center bg-gray-50 rounded-md">
                등록된 단계가 없습니다.
              </p>
            )}

            <ul className="space-y-2 mb-4">
              {sorted.map((stage, idx) => (
                <StageRow
                  key={stage.id}
                  stage={stage}
                  index={idx}
                  total={sorted.length}
                  busy={busy}
                  isWorkshop={isWorkshop}
                  onUpdate={async (patch) => {
                    setBusy(true);
                    try { await updateStage(stages, stage.id, patch); } finally { setBusy(false); }
                  }}
                  onMove={async (dir) => {
                    setBusy(true);
                    try { await moveStage(stages, stage.id, dir); } finally { setBusy(false); }
                  }}
                  onRemove={async () => {
                    setBusy(true);
                    try { await removeStage(stages, stage.id); } finally { setBusy(false); }
                  }}
                />
              ))}
            </ul>

            <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-md">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">단계 제목</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="예: 아이스브레이킹"
                    className="text-sm h-8"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">분</label>
                  <Input
                    type="number"
                    min={0}
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(e.target.value)}
                    className="text-sm h-8"
                  />
                </div>
                <Button
                  onClick={demoGuard(handleAddStage, '단계 추가')}
                  disabled={busy}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-8"
                >
                  <Plus size={14} />
                </Button>
              </div>
              {isWorkshop && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">활동 종류</label>
                  <select
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value as ActivityType)}
                    className="w-full h-8 px-2 rounded-md border border-gray-200 text-sm bg-white focus:outline-none focus:border-indigo-400"
                  >
                    <optgroup label="보드형">
                      {TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.emoji} {t.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="라이브">
                      <option value="poll">📊 라이브 폴</option>
                      <option value="wordcloud">☁️ 워드클라우드</option>
                      <option value="qna">❓ 라이브 Q&amp;A</option>
                    </optgroup>
                  </select>
                </div>
              )}
              {isWorkshop && newActivity === 'poll' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">폴 질문</label>
                    <Input
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                      placeholder="예: 최우선으로 추진할 안건은?"
                      className="text-sm h-8"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">옵션 (한 줄에 하나, 최소 2개)</label>
                    <Textarea
                      value={newPollOptionsText}
                      onChange={(e) => setNewPollOptionsText(e.target.value)}
                      rows={4}
                      placeholder={'A안\nB안\nC안'}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
              {isWorkshop && newActivity === 'wordcloud' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">프롬프트</label>
                    <Input
                      value={newWcPrompt}
                      onChange={(e) => setNewWcPrompt(e.target.value)}
                      placeholder="예: 오늘 워크숍을 한 단어로"
                      className="text-sm h-8"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">입력 최대 길이 (자)</label>
                    <Input
                      type="number"
                      min={5}
                      max={50}
                      value={newWcMaxLen}
                      onChange={(e) => setNewWcMaxLen(e.target.value)}
                      className="text-sm h-8 w-24"
                    />
                  </div>
                </div>
              )}
              {isWorkshop && newActivity === 'qna' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Q&amp;A 안내</label>
                    <Input
                      value={newQnaPrompt}
                      onChange={(e) => setNewQnaPrompt(e.target.value)}
                      placeholder="예: 오늘 발표에 대해 궁금한 점을 자유롭게 질문해 주세요"
                      className="text-sm h-8"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 공지 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">📢 채팅 공지</h3>
            <p className="text-xs text-gray-500 mb-3">고정된 공지는 채팅 상단에 항상 표시됩니다.</p>

            <Textarea
              value={announcementDraft}
              onChange={(e) => setAnnouncementDraft(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="예: 10분 후 발표 시작합니다. 카메라를 켜주세요."
              className="text-sm mb-2"
            />

            <div className="flex gap-2">
              <Button
                onClick={handlePin}
                disabled={busy || !announcementDraft.trim()}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1"
              >
                <Pin size={14} />
                <span className="ml-1">{pinnedAnnouncement ? '공지 갱신' : '공지 고정'}</span>
              </Button>
              {pinnedAnnouncement && (
                <Button
                  onClick={handleUnpin}
                  disabled={busy}
                  variant="outline"
                  size="sm"
                >
                  <PinOff size={14} />
                  <span className="ml-1">해제</span>
                </Button>
              )}
            </div>
          </section>

          {/* 부적절 키워드 필터 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">🚫 부적절 키워드 필터</h3>
            <p className="text-xs text-gray-500 mb-3">
              등록된 키워드가 포함된 메시지·포스트는 작성이 차단됩니다. 대소문자 구분 없음.
            </p>

            {(bannedWords?.length ?? 0) === 0 && (
              <p className="text-xs text-gray-400 mb-3 py-3 text-center bg-gray-50 rounded-md">
                등록된 키워드가 없습니다.
              </p>
            )}

            {bannedWords && bannedWords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {bannedWords.map((w) => (
                  <span
                    key={w}
                    className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5"
                  >
                    {w}
                    <button
                      type="button"
                      onClick={() => removeWord(w)}
                      disabled={busy}
                      className="hover:text-red-900 disabled:opacity-30"
                      aria-label={`키워드 ${w} 제거`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddWord(); } }}
                placeholder="차단할 단어 입력"
                maxLength={40}
                className="text-sm h-8 flex-1"
              />
              <Button
                onClick={handleAddWord}
                disabled={busy || !newWord.trim()}
                size="sm"
                variant="outline"
                className="h-8"
              >
                <Plus size={14} />
              </Button>
            </div>
          </section>
          </>)}
        </div>
      </aside>
    </div>
  );
}

interface StageRowProps {
  stage: Stage;
  index: number;
  total: number;
  busy: boolean;
  isWorkshop: boolean;
  onUpdate: (patch: Partial<Pick<Stage, 'title' | 'durationSec' | 'activityType'>>) => Promise<void>;
  onMove: (direction: -1 | 1) => Promise<void>;
  onRemove: () => Promise<void>;
}

function StageRow({ stage, index, total, busy, isWorkshop, onUpdate, onMove, onRemove }: StageRowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(stage.title);
  const [minutes, setMinutes] = useState(String(Math.round(stage.durationSec / 60)));
  const [activity, setActivity] = useState<ActivityType>(stage.activityType ?? 'brainstorming');

  const stageTemplate = stage.activityType ? TEMPLATES.find((t) => t.id === stage.activityType) : null;

  async function save() {
    const m = Number(minutes);
    if (Number.isNaN(m) || m < 0) return;
    await onUpdate({
      title: title.trim() || stage.title,
      durationSec: Math.floor(m * 60),
      ...(isWorkshop ? { activityType: activity } : {}),
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="flex flex-col gap-2 p-2 bg-indigo-50 rounded-md border border-indigo-200">
        <div className="flex gap-2 items-center">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm h-8 flex-1" />
          <Input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="text-sm h-8 w-16"
          />
          <Button onClick={save} disabled={busy} size="sm" className="h-7 bg-indigo-600 hover:bg-indigo-700 text-white text-xs">저장</Button>
          <button
            onClick={() => { setTitle(stage.title); setMinutes(String(Math.round(stage.durationSec / 60))); setActivity(stage.activityType ?? 'brainstorming'); setEditing(false); }}
            className="text-xs text-gray-500 hover:text-gray-800 px-1"
          >
            취소
          </button>
        </div>
        {isWorkshop && (
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityType)}
            className="w-full h-8 px-2 rounded-md border border-indigo-200 text-sm bg-white focus:outline-none focus:border-indigo-400"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.label}
              </option>
            ))}
          </select>
        )}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-md group">
      <span className="text-[11px] font-bold text-gray-400 w-6 text-center flex-shrink-0">{index + 1}</span>
      <button
        onClick={() => setEditing(true)}
        className="flex-1 text-left text-sm text-gray-900 truncate hover:underline focus-visible:outline focus-visible:outline-2 rounded"
      >
        {stageTemplate && <span className="mr-1">{stageTemplate.emoji}</span>}
        {stage.title}
      </button>
      <span className="text-xs text-gray-500 flex-shrink-0">{Math.round(stage.durationSec / 60)}분</span>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => onMove(-1)}
          disabled={busy || index === 0}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 p-1"
          aria-label="위로"
        >
          <ArrowUp size={12} />
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={busy || index === total - 1}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 p-1"
          aria-label="아래로"
        >
          <ArrowDown size={12} />
        </button>
        <button
          onClick={onRemove}
          disabled={busy}
          className="text-gray-400 hover:text-red-500 p-1"
          aria-label="삭제"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </li>
  );
}
