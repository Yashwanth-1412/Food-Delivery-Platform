import React, { useState, useEffect } from 'react';
import { authService } from './firebase/auth';
import { roleService } from './services/roleApi';
import Login from './components/Auth/Login';
import LoadingScreen from './components/common/LoadingScreen';
import RoleBasedRouter from './components/Router/RoleBasedRouter';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load cached role from localStorage
  useEffect(() => {
    const cachedRole = localStorage.getItem('userRole');
    if (cachedRole) {
      try {
        setUserRole(JSON.parse(cachedRole));
        console.log('📋 Loaded cached role:', JSON.parse(cachedRole));
      } catch (error) {
        console.error('❌ Error parsing cached role:', error);
        localStorage.removeItem('userRole');
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      try {
        setLoading(true);
        setError(null);
        
        if (firebaseUser) {
          console.log('🔍 User authenticated, fetching role...');
          setUser(firebaseUser);
          
          // Check if we already have cached role for this user
          const cachedRole = localStorage.getItem('userRole');
          const cachedUserId = localStorage.getItem('userId');
          
          if (cachedRole && cachedUserId === firebaseUser.uid) {
            try {
              const parsedRole = JSON.parse(cachedRole);
              console.log('✅ Using cached role:', parsedRole);
              setUserRole(parsedRole);
              setLoading(false);
              return;
            } catch (error) {
              console.error('❌ Invalid cached role, fetching fresh:', error);
              localStorage.removeItem('userRole');
              localStorage.removeItem('userId');
            }
          }
          
          try {
            // Fetch user role from backend
            const roleData = await roleService.getMyRole();
            
            console.log('✅ User role fetched:', roleData);
            const roleInfo = { role: roleData.role, ...roleData };
            setUserRole(roleInfo);
            
            // Cache the role and user ID
            localStorage.setItem('userRole', JSON.stringify(roleInfo));
            localStorage.setItem('userId', firebaseUser.uid);
          } catch (roleError) {
            console.error('❌ Error fetching user role:', roleError);
            
            // Handle specific error cases
            if (roleError.response?.status === 404) {
              console.log('👤 User has no role assigned yet');
              setUserRole({ role: null }); // User exists but no role
            } else {
              console.error('🚨 Role fetch failed:', roleError.message);
              setError('Failed to load user role. Please try refreshing.');
            }
          }
        } else {
          console.log('👋 User not authenticated');
          setUser(null);
          setUserRole(null);
          // Clear cached data on logout
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
        }
      } catch (error) {
        console.error('🚨 Auth state change error:', error);
        setError('Authentication error. Please try again.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginWithRole = async (user, roleData) => {
    console.log('✅ User logged in with role:', roleData.role);
    setUser(user);
    setUserRole(roleData);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setUserRole(null);
      setError(null);
      // Clear cached data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      console.log('👋 User logged out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    window.location.reload();
  };

  // Handle loading state
  if (loading) {
    return (
      <LoadingScreen 
        message={
          user ? "Loading your dashboard..." : "Checking authentication..."
        } 
      />
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={handleLogout}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (!user) {
    return <Login onLoginSuccess={handleLoginWithRole} />;
  }

  // Handle authenticated user with role-based routing
  return (
    <RoleBasedRouter 
      user={user} 
      userRole={userRole}
      onLogout={handleLogout}
      error={error}
    />
  );
}

export default App;