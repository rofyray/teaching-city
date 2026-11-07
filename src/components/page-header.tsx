import type { CurrentUser } from "@/server/session";
import { HeaderActions } from "./header-actions";
import { SignBand } from "./sign-band";

/** Sign band for signed-in pages. On phones it carries the bell and account menu. */
export function PageHeader({
  title,
  subtitle,
  current,
  settingsHref,
  letter,
  line,
}: {
  title: string;
  subtitle?: string;
  current: CurrentUser;
  settingsHref?: string;
  letter?: string;
  line?: string;
}) {
  return (
    <SignBand
      title={title}
      subtitle={subtitle}
      letter={letter}
      line={line}
      action={
        <div className="flex lg:hidden">
          <HeaderActions current={current} settingsHref={settingsHref} />
        </div>
      }
    />
  );
}
