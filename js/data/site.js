const ORG_URL = 'https://github.com/CurseStoneTeam';
const REPO_URL = `${ORG_URL}/CurseStone`;
const LOGO_URL = 'https://raw.githubusercontent.com/CurseStoneTeam/CurseStone/stable/logo.svg';

const DOCS_FULL = 'https://cursestoneteam.github.io/';
const DOCS_INITIAL = 'https://docs-cursestone.readthedocs.io/';
const YOUTUBE_URL = 'https://youtube.com/@CurseStoneTeam';
const DISCORD_URL = 'https://discord.gg/h6TXynYC8p';

function bannerUrl(theme) {
  return (
    'https://socialify.dev/CurseStoneTeam/CurseStone/image' +
    '?description=1&font=Inter&forks=1&issues=1' +
    `&logo=${encodeURIComponent(LOGO_URL)}` +
    `&name=1&owner=1&pattern=Transparent&pulls=1&stargazers=1&theme=${theme}`
  );
}

export const site = {
  name: 'CurseStone',
  logo: LOGO_URL,
  branch: 'stable',
  organization: ORG_URL,
  discord: DISCORD_URL,

  banner: {
    light: bannerUrl('Light'),
    dark: bannerUrl('Dark'),
  },

  repo: {
    url: REPO_URL,
    clone: `${REPO_URL}.git`,
    issues: `${REPO_URL}/issues`,
    pulls: `${REPO_URL}/pulls`,
    releases: `${REPO_URL}/releases`,
    graphs: `${REPO_URL}/graphs/contributors`,
  },

  docs: {
    initial: DOCS_INITIAL,
    full: DOCS_FULL,
  },

  oldSite: {
    url: 'https://cursestonesoftware.netlify.app/',
    host: 'cursestonesoftware.netlify.app',
    author: 'pkz.byt',
  },

  socials: [
    { key: 'discord', icon: 'fa-brands fa-discord', url: DISCORD_URL },
    { key: 'github', icon: 'fa-brands fa-github', url: ORG_URL },
    { key: 'youtube', icon: 'fa-brands fa-youtube', url: YOUTUBE_URL },
  ],

  release: {
    api: 'https://api.github.com/repos/CurseStoneTeam/CurseStone/releases/latest',
    listApi: 'https://api.github.com/repos/CurseStoneTeam/CurseStone/releases?per_page=100',
    cacheKey: 'cursestone-release-v2',
    listCacheKey: 'cursestone-releases-v2',
    ttl: 60 * 60 * 1000,
    retryDelay: 10 * 60 * 1000,
  },

  contributors: {
    api: 'https://api.github.com/repos/CurseStoneTeam/CurseStone/contributors?per_page=100',
    cacheKey: 'cursestone-contributors',
    ttl: 6 * 60 * 60 * 1000,
    retryDelay: 15 * 60 * 1000,
    limit: 10,
    ignore: [],
  },
};
