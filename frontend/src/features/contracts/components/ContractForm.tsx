import {
  useForm,
  useWatch,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";

import { isApiError } from "../../../api/errors";
import type { AsyncChoice } from "../../../components/forms/AsyncChoiceSelect";
import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
import { LocalizedDateInput } from "../../../components/localizedDateInput";
import { useI18n } from "../../../i18n";
import { OwnerChoiceSelect } from "../../choices";
import {
  buildContractCreateInput,
  buildContractUpdateInput,
  contractDetailToFormValues,
  defaultContractFormValues,
  type ContractFormMode,
  type ContractFormValues,
} from "../schemas";
import type {
  ContractDetail,
  ContractInput,
  ContractUpdateInput,
} from "../types";
import {
  contractPriorityLabel,
  contractStatusLabel,
  contractText,
  contractTypeLabel,
} from "./contractLabels";

type ContractFormProps = {
  initialContract?: ContractDetail;
  mode: ContractFormMode;
  mutationError: unknown;
  onSubmit: (
    input: ContractInput | ContractUpdateInput,
  ) => Promise<ContractDetail>;
};

const CONTRACT_FIELDS = new Set<string>([
  "closed_on",
  "contract_type",
  "counterparty",
  "description",
  "effective_date",
  "expiration_date",
  "key_terms_text",
  "opened_on",
  "owner_id",
  "priority",
  "reference_code",
  "renewal_date",
  "status",
  "title",
  "version",
]);

export function ContractForm({
  initialContract,
  mode,
  mutationError,
  onSubmit,
}: ContractFormProps) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const labels = contractText(locale);
  const [ownerChoice, setOwnerChoice] = useState<AsyncChoice | null>(null);
  const form = useForm<ContractFormValues>({
    defaultValues: initialContract ? undefined : defaultContractFormValues(),
    values: initialContract
      ? contractDetailToFormValues(initialContract)
      : undefined,
  });
  const conflict =
    isApiError(mutationError) &&
    mutationError.code === "contract_version_conflict";

  async function submit(values: ContractFormValues) {
    form.clearErrors();
    try {
      const input =
        mode === "create"
          ? buildContractCreateInput(values)
          : buildContractUpdateInput(values);
      const savedContract = await onSubmit(input);
      navigate(`/contracts/${savedContract.id}`);
    } catch (error) {
      applyFormError(form.setError, error, labels);
    }
  }

  return (
    <form
      className="contract-form"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <FormErrorSummary errors={formErrors(form.formState.errors, labels)} />
      {conflict ? (
        <p className="contract-alert" role="alert">
          {labels.versionConflict}
        </p>
      ) : null}
      {isNonConflictApiError(mutationError) ? (
        <p className="contract-alert" role="alert">
          {mutationError.message}
        </p>
      ) : null}
      <fieldset>
        <legend>{labels.contractDetails}</legend>
        <label>
          {labels.title}
          <input {...form.register("title")} id="title" />
        </label>
        <label>
          {labels.referenceCode}
          <input {...form.register("reference_code")} id="reference_code" />
        </label>
        <label>
          {labels.counterparty}
          <input {...form.register("counterparty")} id="counterparty" />
        </label>
        <ContractSelectFields
          labels={labels}
          locale={locale}
          register={form.register}
        />
        {mode === "create" ? (
          <>
            <OwnerChoiceSelect
              id="owner_id"
              onChange={(choice) => {
                setOwnerChoice(choice);
                form.setValue("owner_id", choice?.id ?? "", {
                  shouldValidate: true,
                });
              }}
              value={ownerChoice}
            />
            <input {...form.register("owner_id")} type="hidden" />
          </>
        ) : (
          <label>
            {labels.ownerMembership}
            <input {...form.register("owner_id")} id="owner_id" />
          </label>
        )}
      </fieldset>
      <ContractDateFields form={form} labels={labels} />
      <label>
        {labels.description}
        <textarea {...form.register("description")} id="description" rows={4} />
      </label>
      <label>
        {labels.keyTermsJson}
        <textarea
          {...form.register("key_terms_text")}
          id="key_terms_text"
          rows={6}
        />
      </label>
      {mode === "edit" ? (
        <input
          {...form.register("version", { valueAsNumber: true })}
          type="hidden"
        />
      ) : null}
      <div className="contract-form__actions">
        <button disabled={form.formState.isSubmitting} type="submit">
          {mode === "create" ? labels.create : labels.save}
        </button>
      </div>
    </form>
  );
}

