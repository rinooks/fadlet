import Link from 'next/link';

const FEATURES = [
  { icon: '⚡', title: '30초 입장', desc: '회원가입 없이 6자리 코드만으로 즉시 합류' },
  { icon: '💬', title: '실시간 채팅', desc: '보드 옆 채팅 패널로 즉각적인 질문·반응 교환' },
  { icon: '🎯', title: '운영자 특화', desc: '보드 잠금, 공유, 접속자 관리 등 운영자 기능 내장' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="text-blue-600 font-bold text-xl">Fadlet</span>
        <Link
          href="/login"
          className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
        >
          운영자 로그인
        </Link>
      </header>

      {/* 히어로 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          Facilitator-friendly Padlet
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          워크숍 운영자를 위한<br />협업 보드
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-md">
          가입 없이 6자리 코드로 30초 만에 합류.<br />
          보드와 채팅을 한 화면에서.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link
            href="/boards/new"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition-colors shadow-sm"
          >
            보드 만들기 →
          </Link>
          <Link
            href="/boards/join"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold text-base transition-colors"
          >
            코드로 입장하기
          </Link>
        </div>

        {/* 기능 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-xl p-5 text-left">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100">
        © 2026 REFERENCE HRD. All Rights Reserved.
      </footer>
    </div>
  );
}
