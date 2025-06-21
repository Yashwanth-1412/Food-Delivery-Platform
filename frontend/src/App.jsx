import React, { useState, useEffect } from 'react';
import { authService } from './firebase/auth';
import Login from './components/Auth/Login';
import LoadingScreen from './components/common/LoadingScreen';
import RoleBasedRouter from './components/Router/RoleBasedRouter';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Keep the role if it was already set during login
        if (!userRole) {
          // If no role is set, user needs to login again with role selection
          console.log('🔍 User authenticated but no role selected');
        }
      } else {
        console.log('👤 User not authenticated');
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole]);

  const handleLoginWithRole = (user, roleData) => {
    console.log('✅ User logged in with role:', roleData.role);
    setUser(user);
    setUserRole(roleData);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle loading state
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // Handle unauthenticated state or no role selected
  if (!user || !userRole) {
    return <Login onLoginSuccess={handleLoginWithRole} />;
  }

  // Handle authenticated user with role-based routing
  return (
    <RoleBasedRouter 
      user={user} 
      userRole={userRole}
      onLogout={handleLogout}
    />
  );
}

export default App;