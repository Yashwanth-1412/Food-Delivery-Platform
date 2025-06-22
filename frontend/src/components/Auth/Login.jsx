// Enhanced Login.jsx with artistic left side
import React, { useState, useEffect } from 'react';
import { authService } from '../../firebase/auth';
import { roleService } from '../../services/roleapi';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('customer');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('auth');
  const [user, setUser] = useState(null);
  const [existingRole, setExistingRole] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const foodImages = [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&h=600&fit=crop&crop=center",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % foodImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [foodImages.length]);

  // All the handler functions remain the same...
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let authenticatedUser;
      
      if (isSignUp) {
        authenticatedUser = await authService.signUp(email, password);
        await assignRoleToUser(authenticatedUser, selectedRole);
        onLoginSuccess(authenticatedUser, { role: selectedRole });
      } else {
        authenticatedUser = await authService.signIn(email, password);
        await validateExistingUserRole(authenticatedUser);
      }
    } catch (error) {
      setError(getErrorMessage(error.code || error.message));
    } finally {
      setLoading(false);
    }
  };

  const assignRoleToUser = async (user, role) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await roleService.assignRole(user.uid, role);
    } catch (error) {
      console.error('❌ Error assigning role:', error);
    }
  };

  const validateExistingUserRole = async (user) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const roleData = await roleService.getMyRole();
      setExistingRole(roleData.role);
      setUser(user);
      setStep('roleValidation');
    } catch (error) {
      setUser(user);
      setStep('roleValidation');
      setExistingRole(null);
    }
  };

  const handleRoleValidation = async () => {
    setLoading(true);
    setError('');

    try {
      if (existingRole) {
        if (selectedRole === existingRole) {
          onLoginSuccess(user, { role: selectedRole });
        } else {
          setError(`Your account is registered as ${existingRole}. Please select the correct role.`);
        }
      } else {
        await assignRoleToUser(user, selectedRole);
        onLoginSuccess(user, { role: selectedRole });
      }
    } catch (error) {
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
      await validateExistingUserRole(authenticatedUser);
    } catch (error) {
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
    const messages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    };
    return messages[errorCode] || 'An error occurred. Please try again.';
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    try {
      await authService.sendPasswordResetEmail(email);
      alert('Password reset email sent! Check your inbox.');
    } catch (error) {
      setError(error.message);
    }
  };

  // Role Validation Step
  if (step === 'roleValidation') {
    return (
      <div className="min-h-screen flex">
        {/* Enhanced Left Side - Role Validation */}
        <div className="w-1/2 relative overflow-hidden">
          {/* Food-themed Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/80 via-red-900/80 to-yellow-900/80">
            {/* Food-themed Floating Elements */}
            <div className="absolute inset-0">
              <div className="absolute top-20 left-20 w-32 h-32 bg-orange-400 bg-opacity-20 rounded-full animate-pulse"></div>
              <div className="absolute top-40 right-32 w-24 h-24 bg-red-400 bg-opacity-20 rounded-full animate-bounce delay-1000"></div>
              <div className="absolute bottom-32 left-32 w-20 h-20 bg-yellow-400 bg-opacity-20 rounded-full animate-ping delay-2000"></div>
              <div className="absolute bottom-40 right-20 w-16 h-16 bg-orange-300 bg-opacity-30 rounded-full animate-pulse delay-3000"></div>
            </div>
            
            {/* Warm Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-black/40"></div>
          </div>

          {/* Content Container */}
          <div className="relative z-10 h-full flex items-center justify-center p-12">
            <div className="max-w-md w-full">
              {/* Glass Card with Warm Theme */}
              <div className="backdrop-blur-xl bg-black/20 border border-white/30 rounded-3xl p-8 shadow-2xl">
                {/* Header with Logo */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl mb-4 shadow-lg">
                    <span className="text-3xl">🍽️</span>
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Role Selection</h1>
                  <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-red-600 mx-auto rounded-full"></div>
                </div>

                {/* Welcome Message */}
                <div className="text-center mb-6">
                  <p className="text-white/90 text-lg">Welcome back!</p>
                  <p className="text-white/70 text-sm">{user?.email}</p>
                  
                  {existingRole && (
                    <div className="mt-4 p-4 bg-orange-500/20 rounded-xl border border-orange-400/30">
                      <p className="text-orange-200 text-sm">
                        <strong>Your registered role:</strong> {roles.find(r => r.value === existingRole)?.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-600/20 rounded-xl border border-red-500/30">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                {/* Role Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {roles.map((role) => {
                    const isCorrectRole = !existingRole || role.value === existingRole;
                    const isSelected = selectedRole === role.value;
                    
                    return (
                      <div
                        key={role.value}
                        className={`
                          relative cursor-pointer rounded-xl p-4 text-center transition-all duration-300 transform hover:scale-105
                          ${!isCorrectRole 
                            ? 'bg-white/5 border border-white/10 opacity-50 cursor-not-allowed' 
                            : isSelected 
                              ? 'bg-gradient-to-br from-orange-500/30 to-red-600/30 border border-orange-400/60 shadow-lg' 
                              : 'bg-black/20 border border-white/30 hover:bg-black/30'
                          }
                        `}
                        onClick={() => isCorrectRole && setSelectedRole(role.value)}
                      >
                        <div className="text-2xl mb-2">{role.icon}</div>
                        <div className="text-white text-sm font-medium">{role.label}</div>
                        <div className="text-white/70 text-xs mt-1">{role.description}</div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleRoleValidation}
                    disabled={loading || (existingRole && selectedRole !== existingRole)}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Validating...
                      </span>
                    ) : (
                      `Continue as ${roles.find(r => r.value === selectedRole)?.label}`
                    )}
                  </button>
                  
                  <button
                    onClick={handleBackToAuth}
                    className="w-full bg-black/30 hover:bg-black/40 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm border border-white/20"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side remains the same */}
        <div className="w-1/2 relative overflow-hidden">
          <div className="absolute inset-0">
            {foodImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img src={image} alt={`Food ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"></div>
          <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-12">
            <div className="text-white">
              <h2 className="text-5xl font-bold mb-4 leading-tight drop-shadow-lg">Role Selection</h2>
              <p className="text-xl mb-8 text-gray-200 max-w-md drop-shadow-md">Choose your role to access the platform</p>
            </div>
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {foodImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'bg-white scale-125' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Authentication Step (Login/Signup)
  return (
    <div className="min-h-screen flex">
      {/* Enhanced Left Side - Authentication */}
      <div className="w-55/100 relative overflow-hidden">
        {/* Food-themed Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
          {/* Food-themed Floating Elements */}
          <div className="absolute inset-0">
            {/* Large floating elements with food theme */}
            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-to-r from-orange-400/20 to-red-500/20 rounded-full animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-32 h-32 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full animate-bounce delay-1000"></div>
            <div className="absolute top-1/2 left-1/6 w-24 h-24 bg-gradient-to-r from-red-400/20 to-orange-500/20 rounded-full animate-ping delay-2000"></div>
            
            {/* Small floating particles */}
            <div className="absolute top-20 right-20 w-8 h-8 bg-orange-300/20 rounded-full animate-pulse delay-500"></div>
            <div className="absolute top-60 left-16 w-6 h-6 bg-red-300/20 rounded-full animate-bounce delay-1500"></div>
            <div className="absolute bottom-40 right-32 w-10 h-10 bg-yellow-400/20 rounded-full animate-ping delay-3000"></div>
            <div className="absolute bottom-20 left-20 w-4 h-4 bg-orange-400/30 rounded-full animate-pulse delay-2500"></div>
          </div>
          
          {/* Warm Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-orange-500/5 to-transparent"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 h-full flex items-center justify-center p-8">
          <div className="max-w-xl w-full">
            {/* Glass Card with Warm Theme */}
            <div className="backdrop-blur-xl bg-black/20 border border-white/30 rounded-3xl p-8 shadow-2xl min-h-[600px]">
              {/* Header with Enhanced Logo */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl">🍽️</span>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                  {isSignUp ? 'Join Us' : 'Welcome Back'}
                </h1>
                <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-red-600 mx-auto rounded-full mb-4"></div>
                <p className="text-white/80 text-lg">
                  {isSignUp ? 'Create your food delivery account' : 'Sign in to continue your journey'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-600/20 rounded-xl border border-red-500/30 backdrop-blur-sm">
                  <p className="text-red-200 text-sm flex items-center">
                    <span className="mr-2">⚠️</span>
                    {error}
                  </p>
                </div>
              )}

              {/* Form */}
              <form className="space-y-6" onSubmit={handleAuthSubmit}>
                {/* Role Selection for Sign Up */}
                {isSignUp && (
                  <div className="space-y-4">
                    <label className="block text-white/90 text-sm font-medium">
                      Choose your role
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {roles.map((role) => (
                        <div
                          key={role.value}
                          className={`
                            relative cursor-pointer rounded-xl p-3 text-center transition-all duration-300 transform hover:scale-105
                            ${selectedRole === role.value 
                              ? 'bg-gradient-to-br from-orange-400/30 to-pink-500/30 border border-orange-400/60 shadow-lg' 
                              : 'bg-white/10 border border-white/20 hover:bg-white/20'
                            }
                          `}
                          onClick={() => setSelectedRole(role.value)}
                        >
                          <div className="text-xl mb-1">{role.icon}</div>
                          <div className="text-white text-xs font-medium">{role.label}</div>
                          <div className="text-white/70 text-xs mt-1">{role.description}</div>
                          {selectedRole === role.value && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-4 bg-black/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>

                {/* Password Input */}
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-4 bg-black/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>

                {/* Forgot Password */}
                {!isSignUp && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-orange-300 hover:text-orange-200 text-sm font-medium transition-colors duration-300"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white py-4 px-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <span className="ml-2">→</span>
                    </span>
                  )}
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/30" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-white/70">or continue with</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center px-4 py-4 bg-black/20 border border-white/30 rounded-xl hover:bg-black/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-white font-medium">Continue with Google</span>
                </button>

                {/* Toggle Sign Up/In */}
                <div className="text-center">
                  <p className="text-white/70">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                      }}
                      className="text-orange-300 hover:text-orange-200 font-medium transition-colors duration-300 underline underline-offset-2"
                    >
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Sliding Images (remains the same) */}
      <div className="w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          {foodImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img src={image} alt={`Food ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"></div>
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-12">
          <div className="text-white">
            <h2 className="text-5xl font-bold mb-4 leading-tight drop-shadow-lg">Delicious Food</h2>
            <p className="text-xl mb-8 text-gray-200 max-w-md drop-shadow-md">Delivered Fresh to Your Door</p>
          </div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {foodImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentImageIndex ? 'bg-white scale-125' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;