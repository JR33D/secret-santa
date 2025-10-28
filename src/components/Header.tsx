'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Header() {
	const { data: session } = useSession();
	const router = useRouter();

	if (!session) {
		return (
			<>
				<div className="flex items-center justify-center gap-3 mb-2">
					<Image src="/images/logo_transparent.png" alt="Logo" width={48} height={48} />
					<h1 className="text-indigo-600 text-4xl font-extrabold">Family Secret Santa</h1>
				</div>
				<p className="text-gray-600 mb-3">Organize your family&apos;s gift exchange with style!</p>
			</>
		);
	}

	const user = session.user as any;

	const handleLogout = async () => {
		await signOut({ redirect: false });
		router.push('/login');
	};

	const handleChangePassword = () => {
		router.push('/change-password');
	};

	return (
		<>
			<div className="flex justify-between items-start mb-2">
				<div>
					<div className="flex items-center gap-3">
						<Image src="/images/logo_transparent.png" alt="Logo" width={64} height={64} />
						<h1 className="text-indigo-600 text-4xl font-extrabold">Family Secret Santa</h1>
					</div>
					<p className="text-gray-600">Organize your family&apos;s gift exchange with style!</p>
				</div>

				<div className="flex items-center gap-3">
					<div className="text-right">
						<div className="text-sm font-semibold text-gray-700">{user.role === 'admin' ? '👑 Admin' : '👤 User'}</div>
						<div className="text-xs text-gray-500">{session.user?.name || user.username}</div>
					</div>

					<div className="flex flex-col gap-1">
						<button onClick={handleChangePassword} className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
							Change Password
						</button>
						<button onClick={handleLogout} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition">
							Logout
						</button>
					</div>
				</div>
			</div>
			<div className="border-b-2 border-gray-200 mb-4"></div>
		</>
	);
}
