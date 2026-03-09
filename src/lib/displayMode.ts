import { supabase } from './supabase';

/**
 * Reads the user's display_mode setting and redirects if the current page
 * type doesn't match.
 *
 * @param userId   - The authenticated user's ID
 * @param pageType - 'desktop' for the main app pages, 'mobile' for /mobile-dashboard
 */
export async function applyDisplayModeRedirect(
  userId: string,
  pageType: 'desktop' | 'mobile'
): Promise<void> {
  try {
    const { data } = await supabase
      .from('user_settings')
      .select('value')
      .eq('user_id', userId)
      .eq('key', 'display_mode')
      .single();

    const mode = data?.value || 'auto';

    // Determine effective target based on mode or device detection
    let wantsMobile: boolean;
    if (mode === 'mobile') {
      wantsMobile = true;
    } else if (mode === 'desktop') {
      wantsMobile = false;
    } else {
      // 'auto' — use screen width as proxy for device type
      wantsMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    }

    if (wantsMobile && pageType === 'desktop') {
      window.location.href = '/mobile-dashboard';
    } else if (!wantsMobile && pageType === 'mobile') {
      window.location.href = '/';
    }
  } catch {
    // If the setting can't be read, do nothing — stay on current page
  }
}
