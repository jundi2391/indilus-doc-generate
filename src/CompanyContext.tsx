import React, { createContext, useContext, useState, useEffect } from 'react';
import { DatabaseCompany } from './types';
import { getCompanies } from './dbService';

interface CompanyContextType {
    activeCompany: DatabaseCompany | null;
    setActiveCompanyId: (id: string) => void;
    companies: DatabaseCompany[];
    refreshCompanies: () => Promise<void>;
    isLoading: boolean;
    user: { role: 'super_admin' | 'company_admin'; username: string; companyId?: string } | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const [companies, setCompanies] = useState<DatabaseCompany[]>([]);
    const [user, setUser] = useState<{ role: 'super_admin' | 'company_admin'; username: string; companyId?: string } | null>(() => {
        const saved = localStorage.getItem('app_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
        const savedUser = localStorage.getItem('app_user');
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed.role === 'company_admin') {
                return parsed.companyId || '';
            }
        }
        return localStorage.getItem('active_company_id') || '';
    });
    const [isLoading, setIsLoading] = useState(true);

    const refreshCompanies = async () => {
        const data = await getCompanies();
        setCompanies(data as DatabaseCompany[]);
        setIsLoading(false);
    };

    useEffect(() => {
        refreshCompanies();
    }, []);

    useEffect(() => {
        if (user?.role === 'company_admin' && user.companyId) {
            setActiveCompanyId(user.companyId);
        }
    }, [user]);

    useEffect(() => {
        if (activeCompanyId) {
            localStorage.setItem('active_company_id', activeCompanyId);
        } else {
            localStorage.removeItem('active_company_id');
        }
    }, [activeCompanyId]);

    const login = async (usernameInput: string, passwordInput: string): Promise<boolean> => {
        const normUser = usernameInput.trim().toLowerCase();
        
        // 1. Check Super Admin Credentials
        if (normUser === 'admin' && passwordInput === 'Indilus@2026') {
            const superUser = { role: 'super_admin' as const, username: 'admin' };
            setUser(superUser);
            localStorage.setItem('app_user', JSON.stringify(superUser));
            return true;
        }

        // 2. Fetch fresh companies to ensure correct credentials checking
        const freshCompanies = (await getCompanies()) as DatabaseCompany[];
        setCompanies(freshCompanies);
        
        // 3. Find matching company credentials
        const matchedComp = freshCompanies.find(c => {
            const compUsername = c.username ? c.username.trim().toLowerCase() : '';
            return compUsername && compUsername === normUser && c.password === passwordInput;
        });

        if (matchedComp && matchedComp.id) {
            const companyUser = { 
                role: 'company_admin' as const, 
                username: matchedComp.username || matchedComp.company_name, 
                companyId: matchedComp.id 
            };
            setUser(companyUser);
            setActiveCompanyId(matchedComp.id);
            localStorage.setItem('app_user', JSON.stringify(companyUser));
            localStorage.setItem('active_company_id', matchedComp.id);
            return true;
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        setActiveCompanyId('');
        localStorage.removeItem('app_user');
        localStorage.removeItem('active_company_id');
    };

    const activeCompany = companies.find(c => c.id === activeCompanyId) || null;

    const handleSetActiveCompanyId = (id: string) => {
        // Prevent manual override for company_admin
        if (user?.role === 'company_admin') {
            return;
        }
        setActiveCompanyId(id);
    };

    return (
        <CompanyContext.Provider value={{ 
            activeCompany, 
            setActiveCompanyId: handleSetActiveCompanyId, 
            companies, 
            refreshCompanies,
            isLoading,
            user,
            login,
            logout
        }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
}
