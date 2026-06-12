import Link from 'next/link';
import { SiteFooter } from '@/components/shared/site-footer';

export const metadata = {
  title: '이용약관 · Fadlet',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Link href="/" className="relative text-indigo-600 font-bold text-xl hover:text-indigo-700 transition-colors">
            Fadlet
            <span className="absolute -top-1 -right-4 text-[10px] font-semibold text-indigo-400 leading-none">beta</span>
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600 font-medium">이용약관</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fadlet 서비스 이용약관</h1>
        <p className="text-sm text-gray-500 mb-10">시행일: 2026년 5월 18일</p>

        <article className="space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제1조 (목적)</h2>
            <p>
              본 약관은 (주)레퍼런스에이치알디(이하 &ldquo;회사&rdquo;)가 제공하는 워크숍 협업 보드 서비스
              Fadlet(이하 &ldquo;서비스&rdquo;) 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을
              목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제2조 (용어의 정의)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;서비스&rdquo;란 회사가 운영하는 Fadlet 웹 애플리케이션 및 부속 기능 일체를 말합니다.</li>
              <li>&ldquo;퍼실리테이터(운영자)&rdquo;란 보드를 생성·운영하는 이용자로, Google 계정 인증을 거친 자를 말합니다.</li>
              <li>&ldquo;참여자&rdquo;란 운영자가 공유한 보드 코드를 통해 익명으로 보드에 참여하는 이용자를 말합니다.</li>
              <li>&ldquo;콘텐츠&rdquo;란 이용자가 서비스에 게시한 포스트, 채팅 메시지, 첨부 파일 등 일체의 자료를 말합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>본 약관은 서비스 화면에 게시함으로써 효력을 발생합니다.</li>
              <li>회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 시행일 7일 전부터 공지합니다.</li>
              <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제4조 (서비스의 제공)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회사는 다음과 같은 서비스를 제공합니다.
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>워크숍 보드 생성·진행·저장</li>
                  <li>실시간 채팅·포스트·반응·신고 기능</li>
                  <li>타이머·단계 진행·금칙어 등 퍼실리테이션 도구</li>
                  <li>AI 기반 인사이트 생성(베타)</li>
                  <li>기타 회사가 부가적으로 개발하거나 제휴를 통해 제공하는 기능</li>
                </ul>
              </li>
              <li>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 하되, 시스템 점검 등 필요한 경우 일시 중단될 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제5조 (베타 서비스)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>본 서비스는 현재 베타 단계로, 기능이 변경·추가·축소될 수 있으며 일시적 오류가 발생할 수 있습니다.</li>
              <li>베타 기간 중 회사는 서비스를 무상으로 제공합니다. 단, 정식 출시 시점에 일부 기능이 유료로 전환될 수 있으며 사전에 공지합니다.</li>
              <li>베타 기간 중 발생한 데이터 손실, 서비스 중단 등에 대해 회사는 고의 또는 중과실이 없는 한 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제6조 (이용자의 의무)</h2>
            <p className="mb-2">이용자는 다음 행위를 하여서는 안 됩니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>타인의 개인정보·계정·콘텐츠를 무단으로 사용하거나 도용하는 행위</li>
              <li>음란·폭력·차별·혐오·범죄와 관련된 콘텐츠를 게시하는 행위</li>
              <li>저작권 등 타인의 지식재산권을 침해하는 행위</li>
              <li>서비스의 운영을 방해하거나 시스템 보안을 침해하는 행위</li>
              <li>법령 또는 본 약관에 위배되는 일체의 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제7조 (콘텐츠의 저작권 및 책임)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>이용자가 작성한 콘텐츠의 저작권은 해당 이용자에게 귀속됩니다.</li>
              <li>이용자는 회사가 서비스 운영·홍보·개선 목적으로 콘텐츠를 사용·복제·전송하는 것에 대해 무상의 비독점적 라이선스를 부여합니다. (이용자 식별 정보가 제거된 통계·집계 형태에 한함)</li>
              <li>콘텐츠로 인해 발생한 법적 분쟁의 책임은 해당 콘텐츠를 게시한 이용자에게 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제8조 (서비스 이용 제한)</h2>
            <p>
              회사는 이용자가 본 약관을 위반하거나 서비스 운영을 방해한 경우, 사전 통지 없이 콘텐츠 삭제·이용 제한·계정
              정지 등의 조치를 취할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제9조 (면책 조항)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회사는 천재지변, 통신망 장애, 정전 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
              <li>회사는 이용자가 서비스를 통해 게시·교환한 정보의 신뢰성·정확성에 대해 보증하지 않습니다.</li>
              <li>AI 인사이트 등 자동 생성 결과는 참고용이며, 회사는 그 정확성·완결성을 보장하지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제10조 (분쟁 해결 및 관할)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 상호 협의를 통해 원만히 해결하기 위해 노력합니다.</li>
              <li>분쟁이 해결되지 않을 경우 서울중앙지방법원을 제1심 관할 법원으로 합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">부칙</h2>
            <p>본 약관은 2026년 5월 18일부터 시행됩니다.</p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
