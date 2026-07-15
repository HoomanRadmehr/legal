import { Link } from "react-router-dom";

import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import { formatDate } from "../../../i18n/date";
import { useI18n } from "../../../i18n";
import type { CaseDetail } from "../types";
import {
  casePriorityLabel,
  caseStatusLabel,
  caseText,
  caseTypeLabel,
  partyRoleLabel,
  statusTone,
} from "./caseLabels";

export function CaseSummary({ legalCase }: { legalCase: CaseDetail }) {
  const { locale } = useI18n();
  const labels = caseText(locale);

  return (
    <div className="case-detail-grid">
      <section aria-labelledby="case-summary-title">
        <h2 id="case-summary-title">{labels.summary}</h2>
        <dl className="case-definition-list">
          <div>
            <dt>{labels.reference}</dt>
            <dd>
              <TechnicalValue>{legalCase.reference_code}</TechnicalValue>
            </dd>
          </div>
          <div>
            <dt>{labels.status}</dt>
            <dd>
              <StatusBadge
                label={caseStatusLabel(legalCase.status, locale)}
                tone={statusTone(legalCase.status)}
              />
            </dd>
          </div>
          <div>
            <dt>{labels.priority}</dt>
            <dd>{casePriorityLabel(legalCase.priority, locale)}</dd>
          </div>
          <div>
            <dt>{labels.caseType}</dt>
            <dd>{caseTypeLabel(legalCase.case_type, locale)}</dd>
          </div>
          <div>
            <dt>{labels.owner}</dt>
            <dd>
              <TechnicalValue>{legalCase.owner_id}</TechnicalValue>
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="case-dates-title">
        <h2 id="case-dates-title">{labels.dates}</h2>
        <dl className="case-definition-list">
          <DetailItem
            label={labels.opened}
            value={formatDate(legalCase.opened_on, locale)}
          />
          <DetailItem
            label={labels.closed}
            value={formatDate(legalCase.closed_on, locale)}
          />
          <DetailItem
            label={labels.filingDate}
            value={formatDate(legalCase.filing_date, locale)}
          />
          <DetailItem
            label={labels.court}
            value={legalCase.court_or_authority}
          />
        </dl>
      </section>
      <section aria-labelledby="case-description-title">
        <h2 id="case-description-title">{labels.description}</h2>
        <p>{legalCase.description || labels.noDescription}</p>
        {legalCase.outcome_summary ? <p>{legalCase.outcome_summary}</p> : null}
      </section>
      <section aria-labelledby="case-parties-title">
        <h2 id="case-parties-title">{labels.parties}</h2>
        {legalCase.parties.length > 0 ? (
          <ul className="case-party-list">
            {legalCase.parties.map((party) => (
              <li key={party.id ?? `${party.name}-${party.role}`}>
                <strong>{party.name}</strong>
                <span>{partyRoleLabel(party.role, locale)}</span>
                {party.contact_summary ? <p>{party.contact_summary}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>{labels.noParties}</p>
        )}
      </section>
      <section aria-labelledby="case-linked-title">
        <h2 id="case-linked-title">{labels.linked}</h2>
        <p>{labels.linkedPlaceholder}</p>
        <Link to={`/cases/${legalCase.id}#timeline`}>
          {labels.reviewTimeline}
        </Link>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
