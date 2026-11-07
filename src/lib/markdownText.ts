type MarkdownLinkOptions = {
  allowEmptyLabel?: boolean;
  allowEmptyDestination?: boolean;
};

const nextOccurrenceIndexes = (value: string, delimiter: string): Int32Array => {
  const indexes = new Int32Array(value.length + 1);
  let nextIndex = value.length;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    if (value.startsWith(delimiter, index)) {
      nextIndex = index;
    }
    indexes[index] = nextIndex;
  }

  indexes[value.length] = value.length;
  return indexes;
};

export const stripMarkdownLinks = (
  value: string,
  { allowEmptyLabel = false, allowEmptyDestination = false }: MarkdownLinkOptions = {},
): string => {
  const closingBracketIndexes = nextOccurrenceIndexes(value, ']');
  const closingParenthesisIndexes = nextOccurrenceIndexes(value, ')');
  const parts: string[] = [];
  let index = 0;
  let textStart = 0;

  while (index < value.length) {
    const isImage = value.startsWith('![', index);
    if (!isImage && value[index] !== '[') {
      index += 1;
      continue;
    }

    const labelStart = index + (isImage ? 2 : 1);
    const labelEnd = closingBracketIndexes[labelStart] ?? value.length;
    if (
      labelEnd >= value.length ||
      (!isImage && !allowEmptyLabel && labelEnd === labelStart) ||
      value[labelEnd + 1] !== '('
    ) {
      index += 1;
      continue;
    }

    const destinationStart = labelEnd + 2;
    const destinationEnd = closingParenthesisIndexes[destinationStart] ?? value.length;
    if (destinationEnd >= value.length || (!allowEmptyDestination && destinationEnd === destinationStart)) {
      index += 1;
      continue;
    }

    parts.push(value.slice(textStart, index), value.slice(labelStart, labelEnd));
    index = destinationEnd + 1;
    textStart = index;
  }

  parts.push(value.slice(textStart));
  return parts.join('');
};

const stripDelimitedContent = (value: string, delimiter: string): string => {
  const nextDelimiters = nextOccurrenceIndexes(value, delimiter);
  const parts: string[] = [];
  let index = 0;
  let textStart = 0;

  while (index < value.length) {
    if (value.startsWith(delimiter, index)) {
      const closingIndex = nextDelimiters[index + delimiter.length] ?? value.length;
      if (closingIndex < value.length) {
        parts.push(value.slice(textStart, index), ' ');
        index = closingIndex + delimiter.length;
        textStart = index;
        continue;
      }
    }
    index += 1;
  }

  parts.push(value.slice(textStart));
  return parts.join('');
};

const stripDelimiterPairs = (value: string, delimiter: string, allowEmpty = true): string => {
  const nextDelimiters = nextOccurrenceIndexes(value, delimiter);
  const parts: string[] = [];
  let index = 0;
  let textStart = 0;

  while (index < value.length) {
    if (value.startsWith(delimiter, index)) {
      const contentStart = index + delimiter.length;
      const closingIndex = nextDelimiters[contentStart] ?? value.length;
      if (closingIndex < value.length && (allowEmpty || closingIndex > contentStart)) {
        parts.push(value.slice(textStart, index), value.slice(contentStart, closingIndex));
        index = closingIndex + delimiter.length;
        textStart = index;
        continue;
      }
    }
    index += 1;
  }

  parts.push(value.slice(textStart));
  return parts.join('');
};

export const stripMarkdownCode = (value: string): string =>
  stripDelimitedContent(stripDelimitedContent(stripDelimitedContent(value, '```'), '~~~'), '`');

export const stripMarkdownFormatting = (value: string): string => {
  const withoutInlineCode = stripDelimiterPairs(value, '`', false);
  const withoutStrong = stripDelimiterPairs(stripDelimiterPairs(withoutInlineCode, '**'), '__');
  const withoutEmphasis = stripDelimiterPairs(stripDelimiterPairs(withoutStrong, '*'), '_');
  return stripDelimiterPairs(withoutEmphasis, '~~');
};

export const stripHtmlTags = (value: string, replacement = ''): string => {
  const parts: string[] = [];
  let textStart = 0;
  let index = 0;
  let tagStart = -1;

  while (index < value.length) {
    if (tagStart < 0) {
      if (value[index] === '<') {
        tagStart = index;
      }
    } else if (index === tagStart + 1 && value[index] === '>') {
      tagStart = -1;
    } else if (value[index] === '>') {
      parts.push(value.slice(textStart, tagStart), replacement);
      textStart = index + 1;
      tagStart = -1;
    }
    index += 1;
  }

  parts.push(value.slice(textStart));
  return parts.join('');
};
