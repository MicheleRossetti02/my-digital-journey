import { useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface FileUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  type?: "image" | "file";
  className?: string;
  accept?: string;
  aspectRatio?: number;
}

export function FileUpload({ value, onChange, type = "image", className = "", accept, aspectRatio = 1 }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cropper state
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  async function uploadFile(file: File | Blob, fileName: string) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file, fileName);
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
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "image") {
      // Read for cropper
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || null);
      });
      reader.readAsDataURL(file);
    } else {
      // Direct upload
      uploadFile(file, file.name);
    }
  }

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!imgSrc || !croppedAreaPixels) return;
    
    setUploading(true);
    try {
      const image = new Image();
      image.src = imgSrc;
      await new Promise((res) => (image.onload = res));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No 2d context");

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Failed to create blob");
      
      await uploadFile(blob, "cropped.jpg");
      setImgSrc(null); // close cropper
    } catch (err) {
      setError((err as Error).message);
      setUploading(false);
    }
  };

  const defaultAccept = type === "image" ? "image/*" : "*/*";

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Cropper Modal */}
      {imgSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[var(--color-card)] rounded-xl w-full max-w-2xl flex flex-col overflow-hidden border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center bg-background">
              <h3 className="font-semibold text-foreground">Ritaglia Immagine</h3>
              <button onClick={() => setImgSrc(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <div className="relative w-full h-[50vh] bg-black">
              <Cropper
                image={imgSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-4 bg-background border-t border-border flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-[var(--accent-hue)]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setImgSrc(null)}
                  className="px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-accent"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleCropConfirm}
                  disabled={uploading}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {uploading ? "Salvataggio..." : "Conferma e Salva"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        {value && type === "image" && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => setImgSrc(value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            Ridimensiona
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-destructive hover:underline ml-2"
          >
            Rimuovi
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
