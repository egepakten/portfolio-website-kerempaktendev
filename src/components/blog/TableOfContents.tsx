import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export const TableOfContents = ({ content }: TableOfContentsProps) => {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const tocListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Extract headings from markdown content
    // First, remove code blocks to avoid picking up # in code
    const codeBlockRegex = /```[\s\S]*?```|`[^`\n]+`/g;
    const contentWithoutCode = content.replace(codeBlockRegex, '');

    const regex = /^(#{1,3})\s+(.+)$/gm;
    const matches: TOCItem[] = [];
    const idCounts: Record<string, number> = {};
    let match;

    while ((match = regex.exec(contentWithoutCode)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      // Skip empty headers or headers that look like code comments
      if (!text || text.startsWith('//') || text.startsWith('/*')) continue;

      const baseId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Track duplicate IDs and make them unique
      if (idCounts[baseId] !== undefined) {
        idCounts[baseId]++;
        matches.push({ id: `${baseId}-${idCounts[baseId]}`, text, level });
      } else {
        idCounts[baseId] = 0;
        matches.push({ id: baseId, text, level });
      }
    }

    setHeadings(matches);
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      // Get all heading elements with their positions
      const headingElements = headings
        .map((heading) => {
          const element = document.getElementById(heading.id);
          if (element) {
            return {
              id: heading.id,
              top: element.getBoundingClientRect().top,
            };
          }
          return null;
        })
        .filter(Boolean) as { id: string; top: number }[];

      // Find the heading that is closest to the top but still visible or just passed
      // We use a threshold of 120px from the top of the viewport
      const threshold = 120;
      let activeHeading = headingElements[0]?.id || '';

      for (const heading of headingElements) {
        if (heading.top <= threshold) {
          activeHeading = heading.id;
        } else {
          break;
        }
      }

      setActiveId(activeHeading);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  // Auto-scroll the TOC list to keep the active heading visible
  useEffect(() => {
    if (!activeId || !tocListRef.current) return;

    const activeIndex = headings.findIndex(h => h.id === activeId);
    if (activeIndex === -1) return;

    const tocList = tocListRef.current;
    const listItems = tocList.querySelectorAll('li');
    const activeItem = listItems[activeIndex];

    if (activeItem) {
      const listRect = tocList.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      // Check if the active item is outside the visible area
      if (itemRect.top < listRect.top || itemRect.bottom > listRect.bottom) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeId, headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
      <h4 className="font-semibold text-sm mb-4 flex-shrink-0">On this page</h4>
      <ul ref={tocListRef} className="space-y-2 text-sm overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent scroll-smooth">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(heading.id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  // Update URL hash without jumping
                  window.history.pushState(null, '', `#${heading.id}`);
                }
              }}
              className={`block py-1 transition-colors ${
                activeId === heading.id
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export const ReadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;
      setProgress(scrolled);
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <motion.div
      className="reading-progress"
      style={{ width: `${progress}%` }}
      initial={{ width: 0 }}
    />
  );
};
