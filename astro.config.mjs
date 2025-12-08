// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { readFileSync } from 'fs'

// Load custom Shiki theme
const immutablesTheme = JSON.parse(
  readFileSync(new URL('./src/immutables-theme.json', import.meta.url), 'utf-8')
)

export default defineConfig({
  integrations: [mdx()],
  build: {
    format: 'file' // Generate style.html instead of style/index.html
  },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: immutablesTheme,
      wrap: false
    }
  }
})
