import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check } from 'lucide-react';
import { useState, ReactNode, useMemo } from 'react';
import { Button } from '@/components/ui/button';

interface PostContentProps {
  content: string;
}

// Generate slug from heading text (must match TableOfContents.tsx logic)
const generateSlug = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

// Extract text content from React children
const getTextContent = (children: ReactNode): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return getTextContent((children as { props: { children?: ReactNode } }).props.children);
  }
  return '';
};

// Pre-compute heading IDs from content to handle duplicates
// This ensures IDs match between PostContent and TableOfContents
const computeHeadingIds = (content: string): Map<string, string[]> => {
  // Remove code blocks first to match TableOfContents logic
  const codeBlockRegex = /```[\s\S]*?```|`[^`\n]+`/g;
  const contentWithoutCode = content.replace(codeBlockRegex, '');

  const regex = /^(#{1,6})\s+(.+)$/gm;
  const headingIds = new Map<string, string[]>();
  const idCounts: Record<string, number> = {};
  let match;

  while ((match = regex.exec(contentWithoutCode)) !== null) {
    const text = match[2].trim();
    if (!text || text.startsWith('//') || text.startsWith('/*')) continue;

    const baseId = generateSlug(text);

    let uniqueId: string;
    if (idCounts[baseId] !== undefined) {
      idCounts[baseId]++;
      uniqueId = `${baseId}-${idCounts[baseId]}`;
    } else {
      idCounts[baseId] = 0;
      uniqueId = baseId;
    }

    // Store the unique ID for this heading text occurrence
    if (!headingIds.has(text)) {
      headingIds.set(text, []);
    }
    headingIds.get(text)!.push(uniqueId);
  }

  return headingIds;
};

// Create heading component factory that uses pre-computed IDs
const createHeadingFactory = (headingIds: Map<string, string[]>) => {
  const usedCounts: Record<string, number> = {};

  return (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    const HeadingComponent = ({ children }: { children?: ReactNode }) => {
      const text = getTextContent(children);
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;

      // Get the next available ID for this heading text
      const ids = headingIds.get(text) || [generateSlug(text)];
      const countKey = text;
      if (usedCounts[countKey] === undefined) {
        usedCounts[countKey] = 0;
      }
      const id = ids[usedCounts[countKey]] || generateSlug(text);
      usedCounts[countKey]++;

      return (
        <Tag id={id} className="scroll-mt-24">
          {children}
        </Tag>
      );
    };
    return HeadingComponent;
  };
};

const CodeBlock = ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const isInline = !className;

  const handleCopy = async () => {
    const code = String(children).replace(/\n$/, '');
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isInline) {
    return <code className={className} {...props}>{children}</code>;
  }

  return (
    <div className="relative group">
      {language && (
        <span className="absolute top-3 left-4 text-xs text-muted-foreground font-mono">
          {language}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <code className={className} {...props}>
        {children}
      </code>
    </div>
  );
};

export const PostContent = ({ content }: PostContentProps) => {
  // Pre-compute heading IDs to handle duplicates
  const headingIds = useMemo(() => computeHeadingIds(content), [content]);
  const createHeading = useMemo(() => createHeadingFactory(headingIds), [headingIds]);

  return (
    <div className="prose-custom">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: createHeading(1),
          h2: createHeading(2),
          h3: createHeading(3),
          h4: createHeading(4),
          h5: createHeading(5),
          h6: createHeading(6),
          code: CodeBlock,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
