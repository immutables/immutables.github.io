# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the documentation website for Immutables (immutables.github.io), built with Astro. The project creates immutable classes and builders, and this site serves as its documentation portal.

## Repository Relationship

**IMPORTANT**: There are two distinct repositories to be aware of:

- **immutables/immutables** (GitHub repo, accessed via MCP tools): The actual Java annotation processor library that generates immutable classes and builders. This is the source of truth for:
  - Library features, APIs, and capabilities
  - Code examples and usage patterns
  - Release information and changelogs

- **This repository** (local: `/Users/ievgenlukash/Git/immutables/newdocs`): The Astro-based documentation website that will be hosted at immutables.github.io

When working on documentation:
- Reference the immutables/immutables GitHub repo to understand what the library actually does
- Implement documentation pages, guides, and examples in this local Astro project
- Ensure documentation accurately reflects the current state of the library

## Commands

### Development
- `npm start` - Start development server at localhost:4321
- `npm run build` - Build production site to ./dist/
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands

### Additional Astro Commands
- `npm run astro check` - Type-check the project
- `npm run astro add` - Add integrations to the project

## Architecture

### Project Structure

This is a standard Astro project with the following key directories:

```
src/
├── layouts/     # Astro layout components
│   ├── Landing.astro  # Main landing page layout
│   └── Guide.astro    # Guide/documentation page layout (currently empty)
├── pages/       # File-based routing - each file becomes a route
│   └── index.astro    # Homepage using Landing layout
├── components/  # Reusable Astro/React/Vue/Svelte components (currently empty)
└── styles/
    └── global.css     # Global styles with Hero, Logo, and Since classes
```

### Key Architectural Details

**Layouts**: The site uses two layout templates:
- `Landing.astro` (src/layouts/Landing.astro:1): Base HTML structure with meta tags, accepts a `title` prop and renders children via `<slot/>`
- `Guide.astro`: Currently empty, intended for guide/documentation pages

**Styling**: Global styles (src/styles/global.css:1) define the visual identity with a gradient background and custom logo mask effects. The Logo class uses SVG masking with background image animation.

**Routing**: Astro uses file-based routing from `src/pages/`. The homepage renders a Hero section with the Immutables logo and tagline.

**Assets**: Static assets (images, SVG) are served from the `/public` directory (referenced as `/gfx/` in styles).

## TypeScript Configuration

The project uses Astro's strict TypeScript configuration (`astro/tsconfigs/strict`). All `.astro` files support TypeScript in frontmatter sections.

## License

Apache License 2.0 - Include copyright header when creating new files if contributing significant code.
