import React, { useEffect, useState } from 'react';
import { saveCompany, deleteCompany } from '../dbService';
import { Plus, Trash2, Edit2, Image as ImageIcon, PenTool, Stamp as StampIcon, Building2, Phone, Mail, Globe, CreditCard, Palette, User, Briefcase, ChevronLeft, Upload, Trash, FileText, Truck, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCompany } from '../CompanyContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Companies() {
    const { companies, refreshCompanies, activeCompany, setActiveCompanyId, user } = useCompany();
    const [isEditing, setIsEditing] = useState(false);
    const [currentCompany, setCurrentCompany] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<{ id: string, name: string } | null>(null);

    const displayedCompanies = user?.role === 'company_admin' 
        ? companies.filter(c => c.id === user.companyId)
        : companies;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await saveCompany(currentCompany, currentCompany.id);
            toast.success("Data perusahaan berhasil disimpan!");
            setIsEditing(false);
            refreshCompanies();
        } catch (err) {
            toast.error("Gagal menyimpan data perusahaan.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCompany(id);
            if (activeCompany?.id === id) setActiveCompanyId('');
            refreshCompanies();
            toast.success("Perusahaan dihapus.");
        } catch (err) {
            toast.error("Gagal menghapus perusahaan.");
        }
    };

    return (
        <div className="p-4 sm:p-10 pb-24 max-w-7xl mx-auto w-full font-sans text-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                {/* Mobile only title, desktop uses global header title */}
                <div className="lg:hidden">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                       <div className="p-2 border border-slate-100 bg-primary/5 rounded-xl text-primary shadow-sm">
                            <Building2 size={20} />
                       </div>
                       Multi-Company
                    </h1>
                    <p className="text-slate-400 text-xs mt-1.5 font-bold">Kelola portofolio bisnis dan unit perusahaan Anda secara terpusat.</p>
                </div>
                {/* Desktop spacer to align to right */}
                <div className="hidden lg:block"></div>
                
                {!isEditing && user?.role === 'super_admin' && (
                    <button 
                        onClick={() => { setIsEditing(true); setCurrentCompany({ themeColor: 'primary' }); }}
                        className="px-6 py-3 bg-primary hover:bg-primary/95 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-2xl flex items-center gap-2.5 shadow-md shadow-primary/15 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <Plus size={16} /> Tambah Perusahaan Baru
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
                            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">{currentCompany.id ? 'Edit Profil Perusahaan' : 'Pendaftaran Perusahaan Baru'}</h2>
                            <button onClick={() => setIsEditing(false)} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-55 hover:text-slate-600 transition-all cursor-pointer">
                                <ChevronLeft size={22} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-10">
                            {/* SECTION: BASIC INFO */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <Building2 size={16} className="text-primary" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Identitas</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nama Brand / Umum</label>
                                        <input required value={currentCompany.company_name || ''} onChange={e => setCurrentCompany({...currentCompany, company_name: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="Contoh: Indilus Media" />
                                    </div>
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nama Legal (PT/CV)</label>
                                        <input value={currentCompany.legal_name || ''} onChange={e => setCurrentCompany({...currentCompany, legal_name: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="Contoh: PT Indilus Digital Solusi" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Alamat Kantor Pusat</label>
                                        <textarea value={currentCompany.address || ''} onChange={e => setCurrentCompany({...currentCompany, address: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[100px] placeholder:text-slate-300" rows={2} placeholder="Alamat lengkap perusahaan..." />
                                    </div>
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Email Bisnis</label>
                                        <input type="email" value={currentCompany.email || ''} onChange={e => setCurrentCompany({...currentCompany, email: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="finance@company.com" />
                                    </div>
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nomor Telepon Kantor</label>
                                        <input value={currentCompany.phone || ''} onChange={e => setCurrentCompany({...currentCompany, phone: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="+62 ..." />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: LOGIN CREDENTIALS */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <User size={16} className="text-primary" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kredensial Akses Perusahaan (Login)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Username Login</label>
                                        <input 
                                            value={currentCompany.username || ''} 
                                            onChange={e => setCurrentCompany({...currentCompany, username: e.target.value.toLowerCase().replace(/\s+/g, '')})} 
                                            className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                                            placeholder="Contoh: indilus_finance" 
                                            disabled={user?.role !== 'super_admin'}
                                        />
                                        <p className="text-[9.5px] text-slate-400 italic px-1">Gunakan huruf kecil tanpa spasi.</p>
                                    </div>
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Kunci Sandi (Password)</label>
                                        <input 
                                            type="text" 
                                            value={currentCompany.password || ''} 
                                            onChange={e => setCurrentCompany({...currentCompany, password: e.target.value})} 
                                            className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                                            placeholder="Masukkan password perusahaan" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: FINANCE & THEME */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                        <CreditCard size={16} className="text-primary" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keuangan & Legal</h3>
                                    </div>
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">NPWP Perusahaan</label>
                                        <input value={currentCompany.npwp || ''} onChange={e => setCurrentCompany({...currentCompany, npwp: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="00.000.000.0-000.000" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-5 bg-primary/[0.015] p-6 rounded-2xl border border-primary/5 shadow-inner">
                                        <div className="space-y-1.55">
                                            <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest block px-1">Nama Bank</label>
                                            <input placeholder="Contoh: BANK MANDIRI" value={currentCompany.bank_name || ''} onChange={e => setCurrentCompany({...currentCompany, bank_name: e.target.value})} className="w-full bg-white border border-primary/10 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                                        </div>
                                        <div className="space-y-1.55">
                                            <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest block px-1">Nomor Rekening</label>
                                            <input placeholder="Contoh: 1234567890" value={currentCompany.bank_account || ''} onChange={e => setCurrentCompany({...currentCompany, bank_account: e.target.value})} className="w-full bg-white border border-primary/10 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                                        </div>
                                        <div className="space-y-1.55">
                                            <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest block px-1">Atas Nama (Account Name)</label>
                                            <input placeholder="Contoh: PT ABC INDONESIA" value={currentCompany.bank_account_name || ''} onChange={e => setCurrentCompany({...currentCompany, bank_account_name: e.target.value})} className="w-full bg-white border border-primary/10 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                        <Palette size={16} className="text-primary" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas Visual (Tema)</h3>
                                    </div>
                                    <div className="space-y-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 shadow-inner">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Warna Utama Dokumen</label>
                                        <div className="flex flex-wrap gap-4 items-center">
                                            {[
                                                { id: 'primary', hex: '#0C4196' },
                                                { id: 'secondary', hex: '#2EB9FF' },
                                                { id: 'indigo', hex: '#4f46e5' },
                                                { id: 'emerald', hex: '#10b981' },
                                                { id: 'amber', hex: '#f59e0b' },
                                                { id: 'rose', hex: '#f43f5e' }
                                            ].map(color => (
                                                <button 
                                                    key={color.id}
                                                    type="button"
                                                    onClick={() => setCurrentCompany({...currentCompany, themeColor: color.id})}
                                                    className={`w-10 h-10 rounded-xl border-4 transition-all hover:scale-105 active:scale-95 ${
                                                        currentCompany.themeColor === color.id ? 'border-primary ring-4 ring-primary/10 scale-105 shadow-md z-10' : 'border-white'
                                                    }`}
                                                    style={{ backgroundColor: color.hex }}
                                                    title={color.id}
                                                />
                                            ))}
                                            <div className="flex items-center gap-3 bg-white border border-slate-205 rounded-xl px-4 py-2 shadow-sm ml-auto">
                                                <div 
                                                    className="w-5 h-5 rounded-lg border border-slate-100 shadow-sm" 
                                                    style={{ backgroundColor: (currentCompany.themeColor?.startsWith('#') ? currentCompany.themeColor : '#0C4196') }} 
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="#HEXCOLOR"
                                                    value={currentCompany.themeColor?.startsWith('#') ? currentCompany.themeColor : ''}
                                                    onChange={(e) => setCurrentCompany({...currentCompany, themeColor: e.target.value})}
                                                    className="text-[9px] font-black uppercase w-20 outline-none text-slate-700 bg-transparent"
                                                />
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white/55 border border-slate-200/65 rounded-xl">
                                            <p className="text-[9.5px] text-slate-400 italic font-medium leading-relaxed">Pilih preset atau masukkan kode warna HEX. Warna ini akan menjadi aksen grafis utama pada format dokumen cetak Anda.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: ASSETS (LOGO, SIG, STAMP) */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <ImageIcon size={16} className="text-primary" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aset Digital Dokumen</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <AssetUpload 
                                        label="Logo Perusahaan" 
                                        icon={<ImageIcon size={22} />} 
                                        value={currentCompany.logo} 
                                        onChange={(val) => setCurrentCompany({...currentCompany, logo: val})} 
                                    />
                                    <AssetUpload 
                                        label="Company Stamp (Standard)" 
                                        icon={<StampIcon size={22} />} 
                                        value={currentCompany.company_stamp} 
                                        onChange={(val) => setCurrentCompany({...currentCompany, company_stamp: val})} 
                                    />
                                </div>
                            </div>

                            {/* SECTION: AUTHORITY - INVOICE */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <FileText size={16} className="text-primary" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Otoritas Dokumen: INVOICE & PENAGIHAN</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nama Lengkap Signee</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input value={currentCompany.invoice_auth_name || ''} onChange={e => setCurrentCompany({...currentCompany, invoice_auth_name: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl pl-11 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="Nama Penandatangan" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Jabatan Resmi</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input value={currentCompany.invoice_auth_position || ''} onChange={e => setCurrentCompany({...currentCompany, invoice_auth_position: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl pl-11 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="Contoh: Manager Finance" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nomor HP / WhatsApp</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input value={currentCompany.invoice_auth_phone || ''} onChange={e => setCurrentCompany({...currentCompany, invoice_auth_phone: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl pl-11 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="0812xxxx" />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <AssetUpload 
                                            label="TTD Khusus Invoice" 
                                            icon={<PenTool size={22} />} 
                                            value={currentCompany.invoice_auth_signature} 
                                            onChange={(val) => setCurrentCompany({...currentCompany, invoice_auth_signature: val})} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: AUTHORITY - DO */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <Truck size={16} className="text-secondary" />
                                    <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest">Otoritas Dokumen: DELIVERY ORDER (DO)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nama Lengkap Signee</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input value={currentCompany.do_auth_name || ''} onChange={e => setCurrentCompany({...currentCompany, do_auth_name: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl pl-11 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition-all placeholder:text-slate-300" placeholder="Nama Penandatangan" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Jabatan Resmi</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input value={currentCompany.do_auth_position || ''} onChange={e => setCurrentCompany({...currentCompany, do_auth_position: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl pl-11 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition-all placeholder:text-slate-300" placeholder="Contoh: Manager Logistik" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nomor HP / WhatsApp</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input value={currentCompany.do_auth_phone || ''} onChange={e => setCurrentCompany({...currentCompany, do_auth_phone: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl pl-11 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition-all placeholder:text-slate-300" placeholder="0812xxxx" />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <AssetUpload 
                                            label="TTD Khusus Delivery Order" 
                                            icon={<PenTool size={22} />} 
                                            value={currentCompany.do_auth_signature} 
                                            onChange={(val) => setCurrentCompany({...currentCompany, do_auth_signature: val})} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: AUTHORITY - PO */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <ShoppingCart size={16} className="text-primary" />
                                    <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Otoritas Dokumen: PURCHASE ORDER (PO)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nama Lengkap Signee</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input value={currentCompany.po_auth_name || ''} onChange={e => setCurrentCompany({...currentCompany, po_auth_name: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl pl-11 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="Nama Penandatangan" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Jabatan Resmi</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input value={currentCompany.po_auth_position || ''} onChange={e => setCurrentCompany({...currentCompany, po_auth_position: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl pl-11 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="Contoh: Manager Procurement" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.55">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nomor HP / WhatsApp</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input value={currentCompany.po_auth_phone || ''} onChange={e => setCurrentCompany({...currentCompany, po_auth_phone: e.target.value})} className="w-full bg-slate-55 border border-slate-200/80 rounded-xl pl-11 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="0812xxxx" />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <AssetUpload 
                                            label="TTD Khusus Purchase Order" 
                                            icon={<PenTool size={22} />} 
                                            value={currentCompany.po_auth_signature} 
                                            onChange={(val) => setCurrentCompany({...currentCompany, po_auth_signature: val})} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 flex justify-end gap-3.5">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 border border-slate-200 text-slate-550 font-bold text-xs rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all uppercase tracking-widest cursor-pointer">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-8 py-3 bg-primary text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-md shadow-primary/10 transition-all flex items-center gap-2 cursor-pointer">
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Building2 size={16} />}
                                    Simpan Profil
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6.5">
                        <AnimatePresence>
                            {displayedCompanies.map((c, idx) => (
                                <motion.div 
                                    key={c.id || idx}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="bg-white rounded-[2rem] border border-slate-100 shadow-[s_8px_30px_rgb(0,0,0,0.012)] hover:shadow-md transition-all p-7 flex flex-col group relative cursor-default"
                                >
                                    <div className="flex items-start justify-between mb-7">
                                        <div className="w-[140px] h-[75px] bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-150 overflow-hidden shrink-0 group-hover:scale-102 transition-transform duration-300">
                                            {c.logo ? <img src={c.logo} className="w-full h-full object-contain p-2" /> : <Building2 size={28} className="text-slate-200" />}
                                        </div>
                                        <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            <button onClick={() => { setCurrentCompany(c); setIsEditing(true); }} className="w-8.5 h-8.5 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary shadow-sm hover:text-white rounded-xl transition-all cursor-pointer" title="Edit">
                                                <Edit2 size={13} />
                                            </button>
                                            <button onClick={() => setCompanyToDelete({ id: c.id, name: c.company_name })} className="w-8.5 h-8.5 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-500 shadow-sm hover:text-white rounded-xl transition-all cursor-pointer" title="Hapus">
                                                <Trash size={13} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                            <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Registered Entity</span>
                                        </div>
                                        <h3 className="text-lg font-extrabold text-slate-800 tracking-tight leading-snug group-hover:text-primary transition-colors">{c.company_name}</h3>
                                        <p className="text-slate-450 text-xs font-bold mt-1 truncate">{c.legal_name || 'Individual / Non-PT'}</p>
                                        
                                        <div className="mt-6 space-y-3">
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-150/40 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Mail size={12} className="text-slate-400" />
                                                </div>
                                                <span className="text-xs truncate font-bold text-slate-600">{c.email || 'Email tidak tersedia'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-150/40 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Phone size={12} className="text-slate-400" />
                                                </div>
                                                <span className="text-xs truncate font-bold text-slate-600">{c.phone || 'Nomor tidak tersedia'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-7 pt-5 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {c.authority_signature && <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-md text-primary" title="Business Signature Ready"><PenTool size={12} /></div>}
                                            {c.company_stamp && <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-md text-secondary" title="Corporate Stamp Ready"><StampIcon size={12} /></div>}
                                        </div>
                                        <div 
                                            className="w-4 h-4 rounded-full shadow-md ring-2 ring-white"
                                            style={{ 
                                                backgroundColor: c.themeColor === 'primary' ? '#0C4196' : 
                                                                c.themeColor === 'secondary' ? '#2EB9FF' :
                                                                c.themeColor === 'indigo' ? '#4f46e5' : 
                                                                c.themeColor === 'emerald' ? '#10b981' : 
                                                                c.themeColor === 'sky' ? '#0ea5e9' : 
                                                                c.themeColor === 'rose' ? '#f43f5e' : 
                                                                c.themeColor === 'amber' ? '#f59e0b' : '#64748b' 
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {displayedCompanies.length === 0 && (
                            <div className="col-span-full py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-200/60 flex flex-col items-center justify-center text-center shadow-inner">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200 animate-pulse">
                                    <Building2 size={32} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Belum ada perusahaan</h3>
                                <p className="text-slate-450 max-w-xs mt-2 text-xs font-bold px-6 leading-relaxed">Daftarkan unit bisnis atau perusahaan Anda untuk mulai mengelola portofolio dokumen secara profesional.</p>
                                <button 
                                    onClick={() => { setIsEditing(true); setCurrentCompany({ themeColor: 'primary' }); }}
                                    className="mt-8 px-8 py-3.5 bg-primary text-white font-extrabold text-[11px] uppercase tracking-wider rounded-2xl shadow-md hover:scale-[1.02] hover:bg-primary/95 transition-all cursor-pointer"
                                >
                                    Tambah Unit Pertama
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Delete Confirmation Modal */}
            {companyToDelete && (
                <div id="delete-company-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 transform scale-100 transition-all text-slate-800">
                        <div className="flex items-center gap-4 text-rose-600 mb-6">
                            <div className="p-3 bg-rose-50 rounded-2xl">
                                <Trash2 size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Hapus Perusahaan?</h3>
                                <p className="text-slate-500 text-xs mt-1 font-semibold">Tindakan ini tidak dapat dibatalkan.</p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100 text-sm">
                            <div className="flex justify-between items-center py-1">
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Perusahaan</span>
                                <span className="text-rose-600 font-black text-sm tracking-tight">{companyToDelete.name}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-3 font-semibold leading-relaxed">Peringatan: Data terkait mungkin akan kehilangan referensi setelah dihapus secara permanen.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCompanyToDelete(null)}
                                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-[0.15em] rounded-xl transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    const id = companyToDelete.id;
                                    setCompanyToDelete(null);
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

function AssetUpload({ label, icon, value, onChange }: { label: string, icon: React.ReactNode, value: string, onChange: (val: string) => void }) {
    const [isHovering, setIsHovering] = useState(false);
    
    return (
        <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block">{label}</label>
            <div 
                className="relative h-[150px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 overflow-hidden group hover:border-indigo-300 hover:bg-slate-100/50 transition-all"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {value ? (
                    <>
                        <img src={value} className="w-full h-full object-contain p-4" />
                        {isHovering && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center gap-3">
                                <label className="p-2.5 bg-white text-indigo-600 rounded-xl cursor-pointer shadow-xl hover:scale-110 active:scale-95 transition-transform">
                                    <Upload size={18} />
                                    <input type="file" accept="image/*" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = () => onChange(reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }} className="hidden" />
                                </label>
                                <button type="button" onClick={() => onChange('')} className="p-2.5 bg-white text-rose-600 rounded-xl shadow-xl hover:scale-110 active:scale-95 transition-transform">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors">
                            {icon}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tap untuk unggah</span>
                        <input type="file" accept="image/*" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = () => onChange(reader.result as string);
                                reader.readAsDataURL(file);
                            }
                        }} className="hidden" />
                    </label>
                )}
            </div>
        </div>
    );
}
