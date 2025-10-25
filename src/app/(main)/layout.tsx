import '@/app/globals.css';
import { SessionProvider } from '@/components/SessionProvider';
import Header from '@/components/Header';

export const metadata = {
	title: 'Family Secret Santa',
	description: "Organize your family's gift exchange with style",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="bg-gradient-to-br from-indigo-500 to-purple-700 min-h-screen font-sans p-6">
				<SessionProvider>
					<div className="max-w-6xl mx-auto bg-white rounded-2xl p-8 shadow-xl">
						<Header />
						{children}
					</div>
				</SessionProvider>
			</body>
		</html>
	);
}
