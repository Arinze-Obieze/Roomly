export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://roomfind.ie';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/superadmin/', '/api/', '/messages/', '/settings/', '/profile/edit'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
