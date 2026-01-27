import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'uz' | 'ru';

interface Translations {
  [key: string]: {
    uz: string;
    ru: string;
  };
}

export const translations: Translations = {
  // Header
  'nav.home': { uz: 'Bosh sahifa', ru: 'Главная' },
  'nav.stadiums': { uz: 'Stadionlar', ru: 'Стадионы' },
  'nav.about': { uz: 'Biz haqimizda', ru: 'О нас' },
  'nav.contact': { uz: 'Aloqa', ru: 'Контакты' },
  
  // Hero
  'hero.title': { uz: 'Stadionlarni band qiling', ru: 'Бронируйте стадионы' },
  'hero.subtitle': { uz: 'Onlayn', ru: 'Онлайн' },
  'hero.description': { uz: 'O\'zbekistondagi eng yaxshi stadionlarni osongina band qiling. Tez, qulay va ishonchli.', ru: 'Легко бронируйте лучшие стадионы Узбекистана. Быстро, удобно и надёжно.' },
  'hero.cta': { uz: 'Stadionlarni ko\'rish', ru: 'Посмотреть стадионы' },
  
  // Stadiums section
  'stadiums.title': { uz: 'Mavjud stadionlar', ru: 'Доступные стадионы' },
  'stadiums.subtitle': { uz: 'O\'yiningiz uchun mukammal maydonni tanlang', ru: 'Выберите идеальное поле для вашей игры' },
  'stadiums.book': { uz: 'Band qilish', ru: 'Забронировать' },
  'stadiums.perHour': { uz: 'soat', ru: 'час' },
  'stadiums.capacity': { uz: 'sig\'im', ru: 'вместимость' },
  'stadiums.players': { uz: 'o\'yinchi', ru: 'игроков' },
  
  // Stadium names
  'stadium.central.name': { uz: 'Markaziy Stadion', ru: 'Центральный Стадион' },
  'stadium.central.location': { uz: 'Toshkent, Chilonzor', ru: 'Ташкент, Чиланзар' },
  'stadium.indoor.name': { uz: 'Sport Zali', ru: 'Спортивный Зал' },
  'stadium.indoor.location': { uz: 'Toshkent, Mirzo Ulug\'bek', ru: 'Ташкент, Мирзо Улугбек' },
  'stadium.mini.name': { uz: 'Mini Futbol Maydoni', ru: 'Мини-Футбольное Поле' },
  'stadium.mini.location': { uz: 'Toshkent, Yunusobod', ru: 'Ташкент, Юнусабад' },
  
  // Features
  'features.title': { uz: 'Nima uchun biz?', ru: 'Почему мы?' },
  'features.booking.title': { uz: 'Oson band qilish', ru: 'Лёгкое бронирование' },
  'features.booking.desc': { uz: 'Bir necha daqiqada stadion band qiling', ru: 'Забронируйте стадион за несколько минут' },
  'features.payment.title': { uz: 'Xavfsiz to\'lov', ru: 'Безопасная оплата' },
  'features.payment.desc': { uz: 'Qulay va xavfsiz to\'lov usullari', ru: 'Удобные и безопасные способы оплаты' },
  'features.support.title': { uz: '24/7 Yordam', ru: 'Поддержка 24/7' },
  'features.support.desc': { uz: 'Har doim yordam berishga tayyormiz', ru: 'Всегда готовы помочь' },
  
  // Footer
  'footer.rights': { uz: 'Barcha huquqlar himoyalangan', ru: 'Все права защищены' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('uz');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
