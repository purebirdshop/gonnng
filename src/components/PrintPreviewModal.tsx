import React, { useState } from 'react';
import { PrinterCheck, Share2, X, ChevronLeft, ChevronRight, Check, Calendar, User, Tag } from 'lucide-react';
import { getCategoryColor } from '../data/categoriesData';

export interface PrintableItem {
  id: string;
  type: 'project' | 'recipe';
  title: string;
  description?: string;
  authorName?: string;
  category?: string;
  phases: {
    id?: string;
    title: string;
    tasks: {
      id?: string;
      title: string;
      estimatedHours?: number;
      completed?: boolean;
    }[];
  }[];
  progressPhotos?: { id?: string; url: string; caption?: string; date?: string }[];
  createdAt?: string;
  completedAt?: string;
  recipeTitle?: string;
  tags?: string[];
  gongsCount?: { continue: number; refine: number; reconsider: number };
}

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PrintableItem | null;
}

export default function PrintPreviewModal({
  isOpen,
  onClose,
  item,
}: PrintPreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  React.useEffect(() => {
    if (isOpen && item) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, Boolean(item)]);

  if (!isOpen || !item) return null;

  const hasPhotos = item.progressPhotos && item.progressPhotos.length > 0;
  // Calculate total pages for preview
  const totalPages = Math.max(2, Math.ceil((item.phases.length + (hasPhotos ? 1 : 0)) / 2));

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleShareLink = () => {
    const permalink = `https://gonnng.com/print/${item.type}/${item.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(permalink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
    if (navigator.share) {
      navigator.share({
        title: `Printable ${item.type === 'project' ? 'Project' : 'Recipe'}: ${item.title}`,
        text: `Check out the printable blueprint for ${item.title} on Gonnng`,
        url: permalink,
      }).catch(() => {});
    }
  };

  const handleConfirmPrint = () => {
    window.print();
  };

  return (
    <>
      {/* Modal Backdrop - Light frosted glass overlay */}
      <div 
        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-0 sm:p-6 overflow-y-auto animate-fade-in no-print"
        onClick={onClose}
      >
        {/* Modal Container - 100% Light Mode */}
        <div 
          className="relative w-full h-full sm:h-auto max-w-none sm:max-w-2xl rounded-none sm:rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-full sm:max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/90 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                <PrinterCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-gray-900">Printable Copy Preview</h3>
                <p className="text-xs text-gray-500 font-mono">Standard 8½ × 11 Letter Format (Light Mode)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Share Button */}
              <button
                type="button"
                onClick={handleShareLink}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-all cursor-pointer border border-gray-200 active:scale-95"
                title="Share printable copy link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-mono">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-gray-500" />
                    <span>Share Link</span>
                  </>
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-all cursor-pointer border border-gray-200"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body: Light Mode Studio View for 8.5 x 11 Preview Thumbnail */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-between bg-slate-100">
            <p className="text-xs text-gray-600 font-sans text-center mb-3">
              Previewing Page <span className="text-gray-900 font-bold">{currentPage + 1}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>. Review layout before confirming print.
            </p>

            {/* Carousel Section Container */}
            <div className="relative w-full flex items-center justify-center my-auto py-2">
              {/* Left Carousel Arrow */}
              {totalPages > 1 && (
                <button
                  type="button"
                  onClick={handlePrevPage}
                  className="absolute left-1 sm:left-4 z-20 p-2.5 rounded-full bg-white hover:bg-gray-50 text-gray-900 shadow-md border border-gray-300 transition-all cursor-pointer hover:scale-110 active:scale-95"
                  title="Previous page"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}

              {/* 8.5 x 11 Paper Sheet Preview Thumbnail */}
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[8.5/11] bg-white text-gray-900 border border-gray-300 rounded-sm shadow-xl p-5 sm:p-6 flex flex-col justify-between font-sans transition-all duration-300">
                {/* Paper Header */}
                <div className="border-b-2 border-gray-900 pb-3 mb-2">
                  <div className="flex items-center justify-between text-[9px] font-mono uppercase text-gray-500 font-bold tracking-widest mb-1">
                    <span>GONNNG PROCESS BLUEPRINT</span>
                    <span>LETTER 8.5" × 11"</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black font-display text-gray-900 leading-tight">
                    {item.title}
                  </h2>
                  {item.recipeTitle && (
                    <p className="text-[10px] font-mono text-[#F59E0B] font-bold uppercase mt-0.5">
                      Based on: {item.recipeTitle}
                    </p>
                  )}
                  
                  {/* Meta Bar */}
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-600 mt-2 pt-2 border-t border-gray-200">
                    {item.authorName && (
                      <span className="flex items-center gap-1 font-semibold">
                        <User className="w-3 h-3 text-gray-400" /> {item.authorName}
                      </span>
                    )}
                    {item.category && (
                      <span 
                        className="flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border font-semibold"
                        style={{
                          backgroundColor: `${getCategoryColor(item.category)}15`,
                          color: getCategoryColor(item.category),
                          borderColor: `${getCategoryColor(item.category)}35`
                        }}
                      >
                        <Tag className="w-2.5 h-2.5" /> {item.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono text-gray-500">
                      <Calendar className="w-3 h-3 text-gray-400" /> {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Paper Content Body (Page Dependent) */}
                <div className="flex-1 overflow-hidden space-y-3 py-1">
                  {currentPage === 0 ? (
                    <>
                      {item.description && (
                        <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-[11px] leading-snug text-gray-700 italic">
                          "{item.description}"
                        </div>
                      )}

                      {/* Phase 1 & Tasks */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5">
                          PHASE 1: {item.phases[0]?.title || 'Preparation'}
                        </p>
                        <div className="space-y-1.5">
                          {item.phases[0]?.tasks.slice(0, 4).map((task, idx) => (
                            <div key={task.id || `print-p1-task-${idx}`} className="flex items-start gap-2 text-[11px]">
                              <span className={`w-3.5 h-3.5 shrink-0 rounded border mt-0.5 flex items-center justify-center ${
                                task.completed ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-400 bg-white'
                              }`}>
                                {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </span>
                              <span className={`flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {task.title}
                              </span>
                              {task.estimatedHours && (
                                <span className="text-[9px] font-mono text-gray-500 shrink-0">
                                  {task.estimatedHours}h
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Additional Phase if fits on Page 1 */}
                      {item.phases.length > 1 && (
                        <div className="space-y-2 pt-1">
                          <p className="text-[10px] font-mono font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5">
                            PHASE 2: {item.phases[1]?.title || 'Execution'}
                          </p>
                          <div className="space-y-1.5">
                            {item.phases[1]?.tasks.slice(0, 3).map((task, idx) => (
                              <div key={task.id || `print-p2-task-${idx}`} className="flex items-start gap-2 text-[11px]">
                                <span className={`w-3.5 h-3.5 shrink-0 rounded border mt-0.5 flex items-center justify-center ${
                                  task.completed ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-400 bg-white'
                                }`}>
                                  {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>
                                <span className={`flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                  {task.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Continuation Page (Page 2+) */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5">
                          {item.phases.length > 2 ? `PHASE 3+: ${item.phases[2]?.title || 'Completion'}` : 'Execution Log & Review'}
                        </p>
                        
                        {item.phases.length > 2 ? (
                          <div className="space-y-1.5">
                            {item.phases[2]?.tasks.map((task, idx) => (
                              <div key={task.id || `print-p3-task-${idx}`} className="flex items-start gap-2 text-[11px]">
                                <span className={`w-3.5 h-3.5 shrink-0 rounded border mt-0.5 flex items-center justify-center ${
                                  task.completed ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-400 bg-white'
                                }`}>
                                  {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>
                                <span className="flex-1 text-gray-800">{task.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-dashed border-gray-300 rounded p-2.5 bg-gray-50 text-[10px] space-y-1">
                            <p className="font-bold text-gray-700">Execution Notes & Quality Checks:</p>
                            <div className="h-12 border-b border-gray-300"></div>
                            <div className="h-12"></div>
                          </div>
                        )}
                      </div>

                      {/* Progress Photos / Sign-off Block */}
                      {hasPhotos ? (
                        <div className="pt-2">
                          <p className="text-[10px] font-mono font-bold text-gray-900 uppercase tracking-wider mb-1">
                            Captured Progress Documentation
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {item.progressPhotos?.slice(0, 2).map((photo, pIdx) => (
                              <div key={photo.id || `print-photo-${pIdx}`} className="border border-gray-200 rounded p-1 text-[9px] bg-white">
                                <img src={photo.url} alt="Progress" className="w-full h-16 object-cover rounded" />
                                {photo.caption && <p className="truncate text-gray-600 mt-0.5">{photo.caption}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-gray-200 mt-auto">
                          <div className="flex justify-between text-[9px] font-mono text-gray-500 pt-3">
                            <div>
                              <p className="font-bold text-gray-900">VERIFIED BY:</p>
                              <p className="mt-4 border-t border-gray-400 w-28">Signature / Date</p>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">BLUEPRINT STATUS:</p>
                              <p className="mt-1 text-emerald-700 font-bold">APPROVED COPY</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Paper Footer */}
                <div className="border-t border-gray-300 pt-2 flex items-center justify-between text-[8px] font-mono text-gray-400 uppercase">
                  <span>Gonnng Process Architecture</span>
                  <span>Page {currentPage + 1} of {totalPages}</span>
                </div>
              </div>

              {/* Right Carousel Arrow */}
              {totalPages > 1 && (
                <button
                  type="button"
                  onClick={handleNextPage}
                  className="absolute right-1 sm:right-4 z-20 p-2.5 rounded-full bg-white hover:bg-gray-50 text-gray-900 shadow-md border border-gray-300 transition-all cursor-pointer hover:scale-110 active:scale-95"
                  title="Next page"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* Breadcrumbs below preview thumbnail section */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3 mb-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const isActive = idx === currentPage;
                  return (
                    <button
                      key={`print-page-dot-${idx}`}
                      type="button"
                      onClick={() => setCurrentPage(idx)}
                      className={`transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'w-6 h-2 bg-[#F59E0B] rounded-full shadow-sm'
                          : 'w-2 h-2 bg-gray-300 hover:bg-gray-400 rounded-full'
                      }`}
                      title={`Go to page ${idx + 1}`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer (Confirm / Cancel Actions) */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm font-bold text-gray-700 hover:text-gray-900 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmPrint}
              className="px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#FF751A] text-black text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <PrinterCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm & Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden container strictly for window.print() execution */}
      <div className="printable-sheet-view hidden print:block bg-white text-black p-8 max-w-[8.5in] mx-auto font-sans">
        {/* Printable Document Page 1 Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-gray-600 font-bold tracking-widest mb-1">
            <span>GONNNG PROCESS BLUEPRINT</span>
            <span>STANDARD LETTER 8.5" × 11"</span>
          </div>
          <h1 className="text-2xl font-black font-display text-black leading-tight">
            {item.title}
          </h1>
          {item.recipeTitle && (
            <p className="text-xs font-mono text-[#F59E0B] font-bold uppercase mt-1">
              Based on Blueprint: {item.recipeTitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700 mt-3 pt-3 border-t border-gray-300">
            {item.authorName && (
              <span className="font-semibold">Author: {item.authorName}</span>
            )}
            {item.category && (
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                Category: {item.category}
              </span>
            )}
            <span className="font-mono">Printed: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {item.description && (
          <div className="bg-gray-50 p-4 rounded border border-gray-300 text-sm leading-relaxed text-gray-800 italic mb-6">
            "{item.description}"
          </div>
        )}

        {/* Printable Phases List */}
        <div className="space-y-6">
          {item.phases.map((phase, pIdx) => (
            <div key={phase.id || `sheet-phase-${pIdx}`} className="space-y-3">
              <h3 className="text-sm font-mono font-bold text-black uppercase tracking-wider border-b-2 border-gray-400 pb-1">
                PHASE {pIdx + 1}: {phase.title}
              </h3>
              <div className="space-y-2">
                {phase.tasks.map((task, tIdx) => (
                  <div key={task.id || `sheet-task-${tIdx}`} className="flex items-start justify-between gap-3 text-sm pb-1 border-b border-gray-100">
                    <div className="flex items-start gap-2.5">
                      <span className="w-4 h-4 border border-black rounded flex items-center justify-center shrink-0 mt-0.5">
                        {task.completed ? <Check className="w-3 h-3 stroke-[3] text-black" /> : null}
                      </span>
                      <span className={task.completed ? 'line-through text-gray-500' : 'text-black font-medium'}>
                        {task.title}
                      </span>
                    </div>
                    {task.estimatedHours && (
                      <span className="text-xs font-mono text-gray-500 shrink-0">
                        {task.estimatedHours} hrs
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Notes & Verification Footer for Printed Copy */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300 space-y-6">
          <div className="border border-dashed border-gray-400 rounded p-4 bg-gray-50">
            <p className="text-xs font-mono font-bold text-gray-700 uppercase mb-2">
              Process Execution Notes & Verification Checklist:
            </p>
            <div className="h-16 border-b border-gray-300"></div>
            <div className="h-16"></div>
          </div>

          <div className="flex justify-between items-end text-xs font-mono text-gray-700 pt-4">
            <div>
              <p className="font-bold text-black">VERIFIED & APPROVED BY:</p>
              <div className="mt-8 border-t border-black w-48 pt-1">Signature / Date</div>
            </div>
            <div className="text-right">
              <p className="font-bold text-black">GONNNG PROCESS CERTIFICATION</p>
              <p className="text-emerald-700 font-bold mt-1">PRINTER-FRIENDLY COPY</p>
            </div>
          </div>
        </div>
      </div>

      {/* Media Print CSS: Force 100% Light Mode on print */}
      <style>{`
        @media print {
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .printable-sheet-view, .printable-sheet-view * {
            visibility: visible !important;
          }
          .printable-sheet-view {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 24px !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