function ContractSelectFields({
  labels,
  locale,
  register,
}: {
  labels: ReturnType<typeof contractText>;
  locale: ReturnType<typeof useI18n>["locale"];
  register: ReturnType<typeof useForm<ContractFormValues>>["register"];
}) {
  return (
    <>
      <label>
        {labels.status}
        <select {...register("status")} id="status">
          {(
            ["active", "draft", "expired", "terminated", "archived"] as const
          ).map((status) => (
            <option key={status} value={status}>
              {contractStatusLabel(status, locale)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.priority}
        <select {...register("priority")} id="priority">
          {(["normal", "low", "high", "critical"] as const).map((priority) => (
            <option key={priority} value={priority}>
              {contractPriorityLabel(priority, locale)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.contractType}
        <select {...register("contract_type")} id="contract_type">
          {(["vendor", "service", "employment", "nda", "other"] as const).map(
            (contractType) => (
              <option key={contractType} value={contractType}>
                {contractTypeLabel(contractType, locale)}
              </option>
            ),
          )}
        </select>
      </label>
    </>
  );
}

function ContractDateFields({
  form,
  labels,
}: {
  form: ReturnType<typeof useForm<ContractFormValues>>;
  labels: ReturnType<typeof contractText>;
}) {
  const effectiveDate = useWatch({
    control: form.control,
    name: "effective_date",
  });
  const expirationDate = useWatch({
    control: form.control,
    name: "expiration_date",
  });
  const renewalDate = useWatch({ control: form.control, name: "renewal_date" });
  const openedOn = useWatch({ control: form.control, name: "opened_on" });
  const closedOn = useWatch({ control: form.control, name: "closed_on" });

  return (
    <fieldset>
      <legend>{labels.dates}</legend>
      <LocalizedDateInput
        id="effective_date"
        label={labels.effectiveDate}
        onValueChange={(value) => form.setValue("effective_date", value)}
        registration={form.register("effective_date")}
        value={effectiveDate}
      />
      <LocalizedDateInput
        id="expiration_date"
        label={labels.expirationDate}
        onValueChange={(value) => form.setValue("expiration_date", value)}
        registration={form.register("expiration_date")}
        value={expirationDate}
      />
      <LocalizedDateInput
        id="renewal_date"
        label={labels.renewalDate}
        onValueChange={(value) => form.setValue("renewal_date", value)}
        registration={form.register("renewal_date")}
        value={renewalDate}
      />
      <LocalizedDateInput
        id="opened_on"
        label={labels.openedOn}
        onValueChange={(value) => form.setValue("opened_on", value)}
        registration={form.register("opened_on")}
        value={openedOn}
      />
      <LocalizedDateInput
        id="closed_on"
        label={labels.closedOn}
        onValueChange={(value) => form.setValue("closed_on", value)}
        registration={form.register("closed_on")}
        value={closedOn}
      />
    </fieldset>
  );
}

function applyFormError(
  setError: ReturnType<typeof useForm<ContractFormValues>>["setError"],
  error: unknown,
  labels: ReturnType<typeof contractText>,
) {
  if (error instanceof ZodError) {
    applyZodErrors(setError, error, labels);
    return;
  }
  if (isApiError(error) && applyApiFieldErrors(setError, error, labels)) {
    return;
  }
  setError("root", {
    message: error instanceof Error ? error.message : labels.saveFailed,
  });
}

function applyZodErrors(
  setError: ReturnType<typeof useForm<ContractFormValues>>["setError"],
  error: ZodError,
  labels: ReturnType<typeof contractText>,
) {
  for (const issue of error.issues) {
    setError(issue.path.join(".") as FieldPath<ContractFormValues>, {
      message: validationMessage(issue.message, labels),
    });
  }
}

function validationMessage(
  message: string,
  labels: ReturnType<typeof contractText>,
): string {
  return labels.invalidValue === "Invalid value."
    ? message
    : labels.invalidValue;
}

function applyApiFieldErrors(
  setError: ReturnType<typeof useForm<ContractFormValues>>["setError"],
  error: { code: string; details: Record<string, unknown>; message: string },
  labels: ReturnType<typeof contractText>,
): boolean {
  const mapped = applyApiDetails(setError, error.details, labels);
  if (mapped) {
    return true;
  }
  if (error.code === "contract_date_invalid") {
    return applyDateRuleError(setError, error.message);
  }
  return false;
}

function applyApiDetails(
  setError: ReturnType<typeof useForm<ContractFormValues>>["setError"],
  details: Record<string, unknown>,
  labels: ReturnType<typeof contractText>,
): boolean {
  let mapped = false;
  for (const [field, message] of Object.entries(details)) {
    if (isContractField(field)) {
      setError(field as FieldPath<ContractFormValues>, {
        message: detailMessage(message, labels),
      });
      mapped = true;
    }
  }
  return mapped;
}

function applyDateRuleError(
  setError: ReturnType<typeof useForm<ContractFormValues>>["setError"],
  message: string,
): boolean {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("renewal")) {
    setError("renewal_date", { message });
    return true;
  }
  if (lowerMessage.includes("expiration")) {
    setError("expiration_date", { message });
    return true;
  }
  setError("expiration_date", { message });
  setError("renewal_date", { message });
  return true;
}

function formErrors(
  errors: FieldErrors<ContractFormValues>,
  labels: ReturnType<typeof contractText>,
): FormErrorItem[] {
  return Object.entries(errors).flatMap(([field, error]) => {
    if (!error) {
      return [];
    }
    return [
      {
        fieldId: field,
        label: fieldLabel(field, labels),
        message: String(error.message),
      },
    ];
  });
}

function detailMessage(
  value: unknown,
  labels: ReturnType<typeof contractText>,
): string {
  if (Array.isArray(value)) {
    return String(value[0] ?? labels.invalidValue);
  }
  return String(value || labels.invalidValue);
}

function fieldLabel(
  field: string,
  labels: ReturnType<typeof contractText>,
): string {
  const fieldLabels: Record<string, string> = {
    closed_on: labels.closedOn,
    contract_type: labels.contractType,
    counterparty: labels.counterparty,
    description: labels.description,
    effective_date: labels.effectiveDate,
    expiration_date: labels.expirationDate,
    key_terms_text: labels.keyTermsJson,
    opened_on: labels.openedOn,
    owner_id: labels.ownerMembership,
    priority: labels.priority,
    reference_code: labels.referenceCode,
    renewal_date: labels.renewalDate,
    status: labels.status,
    title: labels.title,
  };
  return fieldLabels[field] ?? field.replaceAll("_", " ");
}

function isContractField(field: string): boolean {
  return CONTRACT_FIELDS.has(field);
}

function isNonConflictApiError(error: unknown): error is Error {
  return isApiError(error) && error.code !== "contract_version_conflict";
}
