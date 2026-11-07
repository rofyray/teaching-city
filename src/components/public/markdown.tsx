import type { ReactNode } from "react";
import { titleCase } from "@/lib/title-case";

/**
 * A small renderer for the brief's Markdown subset: headings, paragraphs, bullet lists,
 * tables, bold text and links. The brief is trusted, verbatim copy (Content Pack 13.1).
 */

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] };

export function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: titleCase(heading[2]) });
      i++;
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i]
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
        i++;
      }
      blocks.push({ type: "table", header: rows[0], rows: rows.slice(1) });
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|\||- )/.test(lines[i].trim())) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "paragraph", text: para.join(" ") });
  }
  return blocks;
}

/** Bold (**text**) and links ([text](url)); links may sit inside bold text. */
export function Inline({ text }: { text: string }): ReactNode {
  const parts: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    if (match[1] !== undefined) {
      parts.push(
        <strong key={key++} className="font-extrabold">
          <Inline text={match[1]} />
        </strong>,
      );
    } else {
      parts.push(
        <a key={key++} href={match[3]} className="font-semibold underline underline-offset-2">
          {match[2]}
        </a>,
      );
    }
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const plain = (text: string) => text.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

export function DataTable({ header, rows, label }: { header: string[]; rows: string[][]; label: string }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="card my-6 max-w-full overflow-x-auto outline-rule"
    >
      <table className="w-full min-w-[560px] border-collapse text-left text-body-sm">
        <thead>
          <tr>
            {header.map((cell) => (
              <th key={cell} scope="col" className="border-b-2 border-rule px-4 py-3 align-bottom text-micro font-extrabold">
                <Inline text={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-t border-rule first:border-t-0">
              {row.map((cell, c) =>
                c === 0 ? (
                  <th key={c} scope="row" className="px-4 py-3 align-top font-bold">
                    <Inline text={cell} />
                  </th>
                ) : (
                  <td key={c} className="px-4 py-3 align-top">
                    <Inline text={cell} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const headingClass: Record<number, string> = {
  2: "mt-12 mb-4 text-title font-extrabold first:mt-0",
  3: "mt-8 mb-3 text-heading font-extrabold",
  4: "mt-6 mb-2 text-subheading font-extrabold",
};

/** Renders a Markdown chunk; the smallest heading level in the chunk becomes an h2. */
export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  const levels = blocks.filter((b) => b.type === "heading").map((b) => (b as { level: number }).level);
  const shift = levels.length ? Math.min(...levels) - 2 : 0;
  // The nearest heading above each block, used to name table regions.
  const headingAbove = blocks.map((_, i) => {
    for (let j = i - 1; j >= 0; j--) {
      const b = blocks[j];
      if (b.type === "heading") return plain(b.text);
    }
    return "";
  });
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const level = Math.min(block.level - shift, 4);
            const Tag = `h${level}` as "h2" | "h3" | "h4";
            return (
              <Tag key={i} className={headingClass[level]}>
                <Inline text={block.text} />
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={i} className="my-4 text-body">
                <Inline text={block.text} />
              </p>
            );
          case "list":
            return (
              <ul key={i} className="my-4 flex list-disc flex-col gap-2 pl-6 text-body">
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );
          case "table": {
            const lastHeading = headingAbove[i];
            return (
              <DataTable
                key={i}
                header={block.header}
                rows={block.rows}
                label={lastHeading ? `${lastHeading}: ${plain(block.header.join(", "))}` : plain(block.header.join(", "))}
              />
            );
          }
        }
      })}
    </>
  );
}

/** Slices the text from the line that starts with `from` up to (not including) the line that starts with `to`. */
export function sliceBrief(source: string, from: string, to?: string): string {
  const start = source.indexOf(from);
  if (start < 0) throw new Error(`Brief section not found: ${from}`);
  const end = to ? source.indexOf(to, start + from.length) : -1;
  return source.slice(start, end < 0 ? undefined : end).trim();
}
