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
    const [tokenData, setTokenData] = useState<{ access_token: string; expires_in: number } | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!code) {
            setStatus('error');
            setErrorMessage('Missing authorization code in URL query parameters.');
            return;
        }

        async function exchangeCode() {
            try {
                // 1. Fetch the code document directly using the authenticated client
                const codeRef = doc(db, 'oauth_codes', code as string);
                const codeSnap = await getDoc(codeRef);

                if (!codeSnap.exists()) {
                    setStatus('error');
                    setErrorMessage('Invalid or already consumed authorization code.');
                    return;
                }

                const data = codeSnap.data();

                // 2. Expiration check
                if (data.expiresAt && data.expiresAt < Date.now()) {
                    await deleteDoc(codeRef);
                    setStatus('error');
                    setErrorMessage('Authorization code has expired.');
                    return;
                }

                // 3. One-time use: Delete code from Firestore
                await deleteDoc(codeRef);

                // 4. Set state with user ID token or session identifier
                const user = auth.currentUser;
                const idToken = user ? await user.getIdToken() : data.uid;

                setTokenData({
                    access_token: idToken,
                    expires_in: 3600,
                });
                setStatus('success');
            } catch (err: unknown) {
                setStatus('error');
                const message = err instanceof Error ? err.message : 'Failed to exchange authorization code.';
                setErrorMessage(message);
            }
        }

        exchangeCode();
    }, [code]);

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

                    {status === 'success' && tokenData && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-medium text-sm">Token issued successfully!</span>
                            </div>
                            <div className="p-3 bg-muted rounded-md text-xs font-mono break-all">
                                {tokenData.access_token}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}