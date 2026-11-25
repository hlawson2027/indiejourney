import site from '../content/settings/site.json';
import homepage from '../content/settings/homepage.json';

export type Link = { label: string; url: string };

export const settings = site as {
  title: string;
  tagline: string;
  description: string;
  email?: string;
  share_image?: string;
  nav: Link[];
  social: Link[];
  footer_columns: { heading: string; links: Link[] }[];
  newsletter: { kicker?: string; heading: string; text?: string; form_action?: string; email_field?: string };
  disclosures: { affiliate: string; amazon: string };
  analytics_token?: string;
  google_site_verification?: string;
  pinterest_domain_verify?: string;
  pinterest_save_button?: boolean;
};

const ref = (v?: string | null) => (v ? v.split('/').pop()!.replace(/\.(md|json|ya?ml)$/i, '') : undefined);
const refs = (v?: (string | null)[] | null) => (v || []).map(ref).filter(Boolean) as string[];

type RawSection = Record<string, any> & { type: string };

export const home = {
  lead: ref((homepage as any).lead),
  side_stories: refs((homepage as any).side_stories),
  latest_count: Number((homepage as any).latest_count ?? 4),
  sections: ((homepage as any).sections || []).map((s: RawSection) => ({
    ...s,
    category: ref(s.category),
    left: ref(s.left),
    right: ref(s.right),
    lookbook: ref(s.lookbook),
    products: refs(s.products),
  })) as RawSection[],
};
