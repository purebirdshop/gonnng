import React from 'react';
import { motion } from 'motion/react';
import { Camera, Disc3, File, ShieldCheck, Check, X } from 'lucide-react';
import { AppPermissions } from './UserProfile';
import { permissionService } from '../services/permissionService';

interface PermissionsPromptModalProps {
  isOpen: boolean;
  currentPermissions?: AppPermissions;
  onSavePermissions: (permissions: AppPermissions) => void;
  onClose?: () => void;
}

export default function PermissionsPromptModal({
  isOpen,
  currentPermissions,
  onSavePermissions,
  onClose,
}: PermissionsPromptModalProps) {
  const [camera, setCamera] = React.useState(true);
  const [microphone, setMicrophone] = React.useState(true);
  const [files, setFiles] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      if (currentPermissions) {
        setCamera(currentPermissions.camera);
        setMicrophone(currentPermissions.microphone);
        setFiles(currentPermissions.files);
      } else {
        setCamera(true);
        setMicrophone(true);
        setFiles(true);
      }

      // Silent check for live permission statuses
      permissionService.checkPermissionStatus('camera').then(status => {
        if (status === 'granted') setCamera(true);
        else if (status === 'denied') setCamera(false);
      });
      permissionService.checkPermissionStatus('microphone').then(status => {
        if (status === 'granted') setMicrophone(true);
        else if (status === 'denied') setMicrophone(false);
      });
      permissionService.checkPermissionStatus('file_access').then(status => {
        if (status === 'granted') setFiles(true);
        else if (status === 'denied') setFiles(false);
      });
    }
  }, [isOpen, currentPermissions]);

  if (!isOpen) return null;

  // Toggle handlers ONLY update internal state; they do NOT trigger save or close!
  const handleToggleCamera = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCamera(prev => !prev);
  };

  const handleToggleMicrophone = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMicrophone(prev => !prev);
  };

  const handleToggleFiles = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFiles(prev => !prev);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSavePermissions({ camera, microphone, files });
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl border space-y-5 relative bg-white border-slate-200 text-slate-900 flex flex-col justify-between max-h-[90vh] overflow-y-auto"
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close permissions modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#F59E0B] uppercase tracking-wider block">
              Device Permissions
            </span>
            <h3 className="text-lg font-display font-bold text-slate-900">
              Allow Gonnng Access?
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          To take progress photos, record project video updates, and upload media files, Gonnng requests permission to access your device's camera, microphone, and files.
        </p>

        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          {/* Camera Permission Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Camera className="w-4.5 h-4.5 text-[#F59E0B]" />
              <span className="text-xs font-bold text-slate-800">Camera Access</span>
            </div>
            <button
              type="button"
              id="toggle-camera-perm-btn"
              onClick={handleToggleCamera}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                camera ? 'bg-[#F59E0B]' : 'bg-slate-300'
              }`}
            >
              <span className={`w-4.5 h-4.5 rounded-full bg-white shadow-md absolute top-0.75 transition-transform ${
                camera ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Microphone Permission Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2.5">
              <Disc3 className="w-4.5 h-4.5 text-[#F59E0B]" />
              <span className="text-xs font-bold text-slate-800">Microphone Access</span>
            </div>
            <button
              type="button"
              id="toggle-microphone-perm-btn"
              onClick={handleToggleMicrophone}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                microphone ? 'bg-[#F59E0B]' : 'bg-slate-300'
              }`}
            >
              <span className={`w-4.5 h-4.5 rounded-full bg-white shadow-md absolute top-0.75 transition-transform ${
                microphone ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Files Permission Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2.5">
              <File className="w-4.5 h-4.5 text-[#F59E0B]" />
              <span className="text-xs font-bold text-slate-800">Access Files on Device</span>
            </div>
            <button
              type="button"
              id="toggle-files-perm-btn"
              onClick={handleToggleFiles}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                files ? 'bg-[#F59E0B]' : 'bg-slate-300'
              }`}
            >
              <span className={`w-4.5 h-4.5 rounded-full bg-white shadow-md absolute top-0.75 transition-transform ${
                files ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            id="save-permissions-btn"
            onClick={handleSave}
            className="w-full py-3 bg-[#F59E0B] hover:bg-[#FF751A] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save & Apply Permissions
          </button>
        </div>
      </motion.div>
    </div>
  );
}
