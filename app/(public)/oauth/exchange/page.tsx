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
    // const [tokenData, setTokenData] = useState<{ access_token: string; expires_in: number } | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [redirectingTo, setRedirectingTo] = useState<string | null>(null);

    useEffect(() => {
        if (!code) {
            setStatus('error');
            setErrorMessage('Missing authorization code in URL query parameters.');
            return;
        }

        async function processExchangeAndRedirect() {
            try {
                // Fetch the code document directly using the authenticated client
                const codeRef = doc(db, 'oauth_codes', code as string);
                const codeSnap = await getDoc(codeRef);

                if (!codeSnap.exists()) {
                    setStatus('error');
                    setErrorMessage('Invalid authorization code.');
                    return;
                }

                const data = codeSnap.data();

                // Expiration check
                if (data.expiresAt && data.expiresAt < Date.now()) {
                    await deleteDoc(codeRef);
                    setStatus('error');
                    setErrorMessage('Authorization code has expired.');
                    return;
                }

                // One-time use: Delete code from Firestore
                await deleteDoc(codeRef);

                // Set state with user ID token or session identifier
                const user = auth.currentUser;
                if (!user) {
                    setStatus('error');
                    setErrorMessage('User session expired. Please log in again.');
                    return;
                }

                const idToken = await user.getIdToken();

                // Construct Final Callback URL
                const targetRedirectUri = data.redirect_uri || searchParams.get('redirect_uri');
                const state = data.state || searchParams.get('state');

                if (targetRedirectUri) {
                    const callbackUrl = new URL(targetRedirectUri);

                    // Pass access token and standard OAuth params in hash fragment or query depending on response_type
                    callbackUrl.searchParams.set('access_token', idToken);
                    callbackUrl.searchParams.set('token_type', 'Bearer');
                    if (state) callbackUrl.searchParams.set('state', state);

                    setRedirectingTo(callbackUrl.toString());
                    setStatus('success');

                    // Automatic redirection after brief status confirmation
                    setTimeout(() => {
                        window.location.href = callbackUrl.toString();
                    }, 1200);
                } else {
                    // Fallback if testing manually without a redirect_uri
                    setStatus('success');
                }
            } catch (err: unknown) {
                setStatus('error');
                const message = err instanceof Error ? err.message : 'Failed to exchange authorization code.';
                setErrorMessage(message);
            }
        }

        processExchangeAndRedirect();
    }, [code, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>OAuth Token Exchange</CardTitle>
                </CardHeader>
                <CardContent>
                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-6 space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Exchanging authorization code...</p>
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

                    {/* {status === 'success' && tokenData && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-medium text-sm">Token issued successfully!</span>
                            </div>
                            <div className="p-3 bg-muted rounded-md text-xs font-mono break-all">
                                {tokenData.access_token}
                            </div>
                        </div>
                    )} */}
                </CardContent>
            </Card>
        </div>
    );
}