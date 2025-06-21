import React, { useState } from 'react';
import { authService } from '../../firebase/auth';
import { roleService } from '../../services/roleapi';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('customer');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('auth'); // 'auth' or 'roleValidation'
  const [user, setUser] = useState(null);
  const [existingRole, setExistingRole] = useState(null);

  const roles = [
    {
      value: 'customer',
      label: 'Customer',
      description: 'Browse menus and place orders',
      icon: '🛒',
      color: 'blue'
    },
    {
      value: 'restaurant',
      label: 'Restaurant',
      description: 'Manage menu and restaurant orders',
      icon: '🏪',
      color: 'green'
    },
    {
      value: 'agent',
      label: 'Delivery Agent',
      description: 'Accept and deliver orders',
      icon: '🚗',
      color: 'purple'
    },
    {
      value: 'admin',
      label: 'Administrator',
      description: 'Full system management',
      icon: '⚙️',
      color: 'red'
    }
  ];

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let authenticatedUser;
      
      if (isSignUp) {
        // Sign up new user
        authenticatedUser = await authService.signUp(email, password);
        console.log('✅ New user signed up:', authenticatedUser.email);
        
        // For new users, assign the selected role
        await assignRoleToUser(authenticatedUser, selectedRole);
        
        // Success - proceed to dashboard
        onLoginSuccess(authenticatedUser, { role: selectedRole });
        
      } else {
        // Sign in existing user
        authenticatedUser = await authService.signIn(email, password);
        console.log('✅ User signed in:', authenticatedUser.email);
        
        // Check existing role from backend
        await validateExistingUserRole(authenticatedUser);
      }
      
    } catch (error) {
      console.error('Auth error:', error);
      setError(getErrorMessage(error.code || error.message));
    } finally {
      setLoading(false);
    }
  };

  const assignRoleToUser = async (user, role) => {
    try {
      console.log('🔄 Assigning role to new user:', role);
      
      // Wait a moment for Firebase token to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await roleService.assignRole(user.uid, role);
      console.log('✅ Role assigned successfully:', response);
      
    } catch (error) {
      console.error('❌ Error assigning role:', error);
      // For new users, we'll proceed anyway and let them in
      // The role assignment can be handled later
      console.log('⚠️ Proceeding without backend role assignment');
    }
  };

  const validateExistingUserRole = async (user) => {
    try {
      console.log('🔍 Checking existing user role...');
      
      // Wait a moment for Firebase token to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const roleData = await roleService.getMyRole();
      console.log('✅ Existing role found:', roleData);
      
      setExistingRole(roleData.role);
      setUser(user);
      setStep('roleValidation');
      
    } catch (error) {
      console.error('❌ Error fetching existing role:', error);
      
      if (error.response?.status === 404) {
        // No role found - treat as new user
        console.log('ℹ️ No existing role found, treating as new user');
        setUser(user);
        setStep('roleValidation');
        setExistingRole(null);
      } else {
        // Other error - let them choose role
        console.log('⚠️ Error fetching role, allowing role selection');
        setUser(user);
        setStep('roleValidation');
        setExistingRole(null);
      }
    }
  };

  const handleRoleValidation = async () => {
    setLoading(true);
    setError('');

    try {
      if (existingRole) {
        // Existing user - validate role matches
        if (selectedRole === existingRole) {
          console.log('✅ Role validation successful');
          onLoginSuccess(user, { role: selectedRole });
        } else {
          setError(`Your account is registered as ${existingRole}. Please select the correct role or contact support.`);
        }
      } else {
        // No existing role - assign new role
        await assignRoleToUser(user, selectedRole);
        console.log('✅ New role assigned to existing user');
        onLoginSuccess(user, { role: selectedRole });
      }
    } catch (error) {
      console.error('❌ Role validation error:', error);
      setError('Failed to validate role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const authenticatedUser = await authService.signInWithGoogle();
      console.log('✅ Google sign in successful:', authenticatedUser.email);
      
      // Check if user has existing role
      await validateExistingUserRole(authenticatedUser);
      
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToAuth = () => {
    setStep('auth');
    setUser(null);
    setExistingRole(null);
    setError('');
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled.';
      default:
        return typeof errorCode === 'string' ? errorCode : 'An error occurred. Please try again.';
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50 text-blue-800 ring-blue-500',
      green: 'border-green-200 bg-green-50 text-green-800 ring-green-500',
      purple: 'border-purple-200 bg-purple-50 text-purple-800 ring-purple-500',
      red: 'border-red-200 bg-red-50 text-red-800 ring-red-500'
    };
    return colorMap[color] || colorMap.blue;
  };

  // Role Validation Step
  if (step === 'roleValidation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-lg p-8">
          <div>
            <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {existingRole ? 'Verify Your Role' : 'Select Your Role'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Welcome back, {user?.email}
            </p>
            
            {existingRole && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Your registered role:</strong> {roles.find(r => r.value === existingRole)?.label}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Please select the same role to continue
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {existingRole ? 'Confirm your role' : 'Select your role'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => {
                const isCorrectRole = !existingRole || role.value === existingRole;
                const isSelected = selectedRole === role.value;
                
                return (
                  <div
                    key={role.value}
                    className={`
                      relative cursor-pointer rounded-lg border p-3 flex flex-col items-center text-center transition-all
                      ${!isCorrectRole 
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' 
                        : isSelected 
                          ? `ring-2 ${getColorClasses(role.color)}` 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }
                    `}
                    onClick={() => isCorrectRole && setSelectedRole(role.value)}
                  >
                    <div className="text-2xl mb-1">{role.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{role.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{role.description}</div>
                    {isCorrectRole && (
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={isSelected}
                        onChange={() => setSelectedRole(role.value)}
                        className="absolute top-2 right-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                    )}
                    {existingRole && role.value === existingRole && (
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        ✓ Your Role
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRoleValidation}
              disabled={loading || (existingRole && selectedRole !== existingRole)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validating...
                </div>
              ) : (
                `Continue as ${roles.find(r => r.value === selectedRole)?.label}`
              )}
            </button>
            
            <button
              onClick={handleBackToAuth}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authentication Step (Login/Signup)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-lg p-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Join us today' : 'Welcome back'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleAuthSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Role Selection for Sign Up */}
          {isSignUp && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select your role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <div
                    key={role.value}
                    className={`
                      relative cursor-pointer rounded-lg border p-3 flex flex-col items-center text-center transition-all
                      ${selectedRole === role.value 
                        ? `ring-2 ${getColorClasses(role.color)}` 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }
                    `}
                    onClick={() => setSelectedRole(role.value)}
                  >
                    <div className="text-2xl mb-1">{role.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{role.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{role.description}</div>
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={selectedRole === role.value}
                      onChange={() => setSelectedRole(role.value)}
                      className="absolute top-2 right-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading ? 'Loading...' : `${isSignUp ? 'Sign up' : 'Sign in'}`}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;