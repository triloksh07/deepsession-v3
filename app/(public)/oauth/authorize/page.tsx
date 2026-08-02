'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase'; // Your standard Firebase instance
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  onAuthStateChanged 
} from 'firebase/auth';

import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function MCPAuthPage() {
  const searchParams = useSearchParams();
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const completeAuthorization = async (user: any) => {
    setLoading(true);
    const idToken = await user.getIdToken();

    const res = await fetch('/api/oauth/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    const data = await res.json();
    if (data.code && redirectUri) {
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set('code', data.code);
      if (state) redirectUrl.searchParams.set('state', state);
      window.location.href = redirectUrl.toString();
    }
  };

  useEffect(() => {
    // If user is already logged in, complete the flow automatically
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) completeAuthorization(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-lg shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-2">Connect DeepSession to AI Agent</h1>
        <p className="text-sm text-slate-400 mb-6">Authorize your agent to manage focus sprints on your behalf.</p>

        {loading ? (
          <p className="text-blue-400 font-medium">Authorizing agent and redirecting...</p>
        ) : (
          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-2 rounded bg-slate-700 text-white" 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full p-2 rounded bg-slate-700 text-white" 
            />
            <button 
              onClick={async () => {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                await completeAuthorization(cred.user);
              }}
              className="w-full p-2 rounded bg-blue-600 font-bold hover:bg-blue-500"
            >
              Log In & Authorize
            </button>
            <hr className="border-slate-700" />
            <button 
              onClick={async () => {
                const cred = await signInWithPopup(auth, new GoogleAuthProvider());
                await completeAuthorization(cred.user);
              }}
              className="w-full p-2 rounded bg-slate-700 font-medium hover:bg-slate-600"
            >
              Sign In with Google
            </button>
            <button 
              onClick={async () => {
                const cred = await signInWithPopup(auth, new GithubAuthProvider());
                await completeAuthorization(cred.user);
              }}
              className="w-full p-2 rounded bg-slate-700 font-medium hover:bg-slate-600"
            >
              Sign In with GitHub
            </button>
          </div>
        )}
      </div>
    </div>
  );
}