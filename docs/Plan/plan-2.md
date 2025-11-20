I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase already has a solid client-only auth foundation with `AuthProvider` context, Firebase persistence configured, and client-side auth guards in the dashboard layout. However, the auth flow is incomplete: the `Auth.tsx` component doesn't redirect after successful authentication, signup doesn't send email verification, the existing `verify-email/page.tsx` incorrectly uses server-side verification, and logout doesn't redirect users. The signup page also has an incorrect `defaultTab` prop set to "login" instead of "signup".

### Approach

This plan refactors the authentication flow to be fully client-side using Firebase Client SDK only, eliminating any server-side session management. It adds email verification after signup, implements client-side redirects after auth actions, and creates a new verify-email page as a client component. The approach maintains SSR compatibility by keeping redirects client-side while preserving the app's offline-first architecture with Firebase Auth persistence and Firestore offline cache.

### Reasoning

I explored the repository structure, examined the auth-related files including login/signup pages, the Auth component, Navbar, AuthProvider context, useAuth hook, Firebase configuration, and the dashboard layout with its client wrapper. I identified the current auth flow implementation, the existing offline-first setup, and the gaps that need to be filled to complete the client-only authentication architecture.

## Mermaid Diagram

sequenceDiagram
    participant User
    participant LoginPage
    participant SignupPage
    participant Auth Component
    participant Firebase SDK
    participant VerifyEmail Page
    participant Dashboard
    participant Navbar

    Note over User,Navbar: Login Flow
    User->>LoginPage: Visit /login
    LoginPage->>Auth Component: Render with defaultTab="login"
    User->>Auth Component: Enter credentials & submit
    Auth Component->>Firebase SDK: signInWithEmailAndPassword()
    Firebase SDK-->>Auth Component: Success
    Auth Component->>Dashboard: router.push('/dashboard/overview')
    
    Note over User,Navbar: Signup Flow
    User->>SignupPage: Visit /signup
    SignupPage->>Auth Component: Render with defaultTab="signup"
    User->>Auth Component: Enter details & submit
    Auth Component->>Firebase SDK: createUserWithEmailAndPassword()
    Firebase SDK-->>Auth Component: User created
    Auth Component->>Firebase SDK: sendEmailVerification()
    Auth Component->>VerifyEmail Page: router.push('/verify-email')
    
    Note over User,Navbar: Email Verification Flow
    User->>VerifyEmail Page: Redirected after signup
    VerifyEmail Page->>Firebase SDK: Check user.emailVerified
    Firebase SDK-->>VerifyEmail Page: Not verified
    VerifyEmail Page->>User: Show verification message
    User->>VerifyEmail Page: Click "Resend Email"
    VerifyEmail Page->>Firebase SDK: sendEmailVerification()
    User->>User: Check email & click link
    VerifyEmail Page->>Firebase SDK: Periodic reload() check
    Firebase SDK-->>VerifyEmail Page: Verified!
    VerifyEmail Page->>Dashboard: router.push('/dashboard/overview')
    
    Note over User,Navbar: Logout Flow
    User->>Navbar: Click logout
    Navbar->>Firebase SDK: signOut()
    Firebase SDK-->>Navbar: Success
    Navbar->>LoginPage: router.push('/')

## Proposed File Changes

### app/(public)/signup/page.tsx(MODIFY)

Fix the `defaultTab` prop passed to the `Auth` component. Currently it's set to `"login"` which is incorrect for a signup page. Change it to `"signup"` so users see the signup form by default when they visit `/signup`.

### app/(public)/_components/Auth.tsx(MODIFY)

Add comprehensive client-side redirect logic and email verification:

1. **Import additions**: Add `useRouter` from `next/navigation` and `sendEmailVerification` from `firebase/auth` at the top of the file.

2. **Initialize router**: Add `const router = useRouter()` inside the `Auth` component function (after state declarations).

3. **Update handleSignup function**:
   - After successfully creating the user account and updating the profile (after line 88), add a call to `sendEmailVerification(loggedInUser)` to send the verification email
   - Before returning success, add `router.push('/verify-email')` to redirect the user to the verification page
   - Consider wrapping the email send in a try-catch to handle potential errors gracefully, but don't block the redirect if it fails

4. **Update handleLogin function**:
   - After successful sign-in (after line 62, before setting loading to false), add `router.push('/dashboard/overview')` to redirect authenticated users to the dashboard

5. **Update handleProviderSignIn function**:
   - After successful provider sign-in and profile update (after line 117, before setting loading to false), check if `result.user.emailVerified` is true
   - If verified, redirect to `/dashboard/overview` using `router.push('/dashboard/overview')`
   - If not verified, send verification email with `sendEmailVerification(result.user)` and redirect to `/verify-email`
   - Note: Most OAuth providers (Google, GitHub) automatically verify emails, but this check ensures consistency

