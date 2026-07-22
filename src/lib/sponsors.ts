export interface Sponsor {
  name: string | null;
  login: string;
  avatar: string;
  amount: number;
  isOneTime?: boolean;
  link: string;
  org: boolean;
}

export type SponsorSize = 'xs' | 'sm' | 'md' | 'xl' | '2xl';

export interface SponsorGroup {
  label: string;
  minAmount: number;
  maxAmount?: number;
  size: SponsorSize;
  showName?: boolean;
  sponsors: Sponsor[];
}

const SPONSORS_URL = 'https://cdn.jsdelivr.net/gh/lepture/lepture@main/sponsors.json';

const sponsorTiers: Omit<SponsorGroup, 'sponsors'>[] = [
  { label: 'Gold Sponsors', minAmount: 100, size: '2xl', showName: true },
  { label: 'Silver Sponsors', minAmount: 50, maxAmount: 100, size: 'xl' },
  { label: 'Sponsors', minAmount: 25, maxAmount: 50, size: 'md', showName: true },
  { label: 'Backers', minAmount: 10, maxAmount: 25, size: 'sm' },
  { label: 'Supporter', minAmount: 1, maxAmount: 10, size: 'sm' },
];

function isSponsor(value: unknown): value is Sponsor {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const sponsor = value as Partial<Sponsor>;

  return Boolean(sponsor.login && sponsor.avatar && sponsor.link);
}

function sortByAmountThenName(a: Sponsor, b: Sponsor): number {
  const amountDelta = Math.max(b.amount, 0) - Math.max(a.amount, 0);
  const aName = a.name || a.login;
  const bName = b.name || b.login;

  return amountDelta || aName.localeCompare(bName);
}

function sortByName(a: Sponsor, b: Sponsor): number {
  const aName = a.name || a.login;
  const bName = b.name || b.login;

  return aName.localeCompare(bName);
}

export async function getMaintainerSponsors(): Promise<Sponsor[]> {
  try {
    const response = await fetch(SPONSORS_URL);

    if (!response.ok) {
      return [];
    }

    const sponsors = await response.json();

    if (!Array.isArray(sponsors)) {
      return [];
    }

    return sponsors.filter(isSponsor).sort(sortByAmountThenName);
  } catch {
    return [];
  }
}

export function groupCurrentSponsors(sponsors: Sponsor[]): SponsorGroup[] {
  return sponsorTiers
    .map((tier) => ({
      ...tier,
      sponsors: sponsors
        .filter(
          (sponsor) =>
            !sponsor.isOneTime &&
            sponsor.amount >= tier.minAmount &&
            (tier.maxAmount === undefined || sponsor.amount < tier.maxAmount),
        )
        .sort(sortByName),
    }))
    .filter((group) => group.sponsors.length > 0);
}

export function getOneTimeSponsors(sponsors: Sponsor[]): Sponsor[] {
  return sponsors
    .filter((sponsor) => sponsor.isOneTime && sponsor.amount > 0)
    .sort(sortByAmountThenName);
}

export function getPastSponsors(sponsors: Sponsor[]): Sponsor[] {
  return sponsors.filter((sponsor) => sponsor.amount <= 0);
}
