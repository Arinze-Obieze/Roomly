import { createClient } from '@/core/utils/supabase/server';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://roomfind.ie';

  // Core static static routes
  const staticRoutes = [
    '',
    '/login',
    '/signup',
    '/problems',
    '/solutions',
    '/how-it-works',
    '/pricing',
    '/contact',
    '/about',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    const supabase = await createClient();
    
    // Fetch active properties for dynamic routes
    const { data: properties } = await supabase
      .from('properties')
      .select('id, updated_at')
      .eq('is_active', true)
      .eq('approval_status', 'approved');

    const propertyRoutes = (properties || []).map((property) => ({
      url: `${baseUrl}/listings/${property.id}`,
      lastModified: property.updated_at || new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.9,
    }));

    return [...staticRoutes, ...propertyRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static routes at minimum if DB connection fails
    return staticRoutes;
  }
}
