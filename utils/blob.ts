const FILESIZE_UNITS = ["B", "KB", "MB", "GB"] as const;
type PowOf2 = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024;
type SizeUnit = (typeof FILESIZE_UNITS)[number];
type BlobSize = `${PowOf2}${SizeUnit}`;
type BlobType = "image" | "video" | "audio" | "pdf" | "text" | "blob" | MimeType;
type FileSizeUnit = (typeof FILESIZE_UNITS)[number];

export interface BlobEnsureOptions {
  maxSize?: BlobSize;
  types?: BlobType[];
}

/**
 * Converts a file size string to bytes.
 * @param input - The file size string (e.g., "1KB", "2MB").
 * @returns The size in bytes.
 * @throws Will throw an error if the input format is invalid.
 */
function fileSizeToBytes(input: string): number {
  const regex = new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*(${FILESIZE_UNITS.join("|")})$`, "i");
  const match = input.match(regex);

  if (!match) {
    throw new Error(`Invalid file size format: ${input}`);
  }

  const sizeValue = Number.parseFloat(match[1]);
  const sizeUnit = match[2].toUpperCase() as FileSizeUnit;

  if (!FILESIZE_UNITS.includes(sizeUnit)) {
    throw new Error(`Invalid file size unit: ${sizeUnit}`);
  }
  const bytes = sizeValue * Math.pow(1024, FILESIZE_UNITS.indexOf(sizeUnit));
  return Math.floor(bytes);
}

/**
 * Ensures a Blob meets specified criteria.
 * @param blob - The Blob object to validate.
 * @param options - The validation options.
 * @throws Will throw an error if the Blob does not meet the specified criteria.
 */
export function validateBlob(blob: Blob, options: BlobEnsureOptions = {}): void {
  const { maxSize, types } = options;

  if (!maxSize && (!types || !types.length)) {
    throw new Error("validateBlob() requires at least one of maxSize or types to be set.");
  }

  if (maxSize) {
    const maxFileSizeBytes = fileSizeToBytes(maxSize);
    if (blob.size > maxFileSizeBytes) {
      throw new Error(`File size must be less than ${maxSize}`);
    }
  }

  if (types && types.length) {
    const blobShortType = blob.type.split("/")[0];
    const isValidType =
      types.includes(blob.type as BlobType) || types.includes(blobShortType as BlobType);

    if (!isValidType) {
      throw new Error(`File type is invalid, must be: ${types.join(", ")}`);
    }
  }
}
