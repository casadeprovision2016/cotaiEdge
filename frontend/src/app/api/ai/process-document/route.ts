/**
 * Next.js API Route for AI Document Processing
 * Proxies requests to backend AI service
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData();
    
    // Get auth token from cookies or headers
    const authToken = request.cookies.get('auth-token')?.value || 
                     request.headers.get('authorization');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward request to backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/ai/process-document`, {
      method: 'POST',
      headers: {
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.message || 'Backend request failed',
          status: backendResponse.status 
        },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}