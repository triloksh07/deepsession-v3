'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Chrome,
  Github
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import logger from '@/lib/utils/logger';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export default function MCPAuthPage() {
  const searchParams = useSearchParams();
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const clientId = searchParams.get('client_id');
  const codeChallenge = searchParams.get('code_challenge');

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Generate code and write to Firestore using Client SDK directly
  const completeAuthorization = async (user: FirebaseUser) => {
    setIsAuthorizing(true);
    try {
      const code = crypto.randomUUID();

      // Write code directly to Firestore using authenticated user context
      await setDoc(doc(db, 'oauth_codes', code), {
        code,
        uid: user.uid,
        client_id: clientId || 'default_client',
        redirect_uri: redirectUri || '',
        state: state || '',
        code_challenge: codeChallenge || null,
        createdAt: serverTimestamp(),
      });

      // Instead of going straight to the client redirect_uri,
      // redirect internally to your client-side exchange page:
      const exchangeUrl = new URL('/oauth/exchange', window.location.origin);
      exchangeUrl.searchParams.set('code', code);

      if (redirectUri) exchangeUrl.searchParams.set('redirect_uri', redirectUri);
      if (state) exchangeUrl.searchParams.set('state', state);

      window.location.href = exchangeUrl.toString();

    } catch (err: unknown) {
      logger.error('Authorization code creation failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to authorize client';
      setError(message);
      setIsAuthorizing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isAuthorizing) {
        completeAuthorization(user);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      await completeAuthorization(cred.user);
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      setError(message);
    }
  };

  const handleProviderSignIn = async (provider: 'google' | 'github') => {
    setError('');
    setIsLoading(true);
    const authProvider = provider === 'google' ? googleProvider : githubProvider;

    try {
      const result = await signInWithPopup(auth, authProvider);
      await completeAuthorization(result.user);
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Provider sign-in failed';
      setError(message);
    }
  };

  const anyLoading = isLoading || isAuthorizing;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Connect DeepSession to AI Agent</CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">
              Authorize your agent to manage focus sessions on your behalf.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {isAuthorizing ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Authorizing agent and redirecting...
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleProviderSignIn('google')}
                  disabled={anyLoading}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleProviderSignIn('github')}
                  disabled={anyLoading}
                >
                  <Github className="mr-2 h-4 w-4" />
                  Continue with GitHub
                </Button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or sign in with email
                  </span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mcp-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mcp-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      disabled={anyLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mcp-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mcp-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Your password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                      disabled={anyLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      disabled={anyLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={anyLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Authorize & Continue'
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}