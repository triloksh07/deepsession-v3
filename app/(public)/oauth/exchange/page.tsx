// app/(public)/oauth/exchange/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TokenExchangePage() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [redirectingTo, setRedirectingTo] = useState<string | null>(null);

    useEffect(() => {
        if (!code) {
            setStatus('error');
            setErrorMessage('Missing authorization code in URL query parameters.');
            return;
        }

        async function verifyAndRedirect() {
            try {
                // FIX: this page no longer mints or hands out an access token.
                // It only confirms the code still exists (hasn't expired / already
                // been used), then redirects the caller back with the authorization
                // `code` itself. The real token issuance happens server-to-server
                // when Claude calls POST /api/oauth/token with this code + the PKCE
                // code_verifier — matching the authorization_code grant advertised
                // in /.well-known/oauth-authorization-server.
                const codeRef = doc(db, 'oauth_codes', code as string);
                const codeSnap = await getDoc(codeRef);

                if (!codeSnap.exists()) {
                    setStatus('error');
                    setErrorMessage('Invalid or already-used authorization code.');
                    return;
                }

                const data = codeSnap.data();
                const targetRedirectUri = data.redirect_uri || searchParams.get('redirect_uri');
                const state = data.state || searchParams.get('state');

                if (!targetRedirectUri) {
                    // Fallback for manual/local testing without a redirect_uri
                    setStatus('success');
                    return;
                }

                const callbackUrl = new URL(targetRedirectUri);
                callbackUrl.searchParams.set('code', code as string);
                if (state) callbackUrl.searchParams.set('state', state);

                setRedirectingTo(callbackUrl.toString());
                setStatus('success');

                setTimeout(() => {
                    window.location.href = callbackUrl.toString();
                }, 800);
            } catch (err: unknown) {
                setStatus('error');
                const message = err instanceof Error ? err.message : 'Failed to verify authorization code.';
                setErrorMessage(message);
            }
        }

        verifyAndRedirect();
    }, [code, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>OAuth Authorization</CardTitle>
                </CardHeader>
                <CardContent>
                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-6 space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Finalizing authorization...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}


                    {
                        status === 'success' && (
                            <div className="flex flex-col items-center space-y-3 py-4" >
                                <CheckCircle2 className="h-10 w-10 text-green-500" />
                                <p className="font-semibold text-base" > Authorization Successful! </p>
                                {
                                    redirectingTo ? (
                                        <p className="text-xs text-muted-foreground" >
                                            Redirecting back to application...
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground" >
                                            Authentication complete.You may now close this window.
                                        </p>
                                    )
                                }
                            </div>
                        )
                    }
                </CardContent>
            </Card>
        </div>
    );
}