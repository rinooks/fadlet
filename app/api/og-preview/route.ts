import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface OgData {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
}

const MAX_HTML_BYTES = 512 * 1024;

function extractMeta(html: string, prop: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${prop.replace('og:', '')}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return '';
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() ?? '';
}

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '0.0.0.0' || h === '::1' || h === '[::1]') return true;
  if (h.endsWith('.local') || h.endsWith('.internal')) return true;
  // IPv4 사설/링크-로컬/메타데이터 대역
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true; // AWS/GCP 메타데이터
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }
  // IPv6 사설/로컬
  if (h.startsWith('[fc') || h.startsWith('[fd') || h.startsWith('[fe80')) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url');
  if (!raw) return NextResponse.json({ error: 'url 파라미터가 필요합니다.' }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: '유효한 URL이 아닙니다.' }, { status: 400 });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'http(s)만 허용됩니다.' }, { status: 400 });
  }
  if (isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ error: '내부 주소는 허용되지 않습니다.' }, { status: 400 });
  }

  try {
    // 리다이렉트를 수동으로 따라가며 각 hop의 호스트를 재검증한다 (SSRF: 사설/메타데이터 IP로의 리다이렉트 우회 차단).
    let currentUrl = parsed.toString();
    let res: Response | null = null;
    for (let hop = 0; hop < 5; hop++) {
      const r = await fetch(currentUrl, {
        headers: { 'User-Agent': 'Fadlet-Bot/1.0' },
        signal: AbortSignal.timeout(5000),
        redirect: 'manual',
      });
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get('location');
        if (!loc) break;
        let next: URL;
        try {
          next = new URL(loc, currentUrl);
        } catch {
          return NextResponse.json({ error: '유효하지 않은 리다이렉트 주소입니다.' }, { status: 400 });
        }
        if (next.protocol !== 'http:' && next.protocol !== 'https:') {
          return NextResponse.json({ error: 'http(s)만 허용됩니다.' }, { status: 400 });
        }
        if (isPrivateHost(next.hostname)) {
          return NextResponse.json({ error: '내부 주소는 허용되지 않습니다.' }, { status: 400 });
        }
        currentUrl = next.toString();
        continue;
      }
      res = r;
      break;
    }
    if (!res) throw new Error('리다이렉트가 너무 많습니다.');
    if (!res.ok) throw new Error('페이지 요청 실패');
    // 최종 도달 URL 기준으로 메타 구성
    parsed = new URL(currentUrl);

    // 응답 크기 제한 (512KB) — 메타 태그만 필요하므로 충분
    const reader = res.body?.getReader();
    if (!reader) throw new Error('본문 없음');
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const html = new TextDecoder('utf-8', { fatal: false }).decode(merged);

    const data: OgData = {
      url: parsed.toString(),
      title: extractMeta(html, 'og:title') || extractTitle(html),
      description: extractMeta(html, 'og:description'),
      image: extractMeta(html, 'og:image'),
      siteName: extractMeta(html, 'og:site_name') || parsed.hostname,
    };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return NextResponse.json({ error: '미리보기를 불러올 수 없습니다.' }, { status: 500 });
  }
}
