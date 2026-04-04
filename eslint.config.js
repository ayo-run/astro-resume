// @ts-check

import js from '@eslint/js'
import css from '@eslint/css'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig([
  {
    files: ['**/*.css'],
    plugins: {
      css
    },
    languageOptions: {
      tolerant: true
    },
    language: 'css/css',
    rules: {
      'css/no-duplicate-imports': 'error',
      'css/no-empty-blocks': 'error',
      'css/no-invalid-at-rules': 'error',
      'css/no-invalid-properties': 'error'
    }
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      js, '@stylistic': stylistic 
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.browser 
    },
    rules: {
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/comma-dangle': ['error', 'never'] ,
      '@stylistic/block-spacing': 'error',
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/key-spacing': ['error', {
        'beforeColon': false 
      }],
      '@stylistic/array-bracket-newline': ['error', 'consistent'],
      '@stylistic/object-curly-newline': ['error', {
        'consistent': true
      }]
    }
  },
  globalIgnores(['**/dist'])
])
