import { renderEmailTemplate, getEmailSubject, getEmailHtml, loadEmailTemplate } from '@/lib/email-templates';

describe('Email templates', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('replaces variables in template strings', () => {
    const tpl = 'Hello {{name}}! Your code is {{code}}.';
    const out = renderEmailTemplate(tpl, { name: 'Alice', code: '1234' });
    expect(out).toBe('Hello Alice! Your code is 1234.');
  });

  it('replaces provided variables correctly (including "0")', () => {
    const tpl = 'Count: {{count}}; Note: {{note}}';
    const out = renderEmailTemplate(tpl, { count: '0', note: '' });
    // '0' is a non-empty string and will be preserved by the implementation
    expect(out).toBe('Count: 0; Note: ');
  });

  it('builds subject strings with variables', () => {
    const subj = getEmailSubject('assignment-notification', { year: '2024', giver_name: 'Alice' });
    expect(subj).toContain('Secret Santa 2024');
    expect(subj).toContain('Alice');
  });

  it('loads and renders an actual template file and includes domain link', () => {
    // Ensure DOMAIN is set so the template link is rendered
    process.env.DOMAIN = 'http://localhost:3000';

    const html = getEmailHtml('user-created', {
      person_name: 'Test Person',
      username: 'tester',
      temp_password: 'pw123',
      domain: process.env.DOMAIN ?? '',
    });

    expect(html).toContain('Test Person');
    expect(html).toContain('tester');
    expect(html).toContain('Open the Secret Santa website');
    expect(html).toContain('http://localhost:3000');
  });

  it('replaces multiple occurrences of the same variable', () => {
    const tpl = '{{a}}-{{a}}-{{b}}';
    const out = renderEmailTemplate(tpl, { a: 'X', b: 'Y' });
    expect(out).toBe('X-X-Y');
  });

  it('throws when loading a non-existent template', () => {
    expect(() => loadEmailTemplate('__this-template-does-not-exist__')).toThrow(/Email template not found/);
  });

  it('returns a default subject when template name is unknown', () => {
    const subj = getEmailSubject('not-a-real-template', { foo: 'bar' });
    expect(subj).toBe('Secret Santa Notification');
  });
});
