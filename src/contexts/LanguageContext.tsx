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
  'nav.orders': { uz: 'Buyurtmalar', ru: 'Заказы' },
  'nav.media': { uz: 'Media', ru: 'Медиа' },

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
  'booking.available_hours': { uz: 'Mavjud soatlar', ru: 'Доступные часы' },
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

  // Stadium surface types
  'surface.artificial': { uz: 'Sun\'iy', ru: 'Искусственный' },
  'surface.natural': { uz: 'Tabiiy', ru: 'Натуральный' },
  'surface.hybrid': { uz: 'Aralash', ru: 'Гибридный' },

  // Stadium roof types
  'roof.covered': { uz: 'Yopiq', ru: 'Крытый' },
  'roof.open': { uz: 'Ochiq', ru: 'Открытый' },
  'roof.partial': { uz: 'Qisman yopiq', ru: 'Частично крытый' },

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
  'common.currency': { uz: 'so\'m', ru: 'сум' },
  'common.empty': { uz: 'Hozircha bo\'sh', ru: 'Пока пусто' },
  'common.retry': { uz: 'Qayta urinish', ru: 'Повторить' },
  'common.back': { uz: 'Orqaga', ru: 'Назад' },
  'common.continue': { uz: 'Davom etish', ru: 'Продолжить' },
  'common.close': { uz: 'Yopish', ru: 'Закрыть' },

  // Marketplace
  'nav.marketplace': { uz: 'Do\'kon', ru: 'Магазин' },
  'marketplace.title': { uz: 'Do\'kon', ru: 'Магазин' },
  'marketplace.tagline': { uz: 'Maydon uchun jihozlar', ru: 'Экипировка для поля' },
  'marketplace.searchHint': { uz: 'Mahsulot qidirish...', ru: 'Поиск товара...' },
  'marketplace.sortBy': { uz: 'Saralash', ru: 'Сортировка' },
  'marketplace.sortNewest': { uz: 'Yangi qo\'shilgan', ru: 'Сначала новые' },
  'marketplace.sortLikes': { uz: 'Eng yoqimli', ru: 'Самые любимые' },
  'marketplace.sortPriceAsc': { uz: 'Narx: arzon → qimmat', ru: 'Цена: по возрастанию' },
  'marketplace.sortPriceDesc': { uz: 'Narx: qimmat → arzon', ru: 'Цена: по убыванию' },
  'marketplace.inStockOnly': { uz: 'Faqat mavjudlari', ru: 'Только в наличии' },
  'marketplace.outOfStock': { uz: 'Sotuvda yo\'q', ru: 'Нет в наличии' },
  'marketplace.filters': { uz: 'Filtrlar', ru: 'Фильтры' },
  'marketplace.reset': { uz: 'Tozalash', ru: 'Сбросить' },
  'marketplace.apply': { uz: 'Qo\'llash', ru: 'Применить' },
  'marketplace.allCategories': { uz: 'Barchasi', ru: 'Все' },
  'marketplace.empty': { uz: 'Mahsulot topilmadi', ru: 'Товары не найдены' },
  'marketplace.loadError': { uz: 'Mahsulotlarni yuklab bo\'lmadi', ru: 'Не удалось загрузить товары' },
  'marketplace.viewCart': { uz: 'Savatchani ko\'rish', ru: 'Открыть корзину' },
  'marketplace.viewOrders': { uz: 'Mening buyurtmalarim', ru: 'Мои заказы' },
  'marketplace.size': { uz: 'O\'lcham', ru: 'Размер' },
  'marketplace.selectSize': { uz: 'O\'lcham tanlang', ru: 'Выберите размер' },
  'marketplace.addToCart': { uz: 'Savatga qo\'shish', ru: 'В корзину' },
  'marketplace.added': { uz: 'Savatga qo\'shildi', ru: 'Добавлено в корзину' },
  'marketplace.likeFailed': { uz: 'Yoqtirib bo\'lmadi', ru: 'Не удалось поставить лайк' },
  'marketplace.price': { uz: 'Narx', ru: 'Цена' },
  'marketplace.prepayment': { uz: 'Oldindan to\'lov', ru: 'Предоплата' },
  'marketplace.description': { uz: 'Tavsif', ru: 'Описание' },
  'marketplace.openShop': { uz: 'Do\'kon', ru: 'Магазин' },
  'marketplace.likes': { uz: 'yoqtirish', ru: 'нравится' },

  // Cart
  'cart.title': { uz: 'Savatcha', ru: 'Корзина' },
  'cart.empty': { uz: 'Savatchangiz bo\'sh', ru: 'Корзина пуста' },
  'cart.emptyDesc': { uz: 'Yangi mahsulotlarni do\'kondan tanlang.', ru: 'Найдите товары в магазине.' },
  'cart.continueShopping': { uz: 'Xaridni davom ettirish', ru: 'Продолжить покупки' },
  'cart.subtotal': { uz: 'Mahsulotlar', ru: 'Товары' },
  'cart.prepayment': { uz: 'Oldindan to\'lov', ru: 'Предоплата сейчас' },
  'cart.proceedCheckout': { uz: 'Buyurtma berish', ru: 'Оформить' },
  'cart.unavailable': { uz: 'Mavjud emas', ru: 'Недоступен' },
  'cart.removeUnavailable': { uz: 'Mavjud emaslarni o\'chirish', ru: 'Удалить недоступные' },
  'cart.quantity': { uz: 'Soni', ru: 'Кол-во' },
  'cart.unitPrice': { uz: 'Narxi', ru: 'Цена' },
  'cart.remove': { uz: 'O\'chirish', ru: 'Удалить' },

  // Checkout
  'checkout.title': { uz: 'Buyurtmani rasmiylashtirish', ru: 'Оформление заказа' },
  'checkout.address': { uz: 'Yetkazib berish manzili', ru: 'Адрес доставки' },
  'checkout.addressHint': { uz: 'Shahar, ko\'cha, uy raqami', ru: 'Город, улица, дом' },
  'checkout.lat': { uz: 'Kenglik (lat)', ru: 'Широта (lat)' },
  'checkout.lng': { uz: 'Uzunlik (lng)', ru: 'Долгота (lng)' },
  'checkout.coordsHint': { uz: 'Yandex.Xarita orqali aniq joyni belgilang', ru: 'Уточните точку в Яндекс.Картах' },
  'checkout.pay': { uz: 'To\'lash', ru: 'Оплатить' },
  'checkout.summary': { uz: 'Buyurtma xulosasi', ru: 'Сводка заказа' },
  'checkout.payNow': { uz: 'Hozir to\'lanadigan', ru: 'К оплате сейчас' },
  'checkout.payOnDelivery': { uz: 'Yetkazib berishda to\'lanadi', ru: 'Оплата при доставке' },
  'checkout.deliveryNote': { uz: 'Yetkazib berish narxi keyinroq qo\'shiladi', ru: 'Стоимость доставки добавится позже' },
  'checkout.placeOrder': { uz: 'Buyurtma berish', ru: 'Создать заказ' },
  'checkout.choosePayment': { uz: 'To\'lov usulini tanlang', ru: 'Выберите способ оплаты' },
  'checkout.payDeadline': { uz: 'To\'lash uchun vaqt qoldi', ru: 'Времени на оплату осталось' },
  'checkout.outOfStock': { uz: 'Quyidagi mahsulotlar sotuvda qolmagan', ru: 'Эти товары больше недоступны' },
  'checkout.cartEmpty': { uz: 'Savatcha bo\'sh', ru: 'Корзина пуста' },

  // Marketplace Orders
  'morders.title': { uz: 'Buyurtmalarim', ru: 'Мои заказы' },
  'morders.empty': { uz: 'Buyurtmalar yo\'q', ru: 'Заказов нет' },
  'morders.emptyDesc': { uz: 'Birinchi buyurtmangizni do\'konda bering.', ru: 'Сделайте первый заказ в магазине.' },
  'morders.address': { uz: 'Manzil', ru: 'Адрес' },
  'morders.items': { uz: 'Mahsulotlar', ru: 'Товары' },
  'morders.itemsTotal': { uz: 'Mahsulotlar summasi', ru: 'Сумма товаров' },
  'morders.delivery': { uz: 'Yetkazib berish', ru: 'Доставка' },
  'morders.total': { uz: 'Jami', ru: 'Итого' },
  'morders.paid': { uz: 'To\'langan', ru: 'Оплачено' },
  'morders.remaining': { uz: 'Qoldiq', ru: 'Остаток' },
  'morders.payDeadline': { uz: 'To\'lashga qolgan vaqt', ru: 'Осталось на оплату' },
  'morders.payNow': { uz: 'Hozir to\'lash', ru: 'Оплатить сейчас' },
  'morders.qty': { uz: 'soni', ru: 'кол-во' },
  'morders.refundFlag': { uz: 'Pul qaytarish jarayonida', ru: 'Ожидается возврат' },
  'morders.timeline': { uz: 'Bosqichlar', ru: 'Этапы' },
  'morders.filterAll': { uz: 'Hammasi', ru: 'Все' },

  // Marketplace order statuses
  'status.awaiting_prepayment': { uz: 'To\'lov kutilmoqda', ru: 'Ждём предоплаты' },
  'status.prepaid': { uz: 'Oldindan to\'langan', ru: 'Предоплачено' },
  'status.confirmed': { uz: 'Tasdiqlangan', ru: 'Подтверждён' },
  'status.delivery_sent': { uz: 'Yo\'lda', ru: 'В пути' },
  'status.delivery_completed': { uz: 'Yetkazildi', ru: 'Доставлен' },
  'status.cancelled': { uz: 'Bekor qilingan', ru: 'Отменён' },
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
