import React, { useState } from 'react';
import { generateEmailSubjectLines, personalizeEmailContent, PersonalizedEmail } from '../services/geminiService';

interface AIEmailEnhancerProps {
  script: string;
  onSubjectSelect: (subject: string) => void;
  onPersonalizedContentGenerate: (content: PersonalizedEmail) => void;
}

export const AIEmailEnhancer: React.FC<AIEmailEnhancerProps> = ({
  script,
  onSubjectSelect,
  onPersonalizedContentGenerate
}) => {
  const [showSubjectGenerator, setShowSubjectGenerator] = useState(false);
  const [showPersonalizer, setShowPersonalizer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subjectLines, setSubjectLines] = useState<string[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientCompany, setRecipientCompany] = useState('');
  const [recipientRole, setRecipientRole] = useState('');

  const handleGenerateSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const subjects = await generateEmailSubjectLines(script, recipientName || undefined);
      setSubjectLines(subjects);
      setShowSubjectGenerator(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalize = async () => {
    if (!recipientName) {
      setError('Please enter recipient name');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const personalized = await personalizeEmailContent(
        script,
        recipientName,
        recipientCompany || undefined,
        recipientRole || undefined
      );
      onPersonalizedContentGenerate(personalized);
      setShowPersonalizer(false);
      setRecipientName('');
      setRecipientCompany('');
      setRecipientRole('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={handleGenerateSubjects}
          disabled={loading || !script}
          className="flex-1 px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Generate Subject Lines
        </button>
        <button
          onClick={() => setShowPersonalizer(!showPersonalizer)}
          className="flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 text-sm"
        >
          Personalize Email
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-xs">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-2 text-sm text-gray-300">AI is thinking...</p>
        </div>
      )}

      {showSubjectGenerator && subjectLines.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-yellow-400 text-sm">AI-Generated Subject Lines</h4>
            <button
              onClick={() => { setShowSubjectGenerator(false); setSubjectLines([]); }}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="space-y-2">
            {subjectLines.map((subject, i) => (
              <button
                key={i}
                onClick={() => {
                  onSubjectSelect(subject);
                  setShowSubjectGenerator(false);
                }}
                className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors"
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
      )}

      {showPersonalizer && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-blue-400 text-sm">Personalize Email Content</h4>
            <button
              onClick={() => setShowPersonalizer(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Recipient Name *
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-gray-800 p-2 rounded border border-gray-600 text-sm focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Company (Optional)
              </label>
              <input
                type="text"
                value={recipientCompany}
                onChange={(e) => setRecipientCompany(e.target.value)}
                className="w-full bg-gray-800 p-2 rounded border border-gray-600 text-sm focus:ring-blue-500"
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Role (Optional)
              </label>
              <input
                type="text"
                value={recipientRole}
                onChange={(e) => setRecipientRole(e.target.value)}
                className="w-full bg-gray-800 p-2 rounded border border-gray-600 text-sm focus:ring-blue-500"
                placeholder="CEO"
              />
            </div>

            <button
              onClick={handlePersonalize}
              disabled={loading || !recipientName}
              className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Generate Personalized Content
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
