I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The current home page (`app/page.tsx`) is a client component that renders marketing sections. All section components (Hero, Features, Architecture, UseCases, QuickStart) are pure presentational with no client-side state. The `Navigation` component requires client-side state for mobile menu and smooth scrolling, while `Footer` is purely presentational. The project uses Next.js 15.5.4 with App Router, and there's already a `(public)` route group for public pages. No pricing, docs, or blog pages exist yet.


### Approach

Convert the home page to a Server Component for SSG/SSR benefits while keeping interactive components client-side. Create new SSG pages for pricing and docs with proper metadata. Implement a dynamic blog with static generation using a simple content structure. Ensure all pages have comprehensive SEO metadata (title, description, Open Graph tags) while maintaining the existing design system and component structure.


### Reasoning

I explored the current page structure, examined all section components to identify client-side dependencies, reviewed the root layout for metadata patterns, checked the Next.js configuration for CSP and headers, verified the project structure for existing public pages, and confirmed no pricing/docs/blog pages exist yet.


## Proposed File Changes

### app/page.tsx(MODIFY)

Remove the `"use client"` directive to convert this to a Server Component for SSG benefits. Add a comprehensive `metadata` export with title, description, and Open Graph tags for SEO. Keep the component structure identical but ensure it renders as a Server Component. The existing imports for `Navigation`, `Hero`, `Features`, `Architecture`, `UseCases`, `QuickStart`, and `Footer` will work as-is since Server Components can render both Server and Client Components.

### app/_components/Navigation.tsx(MODIFY)

Add `"use client"` directive at the top of the file to explicitly mark this as a Client Component. This is necessary because it uses `useState` for mobile menu toggle and has interactive scroll behavior. No other changes needed—the component already has all the client-side functionality properly implemented.

### app/_components/Footer.tsx(MODIFY)

Ensure this remains a Server Component (no `"use client"` directive). The component is purely presentational with no hooks or state. Update the footer links to use proper Next.js `Link` components for internal navigation where applicable (e.g., link to `/pricing`, `/docs`, `/blog` when those pages are created). Keep external links as anchor tags.

### app/(public)/pricing/page.tsx(NEW)

References: 

- app/_components/Navigation.tsx(MODIFY)
- app/_components/Footer.tsx(MODIFY)
- app/_components/sections/Features.tsx(MODIFY)

Create a new Server Component for the pricing page with SSG. Export comprehensive `metadata` with title "Pricing - DeepSession", description about pricing plans, and Open Graph tags. Design a pricing section with multiple tiers (e.g., Free, Pro, Enterprise) using the existing design system from `app/_components/sections/Features.tsx` as reference. Include feature comparisons, pricing cards with CTAs linking to `/signup`, and FAQ section. Use Tailwind classes consistent with the existing dark theme (slate-900, slate-800, blue-500, emerald-500). Import and render `Navigation` and `Footer` components for consistent layout.

### app/(public)/docs/page.tsx(NEW)

References: 

- app/_components/Navigation.tsx(MODIFY)
- app/_components/Footer.tsx(MODIFY)
- app/_components/sections/QuickStart.tsx(MODIFY)

Create a new Server Component for the documentation page with SSG. Export comprehensive `metadata` with title "Documentation - DeepSession", description about getting started and API docs, and Open Graph tags. Design a documentation landing page with sections: Getting Started, Features Guide, API Reference, Architecture Overview, Troubleshooting, and FAQ. Use a two-column layout with a sidebar navigation (can be static for now) and main content area. Style with the existing dark theme and use components from `app/_components/sections/QuickStart.tsx` as reference for code snippets and step-by-step guides. Include links to specific doc sections and external resources. Import and render `Navigation` and `Footer` components.

### lib/blog-posts.ts(NEW)

Create a TypeScript file that exports blog post data structure. Define a `BlogPost` type with fields: `slug` (string), `title` (string), `description` (string), `content` (string or array of content blocks), `author` (string), `date` (string), `tags` (string array), `coverImage` (optional string). Export a `blogPosts` array with 3-5 sample blog posts about DeepSession features, productivity tips, architecture deep-dives, etc. Also export a `getBlogPost(slug: string)` function that returns a single post by slug, and `getAllBlogSlugs()` function that returns all slugs for `generateStaticParams()`. Keep content simple—use string-based content that can be rendered as paragraphs.

### app/(public)/blog/page.tsx(NEW)

References: 

- lib/blog-posts.ts(NEW)
- app/_components/Navigation.tsx(MODIFY)
- app/_components/Footer.tsx(MODIFY)
- app/_components/sections/Features.tsx(MODIFY)

Create a Server Component for the blog listing page with SSG. Export comprehensive `metadata` with title "Blog - DeepSession", description about articles and updates, and Open Graph tags. Import `blogPosts` from `lib/blog-posts.ts` and render a grid of blog post cards. Each card should display the post title, description, author, date, tags, and a "Read More" link to `/blog/[slug]`. Use the existing design system with card components similar to `app/_components/sections/Features.tsx`. Include a hero section at the top introducing the blog. Import and render `Navigation` and `Footer` components.

### app/(public)/blog/[slug]/page.tsx(NEW)

References: 

- lib/blog-posts.ts(NEW)
- app/_components/Navigation.tsx(MODIFY)
- app/_components/Footer.tsx(MODIFY)

Create a dynamic Server Component for individual blog posts with SSG. Export `generateStaticParams()` function that calls `getAllBlogSlugs()` from `lib/blog-posts.ts` to return all blog post slugs for static generation at build time. Export `generateMetadata()` function that takes `params` with `slug`, calls `getBlogPost(slug)`, and returns dynamic metadata with the post title, description, author, and Open Graph tags including og:image if available. In the component, accept `params` prop, fetch the blog post using `getBlogPost(params.slug)`, and render the full blog post with title, author, date, tags, and content. Style the article with proper typography (larger text, good line-height, max-width for readability). Include a "Back to Blog" link. Import and render `Navigation` and `Footer` components. Handle 404 case with `notFound()` if slug doesn't exist.

### app/_components/sections/Hero.tsx(MODIFY)

Ensure this remains a Server Component (no `"use client"` directive needed). The component is purely presentational and uses `Link` from Next.js which works in Server Components. No changes to functionality—just verify it's not marked as a client component.

### app/_components/sections/Features.tsx(MODIFY)

Ensure this remains a Server Component (no `"use client"` directive needed). The component maps over a static array and is purely presentational. No changes to functionality—just verify it's not marked as a client component.

### app/_components/sections/Architecture.tsx(MODIFY)

Ensure this remains a Server Component (no `"use client"` directive needed). The component is purely presentational with static data. No changes to functionality—just verify it's not marked as a client component.

### app/_components/sections/UseCases.tsx(MODIFY)

Ensure this remains a Server Component (no `"use client"` directive needed). The component is purely presentational with static data. No changes to functionality—just verify it's not marked as a client component.

### app/_components/sections/QuickStart.tsx(MODIFY)

Ensure this remains a Server Component (no `"use client"` directive needed). The component is purely presentational with static data. No changes to functionality—just verify it's not marked as a client component.