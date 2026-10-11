import React, { useState } from 'react';
import katex from 'katex';
import { Copy, Check, FileText } from 'lucide-react';

interface MentorMessageRendererProps {
  content: string;
  sources?: Array<{ filename?: string; source?: string; page?: number }>;
  onSourceClick?: (source: any) => void;
}

export const MentorMessageRenderer: React.FC<MentorMessageRendererProps> = ({
  content,
  sources = [],
  onSourceClick,
}) => {
  const [copiedBlockIdx, setCopiedBlockIdx] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedBlockIdx(idx);
    setTimeout(() => setCopiedBlockIdx(null), 2000);
  };

  // Helper to safely render math expressions with KaTeX
  const renderMath = (latex: string, displayMode: boolean): string => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
      });
    } catch {
      return latex;
    }
  };

  // Split content by code blocks first: ```lang\n...\n```
  const parseBlocks = (text: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: Array<{ type: 'code' | 'text'; content: string; lang?: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        lang: match[1] || 'code',
        content: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return parts;
  };

  // Parse text block for block math $$...$$, inline math $...$, bold **...**, and paragraphs
  const renderTextBlock = (text: string, blockKey: number) => {
    // 1. Process block math ($$...$$)
    const blockMathRegex = /\$\$([\s\S]+?)\$\$/g;
    const segments: Array<{ type: 'math-block' | 'regular'; val: string }> = [];
    let lastIdx = 0;
    let bMatch: RegExpExecArray | null;

    while ((bMatch = blockMathRegex.exec(text)) !== null) {
      if (bMatch.index > lastIdx) {
        segments.push({ type: 'regular', val: text.slice(lastIdx, bMatch.index) });
      }
      segments.push({ type: 'math-block', val: bMatch[1] });
      lastIdx = bMatch.index + bMatch[0].length;
    }
    if (lastIdx < text.length) {
      segments.push({ type: 'regular', val: text.slice(lastIdx) });
    }

    return (
      <div key={blockKey} className="space-y-2">
        {segments.map((seg, sIdx) => {
          if (seg.type === 'math-block') {
            const mathHtml = renderMath(seg.val, true);
            return (
              <div
                key={sIdx}
                className="my-2 p-2 rounded-xl bg-white/70 dark:bg-black/25 overflow-x-auto text-center"
                dangerouslySetInnerHTML={{ __html: mathHtml }}
              />
            );
          }

          // In regular text, process paragraphs, inline math, and bold
          const paragraphs = seg.val.split(/\n\n+/);
          return (
            <div key={sIdx} className="space-y-1.5">
              {paragraphs.map((p, pIdx) => {
                if (!p.trim()) return null;

                // Split paragraph by inline math $...$
                const inlineMathRegex = /\$([^$\n]+?)\$/g;
                const inlineParts: Array<{ type: 'math' | 'text'; str: string }> = [];
                let pLast = 0;
                let iMatch: RegExpExecArray | null;

                while ((iMatch = inlineMathRegex.exec(p)) !== null) {
                  if (iMatch.index > pLast) {
                    inlineParts.push({ type: 'text', str: p.slice(pLast, iMatch.index) });
                  }
                  inlineParts.push({ type: 'math', str: iMatch[1] });
                  pLast = iMatch.index + iMatch[0].length;
                }
                if (pLast < p.length) {
                  inlineParts.push({ type: 'text', str: p.slice(pLast) });
                }

                return (
                  <p key={pIdx} className="leading-relaxed">
                    {inlineParts.map((item, iIdx) => {
                      if (item.type === 'math') {
                        const html = renderMath(item.str, false);
                        return (
                          <span
                            key={iIdx}
                            className="inline-block px-1"
                            dangerouslySetInnerHTML={{ __html: html }}
                          />
                        );
                      }

                      // Render bold **text** in text segment
                      const boldRegex = /\*\*(.*?)\*\*/g;
                      const boldParts: Array<React.ReactNode> = [];
                      let bLast = 0;
                      let boldMatch: RegExpExecArray | null;

                      while ((boldMatch = boldRegex.exec(item.str)) !== null) {
                        if (boldMatch.index > bLast) {
                          boldParts.push(item.str.slice(bLast, boldMatch.index));
                        }
                        boldParts.push(
                          <strong key={`b-${boldMatch.index}`} className="font-bold text-brand-midnight dark:text-white">
                            {boldMatch[1]}
                          </strong>
                        );
                        bLast = boldMatch.index + boldMatch[0].length;
                      }
                      if (bLast < item.str.length) {
                        boldParts.push(item.str.slice(bLast));
                      }

                      return <React.Fragment key={iIdx}>{boldParts}</React.Fragment>;
                    })}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const blocks = parseBlocks(content);

  return (
    <div className="space-y-3">
      {blocks.map((blk, idx) => {
        if (blk.type === 'code') {
          return (
            <div
              key={idx}
              className="my-2 rounded-xl overflow-hidden border border-brand-violet/20 bg-[#0F0D24] text-gray-100 shadow-md font-mono text-xs"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-brand-midnight/80 border-b border-brand-violet/20 text-[11px] text-brand-cyan">
                <span className="uppercase font-bold tracking-wider">{blk.lang || 'CODE'}</span>
                <button
                  onClick={() => handleCopyCode(blk.content, idx)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Copy code to clipboard"
                >
                  {copiedBlockIdx === idx ? (
                    <>
                      <Check className="w-3 h-3 text-brand-mint" />
                      <span className="text-[10px] text-brand-mint font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-xs leading-relaxed text-gray-200">
                <code>{blk.content}</code>
              </pre>
            </div>
          );
        }

        return renderTextBlock(blk.content, idx);
      })}

      {/* Document Source Chips */}
      {sources && sources.length > 0 && (
        <div className="pt-2 border-t border-brand-violet/10 dark:border-brand-violet/20 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-slate/50 dark:text-gray-400">
            Grounding Sources:
          </span>
          {sources.map((src, sIdx) => {
            const label = src.filename || src.source || 'Uploaded Notes';
            return (
              <button
                key={sIdx}
                onClick={() => onSourceClick && onSourceClick(src)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-cyan/15 hover:bg-brand-cyan/25 text-brand-cyan border border-brand-cyan/30 transition-colors"
                title={`Referenced from ${label}`}
              >
                <FileText className="w-3 h-3" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

