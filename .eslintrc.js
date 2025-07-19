module.exports = {
  // ...other config...
  plugins: ['import'],
  rules: {
    // ...other rules...
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Domain
          {
            target: './src/domain',
            from: './src/usecase',
          },
          {
            target: './src/domain',
            from: './src/data',
          },
          {
            target: './src/domain',
            from: './src/application',
          },
          {
            target: './src/domain',
            from: './components',
          },

          // Usecase
          {
            target: './src/usecase',
            from: './src/data',
          },
          {
            target: './src/usecase',
            from: './src/application',
          },
          {
            target: './src/usecase',
            from: './src/components',
          },

          // Data
          {
            target: './src/data',
            from: './src/application',
          },
          {
            target: './src/data',
            from: './src/components',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['src/domain/**/*'],
      rules: {
        'import/no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['*'],
                message: 'Only allowed dependencies can be imported in the domain layer.',
                allow: [
                  './*',
                  '../*',
                  'lodash',
                  'typescript',
                  'rxjs',
                ],
              },
            ],
          },
        ],
      },
    },
  ],
}; 