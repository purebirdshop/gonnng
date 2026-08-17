import React, { useState, useRef, useEffect } from 'react';
import { searchCategories, CategoryMatch, getCategoryByName } from '../data/categoriesData';
import { Check, ChevronDown, Search, X, Tag } from 'lucide-react';

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  id?: string;
  theme?: 'light' | 'dark';
}

export default function CategoryCombobox({
  value,
  onChange,
  placeholder = 'Search category by name, keyword, or group...',
  label,
  required = false,
  className = '',
  id = 'category-combobox',
  theme = 'dark'
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCategoryObj = getCategoryByName(value);

  // Sync internal search query when external value prop changes
  useEffect(() => {
    setSearchQuery(value || '');
  }, [value]);

  // Filter categories matching search query
  const matches: CategoryMatch[] = searchCategories(searchQuery);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query to selected value if no new selection was finalized
        if (value) {
          setSearchQuery(value);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const handleSelect = (categoryName: string) => {
    onChange(categoryName);
    setSearchQuery(categoryName);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % Math.max(1, matches.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + matches.length) % Math.max(1, matches.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length > 0 && highlightedIndex >= 0 && highlightedIndex < matches.length) {
        handleSelect(matches[highlightedIndex].category.name);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={containerRef} id={`${id}-wrapper`}>
      {label && (
        <label
          htmlFor={id}
          className={`block text-xs font-mono uppercase tracking-wider font-bold ${
            isDark ? 'text-white/60' : 'text-gray-700'
          }`}
        >
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
          {selectedCategoryObj ? (
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm transition-transform"
              style={{ backgroundColor: selectedCategoryObj.colorHex }}
              title={`${selectedCategoryObj.parentCategory} (${selectedCategoryObj.colorName})`}
            />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          id={id}
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required && !value}
          autoComplete="off"
          className={`w-full pl-10 pr-16 py-2.5 rounded-xl text-sm font-sans focus:outline-none transition-all ${
            isDark
              ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#F59E0B]'
              : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]'
          }`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              id={`${id}-clear-btn`}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
              }`}
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            id={`${id}-toggle-btn`}
            className={`p-1 transition-colors cursor-pointer ${
              isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
            title="Toggle dropdown"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 max-h-64 overflow-y-auto rounded-2xl shadow-2xl py-1 text-sm border ${
            isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {matches.length === 0 ? (
            <div className={`px-4 py-3 text-xs text-center font-mono ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
              No categories found matching "{searchQuery}".
            </div>
          ) : (
            matches.map((match, index) => {
              const isSelected = value?.toLowerCase() === match.category.name.toLowerCase();
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={`cat-combobox-${match.category.id || match.category.name}-${index}`}
                  onClick={() => handleSelect(match.category.name)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isHighlighted
                      ? isDark
                        ? 'bg-white/10 text-white'
                        : 'bg-orange-50 text-gray-900'
                      : isDark
                      ? 'text-white/80 hover:bg-white/5'
                      : 'text-gray-700 hover:bg-gray-50'
                  } ${isSelected ? 'font-semibold text-[#F59E0B]' : ''}`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-sm truncate flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: match.category.colorHex }}
                      />
                      <span>{match.category.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#F59E0B] shrink-0" />}
                    </span>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="text-[10px] font-medium tracking-wide px-1.5 py-0.2 rounded border"
                        style={{
                          backgroundColor: `${match.category.colorHex}18`,
                          color: match.category.colorHex,
                          borderColor: `${match.category.colorHex}35`
                        }}
                      >
                        {match.category.parentCategory}
                      </span>

                      {match.matchedBy === 'synonym' && match.matchedTerm && (
                        <span className={`text-[11px] font-mono flex items-center gap-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          <Tag className="w-3 h-3 text-[#F59E0B] shrink-0" />
                          Match: <span className={`font-semibold ${isDark ? 'text-white/90' : 'text-gray-700'}`}>"{match.matchedTerm}"</span>
                        </span>
                      )}

                      {match.matchedBy === 'commonProject' && match.matchedTerm && (
                        <span className={`text-[11px] font-mono flex items-center gap-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          <Tag className="w-3 h-3 text-[#F59E0B] shrink-0" />
                          Project: <span className={`font-semibold ${isDark ? 'text-white/90' : 'text-gray-700'}`}>"{match.matchedTerm}"</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                      isDark ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {match.category.synonyms.length} synonyms
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

