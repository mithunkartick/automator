import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/(.*)','/api/clerk-webhook(.*)',
    '/api/drive-activity/notification(.*)',
    '/api/payment/success(.*)',]);

export default clerkMiddleware((auth, request) => {
  if(!isPublicRoute(request)) {
    auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}

// (Note for Collaborators of Procrastinot) Scopes Used:
// https://www.googleapis.com/auth/userinfo.email
// https://www.googleapis.com/auth/userinfo.profile
// https://www.googleapis.com/auth/drive.activity.readonly
// https://www.googleapis.com/auth/drive.metadata
// https://www.googleapis.com/auth/drive.readonly