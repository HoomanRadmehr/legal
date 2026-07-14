import { z } from "zod";

import type {
  CaseDetail,
  CaseInput,
  CasePartyInput,
  CaseUpdateInput,
} from "./types";

const emptyDate = z.literal("").transform(() => null);
const optionalText = z.string().trim().optional().default("");
const optionalUuid = z.string().trim().uuid().optional().or(z.literal(""));

export const casePartyFormSchema = z.object({
  contact_summary: z.string().trim().max(500).optional().default(""),
  name: z.string().trim().min(1, "Party name is required.").max(255),
  role: z.enum(["client", "court", "opposing", "other", "witness"]),
});

export const caseCreateFormSchema = z.object({
  case_type: z.enum(["internal", "litigation", "other", "regulatory"]),
  closed_on: z.string().date().nullable().or(emptyDate).optional(),
  court_or_authority: optionalText,
  description: optionalText,
  filing_date: z.string().date().nullable().or(emptyDate).optional(),
  opened_on: z.string().date().nullable().or(emptyDate).optional(),
  outcome_summary: optionalText,
  owner_id: optionalUuid,
  parties: z.array(casePartyFormSchema).default([]),
  priority: z.enum(["critical", "high", "low", "normal"]),
  reference_code: z
    .string()
    .trim()
    .min(1, "Reference code is required.")
    .max(64),
  status: z
    .enum(["archived", "closed", "on_hold", "open", "pending"])
    .default("open"),
  title: z.string().trim().min(1, "Title is required.").max(255),
});

export const caseUpdateFormSchema = caseCreateFormSchema.extend({
  version: z.coerce.number().int().min(1),
});

export type CaseFormValues = z.input<typeof caseUpdateFormSchema>;
export type CaseFormMode = "create" | "edit";

export function buildCaseCreateInput(values: CaseFormValues): CaseInput {
  const parsed = caseCreateFormSchema.parse(values);
  return cleanCaseInput(parsed);
}

export function buildCaseUpdateInput(values: CaseFormValues): CaseUpdateInput {
  const parsed = caseUpdateFormSchema.parse(values);
  return { ...cleanCaseInput(parsed), version: parsed.version };
}

export function caseDetailToFormValues(legalCase: CaseDetail): CaseFormValues {
  return {
    case_type: legalCase.case_type,
    closed_on: legalCase.closed_on ?? "",
    court_or_authority: legalCase.court_or_authority,
    description: legalCase.description,
    filing_date: legalCase.filing_date ?? "",
    opened_on: legalCase.opened_on ?? "",
    outcome_summary: legalCase.outcome_summary,
    owner_id: legalCase.owner_id,
    parties: legalCase.parties.map((party) => ({
      contact_summary: party.contact_summary,
      name: party.name,
      role: party.role,
    })),
    priority: legalCase.priority,
    reference_code: legalCase.reference_code,
    status: legalCase.status,
    title: legalCase.title,
    version: legalCase.version,
  };
}

export function defaultCaseFormValues(): CaseFormValues {
  return {
    case_type: "litigation",
    closed_on: "",
    court_or_authority: "",
    description: "",
    filing_date: "",
    opened_on: "",
    outcome_summary: "",
    owner_id: "",
    parties: [{ contact_summary: "", name: "", role: "client" }],
    priority: "normal",
    reference_code: "",
    status: "open",
    title: "",
    version: 1,
  };
}

function cleanCaseInput(
  parsed: z.output<typeof caseCreateFormSchema>,
): CaseInput {
  return {
    case_type: parsed.case_type,
    closed_on: parsed.closed_on ?? null,
    court_or_authority: parsed.court_or_authority,
    description: parsed.description,
    filing_date: parsed.filing_date ?? null,
    opened_on: parsed.opened_on ?? null,
    outcome_summary: parsed.outcome_summary,
    owner_id: parsed.owner_id || undefined,
    parties: parsed.parties.map(cleanPartyInput),
    priority: parsed.priority,
    reference_code: parsed.reference_code,
    status: parsed.status,
    title: parsed.title,
  };
}

function cleanPartyInput(
  party: z.output<typeof casePartyFormSchema>,
): CasePartyInput {
  return {
    contact_summary: party.contact_summary,
    name: party.name,
    role: party.role,
  };
}
