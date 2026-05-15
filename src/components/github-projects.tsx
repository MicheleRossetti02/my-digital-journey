import { useEffect, useState } from "react";
import { fetchTopRepos, languageColors, type GitHubRepo } from "@/lib/github";
import type { GithubConfig } from "@/lib/public-site.functions";

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function RepoCard({ repo }: { repo: GitHubRepo }) {
  const color = (repo.language && languageColors[repo.language]) || "#999";
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="card-surface group flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-lg leading-tight">{repo.name}</h3>
        <span className="text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
          <ExternalIcon />
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1 min-h-[2.5em]">
        {repo.description || <span className="italic opacity-60">No description provided.</span>}
      </p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-[var(--color-border)]">
        {repo.language && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: color }}
            />
            {repo.language}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Star /> {repo.stargazers_count}
        </span>
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="card-surface flex flex-col gap-3">
      <div className="skeleton h-5 w-2/3" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-5/6" />
      <div className="flex gap-3 pt-2">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-10" />
      </div>
    </div>
  );
}

const DEFAULT_USERNAME = "MicheleRossetti02";
const DEFAULT_MAX = 6;

export function GitHubProjects({ config }: { config?: GithubConfig | null }) {
  const username = config?.username || DEFAULT_USERNAME;
  const pinnedNames = config?.pinned ?? [];
  const max = config?.max ?? DEFAULT_MAX;

  const [repos, setRepos] = useState<GitHubRepo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // Always fetch all repos (up to 100) so we can filter by pinned
    fetchTopRepos(username, 100)
      .then((r) => {
        if (!alive) return;
        if (pinnedNames.length > 0) {
          // Return pinned repos in pinned order, skip any not found
          const byName = new Map(r.map((repo) => [repo.name, repo]));
          const ordered = pinnedNames
            .map((name) => byName.get(name))
            .filter((repo): repo is GitHubRepo => repo !== undefined);
          setRepos(ordered);
        } else {
          // Default: top `max` by stars/activity (already sorted by fetchTopRepos)
          setRepos(r.slice(0, max));
        }
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      });
    return () => { alive = false; };
  }, [username, JSON.stringify(pinnedNames), max]);

  if (error) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Couldn't reach GitHub right now ({error}).
      </p>
    );
  }

  if (!repos) {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Nessun repository trovato per <code>{username}</code>.
      </p>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {repos.map((r) => (
        <RepoCard key={r.id} repo={r} />
      ))}
    </div>
  );
}
