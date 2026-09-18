const MAX_DESIGN_FILE_BYTES = 15 * 1024 * 1024;

const ALLOWED_FILES = {
  png: new Set(["image/png"]),
  jpg: new Set(["image/jpeg"]),
  jpeg: new Set(["image/jpeg"]),
  pdf: new Set(["application/pdf"]),
  ai: new Set(["application/pdf", "application/postscript", "application/illustrator", "application/octet-stream"]),
} as const;

export type ValidatedDesignFile = {
  extension: keyof typeof ALLOWED_FILES;
  safeName: string;
  bytes: ArrayBuffer;
  contentType: string;
};

export async function validateDesignFile(
  file: File,
): Promise<{ file: ValidatedDesignFile } | { error: string; status: number }> {
  if (file.size > MAX_DESIGN_FILE_BYTES) {
    return { error: "El archivo de diseño no puede superar 15 MB.", status: 413 };
  }
  if (file.size < 4) {
    return { error: "El archivo de diseño está vacío o no es válido.", status: 400 };
  }

  const safeName = normalizeFileName(file.name);
  const extension = safeName.split(".").pop()?.toLowerCase() as keyof typeof ALLOWED_FILES | undefined;
  if (!extension || !(extension in ALLOWED_FILES)) {
    return { error: "El diseño debe ser PNG, JPG, PDF o AI.", status: 400 };
  }

  const allowedMimeTypes = ALLOWED_FILES[extension];
  const contentType = (file.type || "application/octet-stream").toLowerCase();
  if (!allowedMimeTypes.has(contentType as never)) {
    return { error: "El tipo real del archivo no coincide con su extensión.", status: 400 };
  }

  const bytes = await file.arrayBuffer();
  const header = new Uint8Array(bytes.slice(0, 12));
  const signatureIsValid =
    (extension === "png" && isPng(header)) ||
    ((extension === "jpg" || extension === "jpeg") && isJpeg(header)) ||
    (extension === "pdf" && isPdf(header)) ||
    (extension === "ai" && (isPdf(header) || isPostScript(header)));

  if (!signatureIsValid) {
    return { error: "No hemos podido verificar el formato real del archivo.", status: 400 };
  }

  return { file: { extension, safeName, bytes, contentType } };
}

function normalizeFileName(value: string): string {
  const leaf = value.split(/[\\/]/).pop() || "diseno";
  return leaf
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9À-ÿ._ -]/g, "_")
    .replace(/\.{2,}/g, ".")
    .slice(0, 120) || "diseno";
}

function isPng(bytes: Uint8Array): boolean {
  return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    .every((byte, index) => bytes[index] === byte);
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isPdf(bytes: Uint8Array): boolean {
  return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
}

function isPostScript(bytes: Uint8Array): boolean {
  return String.fromCharCode(...bytes.slice(0, 4)) === "%!PS";
}
