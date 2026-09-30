import type { Locale } from "../config";
import { en } from "./en";
import { es } from "./es";
import { fr, type Dictionary } from "./fr";
import { pt } from "./pt";

export const DICTIONARIES: Record<Locale, Dictionary> = { fr, en, es, pt };
export type { Dictionary };
