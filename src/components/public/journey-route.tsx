type Branch = { edge: string; label: string; next: string | null };

function Dot({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-micro font-extrabold text-white"
    >
      {n}
    </span>
  );
}

/**
 * The Section 3 flow as a route: vertical on phones, horizontal rows of five from 1024px.
 * The last station branches into the hiring lane or the Vendor Bridge.
 */
export function JourneyRoute({ label, stations, branches }: { label: string; stations: readonly string[]; branches: readonly Branch[] }) {
  return (
    <div className="card my-6 p-5 sm:p-6">
      <ol aria-label={label} className="grid lg:grid-cols-5 lg:gap-x-4 lg:gap-y-8">
        {stations.map((station, i) => {
          const endOfRow = (i + 1) % 5 === 0;
          return (
            <li key={station} className="relative flex gap-3 pb-6 lg:flex-col lg:pb-0">
              {i < stations.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`absolute top-7 bottom-0 left-[11px] w-[6px] bg-line-finance lg:top-[11px] lg:right-[-16px] lg:bottom-auto lg:left-7 lg:h-[6px] lg:w-auto ${endOfRow ? "lg:hidden" : ""}`}
                />
              ) : null}
              <Dot n={i + 1} />
              <p className="pt-0.5 text-body-sm font-bold lg:pt-0">{station}</p>
            </li>
          );
        })}
        <li className="relative flex gap-3 lg:col-span-5">
          <Dot n={stations.length + 1} />
          <ul className="grid flex-1 gap-3 sm:grid-cols-2">
            {branches.map((branch) => (
              <li key={branch.label} className="rounded-[8px] p-4 outline-rule">
                <p className="text-micro font-extrabold text-muted">{branch.edge}</p>
                <p className="text-body-sm font-bold">{branch.label}</p>
                {branch.next ? <p className="mt-2 border-t border-rule pt-2 text-body-sm">{branch.next}</p> : null}
              </li>
            ))}
          </ul>
        </li>
      </ol>
    </div>
  );
}
