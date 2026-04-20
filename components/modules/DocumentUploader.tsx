'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DocumentUploader({ onUploadComplete }: { onUploadComplete?: () => void }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('Utilisateur non authentifié');

            // Process all files in parallel for better UX
            await Promise.all(acceptedFiles.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: dbData, error: dbError } = await supabase
                    .from('documents')
                    .insert({
                        user_id: user.id,
                        file_path: filePath,
                        file_type: file.type,
                        original_name: file.name,
                        status: 'pending'
                    })
                    .select();

                if (dbError) throw dbError;

                // Trigger AI processing without waiting for it
                fetch('/api/pipeline-entries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        documentId: dbData[0].id,
                        filePath: filePath,
                        fileType: file.type
                    })
                }).catch(err => console.error('Processing request failed:', err));
            }));

            setSuccess(true);
            if (onUploadComplete) onUploadComplete();
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'Échec du téléchargement');
        } finally {
            setUploading(false);
        }
    }, [onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg'],
            'application/pdf': ['.pdf']
        },
        maxFiles: 10
    });

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-800">
                <Upload className="w-5 h-5" />
                Télécharger
            </h3>

            <div
                {...getRootProps()}
                className={`border-2 border-dashed p-8 text-center cursor-pointer rounded-xl transition-all duration-200 ${isDragActive
                    ? 'border-slate-200 bg-teal-50/20 -translate-x-1 -translate-y-1 shadow-md'
                    : 'border-gray-300 hover:border-slate-200 hover:bg-teal-50/5'
                    }`}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-teal-50 border border-slate-200 rounded-xl flex items-center justify-center animate-pulse">
                            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                        </div>
                        <p className="font-semibold text-slate-800">Envoi en cours...</p>
                        <p className="text-sm text-slate-500">Veuillez patienter</p>
                    </div>
                ) : success ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="font-semibold text-emerald-700">Documents envoyés !</p>
                        <p className="text-sm text-slate-500">Glissez d'autres fichiers pour continuer</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-lg text-slate-800">
                                {isDragActive ? 'Déposez les fichiers ici' : 'Cliquez ou glissez vos fichiers'}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                PDF, PNG, JPG — Max 10 documents
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-400 flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
}
