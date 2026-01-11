import { createContext } from 'react';

const AuthContext = createContext({
  user: null,
  loading: true,
  refreshSession: async () => {},
});

export default AuthContext;