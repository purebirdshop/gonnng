import React, { useState } from 'react';
import { ExternalLink, ImageOff, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getPublicMediaUrl } from '../services/uploadService';

interface MarkedRendererProps {
  markdown: string;
  galleryImages?: string[];
  className?: string;
}

export const MarkedRenderer: React.FC<MarkedRendererProps> = ({
  markdown,
  galleryImages = [],
  className = ''
}) => {
  const [confirmLinkUrl, setConfirmLinkUrl] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  if (!markdown || !markdown.trim()) {
    return null;
  }

  const handleOpenLink = (url: string) => {
    // Standardize URL
    let target = url.trim();
    if (!/^https?:\/\//i.test(target) && !/^mailto:/i.test(target)) {
      target = `https://${target}`;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
    setConfirmLinkUrl(null);
  };

  // Helper to render inline formatting
  const renderInline = (text: string): React.ReactNode => {
    if (!text) return null;
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;
    let textBuffer = '';

    const flushBuffer = () => {
      if (textBuffer.length > 0) {
        tokens.push(
          <span key={`mr-txt-${keyIdx++}`}>{textBuffer}</span>
        );
        textBuffer = '';
      }
    };

    while (remaining.length > 0) {
      // 1. Images: ![alt](url_or_filename)
      const imgMatch = remaining.match(/^!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        flushBuffer();
        const alt = imgMatch[1];
        const filename = imgMatch[2].trim();

        let resolvedUrl = filename;
        if (!/^https?:\/\//i.test(filename)) {
          // Attempt recipe gallery lookup or Supabase public media url
          const matchedInGallery = galleryImages.find(
            img => img.includes(filename) || filename.includes(img)
          );
          if (matchedInGallery) {
            resolvedUrl = matchedInGallery;
          } else {
            resolvedUrl = getPublicMediaUrl('Gonnng', filename);
          }
        }

        const isBroken = brokenImages[filename];

        tokens.push(
          isBroken ? (
            <span
              key={`mr-img-err-${keyIdx++}`}
              className="my-1.5 px-3 py-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50 text-amber-900 text-xs font-mono inline-flex items-center gap-1.5"
            >
              <ImageOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Image not found in Recipe Gallery ({filename})</span>
            </span>
          ) : (
            <span key={`mr-img-${keyIdx++}`} className="inline-block my-1 max-w-full">
              <img
                src={resolvedUrl}
                alt={alt || filename}
                onError={() =>
                  setBrokenImages(prev => ({ ...prev, [filename]: true }))
                }
                className="max-h-64 rounded-xl border border-black/10 object-cover shadow-xs"
                referrerPolicy="no-referrer"
              />
            </span>
          )
        );

        remaining = remaining.slice(imgMatch[0].length);
        continue;
      }

      // 2. Links: [text](url)
      const linkMatch = remaining.match(/^\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        flushBuffer();
        const linkText = linkMatch[1];
        const url = linkMatch[2];
        tokens.push(
          <button
            key={`mr-link-${keyIdx++}`}
            type="button"
            onClick={() => setConfirmLinkUrl(url)}
            className="text-amber-700 hover:text-amber-900 font-semibold underline inline-flex items-center gap-0.5 cursor-pointer text-inherit"
          >
            <span>{linkText}</span>
            <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70" />
          </button>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // 3. Bold: **text**
      const boldMatch = remaining.match(/^\*\*(.*?)\*\*/);
      if (boldMatch) {
        flushBuffer();
        tokens.push(<strong key={`mr-b-${keyIdx++}`} className="font-bold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // 4. Strikethrough: ~~text~~
      const strikeMatch = remaining.match(/^~~(.*?)~~/);
      if (strikeMatch) {
        flushBuffer();
        tokens.push(<del key={`mr-s-${keyIdx++}`} className="line-through opacity-75">{strikeMatch[1]}</del>);
        remaining = remaining.slice(strikeMatch[0].length);
        continue;
      }

      // 5. Highlight: ==text==
      const hlMatch = remaining.match(/^==(.*?)==/);
      if (hlMatch) {
        flushBuffer();
        tokens.push(
          <mark key={`mr-hl-${keyIdx++}`} className="bg-amber-200/90 text-gray-900 px-1 py-0.5 rounded font-medium">
            {hlMatch[1]}
          </mark>
        );
        remaining = remaining.slice(hlMatch[0].length);
        continue;
      }

      // 6. Subscript: ~sub~ (e.g. H~2~O)
      const subMatch = remaining.match(/^~([^~]+)~(?=[^~]|$)/);
      if (subMatch) {
        flushBuffer();
        tokens.push(<sub key={`mr-sub-${keyIdx++}`} className="text-[0.75em]">{subMatch[1]}</sub>);
        remaining = remaining.slice(subMatch[0].length);
        continue;
      }

      // 7. Superscript: ^sup^ (e.g. X^2^)
      const supMatch = remaining.match(/^\^([^\^]+)\^/);
      if (supMatch) {
        flushBuffer();
        tokens.push(<sup key={`mr-sup-${keyIdx++}`} className="text-[0.75em]">{supMatch[1]}</sup>);
        remaining = remaining.slice(supMatch[0].length);
        continue;
      }

      // 8. Inline code: `code`
      const codeMatch = remaining.match(/^`(.*?)`/);
      if (codeMatch) {
        flushBuffer();
        tokens.push(
          <code key={`mr-c-${keyIdx++}`} className="font-mono text-[0.85em] bg-black/5 text-amber-950 px-1.5 py-0.5 rounded border border-black/10">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // 9. Italic: *text* or _text_
      const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
      if (italicMatch) {
        flushBuffer();
        tokens.push(<em key={`mr-i-${keyIdx++}`} className="italic">{italicMatch[2]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Accumulate plain characters into buffer
      textBuffer += remaining[0];
      remaining = remaining.slice(1);
    }

    flushBuffer();

    if (tokens.length === 1 && typeof tokens[0] === 'string') {
      return tokens[0];
    }
    return tokens;
  };

  // Block level parser
  const renderBlocks = (): React.ReactNode[] => {
    const lines = markdown.split(/\r?\n/);
    const blocks: React.ReactNode[] = [];
    let lineIdx = 0;

    while (lineIdx < lines.length) {
      const line = lines[lineIdx];
      const trimmed = line.trim();

      // Horizontal rule: --- or ***
      if (/^(---|\*\*\*)$/.test(trimmed)) {
        blocks.push(<hr key={`hr-${blocks.length}-${lineIdx}`} className="my-3 border-t border-black/10" />);
        lineIdx++;
        continue;
      }

      // Fenced Code Block: ```lang
      if (trimmed.startsWith('```')) {
        const codeLines: string[] = [];
        lineIdx++;
        while (lineIdx < lines.length && !lines[lineIdx].trim().startsWith('```')) {
          codeLines.push(lines[lineIdx]);
          lineIdx++;
        }
        if (lineIdx < lines.length) lineIdx++; // consume closing ```
        blocks.push(
          <pre key={`mr-codeblock-${blocks.length}-${lineIdx}`} className="my-2 p-3 rounded-xl bg-gray-900 text-amber-300 font-mono text-xs overflow-x-auto shadow-inner border border-gray-800">
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        continue;
      }

      // Blockquote: > text
      if (trimmed.startsWith('>')) {
        const quoteText = line.replace(/^\s*>\s?/, '');
        blocks.push(
          <blockquote key={`mr-bq-${blocks.length}-${lineIdx}`} className="my-2 pl-3 border-l-4 border-amber-500 italic text-gray-700 bg-amber-50/50 py-1 rounded-r-lg">
            {renderInline(quoteText)}
          </blockquote>
        );
        lineIdx++;
        continue;
      }

      // Definition list item: term line followed by ": definition" line
      if (lineIdx + 1 < lines.length && lines[lineIdx + 1].trim().startsWith(': ')) {
        const term = trimmed;
        const def = lines[lineIdx + 1].trim().replace(/^:\s*/, '');
        blocks.push(
          <dl key={`mr-dl-${blocks.length}-${lineIdx}`} className="my-1.5 space-y-0.5">
            <dt className="font-bold text-gray-900 text-xs sm:text-sm">{renderInline(term)}</dt>
            <dd className="pl-4 text-xs text-gray-600 border-l-2 border-amber-300">{renderInline(def)}</dd>
          </dl>
        );
        lineIdx += 2;
        continue;
      }

      // Pipe table: | col1 | col2 |
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
        const tableLines: string[] = [];
        while (
          lineIdx < lines.length &&
          lines[lineIdx].trim().startsWith('|') &&
          lines[lineIdx].trim().endsWith('|')
        ) {
          tableLines.push(lines[lineIdx].trim());
          lineIdx++;
        }

        if (tableLines.length >= 2) {
          const headerCells = tableLines[0]
            .slice(1, -1)
            .split('|')
            .map(c => c.trim());
          const bodyRows = tableLines.slice(2).map(rowStr =>
            rowStr
              .slice(1, -1)
              .split('|')
              .map(c => c.trim())
          );

          const currentBlockIdx = blocks.length;
          blocks.push(
            <div key={`mr-tbl-${currentBlockIdx}-${lineIdx}`} className="my-2.5 overflow-x-auto rounded-xl border border-black/10 bg-white">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-amber-100/70 border-b border-black/10">
                    {headerCells.map((cell, cIdx) => (
                      <th key={`mr-th-${currentBlockIdx}-${cIdx}`} className="p-2 font-bold text-gray-900">
                        {renderInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((r, rIdx) => (
                    <tr key={`mr-tr-${currentBlockIdx}-${rIdx}`} className="border-b border-black/5 last:border-0 hover:bg-gray-50/50">
                      {r.map((c, cIdx) => (
                        <td key={`mr-td-${currentBlockIdx}-${rIdx}-${cIdx}`} className="p-2 text-gray-700">
                          {renderInline(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Regular line (or literal lists, checkboxes, footnotes, etc.)
      if (trimmed.length > 0) {
        blocks.push(
          <p key={`mr-p-${blocks.length}-${lineIdx}`} className="my-1 text-xs sm:text-sm text-gray-800 leading-relaxed">
            {renderInline(line)}
          </p>
        );
      } else {
        blocks.push(<div key={`mr-empty-${blocks.length}-${lineIdx}`} className="h-1.5" />);
      }

      lineIdx++;
    }

    return blocks;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {renderBlocks()}

      {/* LINK CONFIRMATION MODAL */}
      {confirmLinkUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-black/10 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Leaving Gonnng?</h3>
                <p className="text-xs text-gray-500 font-mono">External Link Confirmation</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              You are leaving Gonnng to visit an external address:
            </p>

            <div className="p-2.5 rounded-xl bg-gray-100 font-mono text-xs text-gray-800 break-all border border-gray-200 max-h-24 overflow-y-auto">
              {confirmLinkUrl}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmLinkUrl(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleOpenLink(confirmLinkUrl)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase bg-amber-500 hover:bg-amber-600 text-black cursor-pointer shadow-xs"
              >
                Visit External Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
