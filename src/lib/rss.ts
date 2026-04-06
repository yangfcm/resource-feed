import Parser from 'rss-parser'

type CustomFeed = Record<string, unknown>
type CustomItem = {
  'media:content'?: { $?: { url?: string; medium?: string } }
  'content:encoded'?: string
  enclosure?: { url?: string; type?: string }
}

const parser = new Parser<CustomFeed, CustomItem>({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['content:encoded', 'content:encoded'],
    ],
  },
  timeout: 10000,
})

export interface ParsedFeedItem {
  title: string
  description: string
  content: string
  thumbnail: string
  link: string
  guid: string
  publishedAt: Date
}

export interface ParsedFeed {
  title: string
  description: string
  siteUrl: string
  favicon: string
  items: ParsedFeedItem[]
}

function extractThumbnail(item: Parser.Item & CustomItem): string {
  // Priority 1: enclosure with image type
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url
  }

  // Priority 2: media:content with image medium
  const mediaContent = item['media:content']
  if (mediaContent?.$?.url) {
    return mediaContent.$.url
  }

  // Priority 3: first <img> in content
  const html = item['content:encoded'] || item.content || ''
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (imgMatch?.[1]) return imgMatch[1]

  return ''
}

function extractDescription(item: Parser.Item & CustomItem): string {
  const raw = item.contentSnippet || item.summary || ''
  return raw.slice(0, 300)
}

function extractContent(item: Parser.Item & CustomItem): string {
  return item['content:encoded'] || item.content || item.summary || ''
}

export async function fetchAndParseFeed(rssUrl: string): Promise<ParsedFeed> {
  const feed = await parser.parseURL(rssUrl)

  let siteUrl = feed.link || ''
  let domain = ''
  try {
    domain = new URL(siteUrl || rssUrl).hostname
  } catch {
    domain = ''
  }

  const favicon = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    : ''

  const items: ParsedFeedItem[] = (feed.items || []).map((item) => {
    const customItem = item as Parser.Item & CustomItem
    return {
      title: item.title || 'Untitled',
      description: extractDescription(customItem),
      content: extractContent(customItem),
      thumbnail: extractThumbnail(customItem),
      link: item.link || '',
      guid: item.guid || item.link || item.title || String(Date.now()),
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
    }
  })

  return {
    title: feed.title || 'Unknown Feed',
    description: feed.description || '',
    siteUrl,
    favicon,
    items,
  }
}
