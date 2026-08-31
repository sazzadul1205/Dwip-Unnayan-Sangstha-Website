/* eslint-disable no-useless-escape */
// resources/js/components/JobListingSteps/CompensationStep.jsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { StepWrapper } from './StepWrapper';
import { FaPlus, FaTrash, FaMagic, FaInfoCircle, FaSync, FaCheckCircle } from 'react-icons/fa';

// Stop words and helper functions (unchanged)
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'to', 'in', 'for', 'on', 'with', 'by', 'at', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'but', 'or', 'so', 'for', 'nor', 'yet', 'as', 'like',
  'such', 'that', 'these', 'those', 'this', 'those', 'then', 'than', 'into', 'upon',
  'about', 'after', 'before', 'between', 'through', 'during', 'without', 'within',
  'along', 'against', 'among', 'across', 'behind', 'below', 'beneath', 'beside',
  'beyond', 'circa', 'except', 'including', 'minus', 'plus', 'since', 'toward',
  'under', 'unless', 'until', 'up', 'via', 'with', 'within', 'without', 'will',
  'can', 'could', 'may', 'might', 'must', 'should', 'would', 'shall', 'ought',
  'need', 'dare', 'used', 'get', 'gets', 'getting', 'got', 'gotten', 'make', 'makes',
  'making', 'use', 'uses', 'using', 'see', 'sees', 'seeing', 'seen', 'provide',
  'provides', 'providing', 'require', 'requires', 'requiring', 'required', 'include',
  'includes', 'including', 'work', 'works', 'working', 'worked', 'team', 'teams',
  'role', 'roles', 'position', 'positions', 'job', 'jobs', 'candidate', 'candidates',
  'applicant', 'applicants', 'experience', 'skill', 'skills', 'ability', 'abilities',
  'knowledge', 'proficiency', 'strong', 'excellent', 'good', 'great', 'basic',
  'advanced', 'intermediate', 'minimum', 'maximum', 'preferred', 'plus', 'nice',
  'must', 'should', 'would', 'could', 'might', 'also', 'well', 'very', 'really',
  'quite', 'rather', 'somewhat', 'extremely', 'highly', 'deeply', 'fully', 'easily',
  'quickly', 'slowly', 'carefully', 'properly', 'appropriately', 'accordingly',
  'therefore', 'however', 'moreover', 'furthermore', 'nevertheless', 'consequently'
]);

const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.floor(num));
};

const getCaretPosition = (input) => input.selectionStart;
const setCaretPosition = (input, position) => {
  if (input) input.setSelectionRange(position, position);
};

