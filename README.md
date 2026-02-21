# Blog Application

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/susimsek/blog/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/susimsek/blog/tree/main)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=blog&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=blog)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=blog&metric=coverage)](https://sonarcloud.io/summary/new_code?id=blog)
![Top Language](https://img.shields.io/github/languages/top/susimsek/blog)

Welcome to **Blog Application** – a sleek, modern, and fully-featured blogging platform built with:

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)  
![React-Bootstrap](https://img.shields.io/badge/React--Bootstrap-563D7C?logo=bootstrap&logoColor=white)  
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

Explore seamless navigation, robust state management, and responsive design for modern blogging needs. 🚀

## 🚀 Quick Links

- 🌐 [Live Demo](#-live-demo)
- 📖 [Features](#-features)
- 📰 [RSS Feed](#-rss-feed)
- 🧑‍💻 [Development Setup](#-development-setup)
- 🧪 [Testing](#-testing)
- 🏗️ [Build](#️-build)
- 📏 [ESLint](#-eslint)
- 🎨 [Prettier](#-prettier)
- 🛡️ [Code Quality](#️-code-quality)
- 🚀 [Deployment](#-deployment)
- 🛠️ [Used Technologies](#️-used-technologies)

## 🌐 Live Demo

You can explore the live version of the blog application at [https://suaybsimsek.com](https://suaybsimsek.com).

Enjoy reading blog posts and experience seamless navigation between different sections of the site!

![Introduction](https://github.com/susimsek/blog/blob/main/images/introduction.png)

## 📖 Features

- 🌗 **Theme Switching**: Light and dark modes for a seamless user experience.
- 🌍 **Multilingual Support**: Available in **English** and **Turkish**.
- 📱 **Responsive Design**: Optimized for all devices.
- ✅ **High Test Coverage**: Ensures reliability with comprehensive unit tests.
- 📝 **Markdown Rendering**: Write your posts in Markdown.
- 🛠️ **Redux Integration**: Powerful state management.
- 📰 **RSS Support**: Automatically generates and updates an RSS feed for your blog posts.
- ✍️ **Medium Integration**: Displays your latest Medium posts with smart caching.
- 🎨 **Code Style Enforcements**: With **Prettier** and **ESLint**.
- 🔍 **SonarQube Integration**: Continuous code quality monitoring.

## 📰 RSS Feed

Stay updated with the latest blog posts via our RSS feeds. We offer separate feeds for English and Turkish content so you can follow your preferred language:

- **English Feed:**  
  Subscribe to the English feed to receive updates on the newest posts directly in your RSS reader.  
  [https://suaybsimsek.com/en/rss.xml](https://suaybsimsek.com/en/rss.xml)

- **Turkish Feed:**  
  For Turkish content, use the Turkish RSS feed to stay informed about all the latest posts.  
  [https://suaybsimsek.com/tr/rss.xml](https://suaybsimsek.com/tr/rss.xml)

Simply add these links to your favorite RSS reader or news aggregator, and enjoy a seamless reading experience!

## 🎥 Demo Preview

Below is a quick preview of the Blog Application:

![Blog Application Preview](https://github.com/susimsek/blog/blob/main/images/webapp.png)

## 🧑‍💻 Development Setup

To clone and run this application locally:

```bash
# Clone the repository
git clone https://github.com/susimsek/blog.git

# Navigate to the project directory
cd blog

# Enable pnpm via Corepack (recommended)
corepack enable

# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Open the application in your browser
http://localhost:3000
```

## 🧪 Testing

To run the tests and ensure the application is functioning correctly:

```bash
pnpm test
```

## 🏗️ Build

To build the application for production:

```bash
pnpm build
```

## 📏 ESLint

To check the JavaScript and TypeScript code style using ESLint, execute:

```bash
pnpm run lint
```

To automatically fix linting issues, execute:

```bash
pnpm run lint:fix
```

## 🎨 Prettier

To format the code using Prettier, execute:

```bash
pnpm run prettier:format
```

## 🛡️ Code Quality

To assess code quality locally using SonarQube, execute:

```bash
pnpm run sonar
```

## 🚀 Deployment

### Vercel Go API

This repository now includes Go Vercel Functions:

- GraphQL endpoint: `/graphql` (`POST`)
  - `subscribeNewsletter(input: NewsletterSubscribeInput!)`
  - `resendNewsletterConfirmation(input: NewsletterResendInput!)`
  - `confirmNewsletterSubscription(token: String!)`
  - `unsubscribeNewsletter(token: String!)`
- Newsletter dispatch endpoint: `/api/newsletter-dispatch` (`GET`, cron trigger)
  - Vercel cron schedule is UTC. To run at `07:00` Turkiye time (UTC+3), use `0 4 * * *`.
  - Locale is resolved from `Accept-Language` request header (`tr` / `en`) and confirmation flow stays localized.
  - Dispatch uses campaign dedupe (`locale + itemKey`), recipient-level delivery logs, and retry for partial campaigns.
  - Announcement emails include `List-Unsubscribe`, `List-Unsubscribe-Post` headers and one-click unsubscribe link.
  - Frontend subscribe flow supports confirmation resend via GraphQL mutation.

Required environment variables:

- `API_CORS_ORIGIN`: Allowed CORS origin (for example `https://suaybsimsek.com`)
- `MONGODB_URI`: MongoDB Atlas SRV URI (`mongodb+srv://...`)
- `MONGODB_DATABASE`: Atlas database name used by API routes
- `SITE_URL`: Public site URL used in confirmation links (for example `https://suaybsimsek.com`)
- `GMAIL_SMTP_USER`: Gmail address used for SMTP auth
- `GMAIL_SMTP_APP_PASSWORD`: Gmail App Password (16-char)
- `CRON_SECRET`: Secret used by Vercel Cron Authorization header for `/api/newsletter-dispatch`

Optional frontend variable:

- `NEXT_PUBLIC_API_BASE_URL`: Absolute API base URL for GraphQL requests (for example `https://api.suaybsimsek.com`)
- `NEXT_PUBLIC_SITE_URL`: Public site base URL used by client-side structured data (for example `https://suaybsimsek.com`, local: `http://localhost:3000`)

Optional SMTP variables:

- `GMAIL_FROM_EMAIL`: From address shown in email (defaults to `GMAIL_SMTP_USER`)
- `GMAIL_FROM_NAME`: From display name (defaults to `Suayb's Blog`)
- `GMAIL_SMTP_HOST`: SMTP host (defaults to `smtp.gmail.com`)
- `GMAIL_SMTP_PORT`: SMTP port (defaults to `587`)
- `NEWSLETTER_UNSUBSCRIBE_SECRET`: Token signing secret for one-click unsubscribe links
- `NEWSLETTER_MAX_RECIPIENTS_PER_RUN`: Per-locale send cap for one cron run (default `200`)
- `NEWSLETTER_MAX_ITEM_AGE_HOURS`: Freshness filter for RSS items; items older than this are skipped (default `168`)
- `NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_HOURS`: Unsubscribe token TTL in hours (default `8760`)

### Docker Compose Deployment

To deploy the application using Docker Compose, run the following command:

```bash
docker-compose -f deploy/docker-compose/docker-compose.yml up -d
```

To stop and remove the Docker Compose deployment:

```bash
docker-compose -f deploy/docker-compose/docker-compose.yml down
```

You can access the blog directly at [http://localhost](http://localhost).

### Kubernetes Deployment using Helm

To deploy the application on Kubernetes using Helm, run the following command:

```bash
helm install blog deploy/helm/blog
```

To uninstall the Helm deployment:

```bash
helm uninstall blog
```

You can access the blog directly at [http://blog.local](http://blog.local).

This will deploy the **Blog Application** on your **Kubernetes cluster** using the Helm chart located at `deploy/helm/blog`.

In `values.yaml`, ensure the following configuration is set for Ingress, with an appropriate ingress class name (e.g., `nginx`, `traefik`, or another available option):

```yaml
ingress:
  ingressClassName: 'nginx'
```

Additionally, to ensure proper local access, add the following entry to your **hosts** file:

On **Linux/macOS**:

```bash
sudo nano /etc/hosts
```

Add this line:

```
127.0.0.1 blog.local
```

Save and exit.

On **Windows**:

Edit the file:

```
C:\Windows\System32\drivers\etc\hosts
```

Add this line:

```
127.0.0.1 blog.local
```

Save and restart your browser.

## 🛠️ Used Technologies

![Node.js](https://img.shields.io/badge/Node.js-24.0-green?logo=node.js&logoColor=white)  
![CircleCI](https://img.shields.io/badge/CircleCI-343434?logo=circleci&logoColor=white)  
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)  
![Next.js](https://img.shields.io/badge/Next.js-000?logo=next.js&logoColor=white)  
![Next.js Third Parties](https://img.shields.io/badge/Next.js_Third_Parties-000?logo=next.js&logoColor=white)  
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)  
![RSS](https://img.shields.io/badge/RSS-Supported-FF6600?logo=rss&logoColor=white)  
![RSS Parser](https://img.shields.io/badge/RSS_Parser-F26522?logo=rss&logoColor=white)  
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)  
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?logo=prettier&logoColor=white)  
![SonarQube](https://img.shields.io/badge/SonarQube-4E9BCD?logo=sonarqube&logoColor=white)  
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)  
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white)  
![Helm](https://img.shields.io/badge/Helm-0F1689?logo=helm&logoColor=white)  
![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)  
![Husky](https://img.shields.io/badge/Husky-4B32C3?logo=github&logoColor=white)  
![Redux](https://img.shields.io/badge/Redux-764ABC?logo=redux&logoColor=white)  
![Next i18next](https://img.shields.io/badge/Next_i18next-000000?logo=next.js&logoColor=white)  
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=white)  
![Font Awesome](https://img.shields.io/badge/Font_Awesome-339AF0?logo=font-awesome&logoColor=white)  
![Sass](https://img.shields.io/badge/Sass-CC6699?logo=sass&logoColor=white)  
![Gray Matter](https://img.shields.io/badge/Gray_Matter-FFB6C1?logo=markdown&logoColor=black)  
![React Markdown](https://img.shields.io/badge/React_Markdown-61DAFB?logo=react&logoColor=black)  
![React Datepicker](https://img.shields.io/badge/React_Datepicker-61DAFB?logo=react&logoColor=black)  
![Date-fns](https://img.shields.io/badge/Date--fns-007ACC?logo=javascript&logoColor=white)
