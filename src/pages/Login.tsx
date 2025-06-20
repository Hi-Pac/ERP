import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      
      await Swal.fire({
        title: 'Welcome!',
        text: 'Login successful',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials for easy testing
  const useDemoCredentials = (role: 'admin' | 'supervisor' | 'user') => {
    const credentials = {
      admin: { email: 'admin@hcp.com', password: 'admin123' },
      supervisor: { email: 'supervisor@hcp.com', password: 'supervisor123' },
      user: { email: 'user@hcp.com', password: 'user123' }
    };
    
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-full shadow-lg">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">HCP ERP</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to your ERP dashboard</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => useDemoCredentials('admin')}
                  className="w-full text-left justify-start"
                >
                  Admin: admin@hcp.com / admin123
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => useDemoCredentials('supervisor')}
                  className="w-full text-left justify-start"
                >
                  Supervisor: supervisor@hcp.com / supervisor123
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => useDemoCredentials('user')}
                  className="w-full text-left justify-start"
                >
                  User: user@hcp.com / user123
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
