import { useForm, type FieldErrors, type FieldPath } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";

import { isApiError } from "../../../api/errors";
import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
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
      applyFormError(form.setError, error);
    }
  }

  return (
    <form
      className="contract-form"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <FormErrorSummary errors={formErrors(form.formState.errors)} />
      {conflict ? (
        <p className="contract-alert" role="alert">
          This contract changed while you were editing. Reload before saving to
          avoid overwriting work.
        </p>
      ) : null}
      {isNonConflictApiError(mutationError) ? (
        <p className="contract-alert" role="alert">
          {mutationError.message}
        </p>
      ) : null}
      <fieldset>
        <legend>Contract details</legend>
        <label>
          Title
          <input {...form.register("title")} id="title" />
        </label>
        <label>
          Reference code
          <input {...form.register("reference_code")} id="reference_code" />
        </label>
        <label>
          Counterparty
          <input {...form.register("counterparty")} id="counterparty" />
        </label>
        <ContractSelectFields register={form.register} />
        <label>
          Owner membership ID
          <input {...form.register("owner_id")} id="owner_id" />
        </label>
      </fieldset>
      <ContractDateFields register={form.register} />
      <label>
        Description
        <textarea {...form.register("description")} id="description" rows={4} />
      </label>
      <label>
        Key terms JSON
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
          {mode === "create" ? "Create contract" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function ContractSelectFields({
  register,
}: {
  register: ReturnType<typeof useForm<ContractFormValues>>["register"];
}) {
  return (
    <>
      <label>
        Status
        <select {...register("status")} id="status">
          {(
            ["active", "draft", "expired", "terminated", "archived"] as const
          ).map((status) => (
            <option key={status} value={status}>
              {contractStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Priority
        <select {...register("priority")} id="priority">
          {(["normal", "low", "high", "critical"] as const).map((priority) => (
            <option key={priority} value={priority}>
              {contractPriorityLabel(priority)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Contract type
        <select {...register("contract_type")} id="contract_type">
          {(["vendor", "service", "employment", "nda", "other"] as const).map(
            (contractType) => (
              <option key={contractType} value={contractType}>
                {contractTypeLabel(contractType)}
              </option>
            ),
          )}
        </select>
      </label>
    </>
  );
}

function ContractDateFields({
  register,
}: {
  register: ReturnType<typeof useForm<ContractFormValues>>["register"];
}) {
  return (
    <fieldset>
      <legend>Dates</legend>
      <label>
        Effective date
        <input
          {...register("effective_date")}
          id="effective_date"
          type="date"
        />
      </label>
      <label>
        Expiration date
        <input
          {...register("expiration_date")}
          id="expiration_date"
          type="date"
        />
      </label>
      <label>
        Renewal date
        <input {...register("renewal_date")} id="renewal_date" type="date" />
      </label>
      <label>
        Opened on
        <input {...register("opened_on")} id="opened_on" type="date" />
      </label>
      <label>
        Closed on
        <input {...register("closed_on")} id="closed_on" type="date" />
      </label>
    </fieldset>
  );
}

function applyFormError(
  setError: ReturnType<typeof useForm<ContractFormValues>>["setError"],
  error: unknown,
) {
  if (error instanceof ZodError) {
    applyZodErrors(setError, error);
    return;
  }
  if (isApiError(error) && applyApiFieldErrors(setError, error)) {
    return;
  }
  setError("root", {
    message: error instanceof Error ? error.message : "Save failed.",
  });
}

function applyZodErrors(
  setError: ReturnType<typeof useForm<ContractFormValues>>["setError"],
  error: ZodError,
) {
  for (const issue of error.issues) {
    setError(issue.path.join(".") as FieldPath<ContractFormValues>, {
      message: issue.message,
    });
  }
}

function applyApiFieldErrors(
  setError: ReturnType<typeof useForm<ContractFormValues>>["setError"],
  error: { code: string; details: Record<string, unknown>; message: string },
): boolean {
  const mapped = applyApiDetails(setError, error.details);
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
): boolean {
  let mapped = false;
  for (const [field, message] of Object.entries(details)) {
    if (isContractField(field)) {
      setError(field as FieldPath<ContractFormValues>, {
        message: detailMessage(message),
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

function formErrors(errors: FieldErrors<ContractFormValues>): FormErrorItem[] {
  return Object.entries(errors).flatMap(([field, error]) => {
    if (!error) {
      return [];
    }
    return [
      {
        fieldId: field,
        label: fieldLabel(field),
        message: String(error.message),
      },
    ];
  });
}

function detailMessage(value: unknown): string {
  if (Array.isArray(value)) {
    return String(value[0] ?? "Invalid value.");
  }
  return String(value || "Invalid value.");
}

function fieldLabel(field: string): string {
  return field.replaceAll("_", " ");
}

function isContractField(field: string): boolean {
  return CONTRACT_FIELDS.has(field);
}

function isNonConflictApiError(error: unknown): error is Error {
  return isApiError(error) && error.code !== "contract_version_conflict";
}
