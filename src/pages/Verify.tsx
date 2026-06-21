import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDocument } from '../dbService';
import { CheckCircle, XCircle, AlertCircle, Calendar, FileText, User } from 'lucide-react';
import { format } from 'date-fns';

export default function Verify() {
    const { id } = useParams();
    const [doc, setDoc] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDoc = async () => {
            if (!id) return;
            // Check all collections since we don't know the type from the ID alone
            let found = await getDocument('invoices', id);
            if (!found) found = await getDocument('purchase_orders', id);
            if (!found) found = await getDocument('delivery_orders', id);
            
            setDoc(found);
            setLoading(false);
        };
        fetchDoc();
    }, [id]);

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">Checking document records...</div>;

    if (!doc) return (
        <div className="flex flex-col h-screen items-center justify-center bg-slate-50 text-slate-500 p-6">
            <XCircle size={64} className="text-rose-500 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Invalid Document</h1>
            <p className="text-center">This document could not be found or has been removed from the system.</p>
        </div>
    );

    const isCancelled = doc.status === 'Cancelled';
    const isDocVerified = !isCancelled;
    
    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center py-16 px-6 font-sans text-slate-800">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[s_8px_30px_rgb(0,0,0,0.015)] border border-slate-150/80 overflow-hidden">
                <div className={`p-10 text-center ${isDocVerified ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
                    {isDocVerified ? (
                        <CheckCircle size={56} className="text-white mx-auto mb-4" />
                    ) : (
                        <AlertCircle size={56} className="text-white mx-auto mb-4" />
                    )}
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        {isDocVerified ? 'Verified' : 'Cancelled'}
                    </h1>
                    <p className="text-white/80 mt-2 font-bold text-xs italic">
                        {isDocVerified ? 'Dokumen ini autentik dan terdaftar resmi.' : 'Dokumen ini telah dibatalkan / void.'}
                    </p>
                </div>

                <div className="p-9 space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">No. Dokumen</p>
                        <p className="text-base font-extrabold text-slate-800">
                            {doc.data?.metadata?.poNumber || doc.data?.metadata?.invoiceNumber || doc.data?.metadata?.deliveryOrderNumber || '-'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipe</p>
                            <p className="text-xs font-bold text-slate-800 capitalize bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-center">{doc.type?.replace('_', ' ')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal</p>
                            <p className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-center">{doc.data?.metadata?.issueDate || '-'}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Perusahaan Penerbit</p>
                        <p className="text-xs font-bold text-slate-800">{doc.data?.company?.name || 'PT INFINITAS DIGITAL SOLUSI'}</p>
                    </div>

                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Penerima Manfaat / Ditujukan</p>
                        <p className="text-xs font-bold text-slate-800">{doc.data?.vendor?.name || doc.data?.shipping?.name || '-'}</p>
                    </div>

                    <div className="pt-5 border-t border-slate-100 grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status Saat Ini</p>
                            <span className="inline-block px-3 py-1 bg-primary/5 text-primary border border-primary/10 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">{doc.status || 'Draft'}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Otorisator Utama</p>
                            <p className="text-xs font-bold text-slate-800">{doc.data?.signee?.name || '-'}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 text-center border-t border-slate-150/50">
                    <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black">Verified by Indilus System</p>
                </div>
            </div>
        </div>
    );
}
