import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    X_API_KEY: process.env.X_API_KEY ? `${process.env.X_API_KEY.substring(0, 10)}...` : 'MISSING',
    X_API_SECRET: process.env.X_API_SECRET ? `${process.env.X_API_SECRET.substring(0, 10)}...` : 'MISSING',
    X_ACCESS_TOKEN: process.env.X_ACCESS_TOKEN ? `${process.env.X_ACCESS_TOKEN.substring(0, 20)}...` : 'MISSING',
    X_ACCESS_TOKEN_SECRET: process.env.X_ACCESS_TOKEN_SECRET ? `${process.env.X_ACCESS_TOKEN_SECRET.substring(0, 10)}...` : 'MISSING',
    NODE_ENV: process.env.NODE_ENV
  });
}
