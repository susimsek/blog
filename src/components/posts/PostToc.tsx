import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import { useTranslation } from 'react-i18next';

type TocItem = {
  id: string;
  text: string;
  level: number;
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

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const headings = Array.from(root.querySelectorAll<HTMLElement>('h2, h3')).filter(
      heading => !heading.closest('.post-toc'),
    );
    if (headings.length === 0) {
      setItems([]);
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

      const level = Number(heading.tagName.slice(1));
      tocItems.push({ id: heading.id, text, level });
    }

    const hasTooManyEntries = tocItems.length > 20;
    setItems(hasTooManyEntries ? tocItems.filter(item => item.level === 2) : tocItems);
  }, [content, rootRef]);

  if (items.length < 2) {
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
                  const indentClass = item.level === 3 ? 'ms-3' : undefined;

                  return (
                    <li key={item.id} className={indentClass}>
                      <a
                        href={`#${item.id}`}
                        className="post-toc-link d-inline-block py-1"
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
