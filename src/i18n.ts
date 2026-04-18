import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Home": "Home",
      "Plans": "Plans",
      "Setup": "Setup",
      "Community": "Community",
      "Admin": "Admin",
      "Connect": "Connect",
      "Connected": "Connected",
      "Subscription active": "Subscription active",
      "days left": "days left",
      "Select Location": "Select Location",
      "Pay": "Pay",
      "Settings": "Settings",
      "Profile": "Profile",
      "Loading": "Loading...",
      "Error": "Error",
      "Success": "Success"
    }
  },
  ru: {
    translation: {
      "Home": "Главная",
      "Plans": "Тарифы",
      "Setup": "Настройка",
      "Community": "Сообщество",
      "Admin": "Админка",
      "Connect": "Подключить",
      "Connected": "Подключено",
      "Subscription active": "Подписка активна",
      "days left": "дней осталось",
      "Select Location": "Выбор локации",
      "Pay": "Оплатить",
      "Settings": "Настройки",
      "Profile": "Профиль",
      "Loading": "Загрузка...",
      "Error": "Ошибка",
      "Success": "Успешно"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ru", // Default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
