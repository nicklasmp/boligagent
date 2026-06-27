printf '%s' 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZGRjbGJhbGJsb3B1ZWRkaWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQwODc4OCwiZXhwIjoyMDk3OTg0Nzg4fQ.eJjTDhxhu7a3nNy6CkTqIt3xX-2ooCTNxYKL_-bKjA0' | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
printf '%s' 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZGRjbGJhbGJsb3B1ZWRkaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDg3ODgsImV4cCI6MjA5Nzk4NDc4OH0.XcVFC39OtIWJt0YiZcyJIBdu76A_rz1v95XUmUOzdFk' | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
printf '%s' '74d973255dd18dc016031e8d797aee59e8a89a51c0e251c46771806686c524c9' | npx vercel env add CRON_SECRET production
printf '%s' 'BPN0tSfjjmthRiXS5OsXBecmdtm7cHw_qGUtpeQeN5K0UodtniKwLdB3VGPr8_cqbm-eZ0WtAsYUbmGLcWPQ27w' | npx vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
printf '%s' '1K2_gqc-klwQFqdldp0xf9mcBNtYa2iiGzuq-yVDedA' | npx vercel env add VAPID_PRIVATE_KEY production
printf '%s' 'mailto:nicklas-pedersen@outlook.com' | npx vercel env add VAPID_SUBJECT production
