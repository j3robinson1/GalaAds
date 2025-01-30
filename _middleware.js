import { NextResponse } from 'next/server';

export function middleware(request) {
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', "frame-ancestors *");
    response.headers.set('X-Frame-Options', 'ALLOWALL');
    return response;
}
