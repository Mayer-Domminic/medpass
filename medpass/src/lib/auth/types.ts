export interface User {
    id: string;
    username: string;
    email: string;
  }
  
  export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
  }
  
  export interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
  }