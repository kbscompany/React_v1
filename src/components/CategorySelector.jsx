import React, { useState, useEffect, useRef } from 'react';

const CategorySelector = ({ 
  categories = [], 
  value, 
  onChange, 
  placeholder = "Search and select category...",
  required = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Get selected category display text
  const selectedCategory = categories.find(cat => cat.id === parseInt(value));
  const displayText = selectedCategory ? selectedCategory.full_path || selectedCategory.name : '';

  // Filter categories based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category => {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = category.name.toLowerCase().includes(searchLower);
        const pathMatch = (category.full_path || category.name).toLowerCase().includes(searchLower);
        return nameMatch || pathMatch;
      });
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputClick = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleCategorySelect = (category) => {
    onChange(category.id);
    setIsOpen(false);
    setSearchTerm('');
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCategories.length === 1) {
        handleCategorySelect(filteredCategories[0]);
      }
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input Field */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayText}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: '0.5rem 2.5rem 0.5rem 0.5rem',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        />
        
        {/* Icons */}
        <div style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: '#6c757d',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear selection"
            >
              ✕
            </button>
          )}
          <span style={{ color: '#6c757d', fontSize: '12px' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ced4da',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {filteredCategories.length === 0 ? (
            <div style={{
              padding: '12px',
              color: '#6c757d',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              {searchTerm ? 'No categories found' : 'No categories available'}
            </div>
          ) : (
            filteredCategories.map(category => (
              <div
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f8f9fa',
                  backgroundColor: value === category.id ? '#e7f3ff' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (value !== category.id) {
                    e.target.style.backgroundColor = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== category.id) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                {/* Category Icon */}
                {category.icon && (
                  <i 
                    className={category.icon}
                    style={{ 
                      color: category.color || '#007bff',
                      width: '16px',
                      textAlign: 'center'
                    }}
                  ></i>
                )}
                
                {/* Category Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: value === category.id ? 'bold' : 'normal',
                    color: '#495057'
                  }}>
                    {category.name}
                  </div>
                  {category.full_path && category.full_path !== category.name && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6c757d',
                      marginTop: '2px'
                    }}>
                      {category.full_path}
                    </div>
                  )}
                </div>

                {/* Level indicator */}
                {category.level > 0 && (
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    L{category.level}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelector; 