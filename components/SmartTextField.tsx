import React, { useState } from 'react';
import { AIWritingAssistant } from './AIWritingAssistant';

interface SmartTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  context: 'script' | 'email_subject' | 'email_body' | 'campaign_name' | 'video_title' | 'general';
  label?: string;
  helpText?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  required?: boolean;
  disabled?: boolean;
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'enthusiastic';
  targetAudience?: string;
  className?: string;
}

export const SmartTextField: React.FC<SmartTextFieldProps> = ({
  value,
  onChange,
  placeholder,
  context,
  label,
  helpText,
  multiline = false,
  rows = 4,
  maxLength,
  showCharCount = true,
  required = false,
  disabled = false,
  tone = 'professional',
  targetAudience = 'general',
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const charCount = value.length;
  const isNearLimit = maxLength && charCount > maxLength * 0.9;
  const isOverLimit = maxLength && charCount > maxLength;

  const baseInputStyles = `
    w-full px-4 py-3 bg-gray-900 border-2 rounded-lg text-white placeholder-gray-500
    transition-all duration-200 resize-none
    ${isFocused ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-700'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600'}
    ${isOverLimit ? 'border-red-500 ring-2 ring-red-500/20' : ''}
    ${className}
  `;

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={baseInputStyles}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={baseInputStyles}
          />
        )}

        {!disabled && (
          <AIWritingAssistant
            value={value}
            onChange={onChange}
            context={context}
            placeholder={placeholder}
            tone={tone}
            targetAudience={targetAudience}
            maxLength={maxLength}
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        {helpText && (
          <p className="text-xs text-gray-500">{helpText}</p>
        )}

        {showCharCount && maxLength && (
          <div className={`text-xs ml-auto ${
            isOverLimit ? 'text-red-400 font-medium' :
            isNearLimit ? 'text-yellow-400' :
            'text-gray-500'
          }`}>
            {charCount} / {maxLength}
          </div>
        )}
      </div>

      {isOverLimit && (
        <p className="text-xs text-red-400 mt-1">
          Character limit exceeded by {charCount - maxLength!} characters
        </p>
      )}
    </div>
  );
};
