import React, { createContext, useContext, useState, useEffect } from 'react';
import { PendingApprovalsService } from '../services/leaveService';
import { useAuth } from './AuthContext';
import { MANAGER_DIRECTOR_HR } from '../constants/constant';

const PendingApprovalsContext = createContext(null);

export const usePendingApprovals = () => {
    const context = useContext(PendingApprovalsContext);
    if (!context) {
        throw new Error('usePendingApprovals must be used within a PendingApprovalsProvider');
    }
    return context;
};

export const PendingApprovalsProvider = ({ children }) => {
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchPendingCount = async () => {
        // Only fetch if user is a manager, director, or HR
        if (user && MANAGER_DIRECTOR_HR.includes(user.role)) {
            try {
                const data = await PendingApprovalsService();
                setPendingCount(data.length);
            } catch (err) {
                console.error('Failed to fetch pending approvals count', err);
                setPendingCount(0);
            } finally {
                setLoading(false);
            }
        } else {
            setPendingCount(0);
            setLoading(false);
        }
    };

    // Fetch pending count when component mounts and when user changes
    useEffect(() => {
        if (user) {
            fetchPendingCount();
        }
    }, [user]);

    const value = {
        pendingCount,
        loading,
        fetchPendingCount
    };

    return (
        <PendingApprovalsContext.Provider value={value}>
            {children}
        </PendingApprovalsContext.Provider>
    );
};