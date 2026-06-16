import { useCallback } from 'react';
import { useSettings } from '../settings/SettingsContext';

/**
 * Greek is the source of truth (`el`). `en` must mirror its keys exactly —
 * the Translations type enforces that at compile time.
 */
const el = {
  // Tabs
  'tab.home': 'Είσοδος',
  'tab.results': 'Αποτέλεσμα',
  'tab.budget': 'Budget',
  'tab.profile': 'Προφίλ',

  // Segment / mode
  'mode.employee': 'Μισθωτός',
  'mode.freelancer': 'Μπλοκάκι',

  // Home
  'home.caption.employee': 'Βασικός Μικτός Μισθός (μηνιαίος)',
  'home.caption.freelancer': 'Μηνιαίες Αμοιβές (μηνιαίος)',
  'home.children': 'Παιδιά',
  'home.efkaClass': 'Κλάση ΕΦΚΑ',
  'home.triennia': 'Τριετίες',
  'home.perMonth': '/μήνα',
  'home.year': 'Έτος',
  'home.yearHint': 'Φορ. κλίμακα',
  'home.region': 'Περιοχή',
  'home.regionValue': 'Ελλάδα',
  'home.regionHint': 'Πανελλαδικά',
  'home.calculate': 'ΥΠΟΛΟΓΙΣΜΟΣ',

  // Results
  'results.empty.title': 'Κανένας υπολογισμός ακόμη',
  'results.empty.body': 'Συμπλήρωσε μισθό στην αρχική και πάτα ΥΠΟΛΟΓΙΣΜΟΣ.',
  'results.title': 'Ανάλυση {year}',
  'results.net': 'Καθαρά στο χέρι',
  'results.perMonth': '/ μήνα',
  'results.deductions': 'Κρατήσεις',
  'results.efka': 'Ασφαλιστικές Εισφορές (ΕΦΚΑ)',
  'results.tax': 'Φόρος Εισοδήματος',
  'results.totalDeductions': 'Σύνολο κρατήσεων',
  'results.netVsDed': 'Καθαρά vs Κρατήσεις',
  'results.legendNet': 'Καθαρά {pct}%',
  'results.legendDed': 'Κρατήσεις {pct}%',
  'results.paywall.title': 'AI Reverse Pricing',
  'results.paywall.body':
    'Βρες πόσο πρέπει να χρεώνεις ως freelancer για τον στόχο σου. Powered by AI.',
  'results.paywall.price': '€2.99 · one-time',
  'results.paywall.cta': 'Upgrade',

  // Budget
  'budget.empty.title': 'Δεν υπάρχει εισόδημα',
  'budget.empty.body': 'Υπολόγισε τον μισθό σου για να δεις το budget split.',
  'budget.title': 'Smart Budget Splitter',
  'budget.intro': 'Διαχωρισμός {amount} με αλγόριθμο 50/30/20',
  'budget.tag': '{year} inflation-adjusted',
  'budget.save': 'Αποθήκευση',
  'budget.export': 'Εξαγωγή PDF',
  'budget.needs': 'ΑΝΑΓΚΕΣ',
  'budget.wants': 'ΕΠΙΘΥΜΙΕΣ',
  'budget.savings': 'ΑΠΟΤΑΜΙΕΥΣΗ',
  'budget.item.rent': 'Max Ενοίκιο',
  'budget.item.energy': 'Ενέργεια & Λογαριασμοί',
  'budget.item.groceries': 'Σούπερ μάρκετ',
  'budget.item.lifestyle': 'Lifestyle',
  'budget.item.cafe': 'Cafés & Φαγητό',
  'budget.item.subs': 'Συνδρομές',
  'budget.item.invest': 'Index / Επενδύσεις',
  'budget.item.emergency': 'Emergency Fund',

  // Profile
  'profile.title': 'Προφίλ',
  'profile.guest': 'Επισκέπτης',
  'profile.guestSub': 'Σύνδεση για αποθήκευση υπολογισμών',
  'profile.signIn': 'Σύνδεση / Εγγραφή',
  'profile.proTitle': 'ZERØ Pro',
  'profile.proBody': 'AI Reverse Pricing, απεριόριστα σενάρια, εξαγωγή PDF χωρίς watermark.',
  'profile.proCta': 'Απόκτησε Pro',
  'profile.lastNet': 'Τελευταίο καθαρό',
  'profile.section.prefs': 'ΠΡΟΤΙΜΗΣΕΙΣ',
  'profile.section.support': 'ΥΠΟΣΤΗΡΙΞΗ',
  'profile.row.appearance': 'Εμφάνιση',
  'profile.row.language': 'Γλώσσα',
  'profile.row.taxYear': 'Φορολογικό έτος',
  'profile.row.currency': 'Νόμισμα',
  'profile.row.terms': 'Όροι χρήσης',
  'profile.row.privacy': 'Απόρρητο',
  'profile.row.rate': 'Βαθμολόγησε την εφαρμογή',
  'profile.version': 'ZERØ v1.0.0',

  // Appearance options
  'appearance.system': 'Αυτόματο',
  'appearance.light': 'Φωτεινό',
  'appearance.dark': 'Σκοτεινό',

  // Language options
  'language.el': 'Ελληνικά',
  'language.en': 'English',

  // Currency note
  'currency.note': 'Μόνο εμφάνιση συμβόλου — χωρίς μετατροπή ισοτιμίας.',

  // Generic
  'common.cancel': 'Άκυρο',
} as const;

