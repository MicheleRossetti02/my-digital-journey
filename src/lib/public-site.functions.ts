import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, any>;
  items: Array<{
    id: string;
    position: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>;
  }>;
};

export type PublicSiteData = {
  profile: PublicProfile | null;
  sections: PublicSection[];
};

export const getPublicSite = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSiteData> => {
    const [{ data: profile }, { data: sections }, { data: items }] =
      await Promise.all([
        supabaseAdmin.from("site_profile").select("*").eq("id", 1).maybeSingle(),
        supabaseAdmin
          .from("sections")
          .select("*")
          .eq("visible", true)
          .order("position", { ascending: true }),
        supabaseAdmin
          .from("section_items")
          .select("*")
          .eq("visible", true)
          .order("position", { ascending: true }),
      ]);

    const sectionsList: PublicSection[] = (sections ?? []).map((s) => ({
      id: s.id,
      section_key: s.section_key,
      section_type: s.section_type,
      title_it: s.title_it ?? "",
      title_en: s.title_en ?? "",
      subtitle_it: s.subtitle_it ?? "",
      subtitle_en: s.subtitle_en ?? "",
      kicker_it: s.kicker_it ?? "",
      kicker_en: s.kicker_en ?? "",
      body_it: s.body_it ?? "",
      body_en: s.body_en ?? "",
      position: s.position,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: (s.config ?? {}) as Record<string, any>,
      items: (items ?? [])
        .filter((it) => it.section_id === s.id)
        .map((it) => ({
          id: it.id,
          position: it.position,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: (it.data ?? {}) as Record<string, any>,
        })),
    }));

    return {
      profile: profile
        ? {
            name: profile.name,
            email: profile.email,
            location: profile.location,
            avatar_url: profile.avatar_url,
            cv_url: profile.cv_url,
            bio_it: profile.bio_it ?? "",
            bio_en: profile.bio_en ?? "",
            tagline_it: profile.tagline_it ?? "",
            tagline_en: profile.tagline_en ?? "",
            typing_it: Array.isArray(profile.typing_it) ? (profile.typing_it as string[]) : [],
            typing_en: Array.isArray(profile.typing_en) ? (profile.typing_en as string[]) : [],
            links: Array.isArray(profile.links)
              ? (profile.links as Array<{ label: string; url: string }>)
              : [],
            github_config:
              profile.github_config &&
              typeof profile.github_config === "object" &&
              !Array.isArray(profile.github_config)
                ? (profile.github_config as GithubConfig)
                : null,
          }
        : null,
      sections: sectionsList,
    };
  },
);
