import { stripHtmlTags, stripMarkdownCode, stripMarkdownFormatting, stripMarkdownLinks } from '@/lib/markdownText';

describe('markdown text helpers', () => {
  it('removes Markdown links and images while preserving their labels', () => {
    expect(stripMarkdownLinks('Read [the guide](https://example.com) and ![cover](cover.png).')).toBe(
      'Read the guide and cover.',
    );
  });

  it('supports empty labels and destinations only when requested', () => {
    expect(stripMarkdownLinks('[](path) [label]()')).toBe('[](path) [label]()');
    expect(stripMarkdownLinks('[](path) [label]()', { allowEmptyLabel: true, allowEmptyDestination: true })).toBe(
      ' label',
    );
  });

  it('leaves malformed link syntax intact', () => {
    expect(stripMarkdownLinks('[unfinished (path) and [label] without a destination')).toBe(
      '[unfinished (path) and [label] without a destination',
    );
  });

  it('removes HTML tags with the requested replacement and preserves incomplete text', () => {
    expect(stripHtmlTags('one<strong>two</strong><>three<unfinished', ' ')).toBe('one two <>three<unfinished');
    expect(stripHtmlTags('plain text')).toBe('plain text');
  });

  it('strips fenced and inline code while leaving unmatched delimiters intact', () => {
    const markdown = 'before ```ts\nhidden\n``` and ~~~go\nhidden too\n~~~ plus `secret` and `open';
    expect(stripMarkdownCode(markdown)).toBe('before   and   plus   and `open');
    expect(stripMarkdownCode('before```hidden```after')).toBe('before after');
    expect(stripMarkdownCode('plain text')).toBe('plain text');
  });

  it('removes inline formatting delimiters but preserves their content', () => {
    expect(stripMarkdownFormatting('**bold** _italic_ ~~deleted~~ `code`')).toBe('bold italic deleted code');
    expect(stripMarkdownFormatting('**** `` unmatched*')).toBe(' `` unmatched*');
  });
});
