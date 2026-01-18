import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Sessions',
    description: 'Overview of your current focus status and daily progress.',
    openGraph: {
        title: 'Sessions',
        description: 'Overview of your current focus status and daily progress.',
        type: 'website',
    },
    // Add other SEO fields here (twitter, icons, alternates, etc.) as needed
};

export default function SessionsLayout({ children }: { children: React.ReactNode }) {
    // This server layout is intentionally thin: it only provides metadata
    // Keeping metadata here ensures SSR SEO
    return (
        <>
            {children}
        </>
    );
}