import { ORG, canonical } from './routes';

/**
 * JSON-LD builders.
 *
 * Everything is derived from the same copy and config the pages render, so the
 * structured data cannot describe a different product from the one a reader
 * sees — which is the failure mode that gets markup ignored or penalised.
 */

type Site = URL | undefined;

export function organisation(site: Site) {
  return {
    '@type': 'Organization',
    '@id': canonical('/', site) + '#organization',
    name: ORG.name,
    legalName: ORG.legalName,
    url: canonical('/', site),
    logo: new URL('/assets/logo-full-dark.svg', canonical('/', site)).href,
    email: ORG.email,
    sameAs: [ORG.linkedin],
    parentOrganization: { '@type': 'Organization', name: ORG.parent },
  };
}

export function website(site: Site, description: string) {
  return {
    '@type': 'WebSite',
    '@id': canonical('/', site) + '#website',
    url: canonical('/', site),
    name: ORG.name,
    description,
    inLanguage: 'en',
    publisher: { '@id': canonical('/', site) + '#organization' },
  };
}

/** The product itself. Prices come from the pricing copy, never retyped. */
export function softwareApplication(
  site: Site,
  description: string,
  plans: { name: string; price: string; showPeriod: boolean }[]
) {
  return {
    '@type': 'SoftwareApplication',
    '@id': canonical('/', site) + '#software',
    name: ORG.name,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Work management',
    operatingSystem: 'Web, iOS, Android',
    url: canonical('/', site),
    description,
    publisher: { '@id': canonical('/', site) + '#organization' },
    offers: plans.map((plan) => toOffer(plan)),
  };
}

/** `$16.50` and `$0` become a price and a currency without a second source. */
function toOffer(plan: { name: string; price: string; showPeriod: boolean }) {
  const amount = plan.price.replace(/[^0-9.]/g, '') || '0';

  return {
    '@type': 'Offer',
    name: plan.name,
    price: amount,
    priceCurrency: 'USD',
    ...(plan.showPeriod
      ? { priceSpecification: { '@type': 'UnitPriceSpecification', unitText: 'user per month' } }
      : {}),
  };
}

export function product(
  site: Site,
  description: string,
  plans: { name: string; price: string; note: string; showPeriod: boolean }[]
) {
  return {
    '@type': 'Product',
    '@id': canonical('/pricing', site) + '#product',
    name: `${ORG.name} plans`,
    description,
    brand: { '@id': canonical('/', site) + '#organization' },
    offers: plans.map((plan) => ({ ...toOffer(plan), description: plan.note })),
  };
}

export function faqPage(site: Site, items: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    '@id': canonical('/', site) + '#faq',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

/** Wraps any set of nodes into a single graph, which is what crawlers prefer. */
export function graph(nodes: object[]) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
}
