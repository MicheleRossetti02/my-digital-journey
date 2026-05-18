import type { PublicSection } from "@/lib/public-site.functions";

type Lang = "en" | "it";

type SkillItem = {
  name: string;
  level: number; // 1..6
  category?: "soft" | "hard" | string;
  description?: string;
  icon?: string;
};

const LEVEL_LABEL: Record<Lang, Record<number, string>> = {
  en: { 1: "Beginner", 2: "Novice", 3: "Intermediate", 4: "Proficient", 5: "Advanced", 6: "Expert" },
  it: { 1: "Iniziale", 2: "Base", 3: "Intermedio", 4: "Buono", 5: "Avanzato", 6: "Esperto" },
};

const LEVEL_DOTS = (lvl: number) => Math.max(1, Math.min(6, Math.round(lvl)));

function SkillCard({ skill, lang }: { skill: SkillItem; lang: Lang }) {
  const lvl = LEVEL_DOTS(skill.level);
  const intensity = 0.35 + (lvl / 6) * 0.5; // 0.35 → 0.85
  return (
    <article
      className="group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_oklch(0.4_0.05_162/0.25)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {skill.icon ? (
            <span className="text-xl shrink-0" aria-hidden>{skill.icon}</span>
          ) : (
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                background: `oklch(0.92 0.06 162 / ${intensity})`,
                color: "var(--accent-hue)",
              }}
              aria-hidden
            >
              {skill.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <h4 className="font-semibold text-foreground/90 truncate">{skill.name}</h4>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[var(--accent-hue)] font-medium shrink-0">
          {LEVEL_LABEL[lang][lvl]}
        </span>
      </div>
      {skill.description ? (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {skill.description}
        </p>
      ) : null}
      <div className="mt-4 flex items-center gap-1.5" aria-label={`Level ${lvl} of 6`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              background:
                i < lvl
                  ? `oklch(0.62 0.12 162 / ${0.55 + (i / 6) * 0.45})`
                  : "var(--color-border)",
            }}
          />
        ))}
      </div>
    </article>
  );
}

export function SkillsSection({
  section,
  lang,
}: {
  section: PublicSection;
  lang: Lang;
}) {
  const skills = section.items
    .map((it) => {
      const d = it.data as Record<string, any>;
      const level =
        typeof d.level === "number"
          ? d.level
          : typeof d.value === "number"
            ? Math.round((d.value / 100) * 6)
            : 3;
      return {
        name: String(d.name ?? d.title ?? ""),
        level,
        category: (d.category as string | undefined) ?? "soft",
        description:
          typeof d.description === "string"
            ? d.description
            : typeof d.text === "string"
              ? d.text
              : "",
        icon: typeof d.icon === "string" ? d.icon : undefined,
      } satisfies SkillItem;
    })
    .filter((s) => s.name);

  if (skills.length === 0) return null;

  const soft = skills.filter((s) => s.category !== "hard").sort((a, b) => b.level - a.level);
  const hard = skills.filter((s) => s.category === "hard").sort((a, b) => b.level - a.level);

  const kicker = lang === "it" ? section.kicker_it || "Competenze" : section.kicker_en || "Skills";
  const title = lang === "it" ? section.title_it || "Soft & hard skills" : section.title_en || "Soft & hard skills";
  const subtitle = lang === "it" ? section.subtitle_it : section.subtitle_en;
  const labelSoft = lang === "it" ? "Soft skills" : "Soft skills";
  const labelHard = lang === "it" ? "Hard skills" : "Hard skills";

  return (
    <section
      id="skills"
      data-section="skills"
      className="py-24 border-t border-[var(--color-border)] bg-[var(--cream)]/50"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="reveal mb-12 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{kicker}</p>
          <h2 className="font-serif text-4xl md:text-5xl mt-3">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-muted-foreground mt-4">{subtitle}</p>
          ) : null}
        </div>

        {soft.length > 0 && (
          <div className="reveal mb-10">
            <h3 className="font-semibold mb-5 text-foreground/70 text-sm uppercase tracking-wider">
              {labelSoft}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {soft.map((s) => (
                <SkillCard key={s.name} skill={s} lang={lang} />
              ))}
            </div>
          </div>
        )}

        {hard.length > 0 && (
          <div className="reveal">
            <h3 className="font-semibold mb-5 text-foreground/70 text-sm uppercase tracking-wider">
              {labelHard}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hard.map((s) => (
                <SkillCard key={s.name} skill={s} lang={lang} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
