import React, { useState, useRef, useEffect } from 'react';
import { Upload, File, Trash2, CheckCircle2, AlertCircle, Lock, Loader2 } from 'lucide-react';
import { uploadService, isFileUploadAllowed, isFileUploadFeatureEnabled, UploadedFile } from '../services/uploadService';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface FileUploadZoneProps {
  onFileUploaded?: (file: UploadedFile) => void;
  accept?: string;
  maxSizeBytes?: number;
  label?: string;
  className?: string;
  showExistingUploads?: boolean;
}

export default function FileUploadZone({
  onFileUploaded,
  accept = 'image/*,video/*',
  maxSizeBytes = 10 * 1024 * 1024,
  label = 'Upload Media & Documents',
  className = '',
  showExistingUploads = true
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userFiles, setUserFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkResult = isFileUploadAllowed();
  const featureEnabled = isFileUploadFeatureEnabled();

  const loadUserFiles = () => {
    if (checkResult.allowed && checkResult.user) {
      const files = uploadService.getUserUploads(checkResult.user.id);
      setUserFiles(files);
    }
  };

  useEffect(() => {
    loadUserFiles();
  }, [checkResult.allowed, checkResult.user?.id]);

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!checkResult.allowed) {
      setErrorMessage(checkResult.reason || 'File upload is restricted.');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadService.uploadFile(file, maxSizeBytes);
      setSuccessMessage(`Successfully uploaded "${file.name}"`);
      loadUserFiles();
      if (onFileUploaded) {
        onFileUploaded(uploaded);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (checkResult.allowed) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleDelete = (file: UploadedFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      title: "Are you sure?",
      message: `Are you sure you want to delete "${file.filename}"?`,
      onConfirm: () => {
        uploadService.deleteUpload(file.id);
        loadUserFiles();
        setDeleteConfirm(null);
      }
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // State A: Feature Flag Disabled
  if (!featureEnabled) {
    return (
      <div className={`p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 flex items-start gap-3 ${className}`}>
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-amber-300">File Uploads Disabled</p>
          <p className="text-amber-200/80">
            The file upload feature is currently toggled off via feature flag (<code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[10px]">VITE_ENABLE_FILE_UPLOADS=false</code>).
          </p>
        </div>
      </div>
    );
  }

  // State B: User Not Authenticated
  if (!checkResult.allowed) {
    return (
      <div className={`p-4 rounded-xl border border-white/10 bg-[#161618] text-white/70 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-white/50" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/90">Logged-in Users Only</p>
            <p className="text-[11px] text-white/50">Please sign in to upload custom files and media.</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Auth Required
        </span>
      </div>
    );
  }

  // State C: Fully Enabled & Authorized
  return (
    <div className={`space-y-3 ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
            : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/30'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-white/90">{label}</p>
            <p className="text-[11px] text-white/50 mt-0.5">
              Drag & drop or <span className="text-emerald-400 underline">browse</span> (Max {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB)
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Existing Uploads List */}
      {showExistingUploads && userFiles.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] font-medium text-white/60">
            <span>Your Uploaded Files ({userFiles.length})</span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              🔒 Logged-in User
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {userFiles.map((file, fIdx) => (
              <div
                key={`user-file-${file.id || fIdx}-${fIdx}`}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-xs group hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {file.mimeType.startsWith('image/') ? (
                    <img src={file.url} alt={file.filename} className="w-7 h-7 rounded object-cover shrink-0 border border-white/10" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center shrink-0">
                      <File className="w-3.5 h-3.5 text-white/70" />
                    </div>
                  )}

                  <div className="truncate">
                    <p className="font-medium text-white/90 truncate text-[11px]">{file.filename}</p>
                    <p className="text-[10px] text-white/40">{formatFileSize(file.sizeBytes)} • {new Date(file.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(file, e)}
                  className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete Upload"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteConfirm?.isOpen}
        title={deleteConfirm?.title}
        message={deleteConfirm?.message}
        onConfirm={() => deleteConfirm?.onConfirm()}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
