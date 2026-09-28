import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'ar';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Profile = {
  language: Language; goal: 'lose' | 'maintain' | 'gain'; age: number; sex: 'female' | 'male';
  height: number; weight: number; activity: 'sedentary' | 'light' | 'moderate' | 'active';
  halal: boolean; vegetarian: boolean; allergies: string; country: string; gentle: boolean;
  targets: { calories: number; protein: number; carbs: number; fat: number };
};
export type Meal = {
  id: string; date: string; type: MealType; source: 'photo' | 'manual' | 'plan' | 'copy' | 'barcode';
  name: string; photoUri?: string; calories: number; protein: number; carbs: number; fat: number;
  confidence?: 'low' | 'medium' | 'high'; portion: string;
};
export type PlannedMeal = { day: string; type: string; name: string; calories: number; protein: number; carbs: number; fat: number; recipe: string };
export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; date: string };
type Entry = { id: string; date: string; value: number };
type State = { profile: Profile | null; language: Language; meals: Meal[]; water: Entry[]; weights: Entry[]; plan: PlannedMeal[]; groceries: string[]; messages: ChatMessage[] };
const initial: State = { profile: null, language: 'en', meals: [], water: [], weights: [], plan: [], groceries: [], messages: [] };
type Context = State & {
  ready: boolean; update: (patch: Partial<State>) => void; addMeal: (meal: Meal) => void;
  editMeal: (meal: Meal) => void; deleteMeal: (id: string) => void; addWater: (value: number) => void;
  addWeight: (value: number) => void; clear: () => Promise<void>;
};
const PulseContext = createContext<Context | null>(null);
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const previousDate = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dateKey(d); };
export const calculateTargets = (p: Pick<Profile, 'age' | 'sex' | 'height' | 'weight' | 'activity' | 'goal'>) => {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const multiplier = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }[p.activity];
  const calories = Math.max(p.sex === 'female' ? 1200 : 1500, Math.round((bmr * multiplier + { lose: -350, maintain: 0, gain: 250 }[p.goal]) / 10) * 10);
  const protein = Math.round(p.weight * (p.goal === 'gain' ? 1.8 : 1.6));
  const fat = Math.round(calories * 0.28 / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
};
export function PulseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('pulse:v1').then(raw => {
      if (raw) { const parsed = JSON.parse(raw) as Partial<State>; setState({ ...initial, ...parsed }); }
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem('pulse:v1', JSON.stringify(state)).catch(() => {}); }, [state, ready]);
  const update = (patch: Partial<State>) => setState(s => ({ ...s, ...patch }));
  const addMeal = (meal: Meal) => setState(s => ({ ...s, meals: [meal, ...s.meals] }));
  const editMeal = (meal: Meal) => setState(s => ({ ...s, meals: s.meals.map(m => m.id === meal.id ? meal : m) }));
  const deleteMeal = (id: string) => setState(s => ({ ...s, meals: s.meals.filter(m => m.id !== id) }));
  const addWater = (value: number) => setState(s => ({ ...s, water: [{ id: uid(), date: dateKey(), value }, ...s.water] }));
  const addWeight = (value: number) => setState(s => ({ ...s, weights: [{ id: uid(), date: dateKey(), value }, ...s.weights] }));
  const clear = async () => { await AsyncStorage.removeItem('pulse:v1'); setState(initial); };
  return <PulseContext.Provider value={{ ...state, ready, update, addMeal, editMeal, deleteMeal, addWater, addWeight, clear }}>{children}</PulseContext.Provider>;
}
export function usePulse() {
  const value = useContext(PulseContext);
  if (!value) throw new Error('PulseProvider missing');
  return value;
}

