import { Link } from "react-router-dom";

import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import type { ContractDetail } from "../types";
import {
  contractPriorityLabel,
  contractStatusLabel,
  contractTypeLabel,
  lifecycleLabel,
  statusTone,
} from "./contractLabels";

export function ContractSummary({ contract }: { contract: ContractDetail }) {
  return (
    <div className="contract-detail-grid">
      <section aria-labelledby="contract-summary-title">
        <h2 id="contract-summary-title">Summary</h2>
        <dl className="contract-definition-list">
          <DetailItem label="Reference" value={contract.reference_code} />
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge
                label={contractStatusLabel(contract.status)}
                tone={statusTone(contract.status)}
              />
            </dd>
          </div>
          <DetailItem
            label="Priority"
            value={contractPriorityLabel(contract.priority)}
          />
          <DetailItem
            label="Contract type"
            value={contractTypeLabel(contract.contract_type)}
          />
          <DetailItem label="Counterparty" value={contract.counterparty} />
          <div>
            <dt>Owner</dt>
            <dd>
              <TechnicalValue>{contract.owner_id}</TechnicalValue>
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="contract-dates-title">
        <h2 id="contract-dates-title">Dates</h2>
        <p className="contract-date-state">{lifecycleLabel(contract)}</p>
        <dl className="contract-definition-list">
          <DetailItem label="Effective" value={contract.effective_date} />
          <DetailItem label="Expiration" value={contract.expiration_date} />
          <DetailItem label="Renewal" value={contract.renewal_date} />
          <DetailItem label="Opened" value={contract.opened_on} />
          <DetailItem label="Closed" value={contract.closed_on} />
        </dl>
      </section>
      <section aria-labelledby="contract-description-title">
        <h2 id="contract-description-title">Description</h2>
        <p>{contract.description || "No description provided."}</p>
      </section>
      <section aria-labelledby="contract-key-terms-title">
        <h2 id="contract-key-terms-title">Key terms</h2>
        <KeyTerms terms={contract.key_terms} />
      </section>
      <section aria-labelledby="contract-linked-title">
        <h2 id="contract-linked-title">Linked work</h2>
        <p>
          Deadlines, tasks, and documents will appear here as their screens are
          added.
        </p>
        <Link to={`/contracts/${contract.id}#timeline`}>Review timeline</Link>
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

function KeyTerms({ terms }: { terms: Record<string, unknown> }) {
  const entries = Object.entries(terms);
  if (entries.length === 0) {
    return <p>No key terms recorded.</p>;
  }
  return (
    <dl className="contract-definition-list">
      {entries.map(([key, value]) => (
        <DetailItem key={key} label={key} value={String(value)} />
      ))}
    </dl>
  );
}
