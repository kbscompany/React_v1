import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    
    // Set document direction and language
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    
    // Update body class for RTL styling
    document.body.classList.remove('ltr', 'rtl');
    document.body.classList.add(lng === 'ar' ? 'rtl' : 'ltr');
  };

  const currentLanguage = i18n.language || 'en';

  return (
    <div className="flex items-center gap-2">
      <Select value={currentLanguage} onValueChange={changeLanguage}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Language">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {currentLanguage === 'ar' ? '🇸🇦' : '🇺🇸'}
              </span>
              <span>
                {currentLanguage === 'ar' ? 'العربية' : 'English'}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">
            <div className="flex items-center gap-2">
              <span className="text-lg">🇺🇸</span>
              <span>English</span>
            </div>
          </SelectItem>
          <SelectItem value="ar">
            <div className="flex items-center gap-2">
              <span className="text-lg">🇸🇦</span>
              <span>العربية</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher; 