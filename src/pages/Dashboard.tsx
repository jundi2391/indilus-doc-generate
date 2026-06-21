import React, { useEffect, useState } from 'react';
import { getDocuments } from '../dbService';
import { Link } from 'react-router-dom';
import { 
    FileText, Clock, CheckCircle, TrendingUp, AlertCircle, BarChart3, 
    ChevronRight, Bookmark, ArrowUpRight, ArrowDownRight, Activity 
} from 'lucide-react';
import { useCompany } from '../CompanyContext';
import { motion } from 'motion/react';

export default function Dashboard() {
    const { activeCompany } = useCompany();
    const [stats, setStats] = useState({
        totalInvoices: 0,
        unpaidInvoices: 0,
        paidInvoices: 0,
        partialPaidInvoices: 0,
        totalDO: 0,
        doCompleted: 0,
        totalPO: 0,
        poCompleted: 0,
        revenue: 0,
        outstanding: 0
    });

    const [recentDocs, setRecentDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const calculateDocTotal = (docData: any) => {
        if (!docData?.items) return 0;
        const subtotal = docData.items.reduce((sum: number, item: any) => sum + ((item.qty || 0) * (item.price || 0)), 0);
        const tax = docData.ppnEnabled ? subtotal * (docData.ppnPercent || 11) / 100 : 0;
        return subtotal + tax;
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const numI = await getDocuments('invoices');
            const numP = await getDocuments('purchase_orders');
            const numD = await getDocuments('delivery_orders');

            // Filter if activeCompany exists (and also show legacy documents with no companyId)
            const filteredI = activeCompany ? numI.filter(i => !i.companyId || i.companyId === activeCompany.id) : numI;
            const filteredP = activeCompany ? numP.filter(p => !p.companyId || p.companyId === activeCompany.id) : numP;
            const filteredD = activeCompany ? numD.filter(d => !d.companyId || d.companyId === activeCompany.id) : numD;

            const paidI = filteredI.filter(i => i.status === 'Paid');
            const outstandingI = filteredI.filter(i => i.status === 'Unpaid' || i.status === 'Partial Paid');

            const revenue = paidI.reduce((sum, i) => sum + calculateDocTotal(i.data), 0);
            const outstanding = outstandingI.reduce((sum, i) => sum + calculateDocTotal(i.data), 0);

            setStats({
                totalInvoices: filteredI.length,
                unpaidInvoices: filteredI.filter(i => i.status === 'Unpaid' || i.status === 'Draft').length,
                paidInvoices: paidI.length,
                partialPaidInvoices: filteredI.filter(i => i.status === 'Partial Paid').length,
                totalPO: filteredP.length,
                poCompleted: filteredP.filter(p => p.status === 'Completed').length,
                totalDO: filteredD.length,
                doCompleted: filteredD.filter(p => p.status === 'Completed').length,
                revenue,
                outstanding
            });

            const allDocs: any[] = [
                ...filteredI.map((i: any) => ({...i, docTypeLabel: 'Invoice', docType: 'invoice', accent: 'primary'})), 
                ...filteredP.map((p: any) => ({...p, docTypeLabel: 'Purchase Order', docType: 'po', accent: 'secondary'})), 
                ...filteredD.map((d: any) => ({...d, docTypeLabel: 'Delivery Order', docType: 'delivery_order', accent: 'secondary'}))
            ].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            setRecentDocs(allDocs.slice(0, 8));
            setLoading(false);
        };
        load();
    }, [activeCompany]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="p-4 sm:p-10 pb-24 max-w-7xl mx-auto w-full space-y-10">
            {/* Mobile-only header, desktop uses sticky header from layout */}
            <header className="lg:hidden mb-6 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        {activeCompany ? activeCompany.company_name : 'Dashboard Overview'}
                    </h1>
                </div>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">Berikut adalah ringkasan performa finansial dan administrasi bisnis Anda.</p>
                {activeCompany && (
                    <div className="mt-2 text-primary font-black uppercase tracking-wider text-[10px] bg-primary/10 rounded-full px-3 py-1 flex items-center gap-2 self-start border border-primary/20">
                        <Bookmark size={11} /> Unit Bisnis Aktif
                    </div>
                )}
            </header>
            
            {/* 4 Bento-Style Metric Cards exactly like Spendkart */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
               <SpendkartMetricCard 
                    title="Total Revenue" 
                    value={formatCurrency(stats.revenue)} 
                    icon={<TrendingUp />} 
                    color="primary"
                    trendType="up"
                    trendValue="▲ 12.1%"
                    subtitle="Bulan ini"
               />
               <SpendkartMetricCard 
                    title="Outstanding" 
                    value={formatCurrency(stats.outstanding)} 
                    icon={<AlertCircle />} 
                    color="rose"
                    trendType="down"
                    trendValue="▼ 4.5%"
                    subtitle="Piutang berjalan"
               />
               <SpendkartMetricCard 
                    title="Total Invoices" 
                    value={stats.totalInvoices.toString()} 
                    icon={<FileText />} 
                    color="secondary"
                    trendType="up"
                    trendValue="▲ 8.3%"
                    subtitle="Invoice terbit"
               />
               <SpendkartMetricCard 
                    title="Pending DO" 
                    value={(stats.totalDO - stats.doCompleted).toString()} 
                    icon={<Clock />} 
                    color="amber"
                    trendType="normal"
                    trendValue="● Berjalan"
                    subtitle="Menunggu diproses"
               />
            </div>

            {/* Split Grid for Document List and Visual widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Clean Ledger card with high rounded corners & soft shadow */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <Activity size={18} />
                            </div>
                            <h2 className="font-extrabold text-slate-800 text-sm tracking-tight">
                                Dokumen Terbaru
                            </h2>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">Updated Real-time</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#FAFBFD] border-b border-slate-100 font-extrabold text-slate-400 text-[10px] uppercase tracking-wider">
                                <tr>
                                    <th className="py-4.5 px-8 text-center w-28">Tipe</th>
                                    <th className="py-4.5 px-6">No. Referensi</th>
                                    <th className="py-4.5 px-6">Partner Bisnis</th>
                                    <th className="py-4.5 px-8 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentDocs.map((doc, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/70 transition-all cursor-default">
                                        <td className="py-5 px-8">
                                            <div className="flex justify-center">
                                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border shadow-sm ${
                                                    doc.docType === 'invoice' 
                                                        ? 'bg-primary/5 text-primary border-primary/20' 
                                                        : doc.docType === 'po' 
                                                        ? 'bg-secondary/5 text-secondary border-secondary/20' 
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                    {doc.docTypeLabel}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="font-extrabold text-slate-800 text-sm tracking-tight">
                                                {doc.data?.metadata?.poNumber || doc.data?.metadata?.invoiceNumber || doc.data?.metadata?.deliveryOrderNumber || 'NO-REF'}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight mt-0.5">{new Date(doc.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-slate-700 font-bold text-xs">{doc.data?.client?.name || doc.data?.vendor?.name || 'Tanpa Partner'}</span>
                                                <span className="text-[10px] text-slate-400 font-semibold">ATTN: {doc.data?.client?.attn || doc.data?.vendor?.attn || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            <Link 
                                                to={`/documents/${doc.docType}/${doc.id}`} 
                                                className="inline-flex items-center gap-1 bg-slate-50 group-hover:bg-primary group-hover:text-white border border-slate-200/60 group-hover:border-primary px-3 py-1.5 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-wider transition-all"
                                            >
                                                Edit <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {recentDocs.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 border border-slate-100">
                                                <Bookmark size={30} />
                                            </div>
                                            <p className="text-slate-400 font-extrabold uppercase tracking-widest text-xs">Belum ada aktivitas dokumen</p>
                                        </td>
                                    </tr>
                                )}
                                {loading && (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                           <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Menghubungkan ke database...</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side Spendkart-style progress dashboard widgets */}
                <div className="space-y-7">
                    
                    {/* Ringkasan Operasional Panel */}
                    <div className="bg-primary rounded-[2rem] p-8 text-white shadow-lg shadow-primary/10 relative overflow-hidden group">
                        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                        <h3 className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-3">Ringkasan Operasional</h3>
                        <div className="space-y-5">
                            <SpendkartSmallStats label="Invoices Lunas" value={stats.paidInvoices} total={stats.totalInvoices} />
                            <SpendkartSmallStats label="PO Terselesaikan" value={stats.poCompleted} total={stats.totalPO} />
                            <SpendkartSmallStats label="DO Terkirim" value={stats.doCompleted} total={stats.totalDO} />
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <Link to="/documents/invoice" className="flex items-center justify-between group/link">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-100 hover:text-white">Dokumen & Invoice</span>
                                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover/link:bg-white/20 transition-all">
                                    <ChevronRight size={16} />
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Spendkart Business Health Black Tile widget */}
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-900/15 relative overflow-hidden group">
                         <div className="flex items-center gap-4.5 mb-6">
                            <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                <CheckCircle size={22} className="text-secondary" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-200">Business Health</h4>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Berdasarkan data tagihan lunas</p>
                            </div>
                         </div>
                         <div className="text-4xl font-extrabold text-white tracking-tight mb-2 flex items-baseline gap-1">
                             {stats.totalInvoices > 0 ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) : 0}%
                             <span className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-1">Kolektabilitas</span>
                         </div>
                         <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mb-3">
                              <div 
                                 className="h-full bg-secondary shadow-[0_0_12px_rgba(46,185,255,0.7)] transition-all duration-1000" 
                                 style={{ width: `${stats.totalInvoices > 0 ? (stats.paidInvoices / stats.totalInvoices) * 100 : 0}%` }}
                              ></div>
                         </div>
                         <p className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Perbandingan total invoice lunas vs total terbit</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reusable custom Spendkart card with consistent palette
function SpendkartMetricCard({ title, value, icon, color, trendType, trendValue, subtitle }: { 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    color: string;
    trendType: "up" | "down" | "normal";
    trendValue: string;
    subtitle: string;
}) {
    const isPrimary = color === "primary";
    const isRose = color === "rose";
    const isSecondary = color === "secondary";
    const isAmber = color === "amber";

    // Build colors safe for Tailwind CSS v4 custom theme
    const iconWrapperBg = 
        isPrimary ? "bg-primary/5 text-primary border-primary/15" :
        isRose ? "bg-rose-500/5 text-rose-600 border-rose-500/15" :
        isSecondary ? "bg-secondary/5 text-secondary border-secondary/15" :
        "bg-amber-500/5 text-amber-600 border-amber-500/15";

    const trendBg = 
        trendType === "up" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
        trendType === "down" ? "bg-rose-50 text-rose-600 border-rose-100" :
        "bg-slate-50 text-slate-500 border-slate-150";

    return (
        <motion.div 
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 350 }}
            className="bg-white rounded-[2rem] shadow-[s_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 p-7 flex flex-col justify-between relative overflow-hidden transition-all group"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                    <span className="text-slate-400 text-[10.5px] font-black uppercase tracking-wider">{title}</span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1 truncate max-w-[200px]" title={value}>{value}</h3>
                </div>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-sm ${iconWrapperBg}`}>
                    {React.cloneElement(icon as React.ReactElement, { size: 20, strokeWidth: 2.5 })}
                </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 text-[9px] font-black tracking-wide rounded-md border ${trendBg}`}>
                    {trendValue}
                </span>
                <span className="text-[10px] text-slate-400 font-bold tracking-tight">{subtitle}</span>
            </div>
        </motion.div>
    );
}

function SpendkartSmallStats({ label, value, total }: { label: string; value: number; total: number }) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-wider">{label}</span>
                <span className="text-xs font-black text-white">
                    {value} <span className="text-white/30 text-[9px] font-extrabold uppercase ml-1">/ {total}</span>
                </span>
            </div>
            <div className="w-full h-1.5 bg-black/15 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}

