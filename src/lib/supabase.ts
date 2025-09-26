export const isSupabaseAvailable = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const available = !!(url && key && url !== 'your_supabase_url_here' && key !== 'your_supabase_anon_key_here');
  
  if (!available) {
    console.log('📝 Running in demo mode - Supabase not configured');
  }
  
  return available;
};