'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const result = await signIn('credentials', {
				username,
				password,
				redirect: false,
			});

			if (result?.error) {
				setError('Invalid username or password');
				setLoading(false);
				return;
			}

			// Redirect to the page they were trying to access, or home
			const callbackUrl = searchParams.get('callbackUrl') || '/home';
			router.push(callbackUrl);
			router.refresh();
		} catch (err) {
			setError('An error occurred. Please try again.');
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center p-6">
			<div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-extrabold text-indigo-600 mb-2">🎅 Secret Santa</h1>
					<p className="text-gray-600">Sign in to continue</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
							Username
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							placeholder="Enter your username"
							required
							autoFocus
						/>
					</div>

					<div>
						<label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							placeholder="Enter your password"
							required
						/>
					</div>

					{error && (
						<div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
							<p className="text-red-700 text-sm">{error}</p>
						</div>
					)}

					<button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
						{loading ? 'Signing in...' : 'Sign In'}
					</button>
				</form>

				<div className="mt-6 text-center text-sm text-gray-500">
					<p>Family Secret Santa • {new Date().getFullYear()}</p>
				</div>
			</div>
		</div>
	);
}
