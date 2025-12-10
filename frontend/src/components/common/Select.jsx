import { useState, useRef, useEffect } from 'react';
import './Select.css';

const Select = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  name,
  id,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Scroll selected option into view when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedOption = dropdownRef.current.querySelector('[data-selected="true"]');
      if (selectedOption) {
        selectedOption.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [isOpen, value]);

  const selectedOption = options.find(opt => {
    const optValue = typeof opt === 'object' ? opt.value : opt;
    return optValue === value;
  });

  const displayValue = selectedOption
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : placeholder;

  const handleSelect = (optionValue) => {
    if (onChange) {
      const syntheticEvent = {
        target: {
          name: name || '',
          value: optionValue,
        },
      };
      onChange(syntheticEvent);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = options.findIndex(opt => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            return optValue === value;
          });
          const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
          const nextOption = options[nextIndex];
          const nextValue = typeof nextOption === 'object' ? nextOption.value : nextOption;
          handleSelect(nextValue);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          const currentIndex = options.findIndex(opt => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            return optValue === value;
          });
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
          const prevOption = options[prevIndex];
          const prevValue = typeof prevOption === 'object' ? prevOption.value : prevOption;
          handleSelect(prevValue);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className={`modern-select ${className} ${disabled ? 'modern-select--disabled' : ''}`} ref={selectRef}>
      <button
        type="button"
        className={`modern-select__trigger ${isOpen ? 'modern-select__trigger--open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
        id={id}
        {...props}
      >
        <span className={`modern-select__value ${!selectedOption ? 'modern-select__value--placeholder' : ''}`}>
          {displayValue}
        </span>
        <svg
          className={`modern-select__arrow ${isOpen ? 'modern-select__arrow--open' : ''}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1L6 6L11 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="modern-select__dropdown" ref={dropdownRef} role="listbox">
          {options.length === 0 ? (
            <div className="modern-select__option modern-select__option--empty">
              No options available
            </div>
          ) : (
            options.map((option, index) => {
              const optionValue = typeof option === 'object' ? option.value : option;
              const optionLabel = typeof option === 'object' ? option.label : option;
              const isSelected = optionValue === value;

              return (
                <button
                  key={index}
                  type="button"
                  className={`modern-select__option ${isSelected ? 'modern-select__option--selected' : ''}`}
                  onClick={() => handleSelect(optionValue)}
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                >
                  {optionLabel}
                  {isSelected && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Hidden native select for form submission */}
      {name && (
        <select
          name={name}
          value={value || ''}
          onChange={() => {}}
          className="modern-select__native"
          tabIndex={-1}
          aria-hidden="true"
        >
          {options.map((option, index) => {
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;
            return (
              <option key={index} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      )}
    </div>
  );
};

export default Select;

