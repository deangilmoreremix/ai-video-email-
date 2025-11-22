import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

export interface Contact {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  tags?: string[];
  custom_fields?: Record<string, string>;
  created_at?: string;
  user_id?: string;
}

export async function importContactsFromCSV(file: File): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  return new Promise((resolve) => {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          resolve({ success: 0, failed: results.data.length, errors: ['User not authenticated'] });
          return;
        }

        for (const row of results.data as Record<string, string>[]) {
          try {
            const contact: Contact = {
              email: row.email || row.Email || row.EMAIL,
              first_name: row.first_name || row['First Name'] || row.firstName || '',
              last_name: row.last_name || row['Last Name'] || row.lastName || '',
              company: row.company || row.Company || '',
              phone: row.phone || row.Phone || '',
              tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
              user_id: user.id,
            };

            if (!contact.email) {
              errors.push(`Row missing email: ${JSON.stringify(row)}`);
              failed++;
              continue;
            }

            const { error } = await supabase
              .from('contacts')
              .insert(contact);

            if (error) {
              errors.push(`Failed to import ${contact.email}: ${error.message}`);
              failed++;
            } else {
              success++;
            }
          } catch (error: any) {
            errors.push(`Error processing row: ${error.message}`);
            failed++;
          }
        }

        resolve({ success, failed, errors });
      },
      error: (error) => {
        resolve({ success: 0, failed: 0, errors: [error.message] });
      },
    });
  });
}

export async function exportContactsToCSV(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }

  const csv = Papa.unparse(contacts || []);
  return csv;
}

export function downloadCSV(csv: string, filename: string = 'contacts.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export async function getContacts(): Promise<Contact[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return contacts || [];
}

export async function addContact(contact: Contact): Promise<Contact> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({ ...contact, user_id: user.id })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .update(contact)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export async function searchContacts(query: string): Promise<Contact[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
    .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,company.ilike.%${query}%`);

  if (error) {
    throw error;
  }

  return contacts || [];
}
