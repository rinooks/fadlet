import Link from 'next/link';
import { Settings } from 'lucide-react';
import { DemoButton } from '@/components/shared/demo-button';
import { FeedbackButton } from '@/components/shared/feedback-button';

const FEATURES = [
  {
    icon: '⚡',
    title: '30초 입장',
    desc: '가입 없이 6자리 코드로 즉시 합류. 호스트는 Google 로그인만으로 시작.',
  },
  {
    icon: '🗺️',
    title: '보드형 7종 + 라이브 3종',
    desc: '브레인스토밍·캔버스·찬반·칸반·KPT·4F·9칸 + 폴/워드클라우드/Q&A.',
  },
  {
    icon: '🎬',
    title: '단계 시퀀스',
    desc: '단계별로 활동을 자동 전환. 타이머와 함께 워크숍 흐름을 통제.',
  },
  {
    icon: '📊',
    title: '통합 PDF 리포트',
    desc: '보드형 결과 + 라이브 응답까지 한 PDF로. 단계당 한 페이지.',
  },
  {
    icon: '💬',
    title: '실시간 채팅',
    desc: '파일 첨부, 링크 미리보기, 미디어 갤러리, 공지 고정까지.',
  },
  {
    icon: '🛡',
    title: '퍼실리테이터 도구',
    desc: '보드 잠금, 신고 관리, 금칙어, 8가지 스킨, 분석 대시보드.',
  },
];

const PAIN_POINTS = [
  { before: '"단톡방부터 새로 팔까요?"', after: 'URL + 6자리 코드 → 30초 입장' },
  { before: '"자료는 카톡으로 보내드릴게요"', after: '보드 한 화면에 자료·채팅·활동 한꺼번에' },
  { before: '"끝나고 정리해서 메일로 드릴게요"', after: '종료 시 통합 PDF 리포트 자동 생성' },
];

const DIFFERENTIATORS = [
  {
    title: '퍼실리테이터 손에 맞는 도구',
    body: '보드 잠금, 타이머, 신고 관리, 금칙어, 8가지 스킨. 일반 협업 도구가 아니라 워크숍을 "진행하는 사람"의 도구로 설계됐습니다.',
  },
  {
    title: '채팅·보드·라이브가 한 화면',
    body: '파일 공유, 라이브 폴, Q&A까지 워크숍 한 곳에서. 끝나면 단계별로 정리된 PDF 한 권이 손에 남습니다.',
  },
  {
    title: '템플릿이 아니라, 워크숍 흐름',
    body: '보드형 7종 + 라이브 3종을 단계 시퀀스로 엮습니다. 단일 템플릿 도구가 아니라, 처음부터 끝까지 한 줄로 연결되는 OS.',
  },
];

const VISION_NEXT = [
  { tag: 'AI 자동 보고서', desc: '채팅과 결과 데이터를 한 권의 인사이트 리포트로 정리.' },
  { tag: '다음 단계 추천', desc: '이번 워크숍 결과를 바탕으로 다음 워크숍 방향을 제안.' },
  { tag: '워크숍 설계 초안', desc: '주제만 던지면 단계와 템플릿까지 자동 구성.' },
];

const TEMPLATES = [
  { emoji: '💡', label: '브레인스토밍', desc: '제약 없이 아이디어를 자유롭게 쏟아냅니다.' },
  { emoji: '🗺️', label: '캔버스', desc: '포스트를 원하는 위치에 자유롭게 배치합니다.' },
  { emoji: '⚖️', label: '찬반', desc: '주제에 대한 찬성과 반대 의견을 나눕니다.' },
  { emoji: '🗂️', label: '칸반', desc: '할 일·진행 중·완료로 작업 흐름을 시각화합니다.' },
  { emoji: '🔄', label: 'KPT', desc: 'Keep · Problem · Try 세 가지로 팀을 돌아봅니다.' },
  { emoji: '📋', label: '4F', desc: '관찰 → 감정 → 발견 → 액션의 시간 흐름.' },
  { emoji: '🔲', label: '9칸 (TRIZ)', desc: '시간 × 레벨로 9개 영역을 탐색합니다.' },
  { emoji: '📊', label: '라이브 폴', desc: '객관식 투표 + 실시간 막대 차트.' },
  { emoji: '☁️', label: '워드클라우드', desc: '한 단어 응답을 빈도수로 시각화.' },
  { emoji: '❓', label: '라이브 Q&A', desc: '질문 모으고 좋아요 정렬, 퍼실리테이터 답변.' },
];

