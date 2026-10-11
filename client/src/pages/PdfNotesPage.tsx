import React, { useEffect, useState, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  FileText,
  UploadCloud,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { apiClient } from '../api/client';

interface DocumentItem {
  id: string;
  filename: string;
  filesize: number;
  page_count: number;
  ai_annotations_count: number;
  summary: string;
  created_at: string;
}

export const PdfNotesPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = () => {
    apiClient<{ documents: DocumentItem[] }>('/api/user/documents')
      .then((res) => {
        setDocuments(res.documents || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Could not load user documents:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorBanner(null);
    setSuccessBanner(null);

    // 1. Clean format validation
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorBanner('Invalid file type. Only PDF documents (.pdf) can be uploaded.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Clean 15 MB size check
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorBanner(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 15 MB limit.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 3. Upload to backend
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('summary', `Lecture notes for ${file.name.replace('.pdf', '')}`);

    try {
      await apiClient('/api/user/documents/upload', {
        method: 'POST',
        body: formData,
      });
      setSuccessBanner(`"${file.name}" uploaded and indexed successfully for AI Study Mentor retrieval!`);
      loadDocuments();
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string, filename: string) => {
    if (!window.confirm(`Delete "${filename}" from your study library?`)) return;
    try {
      await apiClient(`/api/user/documents/${docId}`, { method: 'DELETE' });
      setSuccessBanner(`Document "${filename}" removed.`);
      loadDocuments();
    } catch (err: any) {
      setErrorBanner(err.message || 'Could not delete document.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-midnight dark:text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-orchid" />
          AI Annotated PDF Notes
        </h2>
        <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300 mt-1">
          Upload your textbook PDFs, syllabus sheets, and lecture slides. 
          Your AI Mentor indexes the content to answer your questions with precise citations.
        </p>
      </div>

      {/* Alert banners */}
      {errorBanner && (
        <div role="alert" className="p-3.5 rounded-xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral text-xs flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {errorBanner}
          </span>
          <button onClick={() => setErrorBanner(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {successBanner && (
        <div role="alert" className="p-3.5 rounded-xl bg-brand-mint/15 border border-brand-mint/30 text-emerald-700 dark:text-brand-mint text-xs flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {successBanner}
          </span>
          <button onClick={() => setSuccessBanner(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Zone */}
      <Card padding="lg" className="border-2 border-dashed border-brand-violet/20 hover:border-brand-violet/40 transition-colors bg-brand-violet/5 dark:bg-brand-violet/10 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload-input"
          disabled={uploading}
        />
        <label
          htmlFor="pdf-upload-input"
          className="cursor-pointer flex flex-col items-center justify-center py-6 space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-orchid flex items-center justify-center text-white shadow-violet-glow">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-brand-midnight dark:text-white">
              {uploading ? 'Uploading & Indexing PDF...' : 'Click to Upload Lecture PDF Notes'}
            </h3>
            <p className="text-xs text-brand-slate/60 dark:text-gray-400 mt-0.5">
              Strictly PDF documents up to 15 MB per file
            </p>
          </div>
        </label>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-slate/70 dark:text-gray-300">
          Your Indexed Study Documents ({documents.length})
        </h3>

        {documents.map((doc) => (
          <Card key={doc.id} padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-brand-orchid/15 text-brand-orchid">
                  {doc.ai_annotations_count} AI Annotations
                </span>
                <span className="text-xs text-brand-slate/50 dark:text-gray-400">
                  {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'} • {formatFileSize(doc.filesize)}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-brand-midnight dark:text-white flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-brand-mint flex-shrink-0" />
                {doc.filename}
              </h4>
              <p className="text-xs text-brand-slate/70 dark:text-gray-300 leading-relaxed">
                {doc.summary}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewDoc(doc)}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
              >
                Inspect
              </Button>
              <button
                onClick={() => handleDelete(doc.id, doc.filename)}
                className="p-2 text-brand-slate/40 hover:text-brand-coral rounded-xl hover:bg-brand-coral/10 transition-colors"
                title="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}

        {documents.length === 0 && !loading && (
          <Card padding="lg" className="text-center py-8 text-xs text-brand-slate/60 dark:text-gray-400">
            No PDF notes uploaded yet. Upload your first lecture note above to empower your AI Mentor!
          </Card>
        )}
      </div>

      {/* Inspect / Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-brand-midnight/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card padding="lg" className="max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-brand-violet/10 dark:border-brand-violet/20 pb-3">
              <h3 className="font-bold text-brand-midnight dark:text-white flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-brand-cyan" />
                {previewDoc.filename}
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-brand-slate/50 hover:text-brand-midnight dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-brand-slate/80 dark:text-gray-200">
              <p><strong>File Size:</strong> {formatFileSize(previewDoc.filesize)}</p>
              <p><strong>Estimated Pages:</strong> {previewDoc.page_count}</p>
              <p><strong>AI Annotations:</strong> {previewDoc.ai_annotations_count} margin notes generated</p>
              <p><strong>Indexing Summary:</strong></p>
              <div className="p-3 rounded-xl bg-brand-violet/5 dark:bg-brand-violet/15 text-xs italic">
                {previewDoc.summary}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-brand-violet/10 dark:border-brand-violet/20">
              <Button variant="primary" size="sm" onClick={() => setPreviewDoc(null)}>
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
