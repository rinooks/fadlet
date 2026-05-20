'use client';

import { useEffect, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase/client';
import { userDocPath } from '@/lib/firebase/collections';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UserProfile } from '@/lib/types/user-profile';

interface ProfileCompletionModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  existingProfile?: UserProfile | null;
}

export function ProfileCompletionModal({
  open,
  onClose,
  user,
  existingProfile,
}: ProfileCompletionModalProps) {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(existingProfile?.name ?? user.displayName ?? '');
    setOrganization(existingProfile?.organization ?? '');
    setJobTitle(existingProfile?.jobTitle ?? '');
    setMarketingAgreed(existingProfile?.marketingConsent?.agreed ?? false);
  }, [open, user, existingProfile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim() || !organization.trim()) {
      toast.error('필수 항목을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      await setDoc(
        doc(db, userDocPath(user.uid)),
        {
          uid: user.uid,
          email: existingProfile?.email ?? user.email ?? null,
          name: name.trim(),
          organization: organization.trim(),
          jobTitle: jobTitle.trim() || null,
          marketingConsent: {
            agreed: marketingAgreed,
            agreedAt: marketingAgreed ? now : null,
          },
          profileCompletedAt: now,
          updatedAt: now,
          ...(existingProfile?.createdAt ? {} : { createdAt: now }),
        },
        { merge: true },
      );
      toast.success('프로필이 저장되었습니다.');
      onClose();
    } catch (err) {
      console.error('[ProfileCompletionModal]', err);
      toast.error('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkip() {
    if (submitting) return;
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting && !v) onClose(); }}>
      <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto p-6 sm:p-8 sm:max-w-lg">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold">Fadlet을 자주 쓰시네요 👋</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 leading-relaxed">
            워크숍 운영에 도움이 될 자료와 제품 업데이트를 정확히 전해 드리고 싶어요.
            <br />
            <span className="text-[11px] text-gray-400">
              30초면 끝나요. 지금 건너뛰셔도 됩니다.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-name" className="text-sm font-semibold text-gray-700">
              이름 <span className="text-red-500">*</span>
            </label>
            <Input
              id="profile-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              maxLength={40}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-org" className="text-sm font-semibold text-gray-700">
              소속(회사·기관) <span className="text-red-500">*</span>
            </label>
            <Input
              id="profile-org"
              required
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="예: 레퍼런스HRD"
              maxLength={80}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-job" className="text-sm font-semibold text-gray-700">
              직책/팀 <span className="text-[11px] font-normal text-gray-400">(선택)</span>
            </label>
            <Input
              id="profile-job"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="예: HRD팀 매니저"
              maxLength={60}
              disabled={submitting}
            />
          </div>

          <label className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50/60 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingAgreed}
              onChange={(e) => setMarketingAgreed(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-4 w-4 accent-indigo-600"
            />
            <span className="text-xs text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-500">[선택]</span>{' '}
              제품 업데이트·워크숍 운영 노하우 및 프로모션 정보 이메일 수신에 동의합니다.
              <br />
              <span className="text-[11px] text-gray-400">
                동의하지 않아도 서비스 이용에는 영향이 없으며, 언제든 설정에서 철회할 수 있습니다.
              </span>
            </span>
          </label>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            입력하신 정보는 제품 안내·운영 목적으로 보관되며, 회원 탈퇴 시 즉시 파기됩니다.
            마케팅 동의 항목은 별도 관리되며 동의하신 경우에 한해 수신됩니다.
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={submitting}
              className="sm:w-32"
            >
              나중에 입력
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11"
            >
              {submitting ? '저장 중…' : '저장하기'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
