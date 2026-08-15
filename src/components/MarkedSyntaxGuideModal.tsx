import React from 'react';
import { X, CheckCircle2, XCircle, Info, Hash, FileCode } from 'lucide-react';

interface MarkedSyntaxGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarkedSyntaxGuideModal: React.FC<MarkedSyntaxGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-500/10 border-b border-black/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold font-mono text-sm">
              #
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-gray-900">
                Marked Mode Syntax Guide
              </h3>
              <p className="text-xs text-gray-600 font-mono">
                Gonnng Markdown-Based Content Entry Convention
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 text-gray-500 hover:text-gray-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs sm:text-sm text-gray-800">
          {/* Section 1: Structural Headers */}
          <div className="space-y-2">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-amber-600" />
              <span>1. Structural Headers (Page & Task Hierarchy)</span>
            </h4>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-xs space-y-1.5">
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span className="font-bold text-amber-800"># Recipe or Project Title</span>
                <span className="text-gray-600 font-sans">Main Title</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span className="font-bold text-amber-800">## Phase Title</span>
                <span className="text-gray-600 font-sans">Phase Header</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-bold text-amber-800">### Task Title</span>
                <span className="text-gray-600 font-sans">Task Step</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Lines following a <code className="font-mono bg-gray-100 px-1">### Task Title</code> are appended to that task&apos;s body formatting.
            </p>
          </div>

          {/* Section 2: Enabled Formatting */}
          <div className="space-y-2">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>2. Supported Formatting (Task Body)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg border border-gray-200 bg-emerald-50/30 flex justify-between">
                <span>**bold**</span>
                <strong className="font-sans">bold text</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-200 bg-emerald-50/30 flex justify-between">
                <span>*italic*</span>
                <em className="font-sans">italic text</em>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-200 bg-emerald-50/30 flex justify-between">
                <span>~~strikethrough~~</span>
                <span className="line-through">strikethrough</span>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-200 bg-emerald-50/30 flex justify-between">
                <span>==highlighted==</span>
                <mark className="bg-amber-200 font-sans px-1 rounded">highlight</mark>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-200 bg-emerald-50/30 flex justify-between">
                <span>`inline code`</span>
                <code className="bg-gray-100 px-1 rounded">inline code</code>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-200 bg-emerald-50/30 flex justify-between">
                <span>[link](url)</span>
                <span className="text-amber-700 underline font-sans">Clickable Link</span>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-200 bg-emerald-50/30 flex justify-between col-span-1 sm:col-span-2">
                <span>![alt](filename)</span>
                <span className="text-gray-600 font-sans">Gallery Image embed</span>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-200 bg-emerald-50/30 flex justify-between col-span-1 sm:col-span-2">
                <span>H~2~O / X^2^</span>
                <span className="font-sans">H<sub>2</sub>O / X<sup>2</sup></span>
              </div>
            </div>
          </div>

          {/* Section 3: Suppressed Syntax (Literal Characters) */}
          <div className="space-y-2">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>3. Suppressed Syntax (Rendered as Literal Text)</span>
            </h4>
            <div className="p-3 rounded-xl bg-rose-50/40 border border-rose-200 text-xs font-mono space-y-1.5 text-gray-800">
              <div className="flex justify-between py-1 border-b border-rose-100">
                <span>- [ ] Task checkbox</span>
                <span className="text-rose-900 font-sans italic">Rendered as literal text</span>
              </div>
              <div className="flex justify-between py-1 border-b border-rose-100">
                <span>- item / 1. item lists</span>
                <span className="text-rose-900 font-sans italic">Rendered as literal text</span>
              </div>
              <div className="flex justify-between py-1 border-b border-rose-100">
                <span>[^1] Footnote definitions</span>
                <span className="text-rose-900 font-sans italic">Rendered as literal text</span>
              </div>
              <div className="flex justify-between py-1">
                <span>&#123;#custom-id&#125; Heading ID syntax</span>
                <span className="text-rose-900 font-sans italic">Rendered as literal text</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-mono font-bold uppercase cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
