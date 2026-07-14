import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";

import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
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
      applyFormError(form.setError, error);
    }
  }

  return (
    <form className="case-form" onSubmit={form.handleSubmit(submit)} noValidate>
      <FormErrorSummary errors={formErrors(form.formState.errors)} />
      {conflict ? (
        <p className="case-alert" role="alert">
          This case changed while you were editing. Reload before saving to
          avoid overwriting work.
        </p>
      ) : null}
      {isNonConflictApiError(mutationError) ? (
        <p className="case-alert" role="alert">
          {mutationError.message}
        </p>
      ) : null}
      <fieldset>
        <legend>Case details</legend>
        <label>
          Title
          <input {...form.register("title")} id="title" />
        </label>
        <label>
          Reference code
          <input {...form.register("reference_code")} id="reference_code" />
        </label>
        <label>
          Status
          <select {...form.register("status")} id="status">
            {(
              ["open", "pending", "on_hold", "closed", "archived"] as const
            ).map((status) => (
              <option key={status} value={status}>
                {caseStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select {...form.register("priority")} id="priority">
            {(["normal", "low", "high", "critical"] as const).map(
              (priority) => (
                <option key={priority} value={priority}>
                  {casePriorityLabel(priority)}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          Case type
          <select {...form.register("case_type")} id="case_type">
            {(["litigation", "regulatory", "internal", "other"] as const).map(
              (caseType) => (
                <option key={caseType} value={caseType}>
                  {caseTypeLabel(caseType)}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          Owner membership ID
          <input {...form.register("owner_id")} id="owner_id" />
        </label>
      </fieldset>
      <CaseDateFields register={form.register} />
      <label>
        Description
        <textarea {...form.register("description")} id="description" rows={4} />
      </label>
      <label>
        Outcome summary
        <textarea
          {...form.register("outcome_summary")}
          id="outcome_summary"
          rows={3}
        />
      </label>
      <fieldset>
        <legend>Parties</legend>
        {parties.fields.map((field, index) => (
          <div className="case-party-row" key={field.id}>
            <label>
              Party name
              <input {...form.register(`parties.${index}.name`)} />
            </label>
            <label>
              Party role
              <select {...form.register(`parties.${index}.role`)}>
                {(
                  ["client", "opposing", "court", "witness", "other"] as const
                ).map((role) => (
                  <option key={role} value={role}>
                    {partyRoleLabel(role)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Contact summary
              <input {...form.register(`parties.${index}.contact_summary`)} />
            </label>
            <button type="button" onClick={() => parties.remove(index)}>
              Remove party
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            parties.append({ contact_summary: "", name: "", role: "client" })
          }
        >
          Add party
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
          {mode === "create" ? "Create case" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function CaseDateFields({
  register,
}: {
  register: ReturnType<typeof useForm<CaseFormValues>>["register"];
}) {
  return (
    <fieldset>
      <legend>Dates and authority</legend>
      <label>
        Opened on
        <input {...register("opened_on")} id="opened_on" type="date" />
      </label>
      <label>
        Closed on
        <input {...register("closed_on")} id="closed_on" type="date" />
      </label>
      <label>
        Filing date
        <input {...register("filing_date")} id="filing_date" type="date" />
      </label>
      <label>
        Court or authority
        <input {...register("court_or_authority")} id="court_or_authority" />
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
) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      setError(issue.path.join(".") as keyof CaseFormValues, {
        message: issue.message,
      });
    }
    return;
  }
  setError("root", {
    message: error instanceof Error ? error.message : "Save failed.",
  });
}

function formErrors(errors: FieldErrors<CaseFormValues>): FormErrorItem[] {
  return Object.entries(errors).flatMap(([field, error]) => {
    if (!error || field === "parties") {
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

function fieldLabel(field: string): string {
  return field.replaceAll("_", " ");
}

function isNonConflictApiError(error: unknown): error is Error {
  return isApiError(error) && error.code !== "case_version_conflict";
}
