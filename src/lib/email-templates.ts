import fs from 'fs';
import path from 'path';

/**
 * Load an email template from the email-templates directory
 */
export function loadEmailTemplate(templateName: string): string {
  const templatePath = path.join(process.cwd(), 'email-templates', `${templateName}.html`);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templateName}`);
  }
  
  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Replace variables in template with actual values
 * Variables are in the format {{variable_name}}
 */
export function renderEmailTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }
  
  return rendered;
}

/**
 * Load and render an email template in one step
 */
export function getEmailHtml(templateName: string, variables: Record<string, string>): string {
  const template = loadEmailTemplate(templateName);
  return renderEmailTemplate(template, variables);
}

/**
 * Get email subject for a template (with variable substitution)
 */
export function getEmailSubject(templateName: string, variables: Record<string, string>): string {
  const subjects: Record<string, string> = {
    'user-created': 'Your Secret Santa Account - Login Credentials',
    'password-reset': 'Secret Santa - New Temporary Password',
    'assignment-notification': 'Secret Santa {{year}} - Assignment for {{giver_name}}'
  };
  
  let subject = subjects[templateName] || 'Secret Santa Notification';
  
  // Replace variables in subject
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value || '');
  }
  
  return subject;
}