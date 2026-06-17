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
  'home.caption.employee': 'Βασικός Μικτός Μισθός',
  'home.caption.freelancer': 'Ακαθάριστες Αμοιβές',
  'home.period.month': 'Μηνιαία',
  'home.period.year': 'Ετήσια',
  'home.children': 'Παιδιά',
  'home.efkaClass': 'Κλάση ΕΦΚΑ',
  'home.triennia': 'Τριετίες',
  'home.yearsActive': 'Έτη δραστηριότητας',
  'home.perMonth': '/μήνα',
  'home.year': 'Έτος',
  'home.yearHint': 'Φορ. κλίμακα',
  'home.region': 'Περιοχή',
  'home.regionValue': 'Ελλάδα',
  'home.regionHint': 'Πανελλαδικά',
  'home.calculate': 'ΥΠΟΛΟΓΙΣΜΟΣ',
  'home.invalid': 'Συμπλήρωσε ποσό μεγαλύτερο του 0.',
  'home.tablesSource': 'Πίνακες: {source} · ενημ. {date}',

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
  'results.stale': 'Υπολογίστηκε για {year}. Άλλαξες φορολογικό έτος — υπολόγισε ξανά.',
  'results.negative.title': 'Αρνητικά καθαρά',
  'results.negative.body':
    'Οι κρατήσεις (ΕΦΚΑ + φόρος) ξεπερνούν τα έσοδα. Συχνά συμβαίνει όταν το τεκμαρτό εισόδημα είναι μεγαλύτερο από τα δηλωμένα έσοδα.',
  'results.negative.presumptive':
    'Ο φόρος υπολογίστηκε στο τεκμαρτό ελάχιστο εισόδημα, όχι στα δηλωμένα έσοδα.',
  'results.source': 'Πίνακες: {source} · ενημ. {date}',

  // Budget
  'budget.empty.title': 'Δεν υπάρχει εισόδημα',
  'budget.empty.body': 'Υπολόγισε τον μισθό σου για να δεις το budget split.',
  'budget.title': 'Smart Budget Splitter',
  'budget.intro': 'Διαχωρισμός {amount} με αλγόριθμο 50/30/20',
  'budget.tag': '{year} · 50/30/20',
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
  'profile.signOut': 'Αποσύνδεση',
  'profile.signedInSub': 'Συνδεδεμένος',

  // Login
  'login.title': 'Καλώς ήρθες',
  'login.subtitle': 'Συνδέσου για να αποθηκεύεις τους υπολογισμούς σου σε όλες τις συσκευές.',
  'login.tab.signIn': 'Σύνδεση',
  'login.tab.signUp': 'Εγγραφή',
  'login.email': 'Email',
  'login.emailPlaceholder': 'you@example.com',
  'login.password': 'Κωδικός',
  'login.passwordPlaceholder': '••••••••',
  'login.showPassword': 'Εμφάνιση κωδικού',
  'login.hidePassword': 'Απόκρυψη κωδικού',
  'login.submit.signIn': 'Σύνδεση',
  'login.submit.signUp': 'Δημιουργία λογαριασμού',
  'login.or': 'ή',
  'login.google': 'Συνέχισε με Google',
  'login.apple': 'Συνέχισε με Apple',
  'login.close': 'Κλείσιμο',
  'login.error.email': 'Δώσε έγκυρο email.',
  'login.error.password': 'Ο κωδικός θέλει 6+ χαρακτήρες.',
  'login.error.failed': 'Η σύνδεση απέτυχε. Δοκίμασε ξανά.',
  'login.legal': 'Συνεχίζοντας αποδέχεσαι τους Όρους χρήσης και την Πολιτική Απορρήτου.',

  // Biometric app-lock
  'biometric.title': 'Κλειδωμένο',
  'biometric.body': 'Επαλήθευσε την ταυτότητά σου για να συνεχίσεις.',
  'biometric.unlock': 'Ξεκλείδωμα',
  'biometric.prompt': 'Ξεκλείδωσε το ZERØ',
  'biometric.unavailable.title': 'Μη διαθέσιμο',
  'biometric.unavailable.body': 'Δεν υπάρχει ρυθμισμένο Face ID / Touch ID σε αυτή τη συσκευή.',
  'settings.biometric': 'Βιομετρικό κλείδωμα',
  'common.on': 'Ενεργό',
  'common.off': 'Ανενεργό',

  // Appearance options
  'appearance.system': 'Αυτόματο',
  'appearance.light': 'Φωτεινό',
  'appearance.dark': 'Σκοτεινό',

  // Language options
  'language.el': 'Ελληνικά',
  'language.en': 'English',

  // Currency note
  'currency.note': 'Μετατροπή με σταθερή, κατά προσέγγιση ισοτιμία — όχι ζωντανή τιμή.',

  // Tax year note
  'year.note': 'Ίδιοι πίνακες φόρου/ΕΦΚΑ και για τα δύο έτη μέχρι να δημοσιευθεί το ΦΕΚ 2026.',

  // Error boundary
  'error.title': 'Κάτι πήγε στραβά',
  'error.body': 'Παρουσιάστηκε απρόσμενο σφάλμα. Δοκίμασε ξανά.',
  'error.retry': 'Δοκίμασε ξανά',

  // Onboarding
  'onboarding.s1.title': 'Καθαρός μισθός, στα γρήγορα',
  'onboarding.s1.body': 'Υπολόγισε καθαρά από μικτό — μισθωτός ή μπλοκάκι, με φόρο και ΕΦΚΑ.',
  'onboarding.s2.title': 'Μισθωτός ή Μπλοκάκι',
  'onboarding.s2.body': 'Διάλεξε καθεστώς. Παιδιά, τριετίες, κλάση ΕΦΚΑ και έτη δραστηριότητας λαμβάνονται υπόψη.',
  'onboarding.s3.title': 'Έξυπνο budget',
  'onboarding.s3.body': 'Δες πώς μοιράζεται ο μισθός σου με τον κανόνα 50/30/20.',
  'onboarding.next': 'Επόμενο',
  'onboarding.skip': 'Παράλειψη',
  'onboarding.start': 'Ξεκίνα',
  'onboarding.disclaimerTitle': 'Σημαντικό',
  'onboarding.disclaimer':
    'Οι υπολογισμοί είναι ενδεικτικοί και όχι επίσημη φορολογική συμβουλή. Επαλήθευσε με λογιστή ή την ΑΑΔΕ.',
  'onboarding.accept': 'Κατάλαβα και αποδέχομαι',

  // Generic
  'common.cancel': 'Άκυρο',
  'common.soon.title': 'Σύντομα διαθέσιμο',
  'common.soon.body': 'Αυτή η λειτουργία ετοιμάζεται.',
  'budget.saved.title': 'Αποθηκεύτηκε',
  'budget.saved.body': 'Το budget αποθηκεύτηκε στη συσκευή.',
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

  'home.caption.employee': 'Base Gross Salary',
  'home.caption.freelancer': 'Gross Revenue',
  'home.period.month': 'Monthly',
  'home.period.year': 'Annual',
  'home.children': 'Children',
  'home.efkaClass': 'EFKA Class',
  'home.triennia': 'Triennia',
  'home.yearsActive': 'Years active',
  'home.perMonth': '/mo',
  'home.year': 'Year',
  'home.yearHint': 'Tax scale',
  'home.region': 'Region',
  'home.regionValue': 'Greece',
  'home.regionHint': 'Nationwide',
  'home.calculate': 'CALCULATE',
  'home.invalid': 'Enter an amount greater than 0.',
  'home.tablesSource': 'Tables: {source} · upd. {date}',

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
  'results.stale': 'Calculated for {year}. You changed the tax year — recalculate.',
  'results.negative.title': 'Negative take-home',
  'results.negative.body':
    'Deductions (EFKA + tax) exceed revenue. This often happens when the presumptive income exceeds declared revenue.',
  'results.negative.presumptive':
    'Tax was computed on the presumptive minimum income, not on declared revenue.',
  'results.source': 'Tables: {source} · upd. {date}',

  'budget.empty.title': 'No income',
  'budget.empty.body': 'Calculate your salary to see the budget split.',
  'budget.title': 'Smart Budget Splitter',
  'budget.intro': 'Splitting {amount} with the 50/30/20 rule',
  'budget.tag': '{year} · 50/30/20',
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
  'profile.signOut': 'Sign out',
  'profile.signedInSub': 'Signed in',

  'login.title': 'Welcome',
  'login.subtitle': 'Sign in to save your calculations across devices.',
  'login.tab.signIn': 'Sign in',
  'login.tab.signUp': 'Sign up',
  'login.email': 'Email',
  'login.emailPlaceholder': 'you@example.com',
  'login.password': 'Password',
  'login.passwordPlaceholder': '••••••••',
  'login.showPassword': 'Show password',
  'login.hidePassword': 'Hide password',
  'login.submit.signIn': 'Sign in',
  'login.submit.signUp': 'Create account',
  'login.or': 'or',
  'login.google': 'Continue with Google',
  'login.apple': 'Continue with Apple',
  'login.close': 'Close',
  'login.error.email': 'Enter a valid email.',
  'login.error.password': 'Password needs 6+ characters.',
  'login.error.failed': 'Sign-in failed. Try again.',
  'login.legal': 'By continuing you accept the Terms of Use and Privacy Policy.',

  // Biometric app-lock
  'biometric.title': 'Locked',
  'biometric.body': 'Verify your identity to continue.',
  'biometric.unlock': 'Unlock',
  'biometric.prompt': 'Unlock ZERØ',
  'biometric.unavailable.title': 'Unavailable',
  'biometric.unavailable.body': 'No Face ID / Touch ID is set up on this device.',
  'settings.biometric': 'Biometric lock',
  'common.on': 'On',
  'common.off': 'Off',

  'appearance.system': 'Automatic',
  'appearance.light': 'Light',
  'appearance.dark': 'Dark',

  'language.el': 'Ελληνικά',
  'language.en': 'English',

  'currency.note': 'Converted at a fixed, approximate rate — not live FX.',
  'year.note': 'Identical tax/EFKA tables for both years until the 2026 ΦΕΚ is published.',

  'error.title': 'Something went wrong',
  'error.body': 'An unexpected error occurred. Please try again.',
  'error.retry': 'Try again',

  'onboarding.s1.title': 'Take-home pay, fast',
  'onboarding.s1.body': 'Turn gross into net — employee or freelancer, with tax and EFKA.',
  'onboarding.s2.title': 'Employee or Freelancer',
  'onboarding.s2.body': 'Pick a regime. Children, triennia, EFKA class and years active are all factored in.',
  'onboarding.s3.title': 'Smart budget',
  'onboarding.s3.body': 'See how your salary splits with the 50/30/20 rule.',
  'onboarding.next': 'Next',
  'onboarding.skip': 'Skip',
  'onboarding.start': 'Get started',
  'onboarding.disclaimerTitle': 'Important',
  'onboarding.disclaimer':
    'Figures are indicative, not official tax advice. Verify with an accountant or the tax authority (ΑΑΔΕ).',
  'onboarding.accept': 'I understand and accept',

  'common.cancel': 'Cancel',
  'common.soon.title': 'Coming soon',
  'common.soon.body': 'This feature is on the way.',
  'budget.saved.title': 'Saved',
  'budget.saved.body': 'Your budget has been saved to this device.',
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
