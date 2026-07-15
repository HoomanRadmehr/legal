import { Link } from "react-router-dom";

import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import { useI18n } from "../../../i18n";
import { formatDate } from "../../../i18n/date";
import type { ContractDetail } from "../types";
import {
  contractPriorityLabel,
  contractStatusLabel,
  contractText,
  contractTypeLabel,
  lifecycleLabel,
  statusTone,
} from "./contractLabels";

export function ContractSummary({ contract }: { contract: ContractDetail }) {
  const { locale } = useI18n();
  const labels = contractText(locale);

  return (
    <div className="contract-detail-grid">
      <section aria-labelledby="contract-summary-title">
        <h2 id="contract-summary-title">{labels.summary}</h2>
        <dl className="contract-definition-list">
          <DetailItem label={labels.reference} value={contract.reference_code} />
          <div>
            <dt>{labels.status}</dt>
            <dd>
              <StatusBadge
                label={contractStatusLabel(contract.status, locale)}
                tone={statusTone(contract.status)}
              />
            </dd>
          </div>
          <DetailItem
            label={labels.priority}
            value={contractPriorityLabel(contract.priority, locale)}
          />
          <DetailItem
            label={labels.contractType}
            value={contractTypeLabel(contract.contract_type, locale)}
          />
          <DetailItem label={labels.counterparty} value={contract.counterparty} />
          <div>
            <dt>{labels.owner}</dt>
            <dd>
              <TechnicalValue>{contract.owner_id}</TechnicalValue>
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="contract-dates-title">
        <h2 id="contract-dates-title">{labels.dates}</h2>
        <p className="contract-date-state">{lifecycleLabel(contract, locale)}</p>
        <dl className="contract-definition-list">
          <DetailItem
            label={labels.effective}
            value={formatDate(contract.effective_date, locale)}
          />
          <DetailItem
            label={labels.expiration}
            value={formatDate(contract.expiration_date, locale)}
          />
          <DetailItem
            label={labels.renewal}
            value={formatDate(contract.renewal_date, locale)}
          />
          <DetailItem
            label={labels.opened}
            value={formatDate(contract.opened_on, locale)}
          />
          <DetailItem
            label={labels.closed}
            value={formatDate(contract.closed_on, locale)}
          />
        </dl>
      </section>
      <section aria-labelledby="contract-description-title">
        <h2 id="contract-description-title">{labels.description}</h2>
        <p>{contract.description || labels.noDescription}</p>
      </section>
      <section aria-labelledby="contract-key-terms-title">
        <h2 id="contract-key-terms-title">{labels.keyTerms}</h2>
        <KeyTerms labels={labels} terms={contract.key_terms} />
      </section>
      <section aria-labelledby="contract-linked-title">
        <h2 id="contract-linked-title">{labels.linked}</h2>
        <p>{labels.linkedPlaceholder}</p>
        <Link to={`/contracts/${contract.id}#timeline`}>
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

function KeyTerms({
  labels,
  terms,
}: {
  labels: ReturnType<typeof contractText>;
  terms: Record<string, unknown>;
}) {
  const entries = Object.entries(terms);
  if (entries.length === 0) {
    return <p>{labels.noKeyTerms}</p>;
  }
  return (
    <dl className="contract-definition-list">
      {entries.map(([key, value]) => (
        <DetailItem key={key} label={key} value={String(value)} />
      ))}
    </dl>
  );
}
