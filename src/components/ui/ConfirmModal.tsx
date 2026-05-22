"use client";
import { AlertTriangle, X } from "lucide-react";
import Spinner from "./Spinner";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirmer",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className={`p-4 flex items-center justify-between ${danger ? "bg-red-50 border-b border-red-100" : "bg-indigo-50 border-b border-indigo-100"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${danger ? "bg-red-100" : "bg-indigo-100"}`}>
              <AlertTriangle className={`w-5 h-5 ${danger ? "text-red-600" : "text-indigo-600"}`} />
            </div>
            <h3 className={`font-bold text-base ${danger ? "text-red-900" : "text-indigo-900"}`}>{title}</h3>
          </div>
          <button onClick={onCancel} disabled={loading} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
              danger
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {loading ? <Spinner size="sm" /> : null}
            {loading ? "En cours..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
