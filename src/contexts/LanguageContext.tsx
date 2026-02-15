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
  'nav.stadiums': { uz: 'Maydonlar', ru: 'Стадионы' },
  'nav.about': { uz: 'Loyiha haqida', ru: 'О проекте' },
  'nav.contact': { uz: 'Bog\'lanish', ru: 'Контакты' },

  // Hero
  'hero.title': { uz: 'Futbol maydonlarini onlayn band qiling', ru: 'Бронируйте футбольные поля онлайн' },
  'hero.subtitle': { uz: 'Stadion 24/7', ru: 'Stadion 24/7' },
  'hero.description': { uz: 'O\'zbekiston bo\'ylab eng yaxshi futbol maydonlarini biz orqali toping va band qiling. Qulay vaqt, ajoyib narx va kafolatlangan sifat.', ru: 'Находите и бронируйте лучшие футбольные поля по всему Узбекистану. Удобное время, отличные цены и гарантированное качество.' },
  'hero.cta': { uz: 'Maydon tanlash', ru: 'Выбрать поле' },

  // Stadiums section
  'stadiums.title': { uz: 'Bizning maydonlar', ru: 'Наши стадионы' },
  'stadiums.subtitle': { uz: 'O\'yiningiz uchun mukammal maydonni tanlang', ru: 'Выберите идеальное поле для вашей игры' },
  'stadiums.book': { uz: 'Band qilish', ru: 'Забронировать' },
  'stadiums.perHour': { uz: 'soatiga', ru: 'в час' },
  'stadiums.capacity': { uz: 'o\'rinli', ru: 'мест' },
  'stadiums.players': { uz: 'o\'yinchi', ru: 'игроков' },

  // Stadium names
  'stadium.central.name': { uz: 'Markaziy Arena', ru: 'Центральная Арена' },
  'stadium.central.location': { uz: 'Toshkent, Chilonzor', ru: 'Ташкент, Чиланзар' },
  'stadium.indoor.name': { uz: 'Premium Yopiq Zal', ru: 'Премиум Манеж' },
  'stadium.indoor.location': { uz: 'Toshkent, Mirzo Ulug\'bek', ru: 'Ташкент, Мирзо Улугбек' },
  'stadium.mini.name': { uz: 'Mini Futbol', ru: 'Мини-Футбол' },
  'stadium.mini.location': { uz: 'Toshkent, Yunusobod', ru: 'Ташкент, Юнусабад' },

  // Features
  'features.title': { uz: 'Nega aynan Stadion 24/7?', ru: 'Почему Stadion 24/7?' },
  'features.booking.title': { uz: 'Tezkor band qilish', ru: 'Быстрое бронирование' },
  'features.booking.desc': { uz: 'Bir necha bosishda maydon sizniki bo\'ladi', ru: 'Поле будет вашим всего за пару кликов' },
  'features.payment.title': { uz: 'Ishonchli to\'lov', ru: 'Надёжная оплата' },
  'features.payment.desc': { uz: 'Payme, Click va naqd to\'lov imkoniyati', ru: 'Payme, Click и наличные' },
  'features.support.title': { uz: 'Doimiy aloqa', ru: 'Поддержка 24/7' },
  'features.support.desc': { uz: 'Savollaringizga istalgan vaqt javob beramiz', ru: 'Ответим на ваши вопросы в любое время' },

  // Footer
  'footer.rights': { uz: 'Barcha huquqlar himoyalangan', ru: 'Все права защищены' },
  'nav.back': { uz: 'Orqaga', ru: 'Назад' },
  'stadiums.size': { uz: 'O\'lchami', ru: 'Размер' },
  'stadiums.surface': { uz: 'Chim turi', ru: 'Тип покрытия' },
  'stadiums.roof': { uz: 'Tomi', ru: 'Крыша' },
  'stadiums.features': { uz: 'Qulayliklar', ru: 'Удобства' },
  'stadiums.about': { uz: 'Maydon haqida', ru: 'О поле' },
  'stadiums.contact': { uz: 'Bog\'lanish', ru: 'Контакты' },
  'stadiums.artificialTurfs': { uz: 'Sintetik qoplama', ru: 'Искусственный газон' },
  'stadiums.nearMetro': { uz: 'Metro yaqinida', ru: 'Рядом с метро' },
  'stadiums.open247': { uz: '24/7 ochiq', ru: 'Открыто 24/7' },
  'stadiums.freeParking': { uz: 'Bepul turargoh', ru: 'Бесплатная парковка' },
  'booking.title': { uz: 'Maydonni band qilish', ru: 'Бронирование поля' },
  'booking.date': { uz: 'Sanani tanlang', ru: 'Выберите дату' },
  'booking.time': { uz: 'Vaqtni tanlang', ru: 'Выберите время' },
  'booking.confirm': { uz: 'Tasdiqlash', ru: 'Подтвердить' },
  'booking.success': { uz: 'Muvaffaqiyatli band qilindi!', ru: 'Успешно забронировано!' },
  'booking.error': { uz: 'Xatolik yuz berdi', ru: 'Произошла ошибка' },
  'booking.phone': { uz: 'Telefon raqamingiz', ru: 'Ваш номер телефона' },
  'nav.tournaments': { uz: 'Turnirlar', ru: 'Турниры' },
  'tournaments.title': { uz: 'Faol turnirlar', ru: 'Активные турниры' },
  'tournaments.subtitle': { uz: 'Eng yaxshi turnirlarda ishtirok eting va g\'olib bo\'ling', ru: 'Участвуйте в лучших турнирах и побеждайте' },
  'tournaments.entrance_fee': { uz: 'Ishtirok to\'lovi', ru: 'Взнос за участие' },
  'tournaments.start_date': { uz: 'Boshlanish vaqti', ru: 'Время начала' },
  'tournaments.free': { uz: 'Bepul', ru: 'Бесплатно' },

  // Profile
  'profile.title': { uz: 'Mening profilim', ru: 'Мой профиль' },
  'profile.personal_info': { uz: 'Shaxsiy ma\'lumotlar', ru: 'Личная информация' },
  'profile.personal_info_desc': { uz: 'Shaxsiy ma\'lumotlaringizni shu yerda yangilang.', ru: 'Обновите свои личные данные здесь.' },
  'profile.upload_avatar': { uz: 'Rasm yuklash', ru: 'Загрузить аватар' },
  'profile.avatar_help': { uz: 'Maks 5MB. Formatlar: JPG, PNG, WEBP', ru: 'Макс 5МБ. Форматы: JPG, PNG, WEBP' },
  'profile.phone': { uz: 'Telefon raqam', ru: 'Номер телефона' },
  'profile.phone_tooltip': { uz: 'Telefon raqamni o\'zgartirib bo\'lmaydi.', ru: 'Номер телефона изменить нельзя.' },
  'profile.manager_name': { uz: 'Menejer ismi', ru: 'Имя менеджера' },
  'profile.full_name': { uz: 'To\'liq ism', ru: 'Полное имя' },
  'profile.managed_stadiums': { uz: 'Boshqariladigan maydonlar', ru: 'Управляемые стадионы' },
  'profile.stadium_id': { uz: 'Stadion ID', ru: 'ID стадиона' },
  'profile.save_changes': { uz: 'Saqlash', ru: 'Сохранить изменения' },
  'profile.update_success': { uz: 'Profil muvaffaqiyatli yangilandi', ru: 'Профиль успешно обновлен' },
  'profile.load_error': { uz: 'Profil ma\'lumotlarini yuklashda xatolik', ru: 'Ошибка при загрузке данных профиля' },
  'profile.update_error': { uz: 'Profilni yanglashda xatolik', ru: 'Ошибка при обновлении профиля' },
  'profile.delete_error': { uz: 'Hisobni o\'chirishda xatolik', ru: 'Ошибка при удалении аккаунта' },
  'profile.account_deleted': { uz: 'Hisob o\'chirildi', ru: 'Аккаунт удален' },
  'profile.account_deleted_desc': { uz: 'Sizning hisobingiz muvaffaqiyatli o\'chirildi.', ru: 'Ваш аккаунт был успешно удален.' },
  'profile.crop_image': { uz: 'Rasmni qirqish', ru: 'Обрезать изображение' },
  'profile.crop_desc': { uz: 'Profilingizga moslash uchun rasmni qirqing.', ru: 'Обрежьте изображение, чтобы оно подходило к вашему профилю.' },
  'profile.set_photo': { uz: 'Rasmni o\'rnatish', ru: 'Установить фото' },
  'profile.image_size': { uz: 'Hajmi', ru: 'Размер' }, // Adding for completeness if I update the hardcoded "Size" later

  // Auth & Common
  'auth.logout': { uz: 'Chiqish', ru: 'Выйти' },
  'auth.logout_title': { uz: 'Tizimdan chiqish', ru: 'Выход из системы' },
  'auth.logout_desc': { uz: 'Haqiqatan ham tizimdan chiqmoqchimisiz?', ru: 'Вы действительно хотите выйти?' },
  'auth.logout_confirm': { uz: 'Ha, chiqish', ru: 'Да, выйти' },
  'auth.login': { uz: 'Kirish', ru: 'Войти' },
  'nav.profile': { uz: 'Profil', ru: 'Профиль' },
  'common.no': { uz: 'Yo\'q', ru: 'Нет' },
  'common.cancel': { uz: 'Bekor qilish', ru: 'Отмена' },
  'common.success': { uz: 'Muvaffaqiyatli', ru: 'Успешно' },
  'common.error': { uz: 'Xatolik', ru: 'Ошибка' },
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
