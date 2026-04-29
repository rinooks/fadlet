import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface OgData {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
}

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

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url 파라미터가 필요합니다.' }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Fadlet-Bot/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error('페이지 요청 실패');
    const html = await res.text();

    const data: OgData = {
      url,
      title: extractMeta(html, 'og:title') || extractTitle(html),
      description: extractMeta(html, 'og:description'),
      image: extractMeta(html, 'og:image'),
      siteName: extractMeta(html, 'og:site_name') || new URL(url).hostname,
    };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return NextResponse.json({ error: '미리보기를 불러올 수 없습니다.' }, { status: 500 });
  }
}
