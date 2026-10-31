import type { WatchStatus } from '@repo/firebase';
import { CategoryPills } from '@repo/ui';
import { STATUS_LABELS, WATCH_STATUSES } from './use-status-filter';

const ALL_LABEL = 'All';

export type StatusFilterProps = {
  value: WatchStatus | null;
  onChange: (status: WatchStatus | null) => void;
};

/** Pills, as on Movies, so that a filter does not look like the switch that writes. */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const handleChange = (label: string) => {
    onChange(WATCH_STATUSES.find((status) => STATUS_LABELS[status] === label) ?? null);
  };

  return (
    <CategoryPills
      categories={[ALL_LABEL, ...WATCH_STATUSES.map((status) => STATUS_LABELS[status])]}
      value={value === null ? ALL_LABEL : STATUS_LABELS[value]}
      onValueChange={handleChange}
      label="Filter by status"
      className="[&>button]:touch-target px-0 md:px-0"
    />
  );
}
