// lib/utils/error.ts

/**
 * Safely formats an unknown error into a user-friendly string.
 * Ensures no `any` usage and always returns a meaningful message.
 */
export function formatError(err: unknown, fallback = 'An unexpected error occurred'): string {
    if (err instanceof Error) {
        return err.message;
    }

    if (typeof err === 'string') {
        return err;
    }

    // Optional: handle Firebase/Auth errors if you use them
    if (typeof err === 'object' && err !== null && 'code' in err) {
        const code = (err as { code?: string }).code;
        return `Error code: ${code ?? 'unknown'}`;
    }

    return fallback;
}

// 🔧 Usage Example
// import { formatError } from '@/utils/error';

// const handleResendVerification = async () => {
//     setResending(true);
//     setMessage('');
//     setError('');

//     try {
//         if (!auth.currentUser) {
//             throw new Error('No authenticated user found');
//         }
//         await sendEmailVerification(auth.currentUser);
//         setMessage('Verification email sent! Check your inbox.');
//     } catch (err: unknown) {
//         setError(formatError(err, 'Failed to send verification email'));
//         setError(`${formatError(err)}. Failed to send verification email`);
//     } finally {
//         setResending(false);
//     }
// };

// 🎯 Usage Examples
// Case 1: Verification Email
// ts
// } catch (err: unknown) {
//   setError(formatError(err, 'Failed to send verification email'));
// }
// Case 2: Login Flow
// ts
// } catch (err: unknown) {
//   setError(formatError(err, 'Login failed. Please try again.'));
// }
// Case 3: Analytics Fetch
// ts
// } catch (err: unknown) {
//   setError(formatError(err, 'Unable to load analytics data.'));
// }