import { useId } from 'react';
import { DetailSection, DetailSectionEmpty } from './detail-section';
import { EXTERNAL_TEXT_LINK_CLASS, ExternalLink } from './external-link';
import { ImagePlaceholder } from './image-placeholder';

export type WatchProviderData = {
  id: number;
  name: string;
  /** `null` → placeholder. */
  logoUrl: string | null;
};

export type WatchProviderGroupData = {
  label: string;
  providers: WatchProviderData[];
};

/** What `WatchProvidersSection` renders; build it with `toWatchProvidersData`. */
export type WatchProvidersData = {
  /** The viewer's country, by name. */
  country: string;
  groups: WatchProviderGroupData[];
  /** The title's page on TMDB; `null` hides the link. */
  link: string | null;
};

export type WatchProvidersSectionProps = {
  providers: WatchProvidersData;
};

export function WatchProvidersSection({ providers }: WatchProvidersSectionProps) {
  const { country, groups, link } = providers;

  return (
    <DetailSection title="Where to watch">
      {groups.length === 0 ? (
        <DetailSectionEmpty>
          No streaming, rental or purchase options listed for {country}.
        </DetailSectionEmpty>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <ProviderGroup key={group.label} group={group} />
          ))}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {link !== null && (
              <ExternalLink href={link} className={EXTERNAL_TEXT_LINK_CLASS}>
                See all options on TMDB
              </ExternalLink>
            )}
            {/* TMDB's terms require this credit wherever the data is shown. */}
            <p className="text-muted-foreground text-xs">Streaming data by JustWatch</p>
          </div>
        </div>
      )}
    </DetailSection>
  );
}

function ProviderGroup({ group }: { group: WatchProviderGroupData }) {
  const { label, providers } = group;
  const labelId = useId();

  return (
    <div>
      <h3 id={labelId} className="text-muted-foreground mb-2 text-sm font-medium">
        {label}
      </h3>
      <ul aria-labelledby={labelId} className="flex flex-wrap gap-x-4 gap-y-2">
        {providers.map(({ id, name, logoUrl }) => (
          <li key={id} className="flex min-w-0 items-center gap-2 text-sm">
            <div className="size-10 shrink-0 overflow-hidden rounded-lg">
              {logoUrl === null ? (
                <ImagePlaceholder />
              ) : (
                <img
                  src={logoUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              )}
            </div>
            <span className="min-w-0 wrap-anywhere">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
