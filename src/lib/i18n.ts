export type Locale = 'id' | 'en';
export type Currency = 'IDR' | 'USD';

export interface I18nDictionary {
  common: {
    appName: string;
    tagline: string;
    search: string;
    searchBtn: string;
    login: string;
    register: string;
    becomeHost: string;
    allRightsReserved: string;
    perPerson: string;
    perPackage?: string;
    viewDetails: string;
    topRated: string;
    featured: string;
  };
  nav: {
    explore: string;
    experiences: string;
    community: string;
    forums: string;
    meetups: string;
    stories: string;
  };
  home: {
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    featuredExperiences: string;
    featuredExperiencesSub: string;
    communitySection: string;
    communitySectionSub: string;
    forumSnippet: string;
    meetupSnippet: string;
    storiesSnippet: string;
    noExperiences: string;
  };
}
