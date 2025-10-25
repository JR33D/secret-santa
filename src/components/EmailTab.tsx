'use client';
import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export default function EmailTab() {
	const [smtpServer, setSmtpServer] = useState('');
	const [smtpPort, setSmtpPort] = useState<number>(587);
	const [smtpUsername, setSmtpUsername] = useState('');
	const [smtpPassword, setSmtpPassword] = useState('');
	const [fromEmail, setFromEmail] = useState('');

	useEffect(() => {
		load();
	}, []);

	async function load() {
		const cfg = await apiGet<any>('/api/email-config');
		setSmtpServer(cfg.smtp_server || '');
		setSmtpPort(cfg.smtp_port || 587);
		setSmtpUsername(cfg.smtp_username || '');
		setFromEmail(cfg.from_email || '');
	}

	async function save() {
		try {
			await apiPost('/api/email-config', {
				smtp_server: smtpServer,
				smtp_port: smtpPort,
				smtp_username: smtpUsername,
				smtp_password: smtpPassword,
				from_email: fromEmail,
			});
			alert('Email configuration saved!');
		} catch (error: any) {
			alert(error.message || 'Failed to save email configuration');
		}
	}

	return (
		<div>
			<h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">Email Configuration</h2>
			<p className="mb-4 text-sm text-gray-700">This deployment manages SMTP configuration via environment variables. Fields are read-only. To change settings update container environment / secrets and redeploy.</p>
			<div className="grid md:grid-cols-2 gap-4">
				<div>
					<label htmlFor="smtp-server-input" className="font-semibold block mb-1">
						SMTP Server
					</label>
					<input id="smtp-server-input" className="w-full p-2 border rounded bg-gray-100" value={smtpServer} readOnly />
				</div>
				<div>
					<label htmlFor="smtp-port-input" className="font-semibold block mb-1">
						SMTP Port
					</label>
					<input id="smtp-port-input" type="number" className="w-full p-2 border rounded bg-gray-100" value={smtpPort} readOnly />
				</div>
				<div>
					<label htmlFor="smtp-username-input" className="font-semibold block mb-1">
						Username
					</label>
					<input id="smtp-username-input" className="w-full p-2 border rounded bg-gray-100" value={smtpUsername} readOnly />
				</div>
				<div>
					<label htmlFor="smtp-password-input" className="font-semibold block mb-1">
						Password
					</label>
					<input id="smtp-password-input" type="password" className="w-full p-2 border rounded bg-gray-100" value={smtpPassword} readOnly />
				</div>
				<div>
					<label htmlFor="smtp-from-email-input" className="font-semibold block mb-1">
						From Email
					</label>
					<input id="smtp-from-email-input" className="w-full p-2 border rounded bg-gray-100" value={fromEmail} readOnly />
				</div>
			</div>
		</div>
	);
}