export const CompensationStep = ({ formData, errors, handleChange }) => {
  const [salaryType, setSalaryType] = useState(() => {
    if (formData.as_per_companies_policy) return 'policy';
    if (formData.is_salary_negotiable) return 'negotiable';
    return 'range';
  });

  const [isExtracting, setIsExtracting] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [extractMessage, setExtractMessage] = useState('');

  const [displaySalaryMin, setDisplaySalaryMin] = useState(
    formData.salary_min ? formatCurrency(formData.salary_min) : ''
  );
  const [displaySalaryMax, setDisplaySalaryMax] = useState(
    formData.salary_max ? formatCurrency(formData.salary_max) : ''
  );

  const minInputRef = useRef(null);
  const maxInputRef = useRef(null);

  useEffect(() => {
    if (formData.salary_min) {
      setDisplaySalaryMin(formatCurrency(formData.salary_min));
    } else {
      setDisplaySalaryMin('');
    }
  }, [formData.salary_min]);

  useEffect(() => {
    if (formData.salary_max) {
      setDisplaySalaryMax(formatCurrency(formData.salary_max));
    } else {
      setDisplaySalaryMax('');
    }
  }, [formData.salary_max]);

  const handleSalaryMinChange = (e) => {
    const input = e.target;
    const rawValue = e.target.value;
    const numbersOnly = rawValue.replace(/[^0-9]/g, '');
    const caretPos = getCaretPosition(input);

    if (numbersOnly) {
      const num = parseInt(numbersOnly, 10);
      if (!isNaN(num)) {
        const formattedValue = formatCurrency(num);
        setDisplaySalaryMin(formattedValue);
        handleChange({ target: { name: 'salary_min', value: num } });
        setTimeout(() => {
          if (minInputRef.current) {
            const newCaretPos = Math.min(caretPos, formattedValue.length);
            setCaretPosition(minInputRef.current, newCaretPos);
          }
        }, 0);
      } else {
        setDisplaySalaryMin('');
        handleChange({ target: { name: 'salary_min', value: '' } });
      }
    } else {
      setDisplaySalaryMin('');
      handleChange({ target: { name: 'salary_min', value: '' } });
    }
  };

  const handleSalaryMaxChange = (e) => {
    const input = e.target;
    const rawValue = e.target.value;
    const numbersOnly = rawValue.replace(/[^0-9]/g, '');
    const caretPos = getCaretPosition(input);

    if (numbersOnly) {
      const num = parseInt(numbersOnly, 10);
      if (!isNaN(num)) {
        const formattedValue = formatCurrency(num);
        setDisplaySalaryMax(formattedValue);
        handleChange({ target: { name: 'salary_max', value: num } });
        setTimeout(() => {
          if (maxInputRef.current) {
            const newCaretPos = Math.min(caretPos, formattedValue.length);
            setCaretPosition(maxInputRef.current, newCaretPos);
          }
        }, 0);
      } else {
        setDisplaySalaryMax('');
        handleChange({ target: { name: 'salary_max', value: '' } });
      }
    } else {
      setDisplaySalaryMax('');
      handleChange({ target: { name: 'salary_max', value: '' } });
    }
  };

  const handleFocus = (e) => e.target.select();

  const extractWords = useCallback((text) => {
    if (!text) return [];
    const plainText = text.replace(/<[^>]*>/g, ' ');
    const words = plainText
      .toLowerCase()
      .split(/[\s,;:.!?()\[\]{}"'`~@#$%^&*+=|\\/<>-]+/)
      .filter(word => word.length > 2)
      .filter(word => !STOP_WORDS.has(word))
      .filter(word => !/^\d+$/.test(word))
      .filter(word => !/^[a-z]$/i.test(word));

    const frequency = {};
    words.forEach(word => { frequency[word] = (frequency[word] || 0) + 1; });
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word]) => word);
  }, []);

  const extractAllKeywords = useCallback(() => {
    setIsExtracting(true);
    setExtractMessage('');

    const sources = [
      formData.requirements || '',
      formData.description || '',
      ...(formData.skills || []),
      ...(formData.responsibilities || []),
    ];

    const allText = sources.join(' ');
    const extractedKeywords = extractWords(allText);
    const existingKeywords = new Set(formData.keywords.map(k => k.toLowerCase()));
    const newKeywords = extractedKeywords.filter(k => !existingKeywords.has(k));

    if (newKeywords.length > 0) {
      const updatedKeywords = [...formData.keywords, ...newKeywords];
      handleChange({ target: { name: 'keywords', value: updatedKeywords } });
      setExtractMessage(`Added ${newKeywords.length} new keywords from your requirements`);
    } else {
      setExtractMessage('No new keywords found to add');
    }

    setTimeout(() => setExtractMessage(''), 3000);
    setIsExtracting(false);
  }, [formData.requirements, formData.description, formData.skills, formData.responsibilities, formData.keywords, extractWords, handleChange]);

  const cleanKeywords = useCallback(() => {
    const uniqueKeywords = [...new Set(formData.keywords.map(k => k.trim().toLowerCase()))];
    const validKeywords = uniqueKeywords.filter(k => k.length > 1);
    if (validKeywords.length !== formData.keywords.length) {
      handleChange({ target: { name: 'keywords', value: validKeywords } });
      setExtractMessage('Removed duplicate keywords');
      setTimeout(() => setExtractMessage(''), 2000);
    }
  }, [formData.keywords, handleChange]);

  useEffect(() => {
    if (formData.keywords.length === 0 &&
      (formData.requirements || formData.description || formData.skills?.length > 0)) {
      const timer = setTimeout(() => { extractAllKeywords(); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [extractAllKeywords, formData.description, formData.keywords.length, formData.requirements, formData.skills?.length]);

  const handleSalaryTypeChange = (type) => {
    setSalaryType(type);
    if (type === 'policy') {
      handleChange({ target: { name: 'as_per_companies_policy', value: true } });
      handleChange({ target: { name: 'is_salary_negotiable', value: false } });
      handleChange({ target: { name: 'salary_min', value: '' } });
      handleChange({ target: { name: 'salary_max', value: '' } });
      setDisplaySalaryMin('');
      setDisplaySalaryMax('');
    } else if (type === 'negotiable') {
      handleChange({ target: { name: 'as_per_companies_policy', value: false } });
      handleChange({ target: { name: 'is_salary_negotiable', value: true } });
      handleChange({ target: { name: 'salary_min', value: '' } });
      handleChange({ target: { name: 'salary_max', value: '' } });
      setDisplaySalaryMin('');
      setDisplaySalaryMax('');
    } else {
      handleChange({ target: { name: 'as_per_companies_policy', value: false } });
      handleChange({ target: { name: 'is_salary_negotiable', value: false } });
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim().toLowerCase())) {
      handleChange({
        target: { name: 'keywords', value: [...formData.keywords, newKeyword.trim().toLowerCase()] }
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (index) => {
    const newKeywords = [...formData.keywords];
    newKeywords.splice(index, 1);
    handleChange({ target: { name: 'keywords', value: newKeywords } });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addKeyword();
  };

  return (
    <StepWrapper
      title="Compensation & Benefits"
      description="Define salary range and compensation details"
      isActive={true}
      stepNumber={4}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Salary Type Selection - 3 cards */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
            Salary Information <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div
              className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${salaryType === 'range'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              onClick={() => handleSalaryTypeChange('range')}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <input
                  type="radio"
                  name="salary_type"
                  value="range"
                  checked={salaryType === 'range'}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 mt-0.5"
                />
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">Specific Salary Range</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Set min and max salary</p>
                </div>
              </div>
            </div>

            <div
              className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${salaryType === 'negotiable'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              onClick={() => handleSalaryTypeChange('negotiable')}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <input
                  type="radio"
                  name="salary_type"
                  value="negotiable"
                  checked={salaryType === 'negotiable'}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 mt-0.5"
                />
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">Negotiable</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Based on experience</p>
                </div>
              </div>
            </div>

            <div
              className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${salaryType === 'policy'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              onClick={() => handleSalaryTypeChange('policy')}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <input
                  type="radio"
                  name="salary_type"
                  value="policy"
                  checked={salaryType === 'policy'}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 mt-0.5"
                />
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">As per policy</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Disclosed in interview</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Salary Range Inputs */}
        {salaryType === 'range' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Minimum Salary (BDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  ৳
                </span>
                <input
                  ref={minInputRef}
                  type="text"
                  value={displaySalaryMin}
                  onChange={handleSalaryMinChange}
                  onFocus={handleFocus}
                  placeholder="e.g., 30,000"
                  className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <p className="mt-1 text-[10px] sm:text-xs text-gray-500">Enter numbers only (auto-formats)</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Maximum Salary (BDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  ৳
                </span>
                <input
                  ref={maxInputRef}
                  type="text"
                  value={displaySalaryMax}
                  onChange={handleSalaryMaxChange}
                  onFocus={handleFocus}
                  placeholder="e.g., 50,000"
                  className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              {errors.salary_max && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.salary_max}</p>}
            </div>
          </div>
        )}

        {/* Keywords Section */}
        <div className="border-t pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700">
              Keywords (ATS Optimization)
            </label>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={cleanKeywords}
                className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <FaSync size={10} />
                Clean
              </button>
              <button
                type="button"
                onClick={extractAllKeywords}
                disabled={isExtracting}
                className="text-[10px] sm:text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded-lg flex items-center gap-1 transition"
              >
                <FaMagic size={10} />
                {isExtracting ? 'Extracting...' : 'Auto Extract'}
              </button>
            </div>
          </div>

          <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3">
            Keywords help ATS systems find your job. Auto-extract from your requirements, skills, and responsibilities.
          </p>

          {extractMessage && (
            <div className="mb-2 sm:mb-3 text-[10px] sm:text-xs text-green-600 bg-green-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-2">
              <FaCheckCircle size={10} />
              {extractMessage}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add custom keyword..."
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 text-sm"
            >
              <FaPlus size={12} />
              Add
            </button>
          </div>

          {formData.keywords.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2 max-h-48 sm:max-h-64 overflow-y-auto p-1">
              {formData.keywords.map((keyword, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded-lg group hover:bg-gray-200 transition text-xs sm:text-sm"
                >
                  <span className="text-gray-800 truncate flex-1">{keyword}</span>
                  <button
                    type="button"
                    onClick={() => removeKeyword(index)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    <FaTrash size={10} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-500">No keywords added yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Click "Auto Extract" or add keywords manually
              </p>
            </div>
          )}

          <p className="mt-2 text-[10px] sm:text-xs text-gray-500">
            💡 Tip: Keywords help your job appear in candidate searches.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <FaInfoCircle className="text-blue-500 mt-0.5" size={14} />
          <div className="text-xs sm:text-sm text-blue-800">
            <p className="font-medium mb-1">ATS Optimization Tips:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] sm:text-xs">
              <li>Use common industry terms for your role</li>
              <li>Include hard and soft skills</li>
              <li>Avoid jargon and internal terms</li>
            </ul>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
};