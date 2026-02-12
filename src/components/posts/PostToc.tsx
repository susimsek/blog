import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import { useTranslation } from 'react-i18next';

type TocItem = {
  id: string;
  text: string;
};

const areTocItemsEqual = (left: TocItem[], right: TocItem[]) => {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index]?.id !== right[index]?.id || left[index]?.text !== right[index]?.text) {
      return false;
    }
  }

  return true;
};

const slugify = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '');

  const collapsed = normalized
    .replaceAll(/['"]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+/g, '')
    .replaceAll(/-+$/g, '')
    .replaceAll(/-+/g, '-');

  return collapsed || 'section';
};

const createSlugger = () => {
  const counts = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text);
    const current = counts.get(base) ?? 0;
    counts.set(base, current + 1);
    return current === 0 ? base : `${base}-${current}`;
  };
};

interface PostTocProps {
  content: string;
  rootRef: React.RefObject<HTMLElement | null>;
}

export default function PostToc({ content, rootRef }: Readonly<PostTocProps>) {
  const { t } = useTranslation('post');
  const [items, setItems] = React.useState<TocItem[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      setItems([]);
      setActiveId(null);
      return;
    }

    const updateTocItems = () => {
      const headings = Array.from(root.querySelectorAll<HTMLElement>('h2')).filter(
        heading => !heading.closest('.post-toc'),
      );

      if (headings.length === 0) {
        setItems(previous => (previous.length === 0 ? previous : []));
        setActiveId(null);
        return;
      }

      const slug = createSlugger();
      const tocItems: TocItem[] = [];

      for (const heading of headings) {
        const text = (heading.textContent ?? '').trim();
        if (!text) continue;

        if (!heading.id) {
          heading.id = slug(text);
        }

        tocItems.push({ id: heading.id, text });
      }

      setItems(previous => (areTocItemsEqual(previous, tocItems) ? previous : tocItems));
      setActiveId(previous => {
        if (tocItems.length === 0) {
          return null;
        }
        if (previous && tocItems.some(item => item.id === previous)) {
          return previous;
        }
        return tocItems[0]?.id ?? null;
      });
    };

    updateTocItems();

    if (!('MutationObserver' in globalThis)) {
      return;
    }

    const observer = new MutationObserver(updateTocItems);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [content, rootRef]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || items.length === 0) {
      setActiveId(null);
      return;
    }

    const headingElements = items
      .map(item => document.getElementById(item.id))
      .filter((element): element is HTMLElement => !!element && root.contains(element));

    if (headingElements.length === 0) {
      setActiveId(null);
      return;
    }

    const updateActiveHeading = () => {
      const stickyOffset = 128;
      let currentId = headingElements[0].id;

      for (const heading of headingElements) {
        if (heading.getBoundingClientRect().top <= stickyOffset) {
          currentId = heading.id;
        } else {
          break;
        }
      }

      setActiveId(previous => (previous === currentId ? previous : currentId));
    };

    updateActiveHeading();

    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in globalThis) {
      observer = new IntersectionObserver(updateActiveHeading, {
        root: null,
        rootMargin: '-128px 0px -55% 0px',
        threshold: [0, 1],
      });
      for (const heading of headingElements) {
        observer.observe(heading);
      }
    }

    globalThis.window?.addEventListener('scroll', updateActiveHeading, { passive: true });
    globalThis.window?.addEventListener('resize', updateActiveHeading);

    return () => {
      observer?.disconnect();
      globalThis.window?.removeEventListener('scroll', updateActiveHeading);
      globalThis.window?.removeEventListener('resize', updateActiveHeading);
    };
  }, [items, rootRef]);

  if (items.length === 0) {
    return null;
  }

  const tocTitle = t('post.tocTitle');

  return (
    <div className="post-toc mb-4">
      <Accordion defaultActiveKey="0">
        <Accordion.Item eventKey="0">
          <Accordion.Header>{tocTitle}</Accordion.Header>
          <Accordion.Body>
            <nav aria-label={tocTitle}>
              <ul className="list-unstyled mb-0">
                {items.map(item => {
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`post-toc-link d-inline-block py-1${activeId === item.id ? ' is-active' : ''}`}
                        aria-current={activeId === item.id ? 'location' : undefined}
                        onClick={e => {
                          e.preventDefault();
                          const root = rootRef.current;
                          const el = document.getElementById(item.id);
                          if (root && el && !root.contains(el)) return;
                          if (!el) return;

                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          globalThis.window?.history.pushState(null, '', `#${item.id}`);
                        }}
                      >
                        {item.text}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}
