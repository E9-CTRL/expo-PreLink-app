// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ✅ KEY FIX: Disable experimental export maps (breaks firebase/auth)
config.resolver.unstable_enablePackageExports = false;

// ✅ Optional: Support CommonJS Firebase modules if needed
config.resolver.sourceExts.push('cjs');

module.exports = config;
