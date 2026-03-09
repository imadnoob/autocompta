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

            for (const file of acceptedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
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

                fetch('/api/pipeline-entries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        documentId: dbData[0].id,
                        filePath: filePath,
                        fileType: file.type
                    })
                }).catch(err => console.error('Processing request failed:', err));
            }

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
        maxFiles: 5
    });

    return (
        <div className="bg-neo-white border-3 border-neo-black shadow-neo p-6">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Télécharger
            </h3>

            <div
                {...getRootProps()}
                className={`border-3 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive
                    ? 'border-neo-black bg-neo-yellow/20 -translate-x-1 -translate-y-1 shadow-neo'
                    : 'border-gray-300 hover:border-neo-black hover:bg-neo-yellow/5'
                    }`}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-neo-yellow border-3 border-neo-black flex items-center justify-center animate-pulse">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                        <p className="font-display font-semibold">Envoi en cours...</p>
                        <p className="text-sm text-gray-500">Veuillez patienter</p>
                    </div>
                ) : success ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-neo-lime border-3 border-neo-black flex items-center justify-center">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <p className="font-display font-semibold text-green-700">Document envoyé !</p>
                        <p className="text-sm text-gray-500">Glissez un autre fichier pour continuer</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-neo-cream border-3 border-neo-black flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-display font-semibold text-lg">
                                {isDragActive ? 'Déposez le fichier ici' : 'Cliquez ou glissez un fichier'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                PDF, PNG, JPG — Max 10 Mo
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border-3 border-red-400 flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
}
