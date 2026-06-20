const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.extraNodeModules = {
  '@haven/contracts': path.resolve(workspaceRoot, 'packages/contracts'),
  '@haven/i18n': path.resolve(workspaceRoot, 'packages/i18n'),
  '@haven/schema': path.resolve(workspaceRoot, 'packages/schema'),
  '@haven/shims': path.resolve(workspaceRoot, 'packages/shims'),
  '@haven/ui': path.resolve(workspaceRoot, 'packages/ui'),
};

module.exports = config;
