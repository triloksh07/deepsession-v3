import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Dashboard',
    description: 'Overview of your current focus status and daily progress.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // This server layout is intentionally thin: it only provides metadata
    // Keeping metadata here ensures SSR SEO
    return (
        <>
            {children}
        </>
    );
}