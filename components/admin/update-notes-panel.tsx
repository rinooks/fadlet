'use client';

import { useState } from 'react';
import { Code2, Eye, EyeOff, Megaphone, Pencil, Plus, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createUpdateNote,
  deleteUpdateNote,
  resolveUserBody,
  updateUpdateNote,
  useAllUpdateNotes,
} from '@/lib/firebase/update-notes';
import type { UpdateNote } from '@/lib/types';

interface Props {
  uid: string;
}

type Mode =
  | { kind: 'idle' }
  | { kind: 'creating' }
  | { kind: 'editing'; id: string };

const IDLE: Mode = { kind: 'idle' };

export function UpdateNotesPanel({ uid }: Props) {
  const { notes, loading } = useAllUpdateNotes();
  const [mode, setMode] = useState<Mode>(IDLE);
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [userBody, setUserBody] = useState('');
  const [devBody, setDevBody] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showDevId, setShowDevId] = useState<string | null>(null);

  const isCreating = mode.kind === 'creating';
  const isEditing = mode.kind === 'editing';

  function resetForm() {
    setTitle('');
    setVersion('');
    setUserBody('');
    setDevBody('');
    setIsPublished(true);
  }

  function startCreate() {
    setMode({ kind: 'creating' });
    resetForm();
    setConfirmDelete(null);
  }

  function startEdit(note: UpdateNote) {
    setMode({ kind: 'editing', id: note.id });
    setTitle(note.title);
    setVersion(note.version ?? '');
    setUserBody(resolveUserBody(note));
    setDevBody(note.devBody ?? '');
    setIsPublished(note.isPublished);
    setConfirmDelete(null);
  }

  function cancel() {
    setMode(IDLE);
    resetForm();
  }

  async function handleSave() {
    const trimmedTitle = title.trim();
    const trimmedUserBody = userBody.trim();
    if (!trimmedTitle) {
      toast.error('제목을 입력해 주세요.');
      return;
    }
    if (!trimmedUserBody) {
      toast.error('사용자용 본문을 입력해 주세요.');
      return;
    }
    const fields = {
      title: trimmedTitle,
      userBody: trimmedUserBody,
      devBody,
      version,
      isPublished,
    };
    setSaving(true);
    try {
      if (mode.kind === 'creating') {
        await createUpdateNote({ uid, ...fields });
        toast.success(isPublished ? '업데이트 노트를 게시했습니다.' : '초안으로 저장했습니다.');
      } else if (mode.kind === 'editing') {
        await updateUpdateNote(mode.id, fields);
        toast.success('업데이트 노트를 수정했습니다.');
      }
      cancel();
    } catch (err) {
      console.error('[update-notes-panel] save failed', err);
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(note: UpdateNote) {
    try {
      await updateUpdateNote(note.id, { isPublished: !note.isPublished });
      toast.success(note.isPublished ? '비공개로 전환했습니다.' : '게시했습니다.');
    } catch (err) {
      console.error('[update-notes-panel] toggle publish failed', err);
      toast.error('상태 변경에 실패했습니다.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteUpdateNote(id);
      toast.success('삭제했습니다.');
      setConfirmDelete(null);
    } catch (err) {
      console.error('[update-notes-panel] delete failed', err);
      toast.error('삭제에 실패했습니다.');
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Megaphone size={16} className="text-indigo-600" />
          <h2 className="text-base font-bold text-gray-900">업데이트 노트</h2>
          <span className="text-[11px] text-gray-400">총 {notes.length}</span>
        </div>
        {mode.kind === 'idle' && (
          <Button
            size="sm"
            onClick={startCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 flex items-center gap-1"
          >
            <Plus size={12} /> 새 노트
          </Button>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
        <strong className="text-gray-700">사용자용</strong> 본문은 랜딩 페이지와 <span className="font-mono">/updates</span>에 노출됩니다.{' '}
        <strong className="text-gray-700">개발자용</strong> 본문은 관리자에게만 보이는 기술 메모입니다.
      </p>

      {(isCreating || isEditing) && (
        <div className="border border-indigo-200 bg-indigo-50/40 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 칸반 컬럼 편집 UX 개선"
                maxLength={80}
                className="text-sm h-9"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">버전 (선택)</label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v0.6.0"
                maxLength={20}
                className="text-sm h-9 font-mono"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 mb-1">
              <User size={11} /> 사용자용 본문 <span className="text-red-500">*</span>
              <span className="ml-1 text-[10px] text-emerald-600 font-normal">(프론트 노출)</span>
            </label>
            <textarea
              value={userBody}
              onChange={(e) => setUserBody(e.target.value)}
              placeholder="- 칸반 보드에서 컬럼 이름과 색상을 바로 바꿀 수 있어요&#10;- 카테고리 템플릿이 더 깔끔하게 정리됩니다"
              maxLength={1000}
              rows={4}
              className="w-full text-sm border border-emerald-200 bg-white rounded-md px-3 py-2 focus:outline-none focus:border-emerald-400 leading-relaxed"
            />
            <p className="text-[10px] text-gray-400 mt-0.5 text-right">{userBody.length} / 1000</p>
          </div>

          <div className="mb-3">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 mb-1">
              <Code2 size={11} /> 개발자용 본문 <span className="text-gray-400 font-normal">(선택 · 관리자만)</span>
            </label>
            <textarea
              value={devBody}
              onChange={(e) => setDevBody(e.target.value)}
              placeholder="- KanbanColumnEditor 인라인화&#10;- categories 템플릿 row layout 개선 (lib/templates.ts)"
              maxLength={1500}
              rows={4}
              className="w-full text-sm border border-gray-200 bg-gray-50 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400 leading-relaxed font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-0.5 text-right">{devBody.length} / 1500</p>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded"
              />
              바로 게시하기
            </label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={cancel} disabled={saving} className="text-xs h-8">
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
              >
                {saving ? '저장 중…' : isCreating ? '저장' : '수정 저장'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-8">불러오는 중...</p>
      ) : notes.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center">
          <Megaphone size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">아직 작성한 업데이트 노트가 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => {
            const isConfirming = confirmDelete === note.id;
            const userBodyText = resolveUserBody(note);
            const hasDev = !!note.devBody?.trim();
            const isDevOpen = showDevId === note.id;
            return (
              <li
                key={note.id}
                className={`border rounded-lg p-3 ${note.isPublished ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/60 opacity-90'}`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          note.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {note.isPublished ? '게시됨' : '초안'}
                      </span>
                      {note.version && (
                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {note.version}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-gray-900 truncate">{note.title}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {note.isPublished && note.publishedAt?.toDate?.()
                        ? `${note.publishedAt.toDate().toLocaleString('ko-KR')} 게시`
                        : note.createdAt?.toDate?.().toLocaleString('ko-KR') ?? ''}
                    </p>
                  </div>
                </div>

                <div className="border-l-2 border-emerald-200 pl-3 mb-2">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase mb-0.5 flex items-center gap-1">
                    <User size={10} /> 사용자용
                  </p>
                  <p className="text-xs text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                    {userBodyText || <span className="text-gray-400 italic">비어 있음</span>}
                  </p>
                </div>

                {hasDev && (
                  <div className="mb-2">
                    <button
                      type="button"
                      onClick={() => setShowDevId(isDevOpen ? null : note.id)}
                      className="text-[10px] font-bold text-gray-500 hover:text-gray-700 uppercase flex items-center gap-1"
                    >
                      <Code2 size={10} /> 개발자용 {isDevOpen ? '접기' : '펼치기'}
                    </button>
                    {isDevOpen && (
                      <div className="border-l-2 border-gray-300 pl-3 mt-1">
                        <p className="text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed font-mono">
                          {note.devBody}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
                  {isConfirming ? (
                    <>
                      <span className="text-xs text-red-600 font-medium mr-auto">정말 삭제할까요?</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs h-7"
                      >
                        취소
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(note.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs h-7"
                      >
                        삭제
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePublish(note)}
                        className="text-xs h-7 flex items-center gap-1"
                      >
                        {note.isPublished ? (
                          <>
                            <EyeOff size={12} /> 비공개
                          </>
                        ) : (
                          <>
                            <Eye size={12} /> 게시
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(note)}
                        className="text-xs h-7 flex items-center gap-1"
                      >
                        <Pencil size={12} /> 편집
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDelete(note.id)}
                        className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> 삭제
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
