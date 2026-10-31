import { THEMES, type Theme, useGlobalStore } from '@repo/events';
import { ToggleGroup, ToggleGroupItem, usePageMeta } from '@repo/ui';
import { useId } from 'react';
import { SignOutButton } from '../components/sign-out-button';

const THEME_LABELS: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' };

function isTheme(value: string): value is Theme {
  return THEMES.some((theme) => theme === value);
}

export function Settings() {
  usePageMeta('Settings');

  const theme = useGlobalStore((state) => state.theme);
  const setTheme = useGlobalStore((state) => state.setTheme);
  const email = useGlobalStore((state) => state.user?.email);
  const appearanceHeadingId = useId();
  const accountHeadingId = useId();

  const handleThemeChange = (value: string) => {
    if (isTheme(value)) setTheme(value);
  };

  return (
    <div className="max-w-page mx-auto px-4 pt-20 pb-16 sm:px-6 sm:pt-24 md:px-8">
      <h1 className="mb-6 text-2xl font-bold">User Settings</h1>
      <section aria-labelledby={appearanceHeadingId} className="flex flex-col items-start gap-3">
        <h2 id={appearanceHeadingId} className="text-lg font-semibold">
          Appearance
        </h2>
        <ToggleGroup aria-label="Theme" value={theme} onValueChange={handleThemeChange}>
          {THEMES.map((option) => (
            <ToggleGroupItem
              key={option}
              value={option}
              aria-label={THEME_LABELS[option]}
              className="touch-target px-3 py-1 text-sm"
            >
              {THEME_LABELS[option]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>
      <section aria-labelledby={accountHeadingId} className="mt-8 flex flex-col items-start gap-3">
        <h2 id={accountHeadingId} className="text-lg font-semibold">
          Account
        </h2>
        {email && (
          <p className="text-muted-foreground max-w-full break-words">Signed in as {email}</p>
        )}
        <SignOutButton />
      </section>
    </div>
  );
}
