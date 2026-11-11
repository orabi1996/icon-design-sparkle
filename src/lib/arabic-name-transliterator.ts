/**
 * محول الأسماء العربية إلى الإنجليزية الأمريكية (US English Transliteration)
 * مع التحقق من الاسم الرباعي (4 مقاطع اسمية)
 */

const COMPOUND_PREFIXES = new Set([
  "عبد",
  "أبو",
  "ابو",
  "أبي",
  "ابي",
  "ابن",
  "بن",
  "بنت",
  "آل",
  "ال",
  "أم",
  "ام",
  "ذو",
  "ذي",
  "سيف",
  "نور",
  "تاج",
  "سعد",
  "شمس",
  "علاء",
  "بهاء",
  "ضياء",
  "حسام",
  "عماد",
  "صلاح",
  "جمال",
  "كمال",
  "جلال",
  "عز",
  "فخر",
  "شهاب",
  "تقي",
  "ولي",
  "محي",
  "محيي",
]);

const COMPOUND_SUFFIXES = new Set(["الله", "الرحمن", "الرحيم", "العزيز", "الملك", "الكريم", "السلام", "القدوس", "المهيمن", "الجبار", "المتكبر", "الخالق", "البارئ", "المصور", "الغفار", "القهار", "الوهاب", "الرزاق", "الفتاح", "العليم", "القابض", "الباسط", "السميع", "البصير", "الحكم", "العدل", "اللطيف", "الخبير", "الحليم", "العظيم", "الغفور", "الشكور", "العلي", "الكبير", "الحفيظ", "المقيت", "الحسيب", "الجليل", "الرقيب", "المجيب", "الواسع", "الحكيم", "الودود", "المجيد", "الباعث", "الشهيد", "الحق", "الوكيل", "القوي", "المتين", "الولي", "الحميد", "المحصي", "المبدئ", "المعيد", "المحيي", "المميت", "الحي", "القيوم", "الواجد", "الماجد", "الواحد", "الأحد", "الصمد", "القادر", "المقتدر", "المقدم", "المؤخر", "الأول", "الآخر", "الظاهر", "الباطن", "الوالي", "المتعالي", "البر", "التواب", "المنتقم", "العفو", "الرؤوف", "الرحمن", "الجلال", "الإكرام", "المقسط", "الجامع", "الغني", "المغني", "المانع", "الضار", "النافع", "النور", "الهادي", "البديع", "الباقي", "الوارث", "الرشيد", "الصبور", "الدين", "الإسلام", "الحق", "الدولة", "الملة"]);

/**
 * تقسيم الاسم العربي إلى مقاطع اسمية حقيقية (مع دمج الأسماء المركبة مثل "عبد الله" أو "صلاح الدين")
 */