6. **Optional enhancement**: Consider adding a success toast notification before redirects to improve UX (if toast system is available via `@/components/ui/sonner`).

These changes ensure users are properly redirected after authentication and that email verification is enforced for all signup methods, maintaining the client-only architecture without any API calls.

### app/(public)/verify-email/page.tsx(MODIFY)

References: 

- app/(public)/_components/Auth.tsx(MODIFY)
- context/AuthProvider.tsx

Completely rewrite this file as a client component for email verification:

1. **Change to client component**: Add `'use client'` directive at the top and remove all server-side imports (`verifySessionCookie`, `redirect` from `next/navigation`).

2. **Import required dependencies**:
   - React hooks: `useState`, `useEffect` from `react`
   - Next.js: `useRouter` from `next/navigation`
   - Firebase: `sendEmailVerification`, `reload` from `firebase/auth`
   - Auth context: `useAuth` from `@/context/AuthProvider`
   - UI components: `Card`, `CardContent`, `CardHeader`, `CardTitle` from `@/components/ui/card`, `Button` from `@/components/ui/button`, `Alert`, `AlertDescription` from `@/components/ui/alert`
   - Icons: `Mail`, `CheckCircle`, `AlertCircle`, `Loader2` from `lucide-react`
   - Firebase instance: `auth` from `@/lib/firebase`

3. **Component structure**:
   - Create a default exported function component `VerifyEmailPage`
   - Use `const { user, loading } = useAuth()` to get auth state
   - Use `const router = useRouter()` for navigation
   - Add state: `const [resending, setResending] = useState(false)`, `const [message, setMessage] = useState('')`, `const [error, setError] = useState('')`

4. **Auth state handling with useEffect**:
   - If `loading` is true, return a loading spinner centered on the page
   - If `!loading && !user`, redirect to `/login` using `router.push('/login')`
   - If `user?.emailVerified`, redirect to `/dashboard/overview` using `router.push('/dashboard/overview')`
   - Add a periodic check (every 3-5 seconds) that calls `reload(auth.currentUser)` to refresh the user's verification status from Firebase, then checks if verified and redirects
   - Clean up the interval on component unmount

5. **Resend verification handler**:
   - Create an async function `handleResendVerification` that:
     - Sets `resending` to true and clears previous messages
     - Checks if `auth.currentUser` exists
     - Calls `sendEmailVerification(auth.currentUser)`
     - On success, sets a success message like "Verification email sent! Check your inbox."
     - On error, sets an error message with the error details
     - Finally sets `resending` to false

6. **Logout handler**:
   - Create an async function `handleLogout` that calls `signOut(auth)` and then redirects to `/` using `router.push('/')`

7. **UI layout**:
   - Center the content vertically and horizontally with `min-h-screen flex items-center justify-center p-6 bg-background`
   - Use a `Card` component with max width of `md`
   - In `CardHeader`, show a mail icon in a circular background, title "Verify Your Email", and description explaining that a verification link was sent to `{user?.email}`
   - In `CardContent`:
     - Show success/error alerts if `message` or `error` state is set
     - Add an informational alert explaining users should check their inbox and spam folder
     - Add a "Resend Verification Email" button that calls `handleResendVerification`, disabled when `resending` is true, showing a loader icon when resending
     - Add a secondary "Logout" button that calls `handleLogout`
     - Add a note that the page will auto-redirect once email is verified

8. **Styling**: Use Tailwind classes consistent with the existing `Auth.tsx` component for visual consistency.

This implementation creates a fully client-side verification page that checks auth state, allows resending verification emails, auto-detects when verification is complete, and provides a logout option—all without any server-side session management.

### app/(authed)/dashboard/_components/Navbar2.tsx(MODIFY)

References: 

- context/AuthProvider.tsx

Update the logout handler to redirect users to the home page after signing out:

1. **Import router**: Add `import { useRouter } from 'next/navigation'` at the top with other imports (if not already present).

2. **Initialize router**: Add `const router = useRouter()` inside the `Navbar` component function, after the state declarations (around line 36).

3. **Update handleLogout function** (currently at lines 69-72):
   - After calling `await signOut(auth)`, add `router.push('/')` to redirect the user to the home page
   - The function should now be:
     ```
     const handleLogout = async () => {
       await signOut(auth);
       router.push('/');
     };
     ```
   - Note: The `onAuthStateChanged` listener in `AuthProvider` will handle clearing the user state, so no manual state updates are needed

4. **Optional enhancement**: Consider adding a loading state during logout to prevent multiple clicks, or show a toast notification confirming successful logout.

This ensures users are properly redirected to the public home page after logging out, completing the client-side navigation flow.