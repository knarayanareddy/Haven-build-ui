const config = require('./app.json');

function assertPublicEnv(name) {
  const value = process.env[name];
  if (process.env.EAS_BUILD && (!value || value.startsWith('REPLACE_WITH_'))) {
    throw new Error(`${name} must be configured for EAS builds`);
  }
}

assertPublicEnv('EXPO_PUBLIC_SUPABASE_URL');
assertPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

module.exports = config.expo;
