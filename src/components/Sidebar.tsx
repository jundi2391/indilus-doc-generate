import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
    LayoutDashboard, Users, Building, FileText, ChevronRight, Menu, X, Landmark, 
    Receipt, Truck, Package, Search, Bell, HelpCircle, LogOut, Sun, Moon 
} from "lucide-react";
import { useCompany } from "../CompanyContext";
import { motion, AnimatePresence } from "motion/react";
import { IncoreLogo } from "./IncoreLogo";
import Login from "../pages/Login";

export function Sidebar({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const { companies, activeCompany, setActiveCompanyId, user, logout } = useCompany();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [themeMock, setThemeMock] = React.useState<"light" | "dark">("light");

    if (!user) {
        return <Login />;
    }

    // Dynamic title based on current path
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === "/") return "Dashboard Overview";
        if (path.startsWith("/documents/invoice")) return "Invoices";
        if (path.startsWith("/documents/delivery_order")) return "Delivery Orders";
        if (path.startsWith("/documents/po")) return "Purchase Orders";
        if (path.startsWith("/contacts")) return "Daftar Kontak (Contacts)";
        if (path.startsWith("/products")) return "Katalog Produk (Katalog)";
        if (path.startsWith("/companies")) return "Profil Perusahaan (Companies)";
        return "Sistem Keuangan";
    };

    const getPageSubtitle = () => {
        const path = location.pathname;
        if (path === "/") return "Berikut adalah ringkasan performa finansial dan administrasi bisnis Anda.";
        if (path.startsWith("/documents/invoice")) return "Kelola dan terbitkan tagihan invoice digital untuk rekanan bisnis.";
        if (path.startsWith("/documents/delivery_order")) return "Pantau surat jalan dan status pengiriman barang fisik real-time.";
        if (path.startsWith("/documents/po")) return "Terbitkan purchase order resmi untuk menjaga pasokan logistik.";
        if (path.startsWith("/contacts")) return "Daftar klien, vendor, dan kontak person yang terintegrasi.";
        if (path.startsWith("/products")) return "Data komoditas barang dan layanan jasa yang ditawarkan perusahaan.";
        if (path.startsWith("/companies")) return "Konfigurasi instansi, kop surat, rekening bank, dan data legalitas.";
        return "Aplikasi pencatatan administrasi perusahaan terintegrasi.";
    };

    return (
        <div className="flex h-screen bg-[#F4F7FE] font-sans selection:bg-primary/10 selection:text-primary overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 bg-white flex-col no-print z-50 shrink-0">
                {/* Brand Logo */}
                <div className="h-24 flex items-center px-8 shrink-0">
                    <IncoreLogo />
                </div>

                {/* Business Selector */}
                <div className="px-6 py-4 shrink-0">
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 shadow-sm">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1 mb-2">Unit Bisnis Aktif</label>
                        <div className="relative group">
                            <select 
                                value={activeCompany?.id || ''} 
                                onChange={(e) => setActiveCompanyId(e.target.value)}
                                disabled={user?.role === 'company_admin'}
                                className="disabled:opacity-80 disabled:cursor-not-allowed w-full bg-white border border-slate-200 group-hover:border-primary/30 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none cursor-pointer pr-10 shadow-sm"
                            >
                                {user?.role !== 'company_admin' && <option value="">Semua Perusahaan</option>}
                                {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                        </div>
                    </div>
                </div>
                
                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" active={location.pathname === "/"} color="primary" />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-2">Administrasi</label>
                        <NavItem to="/documents/invoice" icon={<Receipt size={18} />} label="Invoices" active={location.pathname.startsWith("/documents/invoice")} color="primary" />
                        <NavItem to="/documents/delivery_order" icon={<Truck size={18} />} label="Delivery Orders" active={location.pathname.startsWith("/documents/delivery_order")} color="primary" />
                        <NavItem to="/documents/po" icon={<FileText size={18} />} label="Purchase Orders" active={location.pathname.startsWith("/documents/po")} color="primary" />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-2">Master Data</label>
                        <NavItem to="/contacts" icon={<Users size={18} />} label="Daftar Kontak" active={location.pathname.startsWith("/contacts")} color="primary" />
                        <NavItem to="/products" icon={<Package size={18} />} label="Katalog Produk" active={location.pathname.startsWith("/products")} color="primary" />
                        <NavItem to="/companies" icon={<Building size={18} />} label="Profil Perusahaan" active={location.pathname.startsWith("/companies")} color="primary" />
                    </div>
                </nav>

                {/* Bottom Segment with Theme and User Settings */}
                <div className="p-6 border-t border-slate-50 bg-slate-50/30 space-y-5 shrink-0">
                    {/* Sun/Moon Toggle Theme switch exactly like Spendkart */}
                    <div className="flex items-center justify-between bg-slate-100 rounded-full p-1 border border-slate-200/40">
                        <button 
                            onClick={() => setThemeMock("light")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer ${themeMock === "light" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            <Sun size={14} />
                            Light
                        </button>
                        <button 
                            onClick={() => setThemeMock("dark")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer ${themeMock === "dark" ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            <Moon size={14} />
                            Dark
                        </button>
                    </div>

                    {/* Active User Card with Logout button */}
                    <div className="flex items-center justify-between gap-3 px-2">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-full bg-primary text-white shadow-md flex items-center justify-center font-black text-lg border-2 border-white shrink-0">
                                {user?.role === 'super_admin' ? "SA" : (activeCompany?.company_name?.[0] || "A")}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-slate-900 text-sm truncate">{user?.role === 'super_admin' ? "Super Admin" : (activeCompany?.company_name || "Account Admin")}</p>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">{user?.role === 'super_admin' ? "Super Admin" : "Company User"}</p>
                            </div>
                        </div>
                        <button 
                            onClick={logout}
                            title="Log Out dari Sistem"
                            className="p-3 bg-rose-50 hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all cursor-pointer border border-rose-100 shrink-0"
                        >
                            <LogOut size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-150 px-6 flex items-center justify-between z-[60] no-print shadow-sm">
                <IncoreLogo className="scale-90 origin-left" />
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] lg:hidden"
                        />
                        <motion.aside 
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[80] lg:hidden flex flex-col no-print shadow-2xl"
                        >
                            <div className="h-20 flex items-center px-8 border-b border-slate-100 shrink-0">
                                <IncoreLogo className="scale-90 origin-left" />
                            </div>

                            {/* Mobile Business Unit Selector */}
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Unit Bisnis Aktif</label>
                                <div className="relative">
                                    <select 
                                        value={activeCompany?.id || ''} 
                                        onChange={(e) => setActiveCompanyId(e.target.value)}
                                        disabled={user?.role === 'company_admin'}
                                        className="disabled:opacity-85 disabled:cursor-not-allowed w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-[11px] font-bold text-slate-700 outline-none appearance-none cursor-pointer pr-8 shadow-xs"
                                    >
                                        {user?.role !== 'company_admin' && <option value="">Semua Perusahaan</option>}
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                                    </select>
                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-90 pointer-events-none" />
                                </div>
                            </div>

                            <nav className="flex-1 p-6 space-y-4 overflow-y-auto">
                                <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" active={location.pathname === "/"} color="primary" onClick={() => setIsMobileMenuOpen(false)} />
                                <NavItem to="/documents/invoice" icon={<Receipt size={18} />} label="Invoices" active={location.pathname.startsWith("/documents/invoice")} color="primary" onClick={() => setIsMobileMenuOpen(false)} />
                                <NavItem to="/documents/delivery_order" icon={<Truck size={18} />} label="Delivery Orders" active={location.pathname.startsWith("/documents/delivery_order")} color="primary" onClick={() => setIsMobileMenuOpen(false)} />
                                <NavItem to="/documents/po" icon={<FileText size={18} />} label="Purchase Orders" active={location.pathname.startsWith("/documents/po")} color="primary" onClick={() => setIsMobileMenuOpen(false)} />
                                <NavItem to="/contacts" icon={<Users size={18} />} label="Daftar Kontak" active={location.pathname.startsWith("/contacts")} color="primary" onClick={() => setIsMobileMenuOpen(false)} />
                                <NavItem to="/products" icon={<Package size={18} />} label="Katalog Produk" active={location.pathname.startsWith("/products")} color="primary" onClick={() => setIsMobileMenuOpen(false)} />
                                <NavItem to="/companies" icon={<Building size={18} />} label="Profil Perusahaan" active={location.pathname.startsWith("/companies")} color="primary" onClick={() => setIsMobileMenuOpen(false)} />
                            </nav>
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                        {user?.role === 'super_admin' ? "SA" : (activeCompany?.company_name?.[0] || "A")}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-extrabold text-slate-800 text-xs truncate leading-snug">{user?.role === 'super_admin' ? "Super Admin" : (activeCompany?.company_name || "Admin")}</p>
                                        <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider leading-none mt-0.5">{user?.role === 'super_admin' ? "Super Admin" : "Company"}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsMobileMenuOpen(false); logout(); }} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors cursor-pointer border border-rose-100">
                                    <LogOut size={14} />
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0 overflow-hidden relative">
                
                {/* Sticky Header exactly like Spendkart */}
                <header className="hidden lg:flex items-center justify-between px-10 py-6 border-b border-slate-150 bg-[#F4F7FE] no-print shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">
                            {getPageTitle()}
                        </h1>
                        <p className="text-slate-400 text-xs font-semibold">{getPageSubtitle()}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Bar Button */}
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search everything..." 
                                className="pl-11 pr-4 py-2.5 bg-white border border-slate-200/60 rounded-full text-xs font-medium w-64 focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 shadow-sm transition-all text-slate-800"
                            />
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {/* Notification Bell option */}
                        <button className="w-10 h-10 bg-white rounded-full border border-slate-200/60 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all cursor-pointer relative">
                            <Bell size={18} />
                            <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full"></span>
                        </button>

                        {/* Active User Widget Pill */}
                        <div className="flex items-center gap-3.5 bg-white border border-slate-200/60 shadow-sm rounded-full pl-3 pr-4 py-1">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase border border-primary/20">
                                {user?.role === 'super_admin' ? "SA" : (activeCompany?.company_name?.[0] || "A")}
                            </div>
                            <div className="leading-tight">
                                <div className="text-xs font-black text-slate-800 tracking-tight">{user?.role === 'super_admin' ? "Super Admin" : (activeCompany?.company_name || "Account Admin")}</div>
                                <div className="text-[9px] text-slate-450 font-bold tracking-wider">{user?.role === 'super_admin' ? "admin@indilus.pro" : (activeCompany?.email || "company@admin.com")}</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Subcontainer for children */}
                <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ to, icon, label, active, color = "primary", onClick }: { to: string; icon: React.ReactNode; label: string; active: boolean; color?: string; onClick?: () => void }) {
    return (
        <Link 
            to={to} 
            onClick={onClick}
            className={`flex items-center justify-between group px-5 py-3.5 rounded-[1rem] transition-all duration-300 border-l-[3.5px] ${
                active 
                    ? "bg-primary/5 text-primary border-primary font-extrabold shadow-[s_8px_30px_rgb(0,0,0,0.01)]" 
                    : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-800"
            }`}
        >
            <div className="flex items-center gap-4.5">
                <span className={`${active ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`}>{icon}</span>
                <span className="text-[13px] font-bold tracking-normal">{label}</span>
            </div>
            {active && <ChevronRight size={14} className="text-primary/70" />}
        </Link>
    );
}

