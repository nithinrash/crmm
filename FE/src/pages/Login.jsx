import { useState } from 'react';
import { useNavigate } from 'wouter';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users2 } from "lucide-react";

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [, navigate] = useNavigate();
  const { loginMutation } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const user = await loginMutation.mutateAsync({ username, password });

      toast({
        title: "Login successful!",
        description: `Your role is: ${user.role}`,
      });

      if (user.role === 'Sourcing') {
        navigate('/leads');
      } else if (user.role === 'Lead') {
        navigate('/');
      } else if (user.role === 'Sales') {
        navigate('/leads');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
      toast({
        title: "Login failed",
        description: error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
              CRM System
            </h1>
            <p className="mt-2 text-slate-600">
              Manage your leads and sales pipeline efficiently
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Login to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="hidden md:flex flex-col justify-center items-center bg-white rounded-lg p-8">
          <Users2 className="h-24 w-24 text-primary mb-6" />
          <h2 className="text-2xl font-semibold mb-4">Complete CRM Solution</h2>
          <ul className="space-y-2 text-slate-600">
            <li>• Lead Management</li>
            <li>• Sales Pipeline</li>
            <li>• Team Collaboration</li>
            <li>• Task Management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;