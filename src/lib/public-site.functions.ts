import { createServerFn } from "@tanstack/react-start";
import { kvGetProfile, kvGetSections } from "@/lib/kv.server";

export type GithubConfig = {
  username: string;
  pinned: string[];
  max: number;
};

export type PublicProfile = {
  name: string;
  email: string;
  location: string;
  avatar_url: string | null;
  cv_url: string | null;
  bio_it: string;
  bio_en: string;
  tagline_it: string;
  tagline_en: string;
  typing_it: string[];
  typing_en: string[];
  links: Array<{ label: string; url: string }>;
  github_config: GithubConfig | null;
};

export type PublicSection = {
  id: string;
  section_key: string;
  section_type: string;
  title_it: string;
  title_en: string;
  subtitle_it: string;
  subtitle_en: string;
  kicker_it: string;
  kicker_en: string;
  body_it: string;
  body_en: string;
  position: number;
  config: Record<string, unknown>;
  items: Array<{
    id: string;
    position: number;
    data: Record<string, unknown>;
  }>;
};

export type PublicSiteData = {
  profile: PublicProfile | null;
  sections: PublicSection[];
};

export const getPublicSite = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSiteData> => {
    const [profile, sections] = await Promise.all([
      kvGetProfile(),
      kvGetSections(),
    ]);

    const visibleSections: PublicSection[] = sections
      .filter((s) => s.visible)
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s.id,
        section_key: s.section_key,
        section_type: s.section_type,
        title_it: s.title_it,
        title_en: s.title_en,
        subtitle_it: s.subtitle_it,
        subtitle_en: s.subtitle_en,
        kicker_it: s.kicker_it,
        kicker_en: s.kicker_en,
        body_it: s.body_it,
        body_en: s.body_en,
        position: s.position,
        config: s.config,
        items: s.items
          .filter((i) => i.visible)
          .sort((a, b) => a.position - b.position)
          .map((i) => ({ id: i.id, position: i.position, data: i.data })),
      }));

    return {
      profile: {
        name: profile.name,
        email: profile.email,
        location: profile.location,
        avatar_url: profile.avatar_url,
        cv_url: profile.cv_url,
        bio_it: profile.bio_it,
        bio_en: profile.bio_en,
        tagline_it: profile.tagline_it,
        tagline_en: profile.tagline_en,
        typing_it: profile.typing_it,
        typing_en: profile.typing_en,
        links: profile.links,
        github_config: profile.github_config,
      },
      sections: visibleSections,
    };
  },
);
