import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: number;
    phone: string;
    fullname: string | null;
    avatar: string | null;
    role: 'manager' | 'user';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    role: 'manager' | 'user' | null;
    login: (token: string, role: 'manager' | 'user', userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [role, setRole] = useState<'manager' | 'user' | null>(null);

    useEffect(() => {
        // Check localStorage on mount
        const storedToken = localStorage.getItem('token');
        const storedRole = localStorage.getItem('role') as 'manager' | 'user' | null;
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedRole && storedUser) {
            setToken(storedToken);
            setRole(storedRole);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (newToken: string, newRole: 'manager' | 'user', userData: User) => {
        setToken(newToken);
        setRole(newRole);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('role', newRole);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setRole(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, role, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
