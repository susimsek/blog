import fs from 'fs';
import path from 'path';
import RSS from 'rss';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'content/posts/en');

/**
 * Tüm yazıları alır
 * @returns {Array} PostSummary[]
 */
function getAllPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR);

  return files.map((fileName) => {
    const filePath = path.join(POSTS_DIR, fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      id: fileName.replace(/\.md$/, ''),
      title: data.title,
      date: new Date(data.date).toUTCString(),
      summary: data.summary,
      thumbnail: data.thumbnail,
      topics: data.topics,
      readingTime: data.readingTime,
      content,
    };
  });
}

/**
 * RSS feed oluşturur
 */
function generateRssFeed() {
  const siteUrl = 'https://susimsek.github.io/blog';
  const posts = getAllPosts();

  const feed = new RSS({
    title: "Şuayb Şimşek's Blog (EN)",
    description: "Explore the latest articles, tutorials, and insights on my blog. Discover a variety of topics including programming, technology, and more.",
    site_url: siteUrl,
    feed_url: `${siteUrl}/rss.xml`,
    language: 'en',
    lastBuildDate: new Date().toUTCString(),
  });

  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.summary,
      url: `${siteUrl}/posts/${post.id}`,
      date: post.date,
      guid: `${siteUrl}/posts/${post.id}`,
      enclosure: post.thumbnail
        ? {
          url: `${siteUrl}${post.thumbnail}`,
        }
        : undefined,
      custom_elements: [
        { 'content:encoded': `<![CDATA[<div>${post.content}</div>]]>` },
      ],
    });
  });

  const rss = feed.xml({ indent: true });
  const outputDir = path.join(process.cwd(), 'public');
  const outputPath = path.join(outputDir, 'rss.xml');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, rss);
  console.log('RSS feed generated at public/rss.xml!');
}
