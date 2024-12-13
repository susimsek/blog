export const splitContentWithTabs = (content: string) => {
  const tabSectionsRegex = /:::tabs([\s\S]*?):::/gm;

  return [...content.split(tabSectionsRegex)].reduce<Array<{ type: 'tabs' | 'markdown'; content: string }>>(
    (segments, segment, index) => {
      const type = index % 2 === 0 ? 'markdown' : 'tabs';

      if (segment.trim()) {
        segments.push({
          type,
          content: segment.trim(),
        });
      }

      return segments;
    },
    [],
  );
};
