import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';

interface Partner {
    id: string;
    name: string;
    profit_percent: number;
    role: string;
}

interface LedgerEntry {
    id: string;
    type: string;
    amount_usd: number;
    created_at: string;
    partner_id: string;
}

const AdminPartnersScreen: React.FC = () => {
    const { userRole } = useAppContext();
    const navigate = useNavigate();

    const [partners, setPartners] = useState<Partner[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userRole !== 'admin') return;

        const fetchData = async () => {
            const { data: partnersData } = await supabase
                .from('partners')
                .select('*')
                .eq('active', true);

            const { data: ledgerData } = await supabase
                .from('partner_ledger')
                .select('*')
                .order('created_at', { ascending: false });

            setPartners(partnersData || []);
            setLedger(ledgerData || []);
            setLoading(false);
        };

        fetchData();
    }, [userRole]);

    if (userRole !== 'admin') {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>No autorizado</p>
            </div>
        );
    }

    if (loading) {
        return <div className="p-10">Cargando...</div>;
    }

    const getBalance = (partnerId: string) => {
        return ledger
            .filter(l => l.partner_id === partnerId)
            .reduce((acc, curr) => acc + Number(curr.amount_usd), 0);
    };

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-black">Balance Socios</h1>

            <div className="grid gap-6">
                {partners.map(p => {
                    const balance = getBalance(p.id);

                    return (
                        <div
                            key={p.id}
                            className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-bold">{p.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {p.role === 'partner'
                                            ? `${p.profit_percent}% participación`
                                            : 'Empleado'}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs uppercase text-slate-400">Balance</p>
                                    <p className={`text-xl font-black ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        ${balance.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div>
                <h2 className="text-lg font-bold mb-4">Historial</h2>

                <div className="space-y-2">
                    {ledger.map(entry => {
                        const partner = partners.find(p => p.id === entry.partner_id);

                        return (
                            <div
                                key={entry.id}
                                className="flex justify-between text-sm p-3 rounded-xl bg-slate-100 dark:bg-slate-800"
                            >
                                <div>
                                    <p className="font-bold">{partner?.name}</p>
                                    <p className="text-xs text-slate-400">{entry.type}</p>
                                </div>
                                <p className={entry.amount_usd >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                                    ${entry.amount_usd}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <button
                onClick={() => navigate('/admin')}
                className="mt-10 px-4 py-2 rounded-xl bg-primary text-white font-bold"
            >
                Volver
            </button>
        </div>
    );
};

export default AdminPartnersScreen;