export function splitArabicNameParts(rawName: string): string[] {
  const cleaned = String(rawName || "")
    .replace(/[^\u0600-\u06FF\sA-Za-z]/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (!cleaned) return [];
  const rawTokens = cleaned.split(" ").filter(Boolean);
  const merged: string[] = [];

  let i = 0;
  while (i < rawTokens.length) {
    const current = rawTokens[i]!;
    const next = rawTokens[i + 1];

    if (
      next &&
      ((current === "عبد" || current === "أبو" || current === "ابو" || current === "آل" || current === "أم" || current === "ام" || current === "ابن" || current === "بن" || current === "بنت") ||
        (COMPOUND_PREFIXES.has(current) && COMPOUND_SUFFIXES.has(next)))
    ) {
      merged.push(`${current} ${next}`);
      i += 2;
    } else {
      merged.push(current);
      i += 1;
    }
  }

  return merged;
}

/**
 * التحقق مما إذا كان الاسم رباعياً على الأقل (4 مقاطع اسمية)
 */
export function validateQuadrupleArabicName(rawName: string): {
  isValid: boolean;
  partsCount: number;
  parts: string[];
  message: string;
} {
  const parts = splitArabicNameParts(rawName);
  const partsCount = parts.length;

  if (partsCount === 0) {
    return {
      isValid: false,
      partsCount: 0,
      parts: [],
      message: "يرجى إدخال اسم الموظف رباعياً (الاسم الأول، الأب، الجد، العائلة)",
    };
  }

  const tooShortPart = parts.some((p) => p.replace(/\s+/g, "").length < 2);
  if (tooShortPart) {
    return {
      isValid: false,
      partsCount,
      parts,
      message: "يجب أن يتكون كل مقطع من الاسم من حرفين على الأقل",
    };
  }

  if (partsCount < 4) {
    const remaining = 4 - partsCount;
    return {
      isValid: false,
      partsCount,
      parts,
      message: `الاسم المدخل (${partsCount} من 4 مقاطع) — يرجى استكمال ${remaining === 1 ? "اللقب/العائلة" : `باقي الاسم الرباعي (${remaining} مقاطع متبقية)`}`,
    };
  }

  return {
    isValid: true,
    partsCount,
    parts,
    message: "الاسم رباعي مكتمل وصحيح ✓",
  };
}

/**
 * قاموس شامل للأسماء العربية الشائعة بصيغة الإنجليزية الأمريكية (US English)
 */
const EXACT_NAME_DICTIONARY: Record<string, string> = {
  // أسماء مركبة
  "عبد الله": "Abdullah",
  "عبدالله": "Abdullah",
  "عبد الرحمن": "Abdulrahman",
  "عبدالرحمن": "Abdulrahman",
  "عبد العزيز": "Abdulaziz",
  "عبدالعزيز": "Abdulaziz",
  "عبد المجيد": "Abdulmajeed",
  "عبدالمجيد": "Abdulmajeed",
  "عبد الملك": "Abdulmalik",
  "عبدالملك": "Abdulmalik",
  "عبد الإله": "Abdulelah",
  "عبدالإله": "Abdulelah",
  "عبد الاله": "Abdulelah",
  "عبدالاله": "Abdulelah",
  "عبد الكريم": "Abdulkarim",
  "عبدالكريم": "Abdulkarim",
  "عبد الرحيم": "Abdulrahim",
  "عبدالرحيم": "Abdulrahim",
  "عبد اللطيف": "Abdullatif",
  "عبداللطيف": "Abdullatif",
  "عبد الحميد": "Abdulhamid",
  "عبدالحميد": "Abdulhamid",
  "عبد الوهاب": "Abdulwahab",
  "عبدالوهاب": "Abdulwahab",
  "عبد السلام": "Abdulsalam",
  "عبدالسلام": "Abdulsalam",
  "عبد القادر": "Abdulkader",
  "عبدالقادر": "Abdulkader",
  "عبد الرزاق": "Abdulrazzaq",
  "عبدالرزاق": "Abdulrazzaq",
  "عبد الغني": "Abdulghani",
  "عبدالغني": "Abdulghani",
  "عبد الفتاح": "Abdulfattah",
  "عبدالفتاح": "Abdulfattah",
  "عبد الهادي": "Abdulhadi",
  "عبدالهادي": "Abdulhadi",
  "عبد الخالق": "Abdulkhaliq",
  "عبدالخالق": "Abdulkhaliq",
  "عبد الرؤوف": "Abdulraouf",
  "عبدالرؤوف": "Abdulraouf",
  "عبد الباسط": "Abdulbasit",
  "عبدالباسط": "Abdulbasit",
  "عبد الجليل": "Abduljalil",
  "عبدالجليل": "Abduljalil",
  "عبد المنعم": "Abdulmoneim",
  "عبدالمنعم": "Abdulmoneim",
  "عبد المحسن": "Abdulmohsen",
  "عبدالمحسن": "Abdulmohsen",
  "عبد الناصر": "Abdulnasser",
  "عبدالناصر": "Abdulnasser",
  "عبد الحليم": "Abdulhalim",
  "عبدالحليم": "Abdulhalim",
  "عبد الحكيم": "Abdulhakim",
  "عبدالحكيم": "Abdulhakim",
  "عبد العظيم": "Abdulazim",
  "عبدالعظيم": "Abdulazim",
  "عبد الجواد": "Abduljawad",
  "عبدالجواد": "Abduljawad",
  "عبد التواب": "Abdultawab",
  "عبدالتواب": "Abdultawab",
  "عبد المقصود": "Abdulmaqsoud",
  "عبدالمقصود": "Abdulmaqsoud",
  "عبد الصمد": "Abdulsamad",
  "عبدالصمد": "Abdulsamad",
  "عبد الستار": "Abdulsattar",
  "عبدالستار": "Abdulsattar",
  "عبد الغفار": "Abdulghaffar",
  "عبدالغفار": "Abdulghaffar",
  "عبد الواحد": "Abdulwahed",
  "عبدالواحد": "Abdulwahed",
  "عبد المعطي": "Abdulmoati",
  "عبدالمعطي": "Abdulmoati",
  "صلاح الدين": "Salahuddin",
  "علاء الدين": "Alaa Eldin",
  "بهاء الدين": "Bahaa Eldin",
  "ضياء الدين": "Diaa Eldin",
  "حسام الدين": "Hossam Eldin",
  "عماد الدين": "Emad Eldin",
  "نور الدين": "Noureddine",
  "جمال الدين": "Gamal Eldin",
  "كمال الدين": "Kamal Eldin",
  "عز الدين": "Ezzeldin",
  "سيف الدين": "Saifuddin",
  "شمس الدين": "Shamsuddin",
  "محي الدين": "Mohiuddin",
  "محيي الدين": "Mohiuddin",
  "أبو بكر": "Abu Bakr",
  "ابو بكر": "Abu Bakr",

  // أسماء رجال شائعة
  "محمد": "Mohammed",
  "أحمد": "Ahmed",
  "احمد": "Ahmed",
  "محمود": "Mahmoud",
  "مصطفى": "Mostafa",
  "مصطفي": "Mostafa",
  "إبراهيم": "Ibrahim",
  "ابراهيم": "Ibrahim",
  "إسماعيل": "Ismail",
  "اسماعيل": "Ismail",
  "يوسف": "Youssef",
  "علي": "Ali",
  "على": "Ali",
  "عمر": "Omar",
  "عمرو": "Amr",
  "عثمان": "Othman",
  "خالد": "Khaled",
  "فهد": "Fahad",
  "سلمان": "Salman",
  "سلطان": "Sultan",
  "سعود": "Saud",
  "تركي": "Turki",
  "فيصل": "Faisal",
  "نواف": "Nawaf",
  "نايف": "Naif",
  "بندر": "Bandar",
  "وليد": "Waleed",
  "طلال": "Talal",
  "مشاري": "Meshari",
  "مشعل": "Meshal",
  "متعب": "Mutaib",
  "مقرن": "Muqrin",
  "يزيد": "Yazeed",
  "زياد": "Ziyad",
  "ريان": "Rayan",
  "راكان": "Rakan",
  "تميم": "Tamim",
  "بدر": "Badr",
  "ماجد": "Majed",
  "ياسر": "Yasser",
  "عادل": "Adel",
  "سعيد": "Saeed",
  "سعد": "Saad",
  "صالح": "Saleh",
  "ناصر": "Nasser",
  "منصور": "Mansour",
  "حسن": "Hassan",
  "حسين": "Hussein",
  "محسن": "Mohsen",
  "طارق": "Tariq",
  "أنس": "Anas",
  "انس": "Anas",
  "أسامة": "Osama",
  "اسامة": "Osama",
  "اسامه": "Osama",
  "حمزة": "Hamza",
  "حمزه": "Hamza",
  "معاذ": "Muath",
  "صهيب": "Suhaib",
  "بلال": "Bilal",
  "عمار": "Ammar",
  "هاشم": "Hashem",
  "مازن": "Mazen",
  "مروان": "Marwan",
  "صفوان": "Safwan",
  "رضوان": "Radwan",
  "عدنان": "Adnan",
  "حمدان": "Hamdan",
  "حمد": "Hamad",
  "حامد": "Hamed",
  "حميد": "Hameed",
  "مانع": "Mane",
  "سالم": "Salem",
  "سليم": "Salim",
  "سليمان": "Sulaiman",
  "داود": "Dawood",
  "داوود": "Dawood",
  "موسى": "Mousa",
  "عيسى": "Eissa",
  "يحيى": "Yahya",
  "يحيي": "Yahya",
  "زكريا": "Zakaria",
  "أيوب": "Ayoub",
  "ايوب": "Ayoub",
  "هارون": "Haroun",
  "نوح": "Noah",
  "آدم": "Adam",
  "ادم": "Adam",
  "أشرف": "Ashraf",
  "اشرف": "Ashraf",
  "شريف": "Sherif",
  "كريم": "Karim",
  "أكرم": "Akram",
  "اكرم": "Akram",
  "حازم": "Hazem",
  "باسم": "Bassem",
  "بسام": "Bassam",
  "وسام": "Wissam",
  "هشام": "Hesham",
  "عصام": "Essam",
  "حسام": "Hossam",
  "عماد": "Emad",
  "فؤاد": "Fouad",
  "إياد": "Eyad",
  "اياد": "Eyad",
  "جهاد": "Jihad",
  "مراد": "Murad",
  "رشاد": "Rashad",
  "فادي": "Fadi",
  "شادي": "Shady",
  "هادي": "Hadi",
  "مهدي": "Mahdi",
  "مجدي": "Magdy",
  "حمدي": "Hamdy",
  "رشدي": "Roshdy",
  "فتحي": "Fathy",
  "صبحي": "Sobhy",
  "فهمي": "Fahmy",
  "حلمي": "Helmy",
  "عزمي": "Azmy",
  "شوقي": "Shawky",
  "رمزي": "Ramzy",
  "فوزي": "Fawzy",
  "لطفي": "Lotfy",
  "وصفي": "Wasfy",
  "سامي": "Sami",
  "رامي": "Rami",
  "هاني": "Hani",
  "تامر": "Tamer",
  "عامر": "Amer",
  "ثامر": "Thamer",
  "سامر": "Samer",
  "ماهر": "Maher",
  "زاهر": "Zaher",
  "طاهر": "Taher",
  "باهر": "Baher",
  "شاكر": "Shaker",
  "صابر": "Saber",
  "جابر": "Jaber",
  "نادر": "Nader",
  "قادر": "Kader",
  "ياسين": "Yassin",
  "أمين": "Amin",
  "امين": "Amin",
  "مأمون": "Mamoun",
  "أيمن": "Ayman",
  "ايمن": "Ayman",
  "أنور": "Anwar",
  "انور": "Anwar",
  "منير": "Mounir",
  "سمير": "Samir",
  "أمير": "Amir",
  "امير": "Amir",
  "نبيل": "Nabil",
  "جميل": "Jamil",
  "خليل": "Khalil",
  "جليل": "Jalil",
  "كامل": "Kamel",
  "شامل": "Shamel",
  "وائل": "Wael",
  "نائل": "Nael",
  "رائد": "Raed",
  "سائد": "Saed",
  "قائد": "Qaed",
  "فارس": "Fares",
  "حارث": "Harith",
  "ليث": "Laith",
  "غيث": "Ghaith",
  "زيد": "Zaid",
  "عبيد": "Obaid",
  "راشد": "Rashed",
  "مرشد": "Murshed",
  "مهند": "Mohannad",
  "مؤيد": "Moayad",
  "سيد": "Sayed",
  "السيد": "Elsayed",
  "فريد": "Farid",
  "وحيد": "Wahid",
  "مجيد": "Majeed",
  "رشيد": "Rasheed",
  "نبوي": "Nabawy",
  "بدوي": "Badawy",
  "عوض": "Awad",
  "بكر": "Bakr",
  "صبري": "Sabry",
  "شكري": "Shoukry",
  "فكري": "Fekry",
  "يسري": "Yousry",
  "مرسي": "Morsy",
  "بيومي": "Bayoumi",
  "شعبان": "Shaaban",
  "رمضان": "Ramadan",
  "رجب": "Ragab",
  "ممدوح": "Mamdouh",
  "مدحت": "Medhat",
  "طلعت": "Talaat",
  "رفعت": "Refaat",
  "نشأت": "Nashaat",
  "ثروت": "Tharwat",
  "صفوت": "Safwat",
  "عصمت": "Esmat",
  "بهجت": "Bahgat",
  "رأفت": "Raafat",
  "عفت": "Effat",
  "جمال": "Gamal",
  "كمال": "Kamal",
  "جلال": "Galal",
  "دلال": "Dalal",
  "منال": "Manal",
  "نوال": "Nawal",
  "نبراس": "Nibras",
  "عاطف": "Atef",
  "عاكف": "Akef",
  "واصف": "Wasef",
  "ناصف": "Nassef",
  "منصف": "Monsef",
  "أشجعي": "Ashjai",
  "عرابي": "Oraby",
  "أوربي": "Oraby",

  // أسماء إناث شائعة
  "فاطمة": "Fatimah",
  "فاطمه": "Fatimah",
  "مريم": "Maryam",
  "سارة": "Sarah",
  "ساره": "Sarah",
  "نورة": "Noura",
  "نوره": "Noura",
  "نور": "Nour",
  "عائشة": "Aisha",
  "عائشه": "Aisha",
  "خديجة": "Khadijah",
  "خديجه": "Khadijah",
  "حفصة": "Hafsa",
  "زينب": "Zainab",
  "رقية": "Ruqayyah",
  "سمية": "Somaya",
  "سميه": "Somaya",
  "أسماء": "Asmaa",
  "اسماء": "Asmaa",
  "شيماء": "Shaimaa",
  "علياء": "Aliaa",
  "لمياء": "Lamiaa",
  "نجلاء": "Naglaa",
  "وفاء": "Wafaa",
  "صفاء": "Safaa",
  "هناء": "Hanaa",
  "سناء": "Sanaa",
  "دعاء": "Doaa",
  "نداء": "Nedaa",
  "ولاء": "Walaa",
  "آلاء": "Alaa",
  "الاء": "Alaa",
  "إسراء": "Esraa",
  "اسراء": "Esraa",
  "زهراء": "Zahraa",
  "حسناء": "Hasnaa",
  "ميساء": "Maysaa",
  "رغد": "Raghad",
  "شهد": "Shahd",
  "وعد": "Waad",
  "عهد": "Ahad",
  "مجد": "Majd",
  "هند": "Hind",
  "خلود": "Kholoud",
  "عنود": "Anoud",
  "العنود": "Al-Anoud",
  "الجوهرة": "Al-Jawharah",
  "لطيفة": "Latifah",
  "منيرة": "Munirah",
  "أميرة": "Amirah",
  "اميرة": "Amirah",
  "اميره": "Amirah",
  "سميرة": "Samirah",
  "جميلة": "Jamilah",
  "نبيلة": "Nabilah",
  "وسيلة": "Wasilah",
  "حليمة": "Halimah",
  "كريمة": "Karimah",
  "رحمة": "Rahmah",
  "نعمة": "Naemah",
  "بسمة": "Basmah",
  "نسمة": "Nasmah",
  "حكمة": "Hikmah",
  "سلمى": "Salma",
  "لبنى": "Lubna",
  "منى": "Mona",
  "هدى": "Huda",
  "ندى": "Nada",
  "شذى": "Shatha",
  "سهى": "Suha",
  "نهى": "Noha",
  "ضحى": "Duha",
  "سجى": "Saja",
  "تقى": "Tuqa",
  "رؤى": "Roaa",
  "ربى": "Ruba",
  "جنى": "Jana",
  "لمى": "Lama",
  "علا": "Ola",
  "رنا": "Rana",
  "رشا": "Rasha",
  "مها": "Maha",
  "صفا": "Safa",
  "مروة": "Marwa",
  "مروه": "Marwa",
  "دينا": "Dina",
  "لينا": "Lina",
  "تينا": "Tina",
  "نينا": "Nina",
  "ريما": "Rima",
  "ريم": "Reem",
  "ديما": "Dima",
  "ديمة": "Dima",
  "حلا": "Hala",
  "غلا": "Ghala",
  "سمر": "Samar",
  "سحر": "Sahar",
  "قمر": "Qamar",
  "أمل": "Amal",
  "امل": "Amal",
  "إيمان": "Iman",
  "ايمان": "Iman",
  "حنان": "Hanan",
  "بيان": "Bayan",
  "روان": "Rawan",
  "رزان": "Razan",
  "سوزان": "Suzan",
  "جيهان": "Jihan",
  "نوران": "Nouran",
  "غفران": "Ghufran",
  "أفنان": "Afnan",
  "افنان": "Afnan",
  "ألحان": "Alhan",
  "وجدان": "Wijdan",
  "شيرين": "Sherine",
  "نسرين": "Nesreen",
  "ياسمين": "Yasmin",
  "نادين": "Nadine",
  "دارين": "Dareen",
  "لارين": "Lareen",
  "سيرين": "Sireen",
  "لجين": "Lujain",
  "حنين": "Haneen",
  "رنين": "Raneen",
  "عبير": "Abeer",
  "غدير": "Ghadeer",
  "هديل": "Hadeel",
  "أسيل": "Aseel",
  "اسيل": "Aseel",
  "رسيل": "Raseel",
  "عفاف": "Afaf",
  "سلاف": "Sulaf",
  "رهف": "Rahaf",
  "ترف": "Taraf",
  "نوف": "Nouf",
  "طيف": "Taif",
  "مي": "Mai",
  "في": "Fai",
  "آية": "Aya",
  "ايه": "Aya",
  "آيات": "Ayat",
  "بركة": "Barakah",
  "نجاح": "Najah",
  "سماح": "Samah",
  "صباح": "Sabah",
  "سعاد": "Suad",
  "وداد": "Widad",
  "نهاد": "Nihad",
  "ميعاد": "Miad",
  "ابتسام": "Ibtisam",
  "أحلام": "Ahlam",
  "احلام": "Ahlam",
  "إلهام": "Ilham",
  "الهام": "Ilham",
  "سهام": "Siham",
  "ريهام": "Riham",
  "هيام": "Hiam",
  "مرام": "Maram",
  "غرام": "Gharam",
  "وئام": "Wiam",
  "بشرى": "Bushra",
  "ذكرى": "Thikra",
  "يسرى": "Yusra",
  "نجوى": "Najwa",
  "سلوى": "Salwa",
  "فدوى": "Fadwa",
  "أروى": "Arwa",
  "اروى": "Arwa",
  "رضوى": "Radwa",
  "نشوى": "Nashwa",
  "تقوى": "Taqwa",

  // ألقاب وعائلات سعودية وعربية شائعة
  "العتيبي": "Al-Otaibi",
  "القحطاني": "Al-Qahtani",
  "الغامدي": "Al-Ghamdi",
  "الزهراني": "Al-Zahrani",
  "الشمري": "Al-Shammari",
  "الدوسري": "Al-Dosari",
  "الحربي": "Al-Harbi",
  "المطيري": "Al-Mutairi",
  "السبيعي": "Al-Subaie",
  "الشهري": "Al-Shehri",
  "العمري": "Al-Omari",
  "الشهراني": "Al-Shahrani",
  "العنزي": "Al-Anazi",
  "الجهني": "Al-Juhani",
  "المالكي": "Al-Malki",
  "السلمي": "Al-Sulami",
  "القرني": "Al-Qarni",
  "الأسمري": "Al-Asmari",
  "الاسمري": "Al-Asmari",
  "الأحمري": "Al-Ahmari",
  "الاحمري": "Al-Ahmari",
  "البقمي": "Al-Buqami",
  "اليامي": "Al-Yami",
  "الرشيدي": "Al-Rashidi",
  "الحازمي": "Al-Hazmi",
  "الخالدي": "Al-Khaldi",
  "التميمي": "Al-Tamimi",
  "الثبيتي": "Al-Thubaiti",
  "العصيمي": "Al-Osaimi",
  "الروقي": "Al-Roqi",
  "الشيباني": "Al-Shaibani",
  "الحارثي": "Al-Harthi",
  "الثقفي": "Al-Thaqafi",
  "القرشي": "Al-Qurashi",
  "الهاشمي": "Al-Hashemi",
  "الألمعي": "Al-Almai",
  "العسيري": "Al-Asiri",
  "الفيفي": "Al-Faifi",
  "الحكمي": "Al-Hakami",
  "حكمي": "Hakami",
  "مجرشي": "Majrashi",
  "عسيري": "Asiri",
  "غزواني": "Ghazwani",
  "خبراني": "Khabrani",
  "شمراني": "Shamrani",
  "الشمراني": "Al-Shamrani",
  "البلوي": "Al-Balawi",
  "العطوي": "Al-Atawi",
  "الحويطي": "Al-Huwaiti",
  "الشراري": "Al-Sharari",
  "الرويلي": "Al-Ruwaili",
  "السرحاني": "Al-Sarhani",
  "السديري": "Al-Sudairi",
  "العنقري": "Al-Anqari",
  "الراجحي": "Al-Rajhi",
  "العليان": "Al-Olayan",
  "الزامل": "Al-Zamil",
  "القصيبي": "Al-Gosaibi",
  "الجبر": "Al-Jabr",
  "المعيوف": "Al-Mayouf",
  "الفرج": "Al-Faraj",
  "البريك": "Al-Breik",
  "المولد": "Al-Muwallad",
  "الشهيل": "Al-Shuhail",
  "النجار": "El-Naggar",
  "الشافعي": "El-Shafei",
  "البدوي": "El-Badawy",
  "المنصوري": "Al-Mansouri",
  "الحسيني": "Al-Husseini",
  "المصري": "El-Masry",
  "الخطيب": "Al-Khatib",
  "المومني": "Al-Momani",
  "العباسي": "Al-Abbasi",
  "الكيلاني": "Al-Kilani",
  "الرفاعي": "Al-Rifai",
  "الدسوقي": "El-Desouky",
  "الشناوي": "El-Shenawy",
  "الشرقاوي": "El-Sharkawy",
  "الغرباوي": "El-Gharbawy",
  "البحراوي": "El-Bahrawy",
  "المنياوي": "El-Miniawy",
  "الأسيوطي": "El-Assiuty",
  "الصعيدي": "El-Saeedi",
  "الفيومي": "El-Fayoumi",
  "الدمياطي": "El-Domiaty",
  "طنطاوي": "Tantawy",
  "الطنطاوي": "El-Tantawy",
  "فرغلي": "Farghaly",
  "متولي": "Metwally",
  "الشاذلي": "El-Shazly",
  "الغزالي": "Al-Ghazali",
  "الأنصاري": "Al-Ansari",
  "الانصاري": "Al-Ansari",
  "البخاري": "Al-Bukhari",
  "الترمذي": "Al-Tirmidhi",
};

/**
 * خريطة الحروف العربية إلى المقابل الصوتي في الإنجليزية الأمريكية (US Phonetic Map)
 */
const ARABIC_CHAR_MAP: Record<string, string> = {
  "ا": "a",
  "أ": "a",
  "إ": "e",
  "آ": "aa",
  "ء": "",
  "ؤ": "o",
  "ئ": "e",
  "ب": "b",
  "ت": "t",
  "ث": "th",
  "ج": "j",
  "ح": "h",
  "خ": "kh",
  "د": "d",
  "ذ": "dh",
  "ر": "r",
  "ز": "z",
  "س": "s",
  "ش": "sh",
  "ص": "s",
  "ض": "d",
  "ط": "t",
  "ظ": "z",
  "ع": "a",
  "غ": "gh",
  "ف": "f",
  "ق": "q",
  "ك": "k",
  "ل": "l",
  "م": "m",
  "ن": "n",
  "ه": "h",
  "ة": "ah",
  "و": "w",
  "ي": "y",
  "ى": "a",
  "َ": "a",
  "ُ": "u",
  "ِ": "i",
  "ّ": "",
  "ْ": "",
  "ً": "an",
  "ٌ": "un",
  "ٍ": "in",
};

function capitalizeUsWord(word: string): string {
  if (!word) return "";
  if (word.includes("-")) {
    return word
      .split("-")
      .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ""))
      .join("-");
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * تحويل كلمة عربية مفردة إلى الإنجليزية الأمريكية صوتياً إذا لم تكن في القاموس
 */
function transliterateSingleArabicToken(token: string): string {
  const clean = token.trim();
  if (!clean) return "";

  // لو الكلمة أصلاً بالإنجليزية
  if (/^[A-Za-z\-']+$/.test(clean)) {
    return capitalizeUsWord(clean);
  }

  // بحث مباشر في القاموس
  if (EXACT_NAME_DICTIONARY[clean]) {
    return EXACT_NAME_DICTIONARY[clean]!;
  }

  // معالجة "ال" التعريف في بداية اللقب أو الاسم
  if (clean.startsWith("ال") && clean.length > 3) {
    const withoutAl = clean.slice(2);
    if (EXACT_NAME_DICTIONARY[withoutAl]) {
      return `Al-${EXACT_NAME_DICTIONARY[withoutAl]}`;
    }
    return `Al-${transliterateSingleArabicToken(withoutAl)}`;
  }

  // معالجة "عبد..." المتصلة
  if (clean.startsWith("عبدال") && clean.length > 5) {
    const rest = clean.slice(5);
    return `Abdul${transliterateSingleArabicToken(rest).toLowerCase()}`;
  }

  let out = "";
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]!;
    const prev = i > 0 ? clean[i - 1] : "";
    const next = i < clean.length - 1 ? clean[i + 1] : "";

    if (ch === "و") {
      // إذا كانت الواو في وسط الكلمة وليست في أولها تعامل كـ "ou" أو "o"
      out += i === 0 ? "w" : "ou";
    } else if (ch === "ي") {
      // إذا كانت الياء في نهاية الكلمة (مثل الزهراني / فهمي)
      if (i === clean.length - 1) {
        out += "i";
      } else if (i === 0) {
        out += "y";
      } else {
        out += "ee";
      }
    } else if (ch === "ع") {
      if (i === 0 && (next === "م" || next === "ث" || next === "ب" || next === "د")) {
        out += "o";
      } else if (i === 0 && (next === "ص" || next === "ز" || next === "ن" || next === "م")) {
        out += "e";
      } else {
        out += "a";
      }
    } else if (ch === "ا" && prev === "أ") {
      continue;
    } else {
      const mapped = ARABIC_CHAR_MAP[ch];
      if (mapped !== undefined) {
        out += mapped;
      }
    }
  }

  // تحسينات القراءة الصوتية الأمريكية (US Spelling cleanup)
  out = out
    .replace(/aaa+/g, "aa")
    .replace(/eee+/g, "ee")
    .replace(/ouou/g, "ou")
    .replace(/aah$/g, "ah");

  // إذا لم يكن هناك حروف متحركة بين الحروف الساكنة في البداية، نضيف 'a' خفيفة
  if (/^[bcdfghjklmnpqrstvwxyz]{2}/i.test(out) && !/^(sh|kh|gh|th|dh)/i.test(out)) {
    out = out[0] + "a" + out.slice(1);
  }

  return capitalizeUsWord(out);
}

