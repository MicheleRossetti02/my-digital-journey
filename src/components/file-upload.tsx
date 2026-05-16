import { useRef, useState } from "react";

interface FileUploadProps {
  /** Current URL (to show preview) */
  value?: string | null;
  /** Called with the new URL after upload */
  onChange: (url: string) => void;
  /** "image" shows an image preview, "file" shows a link */
  type?: "image" | "file";
  /** Extra CSS classes on the wrapper */
  className?: string;
  accept?: string;
}

/**
 * FileUpload — a reusable component that uploads a file to /api/upload
 * and returns the CDN URL via onChange.
 */
export function FileUpload({ value, onChange, type = "image", className = "", accept }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const { url } = await res.json<{ url: string }>();
      onChange(url);
    } catch (err) {
      setError((err as Error).message);
    }
    setUploading(false);
    // Reset input so the same file can be re-uploaded if needed
    if (inputRef.current) inputRef.current.value = "";
  }

  const defaultAccept = type === "image" ? "image/*" : "*/*";

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Preview */}
      {value && type === "image" && (
        <img
          src={value}
          alt="preview"
          className="h-24 w-24 rounded-lg object-cover border border-border"
        />
      )}
      {value && type === "file" && (
        <a href={value} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
          File attuale
        </a>
      )}

      {/* Upload row */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept ?? defaultAccept}
          onChange={handleChange}
          className="hidden"
          id={`fu-${Math.random().toString(36).slice(2)}`}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          {uploading ? "Caricamento…" : value ? "Cambia file" : "Carica file"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-destructive hover:underline"
          >
            Rimuovi
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