// 결정론적 의사 난수 (hydration mismatch 방지: 인덱스 기반 일관된 값)
const STICKY_COLORS = ['#FEF3C7', '#FCE7F3', '#DBEAFE', '#D1FAE5', '#EDE9FE', '#FED7AA'];
const STICKY_ANIMS = ['sticky-float-a', 'sticky-float-b', 'sticky-float-c', 'sticky-float-d'];

const STICKY_NOTES = Array.from({ length: 42 }, (_, i) => {
  const left = ((i * 73 + 13) % 100);
  const top = ((i * 53 + 29) % 100);
  const size = 36 + ((i * 17) % 56); // 36~92px
  const rot = (((i * 41) % 60) - 30); // -30 ~ +30deg
  const color = STICKY_COLORS[i % STICKY_COLORS.length];
  const anim = STICKY_ANIMS[i % STICKY_ANIMS.length];
  const dur = 28 + ((i * 7) % 22); // 28~50s
  const delay = -((i * 11) % 30); // -29~0s (음수: 즉시 진행 중인 상태에서 시작)
  return { left, top, size, rot, color, anim, dur, delay };
});

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* 배경 효과 (root보다 뒤로 빠지지 않도록 z-index 0, content는 z-10) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-white">
        {/* 베이스 그라데이션 워시 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 700px at 80% -10%, rgba(168,85,247,0.12), transparent 60%), radial-gradient(900px 600px at -10% 30%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(800px 600px at 50% 110%, rgba(96,165,250,0.12), transparent 60%)',
          }}
        />
        {/* 미세 도트 그리드 */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* 떠다니는 포스트잇 */}
        {STICKY_NOTES.map((n, i) => (
          <div
            key={i}
            className={`sticky-note ${n.anim}`}
            style={
              {
                left: `${n.left}%`,
                top: `${n.top}%`,
                '--size': `${n.size}px`,
                '--bg': n.color,
                '--rot': `${n.rot}deg`,
                '--dur': `${n.dur}s`,
                animationDelay: `${n.delay}s`,
                opacity: 0.85,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="relative z-10 flex flex-col flex-1">

      {/* 헤더 */}
      <header className="relative flex items-center justify-between px-6 py-4 border-b border-gray-100/80 backdrop-blur-sm bg-white/40">
        <span className="text-indigo-600 font-bold text-xl tracking-tight">Fadlet</span>
        <div className="flex items-center gap-2">
          <FeedbackButton showLabel className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-2.5 h-9 border border-transparent hover:border-gray-200 rounded-full" />
          <Link
            href="/login"
            aria-label="퍼실리테이터 로그인"
            title="퍼실리테이터 로그인"
            className="group inline-flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-white hover:border-gray-300 border border-transparent transition-all"
          >
            <Settings size={18} className="transition-transform group-hover:rotate-90" />
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <main className="flex-1 flex flex-col items-center px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          워크숍 OS · Beta
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 mb-5 leading-[1.05] tracking-tight">
          워크숍의 처음부터 끝까지,<br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Fadlet 하나로.</span>
        </h1>
        <p className="text-gray-600 text-base sm:text-xl mb-10 max-w-2xl leading-relaxed">
          보드형 <strong className="text-gray-900 font-semibold">7종</strong> · 라이브 <strong className="text-gray-900 font-semibold">3종</strong> · 단계 시퀀스 · 통합 리포트.<br className="hidden sm:inline" />
          기획부터 운영, 결과 정리까지 한 화면에서.
        </p>

        {/* 무료 체험 CTA */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <DemoButton />
          <p className="text-xs text-gray-400">
            구글 로그인만으로 바로 시작
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
          <Link
            href="/dashboard"
            className="group inline-flex items-center justify-center h-11 px-6 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-indigo-300 text-gray-700 font-semibold text-sm transition-all"
          >
            퍼실리테이터로 시작하기
            <span className="ml-1.5 transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/boards/join"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-gray-300 text-gray-700 font-semibold text-sm transition-all"
          >
            코드로 입장하기
          </Link>
        </div>

        {/* 템플릿 미리보기 */}
        <div className="w-full max-w-3xl mb-16">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">
            Templates
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {TEMPLATES.map((t) => (
              <span
                key={t.label}
                tabIndex={0}
                className="group relative z-10 hover:z-50 focus-within:z-50 inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-gray-300 hover:border-indigo-400 hover:bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full cursor-help transition-colors focus:outline-none focus:border-indigo-500"
              >
                <span>{t.emoji}</span>
                {t.label}
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 whitespace-nowrap bg-gray-900 text-white text-[11px] font-normal px-2.5 py-1.5 rounded-md shadow-lg opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus:opacity-100 group-focus:translate-y-0"
                >
                  {t.desc}
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" aria-hidden />
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* 기능 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl w-full">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl p-5 text-left transition-all hover:border-indigo-400 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* 1. Why — 문제와 해결 */}
        <section className="w-full max-w-4xl mt-24 text-left">
          <div className="text-center mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Why Fadlet</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              워크숍 시작 5분 전,<br className="sm:hidden" /> 늘 똑같이 사라지는 시간
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-4 max-w-2xl mx-auto leading-relaxed">
              오프라인 미팅과 미니 워크숍에서 같은 공간에 모인 사람들에게 링크와 자료를 한 번에 공유하는 일은 의외로 거추장스럽습니다.
              <strong className="text-gray-900"> Fadlet은 그 마찰을 30초로 줄이는 데서 출발했습니다.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-200">
                  <p className="text-[11px] font-semibold text-gray-500 mb-1 tracking-wide">기존</p>
                  <p className="text-sm text-gray-700">{p.before}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[11px] font-semibold text-indigo-600 mb-1 tracking-wide">Fadlet</p>
                  <p className="text-sm text-gray-900 font-medium">{p.after}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. What's Different — 3가지 차별 */}
        <section className="w-full max-w-4xl mt-20 text-left">
          <div className="text-center mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">What&apos;s Different</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              협업 보드는 많지만,<br className="sm:hidden" /> 퍼실리테이터에게 맞춘 건 드뭅니다
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DIFFERENTIATORS.map((d, i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl p-6 hover:border-indigo-400 hover:bg-white hover:shadow-md transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-4">
                  0{i + 1}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug">{d.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{d.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Where It's Going — 비전 */}
        <section className="w-full max-w-4xl mt-20 text-left">
          <div className="text-center mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Where It&apos;s Going</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              지금은 워크숍 도구,<br className="sm:hidden" /> 다음은 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">워크숍 OS</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-4 max-w-2xl mx-auto leading-relaxed">
              워크숍에서 쌓인 채팅과 결과 데이터를 AI가 정리하고,<br />
              다음 단계의 방향성과 워크숍 설계까지 제안하는 플랫폼.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {VISION_NEXT.map((v, i) => (
              <div key={i} className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-100 rounded-xl p-5">
                <p className="text-[11px] font-bold text-indigo-600 mb-2 tracking-widest">COMING NEXT</p>
                <p className="text-sm font-semibold text-gray-900 mb-1">{v.tag}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="relative text-center py-6 text-xs text-gray-400 border-t border-gray-100/80 backdrop-blur-sm bg-white/40">
        © 2026 REFERENCE HRD. All Rights Reserved.
      </footer>
      </div>
    </div>
  );
}
