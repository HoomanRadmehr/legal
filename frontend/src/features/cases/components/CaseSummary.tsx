import { Link } from "react-router-dom";

import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import type { CaseDetail } from "../types";
import {
  casePriorityLabel,
  caseStatusLabel,
  caseTypeLabel,
  partyRoleLabel,
  statusTone,
} from "./caseLabels";

export function CaseSummary({ legalCase }: { legalCase: CaseDetail }) {
  return (
    <div className="case-detail-grid">
      <section aria-labelledby="case-summary-title">
        <h2 id="case-summary-title">Summary</h2>
        <dl className="case-definition-list">
          <div>
            <dt>Reference</dt>
            <dd>
              <TechnicalValue>{legalCase.reference_code}</TechnicalValue>
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge
                label={caseStatusLabel(legalCase.status)}
                tone={statusTone(legalCase.status)}
              />
            </dd>
          </div>
          <div>
            <dt>Priority</dt>
            <dd>{casePriorityLabel(legalCase.priority)}</dd>
          </div>
          <div>
            <dt>Case type</dt>
            <dd>{caseTypeLabel(legalCase.case_type)}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>
              <TechnicalValue>{legalCase.owner_id}</TechnicalValue>
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="case-dates-title">
        <h2 id="case-dates-title">Dates and authority</h2>
        <dl className="case-definition-list">
          <DetailItem label="Opened" value={legalCase.opened_on} />
          <DetailItem label="Closed" value={legalCase.closed_on} />
          <DetailItem label="Filing date" value={legalCase.filing_date} />
          <DetailItem
            label="Court or authority"
            value={legalCase.court_or_authority}
          />
        </dl>
      </section>
      <section aria-labelledby="case-description-title">
        <h2 id="case-description-title">Description</h2>
        <p>{legalCase.description || "No description provided."}</p>
        {legalCase.outcome_summary ? <p>{legalCase.outcome_summary}</p> : null}
      </section>
      <section aria-labelledby="case-parties-title">
        <h2 id="case-parties-title">Parties</h2>
        {legalCase.parties.length > 0 ? (
          <ul className="case-party-list">
            {legalCase.parties.map((party) => (
              <li key={party.id ?? `${party.name}-${party.role}`}>
                <strong>{party.name}</strong>
                <span>{partyRoleLabel(party.role)}</span>
                {party.contact_summary ? <p>{party.contact_summary}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No parties recorded.</p>
        )}
      </section>
      <section aria-labelledby="case-linked-title">
        <h2 id="case-linked-title">Linked work</h2>
        <p>
          Deadlines, tasks, and documents will appear here as their screens are
          added.
        </p>
        <Link to={`/cases/${legalCase.id}#timeline`}>Review timeline</Link>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Not set"}</dd>
    </div>
  );
}
