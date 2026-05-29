import { NextRequest, NextResponse } from 'next/server';

const SITE_PASSWORD = process.env.SITE_PASSWORD || '';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!SITE_PASSWORD) {
      return NextResponse.json(
        { success: false, error: '站点未设置密码，请在环境变量 SITE_PASSWORD 中配置' },
        { status: 500 }
      );
    }

    if (password === SITE_PASSWORD) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: '密码错误' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}