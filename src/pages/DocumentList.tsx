import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDocuments, deleteDocumentInfo, saveDocument } from '../dbService';
import { Plus, Edit2, Trash2, FileText, Calendar, Building2, Tag, ChevronRight, ChevronDown } from 'lucide-react';
import { useCompany } from '../CompanyContext';
import toast from 'react-hot-toast';

export default function DocumentList() {
    const params = useParams();
    console.log("DEBUG: All params:", params);
    const { type } = params;
    console.log("DEBUG: Current type parameter value:", JSON.stringify(type), "Typeof:", typeof type);
    const { activeCompany } = useCompany();
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDocs();
    }, [type, activeCompany]);

    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [docToDelete, setDocToDelete] = useState<{ id: string; docNo: string } | null>(null);

    const loadDocs = async () => {
        setLoading(true);
        try {
            const collectionName = type === 'invoice' ? 'invoices' : type === 'po' ? 'purchase_orders' : 'delivery_orders';
            const allDocs = await getDocuments(collectionName);
            // Filter by active company if set (and include legacy documents without companyId)
            const filtered = activeCompany 
                ? allDocs.filter(d => !d.companyId || d.companyId === activeCompany.id)
                : allDocs;
            setDocs(filtered);
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat dokumen.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!id) return;
        setIsDeleting(id);
        try {
            const collectionName = type === 'invoice' ? 'invoices' : type === 'po' ? 'purchase_orders' : 'delivery_orders';
            console.log("DEBUG: Attempting to delete:", { type, collectionName, id });
            await deleteDocumentInfo(collectionName, id);
            toast.success("Dokumen berhasil dihapus secara permanen.");
            console.log("DEBUG: Document deletion confirmed for:", id);
            await loadDocs();
        } catch (e: any) {
            console.error("Delete error:", e);
            toast.error(`Gagal menghapus: ${e.message || 'Error tidak diketahui'}`);
        } finally {
            setIsDeleting(null);
        }
    };

    const typeTitle = type === 'invoice' ? 'Invoices' : type === 'po' ? 'Purchase Orders' : 'Delivery Orders';
    const accentColor = type === 'invoice' ? 'primary' : type === 'po' ? 'secondary' : 'slate';

    return (
        <div className="p-4 sm:p-10 pb-24 max-w-7xl mx-auto w-full font-sans text-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                {/* Mobile only title, desktop uses global header title */}
                <div className="lg:hidden">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                       <div className="p-2 border border-slate-100 bg-primary/5 rounded-xl text-primary shadow-sm">
                            <FileText size={20} strokeWidth={2.5} />
                       </div>
                       {typeTitle}
                    </h1>
                    <p className="text-slate-400 text-xs mt-1.5 font-bold">
                        {activeCompany ? `Manajemen arsip dokumen untuk ${activeCompany.company_name}` : 'Direktori dokumen lintas seluruh entitas'}
                    </p>
                </div>
                {/* Desktop spacer to align to right */}
                <div className="hidden lg:block"></div>
                
                <Link to={`/documents/${type}/new`} className="px-6 py-3 bg-primary hover:bg-primary/95 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-2xl flex items-center gap-2.5 shadow-md shadow-primary/15 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer">
                    <Plus size={16} strokeWidth={3} /> Buat {type === 'invoice' ? 'Invoice' : type === 'po' ? 'PO' : 'DO'} Baru
                </Link>
            </div>

            <div className="bg-white rounded-[2rem] shadow-[s_8px_30px_rgb(0,0,0,0.012)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#FAFBFD] border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5.5 font-black text-slate-400 uppercase tracking-widest text-[9.5px]">Identitas Dokumen</th>
                                <th className="px-8 py-5.5 font-black text-slate-400 uppercase tracking-widest text-[9.5px]">Tgl Terbit</th>
                                <th className="px-8 py-5.5 font-black text-slate-400 uppercase tracking-widest text-[9.5px]">Klien / Rekanan</th>
                                <th className="px-8 py-5.5 font-black text-slate-400 uppercase tracking-widest text-[9.5px]">Status Berkas</th>
                                <th className="px-8 py-5.5 font-black text-slate-400 uppercase tracking-widest text-[9.5px] text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {docs.map(doc => {
                                const docNo = doc.data?.metadata?.poNumber || doc.data?.metadata?.invoiceNumber || doc.data?.metadata?.deliveryOrderNumber || 'UNTITLED';
                                return (
                                    <tr key={doc.id} className="group hover:bg-slate-50/40 transition-colors">
                                        <td className="px-8 py-5.5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-150/60 group-hover:bg-primary/5 group-hover:border-primary/15 transition-all">
                                                    <Tag size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div>
                                                    <span className="font-extrabold text-slate-800 tracking-tight block text-base group-hover:text-primary transition-colors">{docNo}</span>
                                                    <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest">{type}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5.5">
                                            <div className="flex items-center gap-2.5 text-slate-600">
                                                <div className="w-7.5 h-7.5 rounded-lg bg-slate-50/50 flex items-center justify-center border border-slate-150/40">
                                                    <Calendar size={13} className="text-slate-400" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{doc.data?.metadata?.issueDate || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5.5">
                                            <div className="flex items-center gap-2.5 text-slate-600">
                                                <div className="w-7.5 h-7.5 rounded-lg bg-slate-50/50 flex items-center justify-center border border-slate-150/40">
                                                    <Building2 size={13} className="text-slate-400" />
                                                </div>
                                                <span className="text-xs font-extrabold text-slate-700 truncate max-w-[200px]">{doc.data?.vendor?.name || doc.data?.client?.name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5.5">
                                            <div className="relative inline-block">
                                                <select 
                                                    value={doc.status || 'Draft'}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value;
                                                        await saveDocument(type === 'invoice' ? 'invoices' : type === 'po' ? 'purchase_orders' : 'delivery_orders', { ...doc, status: newStatus }, doc.id);
                                                        toast.success("Status diperbarui.");
                                                        loadDocs();
                                                    }}
                                                    className={`appearance-none bg-slate-50 border border-slate-200/80 px-4 py-2 pr-9 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-sm`}
                                                >
                                                    {type === 'invoice' ? (
                                                        <>
                                                            <option>Draft</option>
                                                            <option>Issued</option>
                                                            <option>Sent</option>
                                                            <option>Unpaid</option>
                                                            <option>Partial Paid</option>
                                                            <option>Paid</option>
                                                            <option>Cancelled</option>
                                                        </>
                                                    ) : type === 'po' ? (
                                                        <>
                                                            <option>Draft</option>
                                                            <option>Issued</option>
                                                            <option>Sent</option>
                                                            <option>Approved</option>
                                                            <option>Completed</option>
                                                            <option>Cancelled</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option>Draft</option>
                                                            <option>Issued</option>
                                                            <option>Sent</option>
                                                            <option>Completed</option>
                                                            <option>Cancelled</option>
                                                        </>
                                                    )}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </td>
                                        <td className="px-8 py-5.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link to={`/documents/${type}/${doc.id}`} className="w-9 h-9 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" title="Ubah Dokumen">
                                                    <Edit2 size={14} />
                                                </Link>
                                                <button 
                                                    onClick={() => setDocToDelete({ id: doc.id, docNo })} 
                                                    disabled={isDeleting === doc.id}
                                                    className="w-9 h-9 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                                                    title="Hapus Permanen"
                                                >
                                                    {isDeleting === doc.id ? (
                                                        <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                                <Link to={`/documents/${type}/${doc.id}`} className="w-9 h-9 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                                    <ChevronRight size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className={`w-10 h-10 border-4 border-${accentColor}-600 border-t-transparent rounded-full animate-spin`}></div>
                        <p className="text-slate-400 font-medium animate-pulse">Menghubungkan ke database...</p>
                    </div>
                )}
                {!loading && docs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                           <FileText size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Tidak ada dokumen</h3>
                        <p className="text-slate-500 max-w-xs mt-1">Anda belum membuat {typeTitle} untuk perusahaan ini.</p>
                        <Link to={`/documents/${type}/new`} className="mt-6 text-indigo-600 font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                            Buat sekarang <ChevronRight size={16} />
                        </Link>
                    </div>
                )}
            </div>

            {/* Custom Delete Confirmation Modal */}
            {docToDelete && (
                <div id="delete-confirmation-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 transform scale-100 transition-all">
                        <div className="flex items-center gap-4 text-rose-600 mb-6">
                            <div className="p-3 bg-rose-50 rounded-2xl">
                                <Trash2 size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Hapus Dokumen?</h3>
                                <p className="text-slate-500 text-xs mt-1 font-semibold">Tindakan ini tidak dapat dibatalkan.</p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100 text-sm">
                            <div className="flex justify-between items-center py-1">
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Tipe Dokumen</span>
                                <span className="text-slate-900 font-black uppercase text-xs tracking-wider">{typeTitle}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 mt-2">
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Nomor Dokumen</span>
                                <span className="text-slate-900 font-black text-sm tracking-tight">{docToDelete.docNo}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDocToDelete(null)}
                                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-[0.15em] rounded-xl transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    const id = docToDelete.id;
                                    setDocToDelete(null);
                                    handleDelete(id);
                                }}
                                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-[0.15em] rounded-xl shadow-lg shadow-rose-600/20 transition-all"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
