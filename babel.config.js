module.exports = function (api) {
  api.cache(true);
  
  const isTest = process.env.NODE_ENV === 'test';
  
  if (isTest) {
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
      ],
      plugins: [
        [
          'module-resolver',
          {
            root: ['./'],
            alias: {
              '@': './',
              '@components': './components',
              '@services': './services',
              '@stores': './stores',
              '@utils': './utils',
              '@types': './types',
              '@hooks': './hooks',
              '@app': './app',
            },
          },
        ],
      ],
    };
  }
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@services': './services',
            '@stores': './stores',
            '@utils': './utils',
            '@types': './types',
            '@hooks': './hooks',
            '@app': './app',
          },
        },
      ],
    ],
  };
};
