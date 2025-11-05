import React, { useState } from 'react';
// ... (imports)
import { 
  User, 
  Mail, 
  Lock, 
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
// 1. ADD ICONS for Google and GitHub
import { Chrome, Github } from 'lucide-react'; 

// 2. UPDATE THE PROPS
interface AuthProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSignup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  // --- ADD THESE NEW PROPS ---
  onGoogleSignIn: () => Promise<{ success: boolean; error?: string }>;
  onGitHubSignIn: () => Promise<{ success: boolean; error?: string }>;
  // ---
  isLoading: boolean; // This will now be for email/pass
  isProviderLoading: boolean; // For Google/GitHub
}

export function Auth({ 
  onLogin, 
  onSignup, 
  onGoogleSignIn, 
  onGitHubSignIn, 
  isLoading, 
  isProviderLoading 
}: AuthProps) {
  // ... (all existing state is fine)
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({ ... });
  const [error, setError] = useState('');

  // ... (handleSubmit, resetForm, handleTabChange are all fine)

  // --- 3. ADD NEW HANDLERS FOR PROVIDERS ---
  const handleProviderSignIn = async (provider: 'google' | 'github') => {
    setError('');
    try {
      let result;
      if (provider === 'google') {
        result = await onGoogleSignIn();
      } else {
        result = await onGitHubSignIn();
      }

      if (!result.success) {
        setError(result.error || 'An error occurred');
      }
      // On success, the onAuthStateChanged in page.tsx will handle it
    } catch (error: any) {
      console.error('Provider sign-in error:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        {/* ... (CardHeader is fine) ... */}

        <CardContent>
          {/* --- 4. ADD PROVIDER BUTTONS --- */}
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => handleProviderSignIn('google')}
              disabled={isLoading || isProviderLoading}
            >
              {isProviderLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Sign in with Google
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => handleProviderSignIn('github')}
              disabled={isLoading || isProviderLoading}
            >
              {isProviderLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Github className="mr-2 h-4 w-4" />
              )}
              Sign in with GitHub
            </Button>
          </div>

          {/* --- 5. ADD SEPARATOR --- */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with {activeTab === 'login' ? 'email' : 'email sign up'}
              </span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            {/* ... (rest of the component: TabsList, error Alert, TabsContent) ... */}
            {/* ... (No changes needed inside the forms) ... */}
          </Tabs>

          {/* ... (The toggle sign in/sign up link is fine) ... */}
        </CardContent>
      </Card>
    </div>
  );
}