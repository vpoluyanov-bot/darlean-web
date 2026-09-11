import type { APIRoute } from 'astro';
import { publicRoutes, canonical, ORG } from '../lib/routes';
import { t, defaultLocale } from '../i18n';

/**
 * llms.txt — a plain-language brief for AI crawlers and assistants.
 *
 * Generated from the same copy the site renders, so it cannot describe a
 * product that no longer matches the pages. Route titles come from the copy
 * file too, which means a new page appears here the moment it is added.
 */
export const GET: APIRoute = ({ site }) => {
  const copy = t(defaultLocale);

  const titles: Record<string, { title: string; note: string }> = {
    '/': { title: 'Home', note: 'What Darlean does, the AI agents, security, onboarding and FAQ.' },
    '/pricing': { title: 'Plans', note: 'Freemium, Basic and Pro with what each includes.' },
  };

  const pages = publicRoutes()
    .map((route) => {
      const entry = titles[route];
      const label = entry?.title ?? route;
      const note = entry?.note ? `: ${entry.note}` : '';
      return `- [${label}](${canonical(route, site)})${note}`;
    })
    .join('\n');

  const plans = copy.pricing.plans
    .map((plan) => `- **${plan.name}** — ${plan.price}${plan.showPeriod ? ' per user per month' : ''}. ${plan.note}`)
    .join('\n');

  const agents = copy.ai.agents.map((agent) => `- **${agent.name}** — ${agent.instructions[0]}.`).join('\n');

  const body = `# ${ORG.name}

> ${copy.site.description}

${ORG.name} is a work management platform with AI agents built in. Teams run
tasks, projects, people, documents and approval workflows in one place instead
of stitching together five or six separate tools. The agents do the routine
work rather than answering questions about it: they chase deadlines, build
reports from company data, read receipts and categorise expenses, and turn
meeting agreements into tasks.

Built by ${ORG.parent}, with teams in the US and Europe.

## Who it is for

Business owners, COOs, CFOs, HR directors, legal and accounting teams, and
project managers at small and mid-sized companies — anyone replacing several
disconnected tools with one system.

## Pages

${pages}

## Plans

${plans}

Counterparties sign documents for free, with no account. Plans change at any
time and only active users are billed.

## AI agents

${agents}

Darvis, the assistant, runs in Zero Data Retention mode: company data is never
stored by model providers or used for training, and a human confirms key agent
actions.

## Contact

- Sign up: https://app.darlean.com/signup
- Email: ${ORG.email}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
