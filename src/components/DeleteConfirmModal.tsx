import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone. Are you sure you want to proceed with deleting?",
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border bg-white border-gray-200 text-gray-900 relative space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-display font-bold text-base sm:text-lg text-gray-900">
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-lg transition-all cursor-pointer hover:bg-gray-100 text-gray-500"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message */}
          <p className="text-xs sm:text-sm font-sans leading-relaxed text-gray-600">
            {message}
          </p>

          {/* Actions: Cancel or Yes */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
              }}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