/**
 * تحويل الاسم العربي (رباعي أو أكثر) تلقائياً إلى الإنجليزية الأمريكية (US English)
 */
export function transliterateArabicNameToUsEnglish(arabicFullName: string): string {
  const parts = splitArabicNameParts(arabicFullName);
  if (parts.length === 0) return "";

  const translatedParts = parts.map((part) => {
    const trimmed = part.trim();
    if (EXACT_NAME_DICTIONARY[trimmed]) {
      return EXACT_NAME_DICTIONARY[trimmed]!;
    }
    // إذا كان المقطع مركباً من كلمتين (مثل "عبد الله" أو "أبو بكر")
    if (trimmed.includes(" ")) {
      const [first, second] = trimmed.split(" ");
      if (first === "عبد" && second) {
        const comb = `عبد${second}`;
        if (EXACT_NAME_DICTIONARY[comb]) return EXACT_NAME_DICTIONARY[comb]!;
        if (EXACT_NAME_DICTIONARY[trimmed]) return EXACT_NAME_DICTIONARY[trimmed]!;
        const secEn = transliterateSingleArabicToken(second).replace(/^Al-/i, "");
        return `Abdul${secEn.toLowerCase()}`;
      }
      if ((first === "أبو" || first === "ابو") && second) {
        return `Abu ${transliterateSingleArabicToken(second)}`;
      }
      if (first === "آل" && second) {
        return `Al-${transliterateSingleArabicToken(second).replace(/^Al-/i, "")}`;
      }
      if ((first === "أم" || first === "ام") && second) {
        return `Umm ${transliterateSingleArabicToken(second)}`;
      }
      if ((first === "بن" || first === "ابن") && second) {
        return `Bin ${transliterateSingleArabicToken(second)}`;
      }
      if (first === "بنت" && second) {
        return `Bint ${transliterateSingleArabicToken(second)}`;
      }
      return trimmed
        .split(" ")
        .map((w) => transliterateSingleArabicToken(w))
        .join(" ");
    }

    return transliterateSingleArabicToken(trimmed);
  });

  return translatedParts.filter(Boolean).join(" ");
}