const en = {
  home:'Home', log:'Log', plan:'Plan', coach:'Coach', profile:'Profile', today:'TODAY', greeting:'Your pace. Your progress.',
  hero:'A good day starts with a little awareness.', energy:'ENERGY', eaten:'eaten', remaining:'remaining', target:'target', kcal:'kcal',
  protein:'Protein', carbs:'Carbs', fat:'Fat', quickAdd:'LOG A MEAL', snap:'Snap a meal', library:'Choose photo', camera:'Take photo',
  water:'Water', addWater:'Add 250 ml', weight:'Weight', logWeight:'Log weight', kg:'kg', trend:'Recent check-ins',
  insight:'A LITTLE INSIGHT', insightEmpty:'Your patterns will appear here once you start logging. No rush.',
  insightData:'You have logged {count} meal(s) today. Every entry helps build a clearer picture.',
  diary:'TODAY’S DIARY', diaryEmpty:'Nothing logged yet. Start with a photo or add a meal by hand.',
  add:'Add', save:'Save', cancel:'Cancel', delete:'Delete', edit:'Edit', confirm:'Confirm', retry:'Try again',
  myDay:'Food log', logSub:'Capture the meal. Keep the moment.', photo:'PHOTO ANALYSIS', manual:'MANUAL ENTRY',
  search:'Search foods', searchHint:'Search a dish or ingredient', portions:'Portion', confidence:'Confidence', estimated:'Estimated by AI. Review before saving.',
  analyzing:'Reading your plate…', failed:'Something went wrong. Please try again.', noResults:'No matching foods. Add your own below.',
  custom:'Custom food', mealName:'Meal name', mealType:'Meal type', breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner', snack:'Snack',
  recent:'FREQUENT MEALS', yesterday:'YESTERDAY', copy:'Copy to today', noYesterday:'No meals logged yesterday.',
  barcode:'Scan a barcode', barcodeUnavailable:'Barcode scanning is not available in this build. Search foods instead.',
  barcodeIntro:'Scan a packaged food or enter the number below. Nutrition comes from the product label.',
  barcodeAim:'Align the barcode inside the frame.', barcodePermission:'Camera access lets you scan a barcode. You can always type it instead.',
  barcodeDenied:'Camera access is off. Open settings to enable it, or enter a barcode below.',
  openSettings:'Open settings', scanBarcode:'Open camera', stopScan:'Stop camera',
  barcodeEnter:'BARCODE NUMBER', barcodePlaceholder:'8, 12, 13 or 14 digits',
  barcodeLength:'Enter a complete 8, 12, 13 or 14-digit code.', lookupBarcode:'Look up product',
  barcodeLoading:'Checking the product label…', barcodeUnknown:'No usable label found',
  barcodePartial:'This product has missing or incomplete nutrition details. Search for it manually instead.',
  barcodeNoMatch:'We could not find this product right now. Check the number or search for it manually.',
  barcodeLabel:'PRODUCT LABEL · PER SERVING', barcodeReview:'Review and log meal',
  nutrition:'NUTRITION', review:'Review your estimate', adjust:'Adjust portion', plus:'Larger', minus:'Smaller',
  deleteAsk:'Delete this meal?', deleteBody:'This entry will be removed from your diary.',
  weekly:'Your week, considered.', planSub:'A flexible starting point, not a rulebook.', generate:'Build my week', regenerate:'Regenerate week',
  planEmpty:'A balanced week made for your preferences is one tap away.', grocery:'Grocery list', meals:'Meals', swap:'Swap', recipe:'How to make it', logMeal:'Log this meal', shoppingEmpty:'Generate a plan to see your list.',
  coachTitle:'A little support, anytime.', coachSub:'Ask about food, routines, or your diary.', coachHello:'What’s on your mind today?',
  prompt1:'How is my day looking?', prompt2:'Ideas for a balanced dinner', prompt3:'Help me understand my protein',
  ask:'Ask anything…', send:'Send', thinking:'Thinking it through…', coachError:'Could not reach the coach. Your message was not sent.',
  settings:'Your setup', goals:'GOALS & TARGETS', preferences:'PREFERENCES', privacy:'PRIVACY', about:'ABOUT',
  goal:'Goal', lose:'Lose', maintain:'Maintain', gain:'Gain', age:'Age', sex:'Sex', female:'Female', male:'Male',
  height:'Height (cm)', weightLabel:'Weight (kg)', activity:'Activity', sedentary:'Mostly sitting', light:'Lightly active', moderate:'Moderately active', active:'Very active',
  halal:'Halal', vegetarian:'Vegetarian', allergies:'Allergies / exclusions', country:'Country', language:'Language',
  gentle:'Gentle mode', gentleDesc:'Hide calorie numbers throughout the app', export:'Export my data', erase:'Delete all local data',
  eraseAsk:'Delete everything?', eraseBody:'Your profile, diary, plan, and chat will be erased from this device. This cannot be undone.',
  legal:'Pulse supports general wellness, not medical advice. Estimates can be imperfect. If you have medical or dietary concerns, speak with a qualified professional.',
  billing:'Billing is not connected in this build.', targetEdit:'Edit targets', calculated:'Calculated starting point · Mifflin–St Jeor',
  start:'Get started', continue:'Continue', back:'Back', welcome:'Move forward, not perfectly.', welcomeSub:'A calmer way to understand what’s on your plate.', chooseLang:'CHOOSE YOUR LANGUAGE', onboardGoal:'What are you working toward?', onboardBody:'We’ll shape a starting point around you. You can always change it.',
  onboardDetails:'A few details for your baseline', onboardDetailsSub:'These help us calculate a useful daily range.',
  onboardPrefs:'Make it yours', onboardPrefsSub:'Food should fit your life, not the other way around.',
  readyTitle:'Your starting line.', readySub:'Your targets are a guide, never a grade.', tryPhoto:'Try a photo first', finish:'Start my day',
  validation:'Please check all fields and enter realistic values.', required:'Required', waterToday:'today', notEnough:'No data yet', serving:'serving',
  date:'Date', copied:'Added to today', saved:'Saved', checkIn:'Check-in', exportError:'Sharing is unavailable here.',
  day:'Day', selectDay:'Choose a day', emptyPlan:'No meals for this day.', uncertain:'Low confidence — double-check the portion.',
  customHint:'Values per selected portion', photoNeed:'Choose a photo to analyze.', permission:'Camera access is needed to take a photo. You can still use your library.',
  nudge:'The numbers are estimates, not a verdict.', dayTotal:'DAY TOTAL', noAccount:'No account needed to begin', skip:'Skip for now',
};
const ar: typeof en = {
  home:'الرئيسية', log:'السجل', plan:'الخطة', coach:'المدرب', profile:'حسابي', today:'اليوم', greeting:'على إيقاعك، تقدّمك.', hero:'يوم جيد يبدأ بقليل من الوعي.', energy:'الطاقة', eaten:'تم تناولها', remaining:'المتبقي', target:'الهدف', kcal:'سعرة',
  protein:'بروتين', carbs:'كربوهيدرات', fat:'دهون', quickAdd:'سجّل وجبة', snap:'صوّر وجبة', library:'اختر صورة', camera:'التقط صورة',
  water:'الماء', addWater:'أضف ٢٥٠ مل', weight:'الوزن', logWeight:'سجّل وزنك', kg:'كغ', trend:'آخر القياسات',
  insight:'ملاحظة صغيرة', insightEmpty:'ستظهر أنماطك هنا بعد بدء التسجيل. لا داعي للعجلة.',
  insightData:'سجّلت {count} وجبة اليوم. كل إدخال يساعدك على رؤية أوضح.',
  diary:'وجبات اليوم', diaryEmpty:'لم تسجّل شيئًا بعد. ابدأ بصورة أو أضف وجبة يدويًا.',
  add:'إضافة', save:'حفظ', cancel:'إلغاء', delete:'حذف', edit:'تعديل', confirm:'تأكيد', retry:'حاول مجددًا',
  myDay:'سجل الطعام', logSub:'التقط وجبتك واستمتع بلحظتك.', photo:'تحليل الصورة', manual:'إدخال يدوي',
  search:'ابحث عن طعام', searchHint:'ابحث عن طبق أو مكوّن', portions:'الحصة', confidence:'الثقة', estimated:'تقدير بالذكاء الاصطناعي. راجعه قبل الحفظ.',
  analyzing:'نقرأ طبقك…', failed:'حدث خطأ. حاول مرة أخرى.', noResults:'لا توجد نتائج. أضف طعامك أدناه.',
  custom:'طعام مخصص', mealName:'اسم الوجبة', mealType:'نوع الوجبة', breakfast:'فطور', lunch:'غداء', dinner:'عشاء', snack:'وجبة خفيفة',
  recent:'وجبات متكررة', yesterday:'أمس', copy:'انسخ إلى اليوم', noYesterday:'لا توجد وجبات مسجّلة أمس.',
  barcode:'امسح الرمز', barcodeUnavailable:'مسح الرمز غير متاح في هذه النسخة. ابحث عن الطعام بدلًا منه.',
  barcodeIntro:'امسح رمز طعام مغلّف أو أدخل رقمه أدناه. القيم الغذائية مأخوذة من ملصق المنتج.',
  barcodeAim:'ضع الرمز داخل الإطار.', barcodePermission:'تتيح لك الكاميرا مسح الرمز. يمكنك أيضًا إدخاله يدويًا.',
  barcodeDenied:'إذن الكاميرا متوقف. افتح الإعدادات لتفعيله أو أدخل الرمز أدناه.',
  openSettings:'افتح الإعدادات', scanBarcode:'افتح الكاميرا', stopScan:'أوقف الكاميرا',
  barcodeEnter:'رقم الرمز', barcodePlaceholder:'٨ أو ١٢ أو ١٣ أو ١٤ رقمًا',
  barcodeLength:'أدخل رمزًا كاملًا من ٨ أو ١٢ أو ١٣ أو ١٤ رقمًا.', lookupBarcode:'ابحث عن المنتج',
  barcodeLoading:'نراجع ملصق المنتج…', barcodeUnknown:'لا يوجد ملصق صالح',
  barcodePartial:'القيم الغذائية لهذا المنتج ناقصة أو غير مكتملة. ابحث عنه يدويًا بدلًا من ذلك.',
  barcodeNoMatch:'لم نجد هذا المنتج الآن. تحقق من الرقم أو ابحث عنه يدويًا.',
  barcodeLabel:'ملصق المنتج · لكل حصة', barcodeReview:'راجع الوجبة وسجّلها',
  nutrition:'القيم الغذائية', review:'راجع تقديرك', adjust:'عدّل الحصة', plus:'أكبر', minus:'أصغر',
  deleteAsk:'حذف هذه الوجبة؟', deleteBody:'ستُزال من سجل طعامك.',
  weekly:'أسبوعك، بطريقتك.', planSub:'نقطة بداية مرنة، وليست قواعد صارمة.', generate:'أنشئ خطة أسبوعي', regenerate:'أعد إنشاء الخطة',
  planEmpty:'أسبوع متوازن يناسب تفضيلاتك على بُعد لمسة.', grocery:'قائمة التسوق', meals:'الوجبات', swap:'بدّل', recipe:'طريقة التحضير', logMeal:'سجّل هذه الوجبة', shoppingEmpty:'أنشئ خطة لرؤية قائمة التسوق.',
  coachTitle:'دعم بسيط، متى أردت.', coachSub:'اسأل عن طعامك أو روتينك أو سجلك.', coachHello:'بمَ تفكّر اليوم؟',
  prompt1:'كيف يبدو يومي؟', prompt2:'أفكار لعشاء متوازن', prompt3:'ساعدني في فهم البروتين',
  ask:'اسأل ما تشاء…', send:'أرسل', thinking:'نفكّر في الأمر…', coachError:'تعذّر الوصول إلى المدرب. لم تُرسل رسالتك.',
  settings:'إعداداتك', goals:'الأهداف والقيم', preferences:'التفضيلات', privacy:'الخصوصية', about:'عن التطبيق',
  goal:'الهدف', lose:'خسارة الوزن', maintain:'المحافظة', gain:'زيادة الوزن', age:'العمر', sex:'الجنس', female:'أنثى', male:'ذكر',
  height:'الطول (سم)', weightLabel:'الوزن (كغ)', activity:'النشاط', sedentary:'جلوس غالبًا', light:'نشاط خفيف', moderate:'نشاط متوسط', active:'نشاط عالٍ',
  halal:'حلال', vegetarian:'نباتي', allergies:'حساسية / أطعمة مستبعدة', country:'البلد', language:'اللغة',
  gentle:'الوضع اللطيف', gentleDesc:'إخفاء أرقام السعرات في التطبيق', export:'صدّر بياناتي', erase:'احذف كل البيانات المحلية',
  eraseAsk:'هل تريد حذف كل شيء؟', eraseBody:'سيُحذف ملفك وسجلك وخطتك ومحادثتك من هذا الجهاز. لا يمكن التراجع.',
  legal:'يدعم Pulse الصحة العامة ولا يقدم نصيحة طبية. التقديرات قد لا تكون دقيقة. استشر مختصًا إذا كانت لديك مخاوف صحية أو غذائية.',
  billing:'الدفع غير متصل في هذه النسخة.', targetEdit:'تعديل الأهداف', calculated:'نقطة بداية محسوبة · ميفلين–سانت جيور',
  start:'ابدأ', continue:'التالي', back:'السابق', welcome:'تقدّم، لا كمال.', welcomeSub:'طريقة أهدأ لفهم ما في طبقك.', chooseLang:'اختر لغتك', onboardGoal:'ما هدفك الحالي؟', onboardBody:'سنضع نقطة بداية تناسبك. يمكنك تغييرها دائمًا.',
  onboardDetails:'بعض التفاصيل لنقطة البداية', onboardDetailsSub:'تساعدنا على حساب نطاق يومي مفيد.',
  onboardPrefs:'اجعلها تناسبك', onboardPrefsSub:'الغذاء يناسب حياتك، وليس العكس.',
  readyTitle:'خط البداية.', readySub:'أهدافك دليل، لا حكم.', tryPhoto:'جرّب صورة أولًا', finish:'ابدأ يومي',
  validation:'تحقق من الحقول وأدخل قيمًا منطقية.', required:'مطلوب', waterToday:'اليوم', notEnough:'لا توجد بيانات بعد', serving:'حصة',
  date:'التاريخ', copied:'أُضيفت إلى اليوم', saved:'تم الحفظ', checkIn:'قياس', exportError:'المشاركة غير متاحة هنا.',
  day:'اليوم', selectDay:'اختر يومًا', emptyPlan:'لا وجبات لهذا اليوم.', uncertain:'الثقة منخفضة — تحقق من الحصة.',
  customHint:'القيم للحصة المختارة', photoNeed:'اختر صورة للتحليل.', permission:'نحتاج إذن الكاميرا للتصوير. يمكنك استخدام المعرض.', nudge:'الأرقام تقديرات، وليست أحكامًا.', dayTotal:'مجموع اليوم', noAccount:'لا تحتاج إلى حساب للبدء', skip:'تخطَّ الآن',
};
export const words = { en, ar };
export function useT() {
  const { language } = usePulse();
  return { t: words[language], rtl: language === 'ar', language };
}