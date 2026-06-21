import React, { useEffect, useState } from 'react';
import { getContacts, saveContact, deleteContact } from '../dbService';
import { Plus, Trash2, Edit2, Users, Search, ChevronLeft, Save, Building2, User, Mail, Phone, MapPin, CreditCard, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useCompany } from '../CompanyContext';

export default function Contacts() {
    const { activeCompany, companies, user } = useCompany();
    const [contacts, setContacts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentContact, setCurrentContact] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        loadData();
    }, [activeCompany]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const dd = await getContacts();
            const filtered = activeCompany
                ? dd.filter((c: any) => !c.companyId || c.companyId === activeCompany.id)
                : dd;
            setContacts(filtered);
        } catch (err) {
            toast.error("Gagal mengambil data kontak.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...currentContact,
                companyId: user?.role === 'super_admin' ? (currentContact.companyId || '') : (user?.companyId || '')
            };
            await saveContact(payload, currentContact.id);
            toast.success("Kontak berhasil disimpan");
            setIsEditing(false);
            loadData();
        } catch (err) {
            toast.error("Gagal menyimpan kontak");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteContact(id);
            loadData();
            toast.success("Kontak dihapus");
        } catch (err) {
            toast.error("Gagal menghapus kontak.");
        }
    };

    const filteredContacts = contacts.filter(c => 
        (c.company_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.pic_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-4 sm:p-10 pb-24 max-w-7xl mx-auto w-full font-sans text-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                {/* Mobile only title, desktop uses global header title */}
                <div className="lg:hidden">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 border border-slate-100 bg-primary/5 rounded-xl text-primary shadow-sm">
                            <Users size={20} strokeWidth={2.5} />
                        </div>
                        Direktori Kontak
                    </h1>
                    <p className="text-slate-400 text-xs mt-1.5 font-bold">Manajemen database Customer, Vendor, dan Rekanan Bisnis.</p>
                </div>
                {/* Desktop spacer to align to right */}
                <div className="hidden lg:block"></div>
                
                {!isEditing && (
                    <button 
                        onClick={() => { setIsEditing(true); setCurrentContact({ type: 'Customer', companyId: '' }); }}
                        className="px-6 py-3 bg-primary hover:bg-primary/95 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-2xl flex items-center gap-2.5 shadow-md shadow-primary/15 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <Plus size={16} strokeWidth={3} /> Tambah Kontak
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="bg-white rounded-[2rem] shadow-[s_8px_30px_rgb(0,0,0,0.012)] border border-slate-150/80 overflow-hidden"
                    >
                        <div className="bg-slate-50/40 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-150 shadow-sm">
                                    {currentContact.id ? <Edit2 size={16} className="text-primary" /> : <Plus size={16} className="text-primary" />}
                                </div>
                                <h2 className="text-base font-extrabold text-slate-800 tracking-tight">{currentContact.id ? 'Perbarui Data Kontak' : 'Registrasi Kontak Baru'}</h2>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-55 hover:text-slate-600 transition-all cursor-pointer">
                                <ChevronLeft size={22} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* BASIC INFO */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                        <Building2 size={16} className="text-primary" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profil Entitas</h3>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nama Perusahaan / Organisasi</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input required value={currentContact.company_name || ''} onChange={e => setCurrentContact({...currentContact, company_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-12 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="Masukkan nama legal perusahaan" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Kategori Kontak</label>
                                            <div className="relative">
                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <select value={currentContact.type || 'Customer'} onChange={e => setCurrentContact({...currentContact, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-12 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer">
                                                    <option>Customer</option>
                                                    <option>Vendor</option>
                                                    <option>Buyer</option>
                                                    <option>Shipper</option>
                                                    <option>Receiver</option>
                                                    <option>Other / Partner</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">NPWP (Tax ID)</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input value={currentContact.npwp || ''} onChange={e => setCurrentContact({...currentContact, npwp: e.target.value})} className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-12 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="00.000.000.0-000.000" />
                                            </div>
                                        </div>
                                        {/* COMPANY CHOOSER FOR SUPER ADMIN */}
                                        {user?.role === 'super_admin' && (
                                            <div className="space-y-1.5 pt-2">
                                                <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Akses Perusahaan / Unit Bisnis</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <select 
                                                        value={currentContact.companyId || ''} 
                                                        onChange={e => setCurrentContact({...currentContact, companyId: e.target.value})} 
                                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-12 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Semua Perusahaan (Milik Bersama)</option>
                                                        {companies.map(c => (
                                                            <option key={c.id} value={c.id}>{c.company_name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <p className="text-[9.5px] text-slate-400 italic px-1">Kontak milik bersama dapat dibaca dan digunakan oleh seluruh unit bisnis.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* CONTACT DETAIL */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                        <User size={16} className="text-secondary" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Personil (PIC)</h3>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nama PIC (Attn:)</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input value={currentContact.pic_name || ''} onChange={e => setCurrentContact({...currentContact, pic_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-12 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition-all placeholder:text-slate-300" placeholder="Nama penanggung jawab" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Email Bisnis</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <input type="email" value={currentContact.email || ''} onChange={e => setCurrentContact({...currentContact, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-12 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="user@company.com" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">No. Telepon / WA</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <input value={currentContact.phone || ''} onChange={e => setCurrentContact({...currentContact, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-12 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="08xxxx" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                        <MapPin size={16} className="text-primary" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Lokasi</h3>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Alamat Penagihan / Pengiriman</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-5 text-slate-400" size={16} />
                                            <textarea value={currentContact.address || ''} onChange={e => setCurrentContact({...currentContact, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-12 pr-5 py-4 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 min-h-[100px]" placeholder="Masukkan alamat lengkap rekan bisnis..." rows={3} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 flex justify-end gap-3.5">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 border border-slate-200 text-slate-550 font-bold text-xs rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all uppercase tracking-widest cursor-pointer">Batalkan</button>
                                <button type="submit" disabled={isSaving} className="px-8 py-3 bg-primary hover:bg-primary/95 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-md shadow-primary/10 transition-all flex items-center gap-2 cursor-pointer">
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={16} />}
                                    Simpan Kontak
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-8"
                    >
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                            <input 
                                type="text" 
                                placeholder="Cari nama perusahaan atau PIC..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-13 pr-6 py-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-400 text-sm"
                            />
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin shadow-sm" />
                                <p className="text-slate-400 font-extrabold animate-pulse uppercase tracking-widest text-[9.5px]">Sinkronisasi Database Kontak...</p>
                            </div>
                        ) : filteredContacts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6.5">
                                {filteredContacts.map((contact, idx) => (
                                    <motion.div 
                                        key={contact.id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="bg-white group rounded-[2rem] border border-slate-100 shadow-[s_8px_30px_rgb(0,0,0,0.012)] hover:shadow-md transition-all p-7 flex flex-col relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                                            <button onClick={() => { setCurrentContact(contact); setIsEditing(true); }} className="w-8.5 h-8.5 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary shadow-sm hover:text-white rounded-xl transition-all cursor-pointer" title="Edit">
                                                <Edit2 size={13} />
                                            </button>
                                            <button onClick={() => setContactToDelete({ id: contact.id, name: contact.company_name || contact.pic_name || 'Tidak ada nama' })} className="w-8.5 h-8.5 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-500 shadow-sm hover:text-white rounded-xl transition-all cursor-pointer" title="Hapus">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>

                                        <div className="flex items-start gap-4.5 mb-5.5">
                                            <div className="w-13 h-13 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-150 group-hover:scale-105 group-hover:bg-primary/5 transition-all duration-300">
                                                <Building2 size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="flex-1 pr-16 group-hover:pr-0 transition-all">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-widest border ${
                                                        contact.type === 'Vendor' ? 'bg-amber-50 text-amber-600 border-amber-250/50' : 
                                                        contact.type === 'Customer' ? 'bg-primary/5 text-primary border-primary/15' :
                                                        'bg-slate-50 text-slate-500 border-slate-200'
                                                    }`}>
                                                        {contact.type}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-snug group-hover:text-primary transition-colors">{contact.company_name}</h3>
                                            </div>
                                        </div>

                                        <div className="space-y-3 flex-1">
                                            {contact.pic_name && (
                                                <div className="flex items-center gap-2.5 text-slate-500">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-150/40 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                                                        <User size={12} className="group-hover:text-primary text-slate-400" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{contact.pic_name}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2.5 text-slate-500">
                                                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-150/40 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                                                    <Phone size={12} className="group-hover:text-primary text-slate-400" />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-600">{contact.phone || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-slate-500">
                                                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-150/40 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                                                    <Mail size={12} className="group-hover:text-primary text-slate-400" />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-600 truncate">{contact.email || '-'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
                                            <div className="flex items-start gap-2.5">
                                                <MapPin size={12} className="text-slate-300 mt-0.5 shrink-0" />
                                                <p className="text-[10.5px] font-semibold text-slate-400 line-clamp-2 leading-relaxed">{contact.address || 'Alamat tidak disimpan'}</p>
                                            </div>
                                            {user?.role === 'super_admin' && (
                                                <div className="flex items-center justify-between mt-2 pt-2.5 border-t border-dashed border-slate-100">
                                                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Unit Bisnis:</span>
                                                    <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded ${
                                                        contact.companyId 
                                                            ? 'text-slate-600 bg-slate-100 border border-slate-200/40' 
                                                            : 'text-emerald-700 bg-emerald-50 border border-emerald-250/20'
                                                    }`}>
                                                        {companies.find(comp => comp.id === contact.companyId)?.company_name || 'Semua Perusahaan'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 py-24 flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                                    <Users size={32} />
                                </div>
                                <p className="text-slate-400 font-extrabold uppercase tracking-widest text-xs">Database Kontak Kosong</p>
                                <button onClick={() => { setIsEditing(true); setCurrentContact({ type: 'Customer', companyId: '' }); }} className="mt-6 px-8 py-3.5 bg-primary text-white font-extrabold text-[11px] uppercase tracking-wider rounded-2xl shadow-md hover:scale-[1.02] hover:bg-primary/95 transition-all cursor-pointer">
                                    Tambah Kontak Pertama
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Delete Confirmation Modal */}
            {contactToDelete && (
                <div id="delete-contact-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 transform scale-100 transition-all text-slate-800">
                        <div className="flex items-center gap-4 text-rose-600 mb-6">
                            <div className="p-3 bg-rose-50 rounded-2xl">
                                <Trash2 size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Hapus Kontak?</h3>
                                <p className="text-slate-500 text-xs mt-1 font-semibold">Tindakan ini tidak dapat dibatalkan.</p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100 text-sm">
                            <div className="flex justify-between items-center py-1">
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Nama Kontak</span>
                                <span className="text-rose-600 font-black text-sm tracking-tight">{contactToDelete.name}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setContactToDelete(null)}
                                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-[0.15em] rounded-xl transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    const id = contactToDelete.id;
                                    setContactToDelete(null);
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
