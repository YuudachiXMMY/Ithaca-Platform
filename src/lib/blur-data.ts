import blurData from "../../public/media/images/_blurData.json";
import { BLUR_DATA_URL } from "./utils";

const blurMap = blurData as Record<string, string>;

/**
 * Get the per-image blur data URL for a given image path.
 * Falls back to the generic dark placeholder if no blur data exists.
 */
export function getBlurDataURL(imagePath: string): string {
  return blurMap[imagePath] ?? BLUR_DATA_URL;
}
