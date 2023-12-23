import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest & {element: string}) {

  if(!request.element) {
    request.element = "test";
  }

  return NextResponse.next();
}

