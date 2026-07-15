import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";

import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
import { LocalizedDateInput } from "../../../components/localizedDateInput";
import { useI18n } from "../../../i18n";
import { isApiError } from "../../../api/errors";
import {
  buildCaseCreateInput,
  buildCaseUpdateInput,
  defaultCaseFormValues,
  type CaseFormMode,
  type CaseFormValues,
} from "../schemas";
import type { CaseDetail, CaseInput, CaseUpdateInput } from "../types";
import {
  casePriorityLabel,
  caseStatusLabel,
  caseText,
  caseTypeLabel,
  partyRoleLabel,
} from "./caseLabels";

type CaseFormProps = {
  initialCase?: CaseDetail;
  mode: CaseFormMode;
  mutationError: unknown;
  onSubmit: (input: CaseInput | CaseUpdateInput) => Promise<CaseDetail>;
};

export function CaseForm({
  initialCase,
  mode,
  mutationError,
  onSubmit,
}: CaseFormProps) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const labels = caseText(locale);
  const form = useForm<CaseFormValues>({
    defaultValues: initialCase ? undefined : defaultCaseFormValues(),
    values: initialCase ? caseToValues(initialCase) : undefined,
  });
  const parties = useFieldArray({ control: form.control, name: "parties" });
  const conflict =
    isApiError(mutationError) && mutationError.code === "case_version_conflict";

  async function submit(values: CaseFormValues) {
    form.clearErrors();
    try {
      const input =
        mode === "create"
          ? buildCaseCreateInput(values)
          : buildCaseUpdateInput(values);
      const savedCase = await onSubmit(input);
      navigate(`/cases/${savedCase.id}`);
    } catch (error) {
      applyFormError(form.setError, error, labels);
    }
  }

  return (
    <form className="case-form" onSubmit={form.handleSubmit(submit)} noValidate>
      <FormErrorSummary errors={formErrors(form.formState.errors, labels)} />
      {conflict ? (
        <p className="case-alert" role="alert">
          {labels.versionConflict}
        </p>
      ) : null}
      {isNonConflictApiError(mutationError) ? (
        <p className="case-alert" role="alert">
          {mutationError.message}
        </p>
      ) : null}
      <fieldset>
        <legend>{labels.caseDetails}</legend>
        <label>
          {labels.title}
          <input {...form.register("title")} id="title" />
        </label>
        <label>
          {labels.referenceCode}
          <input {...form.register("reference_code")} id="reference_code" />
        </label>
        <label>
          {labels.status}
          <select {...form.register("status")} id="status">
            {(
              ["open", "pending", "on_hold", "closed", "archived"] as const
            ).map((status) => (
              <option key={status} value={status}>
                {caseStatusLabel(status, locale)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {labels.priority}
          <select {...form.register("priority")} id="priority">
            {(["normal", "low", "high", "critical"] as const).map(
              (priority) => (
                <option key={priority} value={priority}>
                  {casePriorityLabel(priority, locale)}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          {labels.caseType}
          <select {...form.register("case_type")} id="case_type">
            {(["litigation", "regulatory", "internal", "other"] as const).map(
              (caseType) => (
                <option key={caseType} value={caseType}>
                  {caseTypeLabel(caseType, locale)}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          {labels.ownerMembership}
          <input {...form.register("owner_id")} id="owner_id" />
        </label>
      </fieldset>
      <CaseDateFields form={form} labels={labels} />
      <label>
        {labels.description}
        <textarea {...form.register("description")} id="description" rows={4} />
      </label>
      <label>
        {labels.outcome}
        <textarea
          {...form.register("outcome_summary")}
          id="outcome_summary"
          rows={3}
        />
      </label>
      <fieldset>
        <legend>{labels.parties}</legend>
        {parties.fields.map((field, index) => (
          <div className="case-party-row" key={field.id}>
            <label>
              {labels.partyName}
              <input {...form.register(`parties.${index}.name`)} />
            </label>
            <label>
              {labels.partyRole}
              <select {...form.register(`parties.${index}.role`)}>
                {(
                  ["client", "opposing", "court", "witness", "other"] as const
                ).map((role) => (
                  <option key={role} value={role}>
                    {partyRoleLabel(role, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {labels.contactSummary}
              <input {...form.register(`parties.${index}.contact_summary`)} />
            </label>
            <button type="button" onClick={() => parties.remove(index)}>
              {labels.removeParty}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            parties.append({ contact_summary: "", name: "", role: "client" })
          }
        >
          {labels.addParty}
        </button>
      </fieldset>
      {mode === "edit" ? (
        <input
          {...form.register("version", { valueAsNumber: true })}
          type="hidden"
        />
      ) : null}
      <div className="case-form__actions">
        <button disabled={form.formState.isSubmitting} type="submit">
          {mode === "create" ? labels.create : labels.save}
        </button>
      </div>
    </form>
  );
}

function CaseDateFields({
  form,
  labels,
}: {
  form: ReturnType<typeof useForm<CaseFormValues>>;
  labels: ReturnType<typeof caseText>;
}) {
  const openedOn = useWatch({ control: form.control, name: "opened_on" });
  const closedOn = useWatch({ control: form.control, name: "closed_on" });
  const filingDate = useWatch({ control: form.control, name: "filing_date" });

  return (
    <fieldset>
      <legend>{labels.dates}</legend>
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
      <LocalizedDateInput
        id="filing_date"
        label={labels.filingDate}
        onValueChange={(value) => form.setValue("filing_date", value)}
        registration={form.register("filing_date")}
        value={filingDate}
      />
      <label>
        {labels.court}
        <input
          {...form.register("court_or_authority")}
          id="court_or_authority"
        />
      </label>
    </fieldset>
  );
}

function caseToValues(legalCase: CaseDetail): CaseFormValues {
  return {
    case_type: legalCase.case_type,
    closed_on: legalCase.closed_on ?? "",
    court_or_authority: legalCase.court_or_authority,
    description: legalCase.description,
    filing_date: legalCase.filing_date ?? "",
    opened_on: legalCase.opened_on ?? "",
    outcome_summary: legalCase.outcome_summary,
    owner_id: legalCase.owner_id,
    parties: legalCase.parties,
    priority: legalCase.priority,
    reference_code: legalCase.reference_code,
    status: legalCase.status,
    title: legalCase.title,
    version: legalCase.version,
  };
}

function applyFormError(
  setError: ReturnType<typeof useForm<CaseFormValues>>["setError"],
  error: unknown,
  labels: ReturnType<typeof caseText>,
) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      setError(issue.path.join(".") as keyof CaseFormValues, {
        message: validationMessage(issue.message, labels),
      });
    }
    return;
  }
  setError("root", {
    message: error instanceof Error ? error.message : labels.saveFailed,
  });
}

function validationMessage(
  message: string,
  labels: ReturnType<typeof caseText>,
): string {
  return labels.invalidValue === "Invalid value." ? message : labels.invalidValue;
}

function formErrors(
  errors: FieldErrors<CaseFormValues>,
  labels: ReturnType<typeof caseText>,
): FormErrorItem[] {
  return Object.entries(errors).flatMap(([field, error]) => {
    if (!error || field === "parties") {
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

function fieldLabel(field: string, labels: ReturnType<typeof caseText>): string {
  const fieldLabels: Record<string, string> = {
    case_type: labels.caseType,
    closed_on: labels.closedOn,
    court_or_authority: labels.court,
    description: labels.description,
    filing_date: labels.filingDate,
    opened_on: labels.openedOn,
    outcome_summary: labels.outcome,
    owner_id: labels.ownerMembership,
    priority: labels.priority,
    reference_code: labels.referenceCode,
    status: labels.status,
    title: labels.title,
  };
  return fieldLabels[field] ?? field.replaceAll("_", " ");
}

function isNonConflictApiError(error: unknown): error is Error {
  return isApiError(error) && error.code !== "case_version_conflict";
}