export type StringKey = keyof typeof el;
type Translations = Record<StringKey, string>;

const en: Translations = {
  'tab.home': 'Input',
  'tab.results': 'Result',
  'tab.budget': 'Budget',
  'tab.profile': 'Profile',

  'mode.employee': 'Employee',
  'mode.freelancer': 'Freelancer',

  'home.caption.employee': 'Base Gross Salary (monthly)',
  'home.caption.freelancer': 'Monthly Revenue (monthly)',
  'home.children': 'Children',
  'home.efkaClass': 'EFKA Class',
  'home.triennia': 'Triennia',
  'home.perMonth': '/mo',
  'home.year': 'Year',
  'home.yearHint': 'Tax scale',
  'home.region': 'Region',
  'home.regionValue': 'Greece',
  'home.regionHint': 'Nationwide',
  'home.calculate': 'CALCULATE',

  'results.empty.title': 'No calculation yet',
  'results.empty.body': 'Enter a salary on the home tab and press CALCULATE.',
  'results.title': 'Breakdown {year}',
  'results.net': 'Take-home',
  'results.perMonth': '/ month',
  'results.deductions': 'Deductions',
  'results.efka': 'Social Security (EFKA)',
  'results.tax': 'Income Tax',
  'results.totalDeductions': 'Total deductions',
  'results.netVsDed': 'Net vs Deductions',
  'results.legendNet': 'Net {pct}%',
  'results.legendDed': 'Deductions {pct}%',
  'results.paywall.title': 'AI Reverse Pricing',
  'results.paywall.body':
    'Find out how much to charge as a freelancer to hit your target. Powered by AI.',
  'results.paywall.price': '€2.99 · one-time',
  'results.paywall.cta': 'Upgrade',

  'budget.empty.title': 'No income',
  'budget.empty.body': 'Calculate your salary to see the budget split.',
  'budget.title': 'Smart Budget Splitter',
  'budget.intro': 'Splitting {amount} with the 50/30/20 rule',
  'budget.tag': '{year} inflation-adjusted',
  'budget.save': 'Save',
  'budget.export': 'Export PDF',
  'budget.needs': 'NEEDS',
  'budget.wants': 'WANTS',
  'budget.savings': 'SAVINGS',
  'budget.item.rent': 'Max Rent',
  'budget.item.energy': 'Energy & Bills',
  'budget.item.groceries': 'Groceries',
  'budget.item.lifestyle': 'Lifestyle',
  'budget.item.cafe': 'Cafés & Dining',
  'budget.item.subs': 'Subscriptions',
  'budget.item.invest': 'Index / Investing',
  'budget.item.emergency': 'Emergency Fund',

  'profile.title': 'Profile',
  'profile.guest': 'Guest',
  'profile.guestSub': 'Sign in to save your calculations',
  'profile.signIn': 'Sign in / Sign up',
  'profile.proTitle': 'ZERØ Pro',
  'profile.proBody': 'AI Reverse Pricing, unlimited scenarios, watermark-free PDF export.',
  'profile.proCta': 'Get Pro',
  'profile.lastNet': 'Last take-home',
  'profile.section.prefs': 'PREFERENCES',
  'profile.section.support': 'SUPPORT',
  'profile.row.appearance': 'Appearance',
  'profile.row.language': 'Language',
  'profile.row.taxYear': 'Tax year',
  'profile.row.currency': 'Currency',
  'profile.row.terms': 'Terms of use',
  'profile.row.privacy': 'Privacy',
  'profile.row.rate': 'Rate the app',
  'profile.version': 'ZERØ v1.0.0',

  'appearance.system': 'Automatic',
  'appearance.light': 'Light',
  'appearance.dark': 'Dark',

  'language.el': 'Ελληνικά',
  'language.en': 'English',

  'currency.note': 'Symbol display only — no FX conversion.',

  'common.cancel': 'Cancel',
};

const tables = { el, en } as const;

export type TParams = Record<string, string | number>;

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in params ? String(params[k]) : `{${k}}`,
  );
}

/** Returns a `t(key, params?)` translator bound to the active language. */
export function useT() {
  const { settings } = useSettings();
  const table = tables[settings.language];
  return useCallback(
    (key: StringKey, params?: TParams) => interpolate(table[key], params),
    [table],
  );
}
