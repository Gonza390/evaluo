export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing env: ${key}`);
    }
  }

  if (!hasGeminiKey) {
    throw new Error(
      'Missing env: define GEMINI_API_KEY (or GOOGLE_AI_KEY / GOOGLE_GENERATIVE_AI_API_KEY).'
    );
  }
}
