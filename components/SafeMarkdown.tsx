import React from 'react';
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

const securitySchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // Allow className for syntax highlighting if you add it later
    code: [['className']],
  },
  protocols: {
    ...defaultSchema.protocols,
    // STRICT whitelist: block javascript:, data:, vbscript:
    href: ['http', 'https', 'mailto'],
  },
};

// The 'memo' is crucial here. 
// Without it, Virtualization unmounting/mounting items might trigger 
// expensive re-calculations on neighbor items.
export const SafeMarkdown = memo(({ content, className }: SafeMarkdownProps) => {
  if (!content) return null;

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none wrap-break-word ${className}`}>
      <ReactMarkdown
        rehypePlugins={[[rehypeSanitize, securitySchema]]}
        components={{
          // Force external links to open in new tab securely
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />
          ),
          // Style blockquotes to match Shadcn theme
          blockquote: ({ node, ...props }) => (
            <blockquote {...props} className="border-l-2 border-primary pl-4 italic" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}, (prev, next) => prev.content === next.content);

SafeMarkdown.displayName = 'SafeMarkdown';