'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sendEmailVerification, reload, signOut } from 'firebase/auth'
import { useAuth } from '@/context/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { auth } from '@/lib/firebase'

export default function VerifyEmailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Handle auth state and auto-redirect
  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (user?.emailVerified) {
      router.push('/dashboard/overview')
      return
    }

    // Periodic check for email verification
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await reload(auth.currentUser)
        if (auth.currentUser.emailVerified) {
          router.push('/dashboard/overview')
        }
      }
    }, 4000) // every 4 seconds

    return () => clearInterval(interval)
  }, [loading, user, router])

  // Resend verification email
  const handleResendVerification = async () => {
    setResending(true)
    setMessage('')
    setError('')

    try {
      if (!auth.currentUser) throw new Error('No authenticated user found')
      await sendEmailVerification(auth.currentUser)
      setMessage('Verification email sent! Check your inbox.')
    } catch (err: unknown) {
      // const message = `${err?.message} Failed to send verification email`;
      let message = 'Failed to send verification email';
      if (err instanceof Error) {
        message = `${err.message}. Failed to send verification email`;
      }
      console.error('Resend verification error:', err);
      setError(message)
    } finally {
      setResending(false)
    }
  }

  // Logout handler
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-center">Verify Your Email</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            A verification link has been sent to <span className="font-medium">{user?.email}</span>.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <Alert className="border-green-500 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-500 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert className="border-blue-500 text-blue-600">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Please check your inbox and spam folder. This page will automatically redirect once your email is verified.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full"
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>

            <Button
              onClick={handleLogout}
              variant="secondary"
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
