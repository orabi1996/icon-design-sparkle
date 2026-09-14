# Material Design Hub

اعطيني تصميم افضل مع اضافة ايكون من جوجل ماتريل افضل من دي

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://icon-design-sparkle.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b704d21b-2d21-4727-b532-064142f317ab).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Business implementation

The business layer is being delivered in reviewable vertical phases. This phase adds a tenant/company foundation, immutable company history, a screen directory, and a source-backed loan balance report.

- [Phase 1 foundation and activation runbook](docs/business/phase-1-foundation.md)
- [All 96 registered screens](docs/business/screen-map.md)
- [Full business roadmap](docs/business/roadmap.md)

The `VITE_COMPANY_BUSINESS_ENABLED` flag remains off until the migration, staging authorization tests, typecheck, build, and UAT are approved. Existing legacy tables are not silently reassigned to a tenant.
