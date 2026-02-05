export const splitContentWithTabs = (content: string) => {
  const tabSectionsRegex = /:::tabs([\s\S]*?):::/gm;

  return content
    .split(tabSectionsRegex)
    .reduce<Array<{ id: string; type: 'tabs' | 'markdown'; content: string }>>((segments, segment, index) => {
      const type = index % 2 === 0 ? 'markdown' : 'tabs';

      if (segment.trim()) {
        segments.push({
          id: `${type}-${index}`,
          type,
          content: segment.trim(),
        });
      }

      return segments;
    }, []);
};
