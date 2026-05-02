This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Azure Static Web Apps

This client is configured for static export. Set the public API URLs in the build environment and deploy the `out/` folder.

### Required environment variables

Create `client/.env` locally or set GitHub Secrets for the build pipeline:

```
NEXT_PUBLIC_TRAIN_API_URL=https://train-management.azurecontainerapps.io/api
NEXT_PUBLIC_SEAT_API_URL=https://seat-availability.azurecontainerapps.io/api
NEXT_PUBLIC_BOOKING_API_URL=https://ticket-booking.azurecontainerapps.io/api
NEXT_PUBLIC_NOTIFICATION_API_URL=https://notification.azurecontainerapps.io/api
```

### Build output

```
npm run build
```

The static site is generated in `client/out`.
