export const metadata = {
  title: "Family Secret Santa",
  description: "Organize your family's gift exchange with style",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="bg-gradient-to-br from-indigo-500 to-purple-700 min-h-screen font-sans p-6">{children}</body>
		</html>
	);
}
