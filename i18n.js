// ═══════════════════════════════════════════════
// js/i18n.js — نظام الترجمة متعدد اللغات
// ═══════════════════════════════════════════════

const translations = {
  ar: {
    // عام
    appName:        'Quinn Bot',
    loading:        'جاري التحميل...',
    save:           'حفظ',
    cancel:         'إلغاء',
    confirm:        'تأكيد',
    close:          'إغلاق',
    error:          'خطأ',
    success:        'نجح',
    copy:           'نسخ',
    copied:         'تم النسخ!',
    warning:        'تحذير',
    // التبويبات
    tabHome:        'الرئيسية',
    tabVault:       'الخزانة',
    tabExchange:    'التداول',
    tabArena:       'الساحة',
    tabLeaderboard: 'المتصدرون',
    tabProfile:     'الملف',
    // الرئيسية
    tapToEarn:      'اضغط للكسب',
    energy:         'الطاقة',
    perClick:       'لكل نقرة',
    totalEarned:    'إجمالي الكسب',
    // المستخدم
    rank:           'الرتبة',
    level:          'المستوى',
    tokens:         'Quinn',
    referrals:      'الإحالات',
    joinDate:       'تاريخ الانضمام',
    // الخزانة
    vaultTitle:     'Quinn Vault',
    vaultDesc:      'استثمر Quinn واكسب عوائد يومية',
    staked:         'المودع',
    dailyYield:     'العائد اليومي',
    loyaltyBonus:   'مكافأة الولاء',
    deposit:        'إيداع',
    withdraw:       'سحب',
    claim:          'استلام المكافأة',
    earlyPenalty:   'عقوبة السحب المبكر 10%',
    // التداول
    goldPrice:      'سعر الذهب',
    buyGold:        'شراء ذهب',
    sellGold:       'بيع ذهب',
    myGold:         'رصيد الذهب',
    goldHistory:    'سجل الصفقات',
    grams:          'غرام',
    // الساحة
    arenaTitle:     'ساحة القتال',
    games:          'الألعاب',
    gamble:         'القمار',
    pvpWait:        'البحث عن خصم...',
    betAmount:      'مبلغ الرهان',
    play:           'العب',
    win:            '🏆 فزت!',
    lose:           '💔 خسرت',
    // المتصدرون
    rank1:          '🥇',
    rank2:          '🥈',
    rank3:          '🥉',
    myRank:         'ترتيبي',
    // الملف
    profileTitle:   'ملفي الشخصي',
    secureKey:      'المفتاح السري',
    secureKeyWarn:  '⚠️ احتفظ بهذا المفتاح بأمان. لا يمكن استعادته!',
    settings:       'الإعدادات',
    language:       'اللغة',
    notifications:  'الإشعارات',
    // رسائل
    tgOnly:         'هذا التطبيق يعمل فقط داخل تيليجرام',
    openBot:        'فتح البوت',
    banned:         'تم حظر حسابك. تواصل مع الدعم.',
    insufficientBal:'رصيد غير كافٍ',
    wrongPassword:  'كلمة مرور خاطئة',
    // المتجر
    shopTitle:      'المتجر',
    buyWithPass:    'شراء بكلمة المرور',
    buyWithStars:   'شراء بالنجوم',
    enterPassword:  'أدخل كلمة المرور',
    enterAmount:    'أدخل الكمية',
    // الإيداع
    depositPrompt:  'كم تريد إيداع؟',
    withdrawPrompt: 'كم تريد سحب؟',
    // الإشعارات
    newNotif:       'إشعار جديد',
  },
  en: {
    appName:'Quinn Bot',loading:'Loading...',save:'Save',cancel:'Cancel',confirm:'Confirm',close:'Close',
    error:'Error',success:'Success',copy:'Copy',copied:'Copied!',warning:'Warning',
    tabHome:'Home',tabVault:'Vault',tabExchange:'Exchange',tabArena:'Arena',tabLeaderboard:'Leaderboard',tabProfile:'Profile',
    tapToEarn:'Tap to Earn',energy:'Energy',perClick:'per click',totalEarned:'Total Earned',
    rank:'Rank',level:'Level',tokens:'Quinn',referrals:'Referrals',joinDate:'Joined',
    vaultTitle:'Quinn Vault',vaultDesc:'Stake Quinn and earn daily rewards',staked:'Staked',dailyYield:'Daily Yield',
    loyaltyBonus:'Loyalty Bonus',deposit:'Deposit',withdraw:'Withdraw',claim:'Claim Reward',earlyPenalty:'10% Early Withdrawal Penalty',
    goldPrice:'Gold Price',buyGold:'Buy Gold',sellGold:'Sell Gold',myGold:'My Gold',goldHistory:'Trade History',grams:'grams',
    arenaTitle:'Battle Arena',games:'Games',gamble:'Gamble',pvpWait:'Searching for opponent...',
    betAmount:'Bet Amount',play:'Play',win:'🏆 You Won!',lose:'💔 You Lost',
    rank1:'🥇',rank2:'🥈',rank3:'🥉',myRank:'My Rank',
    profileTitle:'My Profile',secureKey:'Secure Key',secureKeyWarn:'⚠️ Keep this key safe. It cannot be recovered!',
    settings:'Settings',language:'Language',notifications:'Notifications',
    tgOnly:'This app only works inside Telegram',openBot:'Open Bot',
    banned:'Your account has been banned. Contact support.',insufficientBal:'Insufficient balance',wrongPassword:'Wrong password',
    shopTitle:'Shop',buyWithPass:'Buy with Password',buyWithStars:'Buy with Stars',enterPassword:'Enter Password',enterAmount:'Enter Amount',
    depositPrompt:'How much to deposit?',withdrawPrompt:'How much to withdraw?',newNotif:'New Notification',
  },
  ru: {
    appName:'Quinn Bot',loading:'Загрузка...',save:'Сохранить',cancel:'Отмена',confirm:'Подтвердить',close:'Закрыть',
    error:'Ошибка',success:'Успех',copy:'Копировать',copied:'Скопировано!',warning:'Предупреждение',
    tabHome:'Главная',tabVault:'Хранилище',tabExchange:'Биржа',tabArena:'Арена',tabLeaderboard:'Рейтинг',tabProfile:'Профиль',
    tapToEarn:'Нажимай для заработка',energy:'Энергия',perClick:'за клик',totalEarned:'Всего заработано',
    rank:'Ранг',level:'Уровень',tokens:'Quinn',referrals:'Рефералы',joinDate:'Дата входа',
    vaultTitle:'Quinn Vault',vaultDesc:'Ставьте Quinn и получайте ежедневные награды',staked:'В стейкинге',
    dailyYield:'Дневной доход',loyaltyBonus:'Бонус лояльности',deposit:'Пополнить',withdraw:'Вывести',claim:'Получить награду',earlyPenalty:'Штраф 10% за досрочный вывод',
    goldPrice:'Цена золота',buyGold:'Купить золото',sellGold:'Продать золото',myGold:'Моё золото',goldHistory:'История сделок',grams:'грамм',
    arenaTitle:'Боевая арена',games:'Игры',gamble:'Азартные игры',pvpWait:'Поиск соперника...',
    betAmount:'Сумма ставки',play:'Играть',win:'🏆 Вы победили!',lose:'💔 Вы проиграли',
    rank1:'🥇',rank2:'🥈',rank3:'🥉',myRank:'Мой рейтинг',
    profileTitle:'Мой профиль',secureKey:'Секретный ключ',secureKeyWarn:'⚠️ Храните этот ключ в безопасности. Его нельзя восстановить!',
    settings:'Настройки',language:'Язык',notifications:'Уведомления',
    tgOnly:'Это приложение работает только в Telegram',openBot:'Открыть бота',
    banned:'Ваш аккаунт заблокирован.',insufficientBal:'Недостаточно средств',wrongPassword:'Неверный пароль',
    shopTitle:'Магазин',buyWithPass:'Купить с паролем',buyWithStars:'Купить со звёздами',enterPassword:'Введите пароль',enterAmount:'Введите сумму',
    depositPrompt:'Сколько внести?',withdrawPrompt:'Сколько вывести?',newNotif:'Новое уведомление',
  },
  es: {
    appName:'Quinn Bot',loading:'Cargando...',save:'Guardar',cancel:'Cancelar',confirm:'Confirmar',close:'Cerrar',
    error:'Error',success:'Éxito',copy:'Copiar',copied:'¡Copiado!',warning:'Advertencia',
    tabHome:'Inicio',tabVault:'Bóveda',tabExchange:'Bolsa',tabArena:'Arena',tabLeaderboard:'Ranking',tabProfile:'Perfil',
    tapToEarn:'Toca para ganar',energy:'Energía',perClick:'por clic',totalEarned:'Total ganado',
    rank:'Rango',level:'Nivel',tokens:'Quinn',referrals:'Referidos',joinDate:'Ingreso',
    vaultTitle:'Quinn Vault',vaultDesc:'Haz staking de Quinn y gana recompensas diarias',staked:'En staking',
    dailyYield:'Rendimiento diario',loyaltyBonus:'Bono de lealtad',deposit:'Depositar',withdraw:'Retirar',claim:'Reclamar recompensa',earlyPenalty:'Penalidad 10% por retiro anticipado',
    goldPrice:'Precio del oro',buyGold:'Comprar oro',sellGold:'Vender oro',myGold:'Mi oro',goldHistory:'Historial',grams:'gramos',
    arenaTitle:'Arena de batalla',games:'Juegos',gamble:'Apuestas',pvpWait:'Buscando oponente...',
    betAmount:'Monto de apuesta',play:'Jugar',win:'🏆 ¡Ganaste!',lose:'💔 Perdiste',
    rank1:'🥇',rank2:'🥈',rank3:'🥉',myRank:'Mi posición',
    profileTitle:'Mi perfil',secureKey:'Clave segura',secureKeyWarn:'⚠️ Guarda esta clave de forma segura. ¡No se puede recuperar!',
    settings:'Ajustes',language:'Idioma',notifications:'Notificaciones',
    tgOnly:'Esta app solo funciona dentro de Telegram',openBot:'Abrir Bot',
    banned:'Tu cuenta ha sido baneada.',insufficientBal:'Saldo insuficiente',wrongPassword:'Contraseña incorrecta',
    shopTitle:'Tienda',buyWithPass:'Comprar con contraseña',buyWithStars:'Comprar con estrellas',enterPassword:'Ingresa contraseña',enterAmount:'Ingresa cantidad',
    depositPrompt:'¿Cuánto depositar?',withdrawPrompt:'¿Cuánto retirar?',newNotif:'Nueva notificación',
  }
};

let _lang = localStorage.getItem('quinn_lang') || 'ar';

export function t(key) {
  return (translations[_lang] || translations.ar)[key] || key;
}

export function getLang() { return _lang; }

export function setLang(lang) {
  if (!translations[lang]) return;
  _lang = lang;
  localStorage.setItem('quinn_lang', lang);
  const isRTL = lang === 'ar';
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  // تحديث جميع العناصر data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    el.textContent = t(k);
  });
  document.dispatchEvent(new CustomEvent('langChanged', { detail: lang }));
}

// تهيئة اللغة عند التحميل
export function initLang() {
  const saved = localStorage.getItem('quinn_lang') || 'ar';
  setLang(saved);
}
