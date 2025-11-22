import React, { useState, useEffect } from 'react';
import {
  Contact,
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  searchContacts,
  importContactsFromCSV,
  exportContactsToCSV,
  downloadCSV,
} from '../services/contactService';

interface ContactManagerProps {
  onClose: () => void;
  onSelectContact?: (contact: Contact) => void;
}

export const ContactManager: React.FC<ContactManagerProps> = ({ onClose, onSelectContact }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const [formData, setFormData] = useState<Partial<Contact>>({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    phone: '',
    tags: [],
  });

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await getContacts();
      setContacts(data);
      setFilteredContacts(data);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const results = await searchContacts(searchQuery);
      setFilteredContacts(results);
    } catch (error: any) {
      console.error('Error searching contacts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingContact) {
        await updateContact(editingContact.id!, formData);
      } else {
        await addContact(formData as Contact);
      }
      await loadContacts();
      setShowAddModal(false);
      setEditingContact(null);
      setFormData({ email: '', first_name: '', last_name: '', company: '', phone: '', tags: [] });
    } catch (error: any) {
      console.error('Error saving contact:', error);
      alert(error.message);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData(contact);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      await deleteContact(id);
      await loadContacts();
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      alert(error.message);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const result = await importContactsFromCSV(file);
      setImportResult(result);
      await loadContacts();
    } catch (error: any) {
      console.error('Error importing contacts:', error);
      alert(error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const csv = await exportContactsToCSV();
      downloadCSV(csv, `contacts-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error: any) {
      console.error('Error exporting contacts:', error);
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Contact Manager</h2>
            <p className="text-gray-400 text-sm mt-1">{contacts.length} contacts</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 border-b border-gray-700">
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Contact
            </button>
            <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors cursor-pointer">
              {importing ? 'Importing...' : 'Import CSV'}
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                disabled={importing}
              />
            </label>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Export CSV
            </button>
          </div>

          {importResult && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <p className="text-white font-medium">Import Complete</p>
              <p className="text-green-400">Success: {importResult.success}</p>
              <p className="text-red-400">Failed: {importResult.failed}</p>
              {importResult.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-gray-400 cursor-pointer">View Errors</summary>
                  <ul className="mt-2 text-sm text-red-400">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No contacts found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      <p className="text-gray-400 text-sm">{contact.email}</p>
                    </div>
                  </div>

                  {contact.company && (
                    <p className="text-gray-400 text-sm mt-2">{contact.company}</p>
                  )}

                  {contact.phone && (
                    <p className="text-gray-400 text-sm">{contact.phone}</p>
                  )}

                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {contact.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {onSelectContact && (
                      <button
                        onClick={() => onSelectContact(contact)}
                        className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(contact)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id!)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email *"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingContact ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingContact(null);
                    setFormData({ email: '', first_name: '', last_name: '', company: '', phone: '', tags: [] });
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
