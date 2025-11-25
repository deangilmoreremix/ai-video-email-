import React, { useState, useEffect } from 'react';
import { VideoTemplate, PersonalizationData, getTemplates, generateScriptFromTemplate, incrementTemplateUsage } from '../services/templateService';

interface TemplateSelectorProps {
  onScriptGenerated?: (script: string) => void;
  onSelect?: (template: VideoTemplate) => void;
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onScriptGenerated, onSelect, onClose }) => {
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [personalization, setPersonalization] = useState<PersonalizationData>({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, [category]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      console.log('Loading templates, category:', category);
      const data = await getTemplates(category || undefined);
      console.log('Templates loaded:', data.length, 'templates');
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    const initialData: PersonalizationData = {};
    template.placeholders?.forEach(placeholder => {
      initialData[placeholder.key] = placeholder.defaultValue || '';
    });
    setPersonalization(initialData);
  };

  const handlePersonalizationChange = (key: string, value: string) => {
    setPersonalization(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    const script = generateScriptFromTemplate(selectedTemplate, personalization);
    await incrementTemplateUsage(selectedTemplate.id);

    if (onScriptGenerated) {
      onScriptGenerated(script);
    }

    if (onSelect) {
      onSelect({ ...selectedTemplate, script_template: script });
    }

    onClose();
  };

  const categories = [
    { value: '', label: 'All Templates' },
    { value: 'sales_pitch', label: 'Sales Pitch' },
    { value: 'demo', label: 'Product Demo' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'thank_you', label: 'Thank You' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'update', label: 'Update' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Choose a Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!selectedTemplate ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No templates found in this category.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors border-2 border-transparent hover:border-yellow-400"
                    >
                      <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
                      <p className="text-gray-300 text-sm mb-3">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{template.duration}s duration</span>
                        <span>{template.usage_count} uses</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="mb-4 text-yellow-400 hover:text-yellow-300 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to templates
              </button>

              <div className="bg-gray-700 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{selectedTemplate.name}</h3>
                <p className="text-gray-300 text-sm">{selectedTemplate.description}</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Personalize Your Script</h4>
                {selectedTemplate.placeholders?.map(placeholder => (
                  <div key={placeholder.key}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {placeholder.label}
                    </label>
                    <input
                      type={placeholder.type}
                      value={personalization[placeholder.key] || ''}
                      onChange={(e) => handlePersonalizationChange(placeholder.key, e.target.value)}
                      placeholder={placeholder.defaultValue}
                      className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Preview</h4>
                <pre className="text-white text-sm whitespace-pre-wrap">
                  {generateScriptFromTemplate(selectedTemplate, personalization)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {selectedTemplate && (
          <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
            >
              Generate Script
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
