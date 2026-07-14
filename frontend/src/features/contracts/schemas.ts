import { z } from "zod";

import type {
  ContractDetail,
  ContractInput,
  ContractUpdateInput,
} from "./types";

const emptyDate = z.literal("").transform(() => null);
const optionalText = z.string().trim().optional().default("");
const optionalUuid = z.string().trim().uuid().optional().or(z.literal(""));

type ContractBaseOutput = {
  effective_date: string;
  expiration_date?: string | null;
  key_terms_text: string;
  renewal_date?: string | null;
};

const contractBaseFormSchema = z
  .object({
    closed_on: z.string().date().nullable().or(emptyDate).optional(),
    contract_type: z.enum(["employment", "nda", "other", "service", "vendor"]),
    counterparty: z
      .string()
      .trim()
      .min(1, "Counterparty is required.")
      .max(255),
    description: optionalText,
    effective_date: z.string().date("Effective date is required."),
    expiration_date: z.string().date().nullable().or(emptyDate).optional(),
    key_terms_text: z.string().trim().max(8192).optional().default("{}"),
    opened_on: z.string().date().nullable().or(emptyDate).optional(),
    owner_id: optionalUuid,
    priority: z.enum(["critical", "high", "low", "normal"]),
    reference_code: z
      .string()
      .trim()
      .min(1, "Reference code is required.")
      .max(64),
    renewal_date: z.string().date().nullable().or(emptyDate).optional(),
    status: z
      .enum(["active", "archived", "draft", "expired", "terminated"])
      .default("active"),
    title: z.string().trim().min(1, "Title is required.").max(255),
  })
  .superRefine(validateDateOrder)
  .superRefine(validateKeyTermsJson);

export const contractCreateFormSchema = contractBaseFormSchema;

export const contractUpdateFormSchema = contractBaseFormSchema.extend({
  version: z.coerce.number().int().min(1),
});

export type ContractFormValues = z.input<typeof contractUpdateFormSchema>;
export type ContractFormMode = "create" | "edit";

export function buildContractCreateInput(
  values: ContractFormValues,
): ContractInput {
  const parsed = contractCreateFormSchema.parse(values);
  return cleanContractInput(parsed);
}

export function buildContractUpdateInput(
  values: ContractFormValues,
): ContractUpdateInput {
  const parsed = contractUpdateFormSchema.parse(values);
  return { ...cleanContractInput(parsed), version: parsed.version };
}

export function contractDetailToFormValues(
  contract: ContractDetail,
): ContractFormValues {
  return {
    closed_on: contract.closed_on ?? "",
    contract_type: contract.contract_type,
    counterparty: contract.counterparty,
    description: contract.description,
    effective_date: contract.effective_date,
    expiration_date: contract.expiration_date ?? "",
    key_terms_text: JSON.stringify(contract.key_terms, null, 2),
    opened_on: contract.opened_on ?? "",
    owner_id: contract.owner_id,
    priority: contract.priority,
    reference_code: contract.reference_code,
    renewal_date: contract.renewal_date ?? "",
    status: contract.status,
    title: contract.title,
    version: contract.version,
  };
}

export function defaultContractFormValues(): ContractFormValues {
  return {
    closed_on: "",
    contract_type: "vendor",
    counterparty: "",
    description: "",
    effective_date: "",
    expiration_date: "",
    key_terms_text: "{}",
    opened_on: "",
    owner_id: "",
    priority: "normal",
    reference_code: "",
    renewal_date: "",
    status: "active",
    title: "",
    version: 1,
  };
}

function validateDateOrder(
  values: ContractBaseOutput,
  context: z.RefinementCtx,
) {
  if (
    values.expiration_date &&
    values.expiration_date < values.effective_date
  ) {
    context.addIssue({
      code: "custom",
      message: "Expiration date cannot precede effective date.",
      path: ["expiration_date"],
    });
  }
  if (values.renewal_date && values.renewal_date < values.effective_date) {
    context.addIssue({
      code: "custom",
      message: "Renewal date cannot precede effective date.",
      path: ["renewal_date"],
    });
  }
  if (values.renewal_date && values.expiration_date) {
    validateRenewalBeforeExpiration(values, context);
  }
}

function validateRenewalBeforeExpiration(
  values: ContractBaseOutput,
  context: z.RefinementCtx,
) {
  if (!values.renewal_date || !values.expiration_date) {
    return;
  }
  if (values.expiration_date >= values.renewal_date) {
    return;
  }
  context.addIssue({
    code: "custom",
    message: "Renewal date cannot be after expiration date.",
    path: ["renewal_date"],
  });
}

function validateKeyTermsJson(
  values: ContractBaseOutput,
  context: z.RefinementCtx,
) {
  try {
    const keyTerms = JSON.parse(values.key_terms_text || "{}");
    if (!isPlainObject(keyTerms)) {
      addKeyTermsIssue(context, "Key terms must be a JSON object.");
    }
  } catch {
    addKeyTermsIssue(context, "Key terms must be valid JSON.");
  }
}

function addKeyTermsIssue(context: z.RefinementCtx, message: string) {
  context.addIssue({ code: "custom", message, path: ["key_terms_text"] });
}

function cleanContractInput(
  parsed: z.output<typeof contractCreateFormSchema>,
): ContractInput {
  return {
    closed_on: parsed.closed_on ?? null,
    contract_type: parsed.contract_type,
    counterparty: parsed.counterparty,
    description: parsed.description,
    effective_date: parsed.effective_date,
    expiration_date: parsed.expiration_date ?? null,
    key_terms: parseKeyTerms(parsed.key_terms_text),
    opened_on: parsed.opened_on ?? null,
    owner_id: parsed.owner_id || undefined,
    priority: parsed.priority,
    reference_code: parsed.reference_code,
    renewal_date: parsed.renewal_date ?? null,
    status: parsed.status,
    title: parsed.title,
  };
}

function parseKeyTerms(value: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(value || "{}");
  return isPlainObject(parsed) ? parsed : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
