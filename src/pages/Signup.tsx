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

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const { email, password, confirmPassword, displayName } = formData;
    
    if (!email || !password || !confirmPassword || !displayName) {
      setError('Please fill in all fields');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      await signup(formData.email, formData.password, formData.displayName, 'user');
      
      await Swal.fire({
        title: 'Account Created!',
        text: 'Your account has been created successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Account creation failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-gray-600">Join the HCP ERP system</p>
        </div>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your account to get started (Default role: User)
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
                <Label htmlFor="displayName">Full Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                />
                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
