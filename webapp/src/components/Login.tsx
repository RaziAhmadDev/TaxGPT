// Signup.tsx
import React, { useState, FC } from 'react';
import axios from 'axios';
import Spinner from './Spinner';
import { useRouter } from 'next/router'

const Login: FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
        email,
        password
      });

      if (response.status === 200) {
        router.push('/chat');
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data.error || 'An unknown error occurred');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-96">
      <h2 className="text-xl font-bold mb-16">Log In</h2>
      {error && <div className="text-red-500">{error}</div>}
      <form onSubmit={handleSignup}>
        <input
          className="mb-2 p-2 border border-gray-300 rounded w-full"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="mb-4 p-2 border border-gray-300 rounded w-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-black text-white p-2 rounded w-full"
          disabled={isLoading}
        >
          {isLoading? <Spinner /> : 'Log In'}
        </button>
      </form>
      <button
        className="mt-4 text-sm text-gray-600"
        onClick={() => {router.push('/signup')}}
        disabled={isLoading}
      >
        Dont have an account? Signup
      </button>
    </div>
  );
};

export default Login;
