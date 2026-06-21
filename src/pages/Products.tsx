import React, { useEffect, useState } from 'react';
import { getProducts, saveProduct, deleteProduct } from '../dbService';
import { Plus, Trash2, Edit2, Package, Search, ChevronLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { useCompany } from '../CompanyContext';

export default function Products() {
    const { activeCompany, companies, user } = useCompany();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
        name: '',
        unit: 'Pcs',
        price: 0,
        description: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [productToDelete, setProductToDelete] = useState<{ id: string, name: string } | null>(null);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await getProducts();
            const filtered = activeCompany
                ? (data as any[]).filter(p => !p.companyId || p.companyId === activeCompany.id)
                : data;
            setProducts(filtered as Product[]);
        } catch (err) {
            toast.error("Gagal mengambil data produk.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [activeCompany]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...currentProduct,
                companyId: user?.role === 'super_admin' ? (currentProduct.companyId || '') : (user?.companyId || '')
            };
            await saveProduct(payload as any, currentProduct.id);
            toast.success("Produk berhasil disimpan!");
            setIsEditing(false);
            fetchProducts();
        } catch (err) {
            toast.error("Gagal menyimpan produk.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteProduct(id);
            toast.success("Produk dihapus.");
            fetchProducts();
        } catch (err) {
            toast.error("Gagal menghapus produk.");
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-10 pb-24 max-w-7xl mx-auto w-full font-sans text-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                {/* Mobile only title, desktop uses global header title */}
                <div className="lg:hidden">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 border border-slate-100 bg-primary/5 rounded-xl text-primary shadow-sm">
                            <Package size={20} strokeWidth={2.5} />
                        </div>
                        Katalog Produk
                    </h1>
                    <p className="text-slate-400 text-xs mt-1.5 font-bold">Lengkap dengan manajemen SKU, Unit, dan Harga Satuan.</p>
                </div>
                {/* Desktop spacer to align to right */}
                <div className="hidden lg:block"></div>
                
                {!isEditing && (
                    <button 
                        onClick={() => { 
                            setIsEditing(true); 
                            setCurrentProduct({ name: '', unit: 'Pcs', price: 0, description: '', companyId: '' }); 
                        }}
                        className="px-6 py-3 bg-primary hover:bg-primary/95 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-2xl flex items-center gap-2.5 shadow-md shadow-primary/15 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <Plus size={16} strokeWidth={3} /> Tambah Produk
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
                                    {currentProduct.id ? <Edit2 size={16} className="text-primary" /> : <Plus size={16} className="text-primary" />}
                                </div>
                                <h2 className="text-base font-extrabold text-slate-800 tracking-tight">{currentProduct.id ? 'Perbarui Data Produk' : 'Registrasi Produk Baru'}</h2>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-55 hover:text-slate-600 transition-all cursor-pointer">
                                <ChevronLeft size={22} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Nama Barang / Deskripsi Singkat</label>
                                    <input 
                                        required 
                                        value={currentProduct.name || ''} 
                                        onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} 
                                        className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                                        placeholder="Contoh: MacBook Pro M3 Max 14-inch" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Unit (Satuan)</label>
                                    <input 
                                        required
                                        value={currentProduct.unit || ''} 
                                        onChange={e => setCurrentProduct({...currentProduct, unit: e.target.value})} 
                                        className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                                        placeholder="Contoh: Pcs, Unit, Box, Set" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Harga Satuan (IDR)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">Rp</div>
                                        <input 
                                            required
                                            type="number"
                                            value={currentProduct.price || 0} 
                                            onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} 
                                            className="w-full bg-slate-55 border border-slate-200/80 rounded-xl pl-11 pr-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                                        />
                                    </div>
                                </div>
                                {/* COMPANY CHOOSER FOR SUPER ADMIN */}
                                {user?.role === 'super_admin' && (
                                    <div className="md:col-span-2 space-y-1.5 pt-2">
                                        <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Akses Perusahaan / Unit Bisnis</label>
                                        <select 
                                            value={currentProduct.companyId || ''} 
                                            onChange={e => setCurrentProduct({...currentProduct, companyId: e.target.value})} 
                                            className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Semua Perusahaan (Milik Bersama)</option>
                                            {companies.map(c => (
                                                <option key={c.id} value={c.id}>{c.company_name}</option>
                                            ))}
                                        </select>
                                        <p className="text-[9.5px] text-slate-400 italic px-1">Produk milik bersama dapat dibaca dan ditentukan dalam dokumen transaksi oleh seluruh unit bisnis.</p>
                                    </div>
                                )}
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block px-1">Rincian Spesifikasi (Opsional)</label>
                                    <textarea 
                                        value={currentProduct.description || ''} 
                                        onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} 
                                        className="w-full bg-slate-55 border border-slate-200/80 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[100px] placeholder:text-slate-300" 
                                        placeholder="Tambahkan detail spesifikasi teknis atau catatan tambahan untuk produk ini..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3.5 pt-8 border-t border-slate-100">
                                <button 
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-3 border border-slate-200 text-slate-550 font-bold text-xs rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all uppercase tracking-widest cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-8 py-3 bg-primary text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-md shadow-primary/10 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                    Simpan Produk
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
                                placeholder="Cari nama produk, spesifikasi, atau unit..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-13 pr-6 py-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-400 text-sm"
                            />
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin shadow-sm" />
                                <p className="text-slate-400 font-extrabold animate-pulse uppercase tracking-widest text-[9.5px]">Memuat Katalog Produk...</p>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6.5">
                                {filteredProducts.map((p, idx) => (
                                    <motion.div 
                                        key={p.id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="bg-white group rounded-[2rem] border border-slate-100 shadow-[s_8px_30px_rgb(0,0,0,0.012)] hover:shadow-md transition-all flex flex-col overflow-hidden relative"
                                    >
                                        <div className="p-7 flex-1">
                                            <div className="flex justify-between items-start mb-5.5">
                                                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-primary/5 group-hover:text-primary group-hover:scale-105 transition-all duration-300">
                                                    <Package size={22} />
                                                </div>
                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                    <button onClick={() => { setCurrentProduct(p); setIsEditing(true); }} className="w-8.5 h-8.5 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary shadow-sm hover:text-white rounded-xl transition-all cursor-pointer">
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button onClick={() => setProductToDelete({ id: p.id!, name: p.name })} className="w-8.5 h-8.5 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-500 shadow-sm hover:text-white rounded-xl transition-all cursor-pointer" title="Hapus">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-snug mb-2 group-hover:text-primary transition-colors">{p.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-slate-55 text-slate-500 rounded-md text-[8.5px] font-black uppercase tracking-widest border border-slate-200 group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/10 transition-colors">
                                                        {p.unit}
                                                    </span>
                                                </div>
                                                {p.description && (
                                                    <p className="mt-3.5 text-[10.5px] font-semibold text-slate-450 line-clamp-2 leading-relaxed">{p.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-[#FAFBFD] px-7 py-5.5 border-t border-slate-100 flex justify-between items-center group-hover:bg-primary/[0.015] transition-colors">
                                            <div className="flex-1">
                                                <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Harga Satuan</p>
                                                <p className="text-xl font-black text-slate-800 tracking-tight flex items-baseline gap-0.5">
                                                    <span className="text-xs font-bold text-slate-400">Rp</span> 
                                                    {p.price.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                            {user?.role === 'super_admin' && (
                                                <div className="text-right ml-4 shrink-0">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Unit Bisnis</p>
                                                    <span className={`text-[9px] font-black px-2 py-1 rounded-md border ${
                                                        p.companyId 
                                                            ? 'text-slate-600 bg-slate-100 border-slate-200/50' 
                                                            : 'text-emerald-700 bg-emerald-50 border-emerald-250/20'
                                                    }`}>
                                                        {companies.find(comp => comp.id === p.companyId)?.company_name || 'Semua'}
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
                                    <Package size={32} />
                                </div>
                                <p className="text-slate-400 font-extrabold uppercase tracking-widest text-xs">Katalog Masih Kosong</p>
                                <button onClick={() => { setIsEditing(true); setCurrentProduct({ name: '', unit: 'Pcs', price: 0, description: '', companyId: '' }); }} className="mt-6 px-8 py-3.5 bg-primary text-white font-extrabold text-[11px] uppercase tracking-wider rounded-2xl shadow-md hover:scale-[1.02] hover:bg-primary/95 transition-all cursor-pointer">
                                    Tambah Produk Pertama
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Delete Confirmation Modal */}
            {productToDelete && (
                <div id="delete-product-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 transform scale-100 transition-all text-slate-800">
                        <div className="flex items-center gap-4 text-rose-600 mb-6">
                            <div className="p-3 bg-rose-50 rounded-2xl">
                                <Trash2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Hapus Produk?</h3>
                                <p className="text-slate-500 text-xs mt-1 font-semibold">Tindakan ini tidak dapat dibatalkan.</p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100 text-sm">
                            <div className="flex justify-between items-center py-1">
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Nama Produk</span>
                                <span className="text-rose-600 font-black text-sm tracking-tight">{productToDelete.name}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setProductToDelete(null)}
                                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-[0.15em] rounded-xl transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    const id = productToDelete.id;
                                    setProductToDelete(null);
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
