import React, { createContext, useState, useEffect } from "react";
import { saveToken, getToken, deleteToken } from "../utils/secureStore";
import { apiService } from "../services/api";
import { socketService } from "../services/socket";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState();
  const [token, setToken] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await getToken("jwt");
        if (storedToken) {
          setToken(storedToken);
          apiService.setToken(storedToken);
          
          // validate the token and get user info
          try {
            const currentUser = await apiService.getCurrentUser();
            setUser(currentUser);
            
            // Connecting to socket with a valid token
            await socketService.connect();
            socketService.registerUser(currentUser._id);
          } catch (validationError) {
            // If token is invalid, clear it
            await deleteToken("jwt");
            setToken(null);
            apiService.setToken(null);
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiService.login({ email, password });
      setUser(data.user);
      setToken(data.token);
      apiService.setToken(data.token);
      await saveToken("jwt", data.token);

      // Register user with socket
      await socketService.connect();
      socketService.registerUser(data.user._id);
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await apiService.register({ name, email, password });
      setUser(data.user);
      setToken(data.token);
      apiService.setToken(data.token);
      await saveToken("jwt", data.token);
      
      // Register user with socket
      await socketService.connect();
      socketService.registerUser(data.user._id);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    apiService.setToken(null);
    socketService.disconnect();
    await deleteToken("jwt");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
