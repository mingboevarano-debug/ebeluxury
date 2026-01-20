export interface Service {
  id: number;
  name: string;
  nameRu: string;
  nameUz: string;
  stage: string;
  stageRu: string;
  stageUz: string;
  cost: number;
}

// Static fallback services (will be replaced by database services)
export const STATIC_CONSTRUCTION_SERVICES: Service[] = [
  // I. PREPARATORY STAGE (1-10)
  { id: 1, name: 'Primary inspection of the apartment', nameRu: 'Первичный осмотр квартиры', nameUz: 'Kvartirani birinchi ko\'rikdan o\'tkazish', stage: 'I. PREPARATORY STAGE', stageRu: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', stageUz: 'I. TAYYORGARLIK BOSQICHI', cost: 6 },
  { id: 2, name: 'Laser measurements of all premises', nameRu: 'Лазерные замеры всех помещений', nameUz: 'Barcha xonalarni lazer bilan o\'lchash', stage: 'I. PREPARATORY STAGE', stageRu: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', stageUz: 'I. TAYYORGARLIK BOSQICHI', cost: 6 },
  { id: 3, name: 'Assessment of the condition of existing communications', nameRu: 'Оценка состояния существующих коммуникаций', nameUz: 'Mavjud kommunikatsiyalar holatini baholash', stage: 'I. PREPARATORY STAGE', stageRu: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', stageUz: 'I. TAYYORGARLIK BOSQICHI', cost: 6 },
  { id: 4, name: 'Identification of hidden defects (cracks, unevenness, dampness)', nameRu: 'Выявление скрытых дефектов (трещины, неровности, сырость)', nameUz: 'Yashirin nuqsonlarni aniqlash (yoriqlar, notekislik, namlik)', stage: 'I. PREPARATORY STAGE', stageRu: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', stageUz: 'I. TAYYORGARLIK BOSQICHI', cost: 6 },
  { id: 5, name: 'Discussion of customer requirements and wishes', nameRu: 'Обсуждение требований и пожеланий заказчика', nameUz: 'Mijoz talablari va istaklarini muhokama qilish', stage: 'I. PREPARATORY STAGE', stageRu: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', stageUz: 'I. TAYYORGARLIK BOSQICHI', cost: 6 },
  { id: 6, name: 'Preparation of the technical specification (TS)', nameRu: 'Составление технического задания (ТЗ)', nameUz: 'Texnik topshiriq (TT) tayyorlash', stage: 'I. PREPARATORY STAGE', stageRu: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', stageUz: 'I. TAYYORGARLIK BOSQICHI', cost: 6 },
  { id: 7, name: 'Preparation of the design concept', nameRu: 'Подготовка дизайн-концепции', nameUz: 'Dizayn konsepsiyasini tayyorlash', stage: 'I. PREPARATORY STAGE', stageRu: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', stageUz: 'I. TAYYORGARLIK BOSQICHI', cost: 6 },
  { id: 8, name: 'Development of a complete design project', nameRu: 'Разработка полного дизайн-проекта', nameUz: 'To\'liq dizayn loyihasini ishlab chiqish', stage: 'I. PREPARATORY STAGE', stageRu: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', stageUz: 'I. TAYYORGARLIK BOSQICHI', cost: 6 },
  { id: 9, name: 'Preparation of working drawings (electrics, plumbing, dismantling/installation)', nameRu: 'Подготовка рабочих чертежей (электрика, сантехника, демонтаж/монтаж)', nameUz: 'Ishchi chizmalarni tayyorlash (elektrika, sanitariya, demontaj/montaj)', stage: 'I. PREPARATORY STAGE', stageRu: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', stageUz: 'I. TAYYORGARLIK BOSQICHI', cost: 6 },
  { id: 10, name: 'Approval of the estimate and conclusion of the contract', nameRu: 'Согласование сметы и заключение договора', nameUz: 'Smetani tasdiqlash va shartnoma tuzish', stage: 'I. PREPARATORY STAGE', stageRu: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', stageUz: 'I. TAYYORGARLIK BOSQICHI', cost: 6 },

  // II. DISMANTLING WORKS (11-15)
  { id: 11, name: 'Demolition of partitions (according to the project)', nameRu: 'Снос перегородок (по проекту)', nameUz: 'Peregorodkalarni buzish (loyiha bo\'yicha)', stage: 'II. DISMANTLING WORKS', stageRu: 'II. ДЕМОНТАЖНЫЕ РАБОТЫ', stageUz: 'II. DEMONTAJ ISHLARI', cost: 6 },
  { id: 12, name: 'Removal of construction debris from rooms', nameRu: 'Уборка строительного мусора из комнат', nameUz: 'Xonalardan qurilish chiqindilarini olib tashlash', stage: 'II. DISMANTLING WORKS', stageRu: 'II. ДЕМОНТАЖНЫЕ РАБОТЫ', stageUz: 'II. DEMONTAJ ISHLARI', cost: 6 },
  { id: 13, name: 'Taking out trash to the stairwell', nameRu: 'Вынос мусора на лестничную площадку', nameUz: 'Chiqindilarni zinapoya maydonchasiga chiqarish', stage: 'II. DISMANTLING WORKS', stageRu: 'II. ДЕМОНТАЖНЫЕ РАБОТЫ', stageUz: 'II. DEMONTAJ ISHLARI', cost: 6 },
  { id: 14, name: 'Removal of trash by specialized transport', nameRu: 'Вывоз мусора специализированным транспортом', nameUz: 'Chiqindilarni maxsus transport bilan olib ketish', stage: 'II. DISMANTLING WORKS', stageRu: 'II. ДЕМОНТАЖНЫЕ РАБОТЫ', stageUz: 'II. DEMONTAJ ISHLARI', cost: 6 },
  { id: 15, name: 'Rough cleaning of the object before rough work', nameRu: 'Грубая уборка объекта перед черновыми работами', nameUz: 'Qo\'pol ishlar oldidan ob\'ektni qo\'pol tozalash', stage: 'II. DISMANTLING WORKS', stageRu: 'II. ДЕМОНТАЖНЫЕ РАБОТЫ', stageUz: 'II. DEMONTAJ ISHLARI', cost: 6 },

  // III. ROUGH CONSTRUCTION WORKS (16-31)
  { id: 16, name: 'Erection of new partitions', nameRu: 'Возведение новых перегородок', nameUz: 'Yangi peregorodkalarni qurish', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 17, name: 'Installation of sound insulation/thermal insulation (if required)', nameRu: 'Монтаж шумоизоляции/теплоизоляции (если требуется)', nameUz: 'Shovqin izolyatsiyasi/issiqlik izolyatsiyasini o\'rnatish (agar kerak bo\'lsa)', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 18, name: 'Laying new electrical wiring on walls and ceiling', nameRu: 'Прокладка новой электропроводки по стенам и потолку', nameUz: 'Devorlar va shift bo\'ylab yangi elektr simlarini yotqizish', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 19, name: 'Installation of junction boxes and socket boxes', nameRu: 'Монтаж распределительных коробок и подрозетников', nameUz: 'Tarqatish qutilari va rozetka qutilarini o\'rnatish', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 20, name: 'Installation of electrical panel and circuit breakers', nameRu: 'Установка электрощита и автоматов', nameUz: 'Elektr shchiti va avtomatlarni o\'rnatish', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 21, name: 'Checking electrical lines for load', nameRu: 'Проверка электрических линий на нагрузку', nameUz: 'Elektr liniyalarini yuklanish uchun tekshirish', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 23, name: 'Laying of plumbing pipes (water and sewage)', nameRu: 'Прокладка сантехнических труб (вода и канализация)', nameUz: 'Sanitariya quvurlarini yotqizish (suv va kanalizatsiya)', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 24, name: 'Installation of manifold, filters, and shut-off valves', nameRu: 'Монтаж коллектора, фильтров и запорных кранов', nameUz: 'Kollektor, filtrlar va to\'xtatish klapanlarini o\'rnatish', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 25, name: 'Installation of waterproofing (bathroom, kitchen, balcony)', nameRu: 'Устройство гидроизоляции (санузел, кухня, балкон)', nameUz: 'Gidroizolyatsiya qurish (hammom, oshxona, balkon)', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 26, name: 'Wall leveling with plaster using beacons', nameRu: 'Выравнивание стен штукатуркой по маякам', nameUz: 'Devorlarni mayaklar bo\'yicha gips bilan tekislash', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 27, name: 'Leveling of door and window slopes', nameRu: 'Выравнивание откосов дверей и окон', nameUz: 'Eshik va deraza yon bag\'irlarini tekislash', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 28, name: 'Installation of plasterboard structures (walls/ceilings)', nameRu: 'Монтаж гипсокартонных конструкций (стены/потолки)', nameUz: 'Gipsokarton konstruksiyalarni o\'rnatish (devorlar/shiflar)', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 29, name: 'Installation of floor screed', nameRu: 'Устройство стяжки пола', nameUz: 'Pol styazhkasini qurish', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 30, name: 'Floor leveling for finish coatings', nameRu: 'Выравнивание пола под чистовые покрытия', nameUz: 'Polni yakuniy qoplamalar uchun tekislash', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },
  { id: 31, name: 'Intermediate quality check of rough works', nameRu: 'Промежуточная проверка качества черновых работ', nameUz: 'Qo\'pol ishlar sifatini oraliq tekshirish', stage: 'III. ROUGH CONSTRUCTION WORKS', stageRu: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', stageUz: 'III. QO\'POL QURILISH ISHLARI', cost: 6 },

  // IV. PREPARATION FOR FINISHING (32-41)
  { id: 32, name: 'Wall putty (second layer)', nameRu: 'Шпатлевка стен (второй слой)', nameUz: 'Devorlarni shpatlevka qilish (ikkinchi qatlam)', stage: 'IV. PREPARATION FOR FINISHING', stageRu: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', stageUz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK', cost: 6 },
  { id: 33, name: 'Sanding walls and ceilings for painting', nameRu: 'Шлифовка стен и потолков под покраску', nameUz: 'Bo\'yash uchun devorlar va shiftlarni silliqlash', stage: 'IV. PREPARATION FOR FINISHING', stageRu: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', stageUz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK', cost: 6 },
  { id: 34, name: 'Deep penetration primer application on surfaces', nameRu: 'Грунтовка поверхностей глубокого проникновения', nameUz: 'Chuqur kiruvchi grunt qo\'llash', stage: 'IV. PREPARATION FOR FINISHING', stageRu: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', stageUz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK', cost: 6 },
  { id: 35, name: 'Ceiling preparation for painting or stretch ceiling', nameRu: 'Подготовка потолка под покраску или натяжной потолок', nameUz: 'Shiftni bo\'yash yoki cho\'ziladigan shift uchun tayyorlash', stage: 'IV. PREPARATION FOR FINISHING', stageRu: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', stageUz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK', cost: 6 },
  { id: 36, name: 'Wall mounting (bamboo panel)', nameRu: 'Монтаж на стен (бамбук панел)', nameUz: 'Devorga o\'rnatish (bambuk panel)', stage: 'IV. PREPARATION FOR FINISHING', stageRu: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', stageUz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK', cost: 6 },
  { id: 37, name: 'Marking zones for light fixtures and decorative elements', nameRu: 'Разметка зон под светильники и декоративные элементы', nameUz: 'Chiroqlar va dekorativ elementlar uchun zonalarni belgilash', stage: 'IV. PREPARATION FOR FINISHING', stageRu: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', stageUz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK', cost: 6 },
  { id: 38, name: 'Floor preparation for tiles/laminate', nameRu: 'Подготовка пола под плитку/ламинат', nameUz: 'Polni plitka/laminat uchun tayyorlash', stage: 'IV. PREPARATION FOR FINISHING', stageRu: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', stageUz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK', cost: 6 },
  { id: 39, name: 'Priming tile zones', nameRu: 'Грунтовка плиточных зон', nameUz: 'Plitka zonalarini gruntlash', stage: 'IV. PREPARATION FOR FINISHING', stageRu: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', stageUz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK', cost: 6 },
  { id: 40, name: 'Removal of dust and debris after preparatory work', nameRu: 'Вынос пыли и мусора после подготовительных работ', nameUz: 'Tayyorgarlik ishlaridan keyin chang va chiqindilarni olib tashlash', stage: 'IV. PREPARATION FOR FINISHING', stageRu: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', stageUz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK', cost: 6 },
  { id: 41, name: 'Final check of readiness for finishing', nameRu: 'Финальная проверка готовности к чистовой отделке', nameUz: 'Yakuniy qoplama uchun tayyorlikni yakuniy tekshirish', stage: 'IV. PREPARATION FOR FINISHING', stageRu: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', stageUz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK', cost: 6 },

  // V. FINISHING WORKS (42-51)
  { id: 42, name: 'Painting ceilings', nameRu: 'Окраска потолков', nameUz: 'Shiftlarni bo\'yash', stage: 'V. FINISHING WORKS', stageRu: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', stageUz: 'V. YAKUNIY QOPLAMA ISHLARI', cost: 6 },
  { id: 43, name: 'Painting walls', nameRu: 'Окраска стен', nameUz: 'Devorlarni bo\'yash', stage: 'V. FINISHING WORKS', stageRu: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', stageUz: 'V. YAKUNIY QOPLAMA ISHLARI', cost: 6 },
  { id: 44, name: 'Tile laying in the bathroom and kitchen area', nameRu: 'Укладка плитки в санузле и кухонной зоне', nameUz: 'Hammom va oshxona zonasida plitka yotqizish', stage: 'V. FINISHING WORKS', stageRu: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', stageUz: 'V. YAKUNIY QOPLAMA ISHLARI', cost: 6 },
  { id: 45, name: 'Grouting tile joints', nameRu: 'Затирка швов плитки', nameUz: 'Plitka tikuvlarini to\'ldirish', stage: 'V. FINISHING WORKS', stageRu: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', stageUz: 'V. YAKUNIY QOPLAMA ISHLARI', cost: 6 },
  { id: 46, name: 'Laying floor coverings (laminate)', nameRu: 'Укладка напольных покрытий (ламинат)', nameUz: 'Pol qoplamalarini yotqizish (laminat)', stage: 'V. FINISHING WORKS', stageRu: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', stageUz: 'V. YAKUNIY QOPLAMA ISHLARI', cost: 6 },
  { id: 47, name: 'Installation of interior doors', nameRu: 'Монтаж межкомнатных дверей', nameUz: 'Ichki eshiklarni o\'rnatish', stage: 'V. FINISHING WORKS', stageRu: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', stageUz: 'V. YAKUNIY QOPLAMA ISHLARI', cost: 6 },
  { id: 48, name: 'Installation of baseboards and architraves', nameRu: 'Монтаж плинтусов и наличников', nameUz: 'Plinthus va nalichniklarni o\'rnatish', stage: 'V. FINISHING WORKS', stageRu: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', stageUz: 'V. YAKUNIY QOPLAMA ISHLARI', cost: 6 },
  { id: 49, name: 'Installation of stretch ceilings (if provided)', nameRu: 'Установка натяжных потолков (если предусмотрено)', nameUz: 'Cho\'ziladigan shiftlarni o\'rnatish (agar ko\'rsatilgan bo\'lsa)', stage: 'V. FINISHING WORKS', stageRu: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', stageUz: 'V. YAKUNIY QOPLAMA ISHLARI', cost: 6 },
  { id: 50, name: 'Installation of decorative elements (panels, moldings)', nameRu: 'Монтаж декоративных элементов (панели, молдинги)', nameUz: 'Dekorativ elementlarni o\'rnatish (panellar, mol\'dinglar)', stage: 'V. FINISHING WORKS', stageRu: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', stageUz: 'V. YAKUNIY QOPLAMA ISHLARI', cost: 6 },
  { id: 51, name: 'Final quality check of finishing', nameRu: 'Финишная проверка качества отделки', nameUz: 'Yakuniy qoplama sifatini yakuniy tekshirish', stage: 'V. FINISHING WORKS', stageRu: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', stageUz: 'V. YAKUNIY QOPLAMA ISHLARI', cost: 6 },

  // VI. INSTALLATION OF EQUIPMENT AND FURNITURE (52-54)
  { id: 52, name: 'Installation of sanitary ware (toilet, sink, faucets, shower)', nameRu: 'Установка сантехнических приборов (унитаз, раковина, смесители, душевая)', nameUz: 'Sanitariya asboblarini o\'rnatish (hajatxona, umivalnik, kranlar, dush)', stage: 'VI. INSTALLATION OF EQUIPMENT AND FURNITURE', stageRu: 'VI. УСТАНОВКА ОБОРУДОВАНИЯ И ФУРНИТУРЫ', stageUz: 'VI. USKUNALAR VA MEBEL O\'RNATISH', cost: 6 },
  { id: 53, name: 'Installation of sockets, switches, lighting fixtures', nameRu: 'Установка розеток, выключателей, осветительных приборов', nameUz: 'Rozetkalar, kalitlar, yoritish asboblarini o\'rnatish', stage: 'VI. INSTALLATION OF EQUIPMENT AND FURNITURE', stageRu: 'VI. УСТАНОВКА ОБОРУДОВАНИЯ И ФУРНИТУРЫ', stageUz: 'VI. USKUNALAR VA MEBEL O\'RNATISH', cost: 6 },
  { id: 54, name: 'Installation of kitchen furniture and built-in appliances (as per agreement)', nameRu: 'Монтаж кухонной мебели и встроенной техники (по договору)', nameUz: 'Oshxona mebeli va o\'rnatilgan texnikani o\'rnatish (shartnoma bo\'yicha)', stage: 'VI. INSTALLATION OF EQUIPMENT AND FURNITURE', stageRu: 'VI. УСТАНОВКА ОБОРУДОВАНИЯ И ФУРНИТУРЫ', stageUz: 'VI. USKUNALAR VA MEBEL O\'RNATISH', cost: 6 },
];

// Export services - try to fetch from database, fallback to static
let cachedServices: Service[] | null = null;

export const getConstructionServices = async (): Promise<Service[]> => {
  // Return cached if available
  if (cachedServices) {
    return cachedServices;
  }

  try {
    // Try to fetch from database
    const { getServices } = await import('@/lib/db');
    const dbServices = await getServices();
    
    if (dbServices && dbServices.length > 0) {
      cachedServices = dbServices;
      return dbServices;
    }
  } catch (error) {
    console.warn('Failed to fetch services from database, using static fallback:', error);
  }

  // Fallback to static services
  cachedServices = STATIC_CONSTRUCTION_SERVICES;
  return STATIC_CONSTRUCTION_SERVICES;
};

// For backward compatibility, export as CONSTRUCTION_SERVICES
// This will be populated on first use
export let CONSTRUCTION_SERVICES: Service[] = STATIC_CONSTRUCTION_SERVICES;

// Initialize services on module load (client-side only)
if (typeof window !== 'undefined') {
  getConstructionServices().then(services => {
    CONSTRUCTION_SERVICES = services;
  });
}

