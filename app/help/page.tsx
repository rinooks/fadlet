'use client';

import Link from 'next/link';

interface SectionProps {
  emoji: string;
  title: string;
  children: React.ReactNode;
}

function Section({ emoji, title, children }: SectionProps) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3">
        <span aria-hidden>{emoji}</span> {title}
      </h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="relative text-indigo-600 font-bold text-xl hover:text-indigo-700 transition-colors">
            Fadlet
            <span className="absolute -top-1 -right-4 text-[10px] font-semibold text-indigo-400 leading-none">beta</span>
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600 font-medium">퍼실리테이터 가이드</span>
        </div>
        <Link href="/dashboard" className="text-xs text-indigo-600 hover:underline">
          ← 내 워크스페이스
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h1 className="text-xl font-bold text-indigo-900 mb-1">워크숍 퍼실리테이터를 위한 빠른 가이드</h1>
          <p className="text-sm text-indigo-800">
            Fadlet은 퍼실리테이터 관점에서 만든 협업 보드입니다. 핵심 기능 5분 안에 익혀
            현장에서 바로 활용해 보세요.
          </p>
        </div>

        <Section emoji="🚀" title="시작하기 — 보드 만들고 공유">
          <ol className="list-decimal list-inside space-y-1">
            <li>워크스페이스 카드를 클릭한 뒤 <strong>+ 새 보드</strong>를 눌러 제목·템플릿을 선택합니다.</li>
            <li>생성 직후 <strong>4자리 코드</strong>가 자동 발급됩니다 (예: K3F2).</li>
            <li>헤더의 <strong>공유</strong> 버튼으로 링크·QR을 참여자에게 전달합니다.</li>
            <li>참여자는 코드 입력 + 닉네임만으로 로그인 없이 즉시 입장합니다.</li>
          </ol>
        </Section>

        <Section emoji="📋" title="템플릿 — 워크숍 흐름에 맞춰 선택">
          <p>보드형 7가지 + 라이브형 3가지가 준비되어 있습니다 (워크숍 모드에서 단계별로 조합).</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside">
            <li><strong>브레인스토밍</strong> — 제약 없는 그리드</li>
            <li><strong>캔버스</strong> — 자유 위치 배치 (도트 그리드)</li>
            <li><strong>찬성 / 반대</strong> — 의견 양분 토론</li>
            <li><strong>칸반</strong> — 할 일 · 진행 중 · 완료</li>
            <li><strong>KPT 회고</strong> — Keep · Problem · Try</li>
            <li><strong>4F 회고</strong> — 관찰 → 감정 → 발견 → 액션 흐름</li>
            <li><strong>9칸 윈도우 (TRIZ)</strong> — 시간 × 레벨 매트릭스</li>
            <li><strong>📊 라이브 폴</strong> — 객관식 투표 + 막대 차트</li>
            <li><strong>☁️ 워드클라우드</strong> — 빈도 시각화</li>
            <li><strong>❓ 라이브 Q&amp;A</strong> — 좋아요 정렬 + 퍼실리테이터 답변</li>
          </ul>
          <p className="text-gray-500 text-xs">팁: 템플릿은 보드 생성 후 변경할 수 없으므로 선택 시 신중히 결정하세요.</p>
        </Section>

        <Section emoji="🎛" title="퍼실리테이터 패널 — 워크숍을 통제하는 핵심">
          <p>헤더의 <strong>🎛 운영</strong> 버튼을 누르면 우측에 패널이 열립니다.</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>단계 + 타이머</strong>: 단계별 제목·시간 등록 → 시작/정지/다음으로 진행. 모든 참여자에게 남은 시간이 실시간 표시됩니다.</li>
            <li><strong>채팅 공지 고정</strong>: 채팅 상단에 항상 표시되는 노란 공지 배너. 메시지에 호버해 핀 아이콘으로도 즉시 고정 가능.</li>
            <li><strong>부적절 키워드 필터</strong>: 등록된 단어가 포함된 메시지·포스트는 자동 차단. 퍼실리테이터는 차단되지 않습니다.</li>
            <li><strong>분석 대시보드</strong>: 참여도·활동량·시간대·상위 기여자를 한눈에 확인.</li>
          </ul>
        </Section>

        <Section emoji="🚩" title="모더레이션 — 신고와 잠금">
          <ul className="list-disc list-inside space-y-1">
            <li>참여자가 메시지·포스트·댓글을 신고하면 퍼실리테이터에게만 알림 배지가 뜹니다.</li>
            <li>신고 패널에서 <strong>대상 삭제 + 해결</strong>(즉시 삭제) 또는 <strong>해결만</strong>(부적절하지 않다고 판단) 처리.</li>
            <li>워크숍이 끝나면 헤더의 <strong>🔒 잠금</strong>으로 더 이상 글이 추가되지 않게 할 수 있습니다.</li>
          </ul>
        </Section>

        <Section emoji="📤" title="결과물 내보내기">
          <p>헤더 <strong>내보내기</strong>에서 세 가지 옵션:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>보드 PDF</strong> — 컬럼별 또는 그리드로 모든 포스트 정리</li>
            <li><strong>채팅 기록 PDF</strong> — 시간·작성자 포함 발화 전체</li>
            <li><strong>보드 + 채팅 통합</strong> — 워크숍 산출물을 한 파일로</li>
          </ul>
          <p className="text-gray-500 text-xs">팁: 새 창이 열린 뒤 브라우저 인쇄 다이얼로그에서 “PDF로 저장”을 선택하세요.</p>
        </Section>

        <Section emoji="👥" title="워크스페이스 — 팀 단위 운영">
          <p>여러 명의 퍼실리테이터가 보드를 공유하려면 워크스페이스를 사용하세요.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>로그인 직후 화면(<strong>내 워크스페이스</strong>)에서 <strong>+ 새 워크스페이스</strong> 또는 <strong>코드로 가입</strong>을 선택합니다.</li>
            <li>새 워크스페이스를 만들면 6자리 초대 코드가 자동 발급됩니다.</li>
            <li>워크스페이스 멤버가 만든 보드는 해당 워크스페이스 화면에서 함께 열람 가능합니다.</li>
          </ul>
        </Section>

        <Section emoji="💡" title="실전 팁">
          <ul className="list-disc list-inside space-y-1">
            <li>워크숍 시작 전 <strong>아이스브레이킹 단계</strong>를 짧게(3분) 두면 참여 진입 장벽이 낮아집니다.</li>
            <li>의견이 길어질 때 <strong>채팅 공지</strong>로 “2분 안에 한 줄로 요약해 주세요” 같은 가이드를 띄워보세요.</li>
            <li>모바일 참여자가 많다면 <strong>이미지 업로드</strong>와 <strong>플로팅 채팅 버튼</strong>을 미리 안내하세요.</li>
            <li>회고 끝에 PDF로 즉시 공유하면 “나중에 정리해서 보내드릴게요” 한 단계가 사라집니다.</li>
          </ul>
        </Section>

        <footer className="text-center text-xs text-gray-400 pt-4 pb-8">
          궁금한 점이나 개선 제안이 있다면 운영팀(REFERENCE HRD)에 알려주세요.
        </footer>
      </main>
    </div>
  );
}
