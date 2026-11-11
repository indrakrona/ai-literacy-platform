/**
 * English versions of the project briefs (keyed by slug). Rubric rows are in the same order as the Bahasa
 * rubric, so each row's English text lands on the same criterion.
 */
export interface BriefEn {
  client: string
  problem: string
  deliverables: string
  rubric: [string, string][]
}

export const APPLIED_RUBRIC_EN: [string, string][] = [
  ['Problem analysis', 'The problem is stated clearly, based on data or an interview with the problem owner, including who is affected.'],
  ['Appropriate use of AI', 'AI is used where it genuinely fits; students explain why, and which parts they did themselves.'],
  ['Checking and safety', 'AI output is checked against sources or by testing; personal data is protected, and risks of bias or error are named with a plan to handle them.'],
  ['Result and communication', 'The problem owner can use the solution, it was tested with at least one user, and it is presented clearly and honestly about its limits.'],
]

export const BRIEFS_EN: Record<string, BriefEn> = {
  'smp-poster-kantin-sehat': {
    client: 'The school canteen manager',
    problem: 'The canteen manager wants more students to choose healthy options such as fruit, vegetables and water, but nobody notices the old posters. They have asked you to make a new poster that appeals to students your age.',
    deliverables: '1. One poster (an image or a Canva link).\n2. A short note: the prompts you used, which parts AI made, and which parts you made or changed yourselves.\n3. One nutrition fact on the poster, with the trusted source you checked it against.',
    rubric: [
      ['Clear message', 'Junior secondary students understand the poster at once, and it asks for one concrete action.'],
      ['Honest credit', 'The note says in detail which work is AI’s and which is the students’ own, including the changes made.'],
      ['Checked fact', 'The nutrition fact is correct and comes from a trusted source (for example the Ministry of Health or a textbook).'],
      ['Visual quality', 'The layout is tidy, readable from a distance, and uses no pictures of real people without permission.'],
    ],
  },
  'smp-ai-untuk-kebaikan-lingkungan': {
    client: 'The neighbourhood association (RT/RW) or village office where students live',
    problem: 'Choose one real problem near your school or home, such as rubbish piling up, flooding when it rains, or older residents who struggle to get information. Design an idea for how AI could help. You do not need to build the app.',
    deliverables: '1. A statement of the problem and who it affects.\n2. An outline of the solution: what the AI does, what data it needs, and where that data comes from.\n3. One safety or privacy rule your solution must follow.\n4. A short presentation (at most 5 slides, or a poster).',
    rubric: [
      ['A real problem', 'The problem really exists where the students live and is backed by observation or a short interview.'],
      ['A sensible role for AI', 'AI’s role is clear and matches what it can do; students also say what AI cannot do.'],
      ['Data and privacy', 'The data needed is stated honestly, and the privacy rule protects residents.'],
      ['Teamwork and presentation', 'Every member has a role; the idea is presented in a logical order that residents can follow.'],
    ],
  },
  'sma-prototipe-asisten-umkm': {
    client: 'A small business near the school (food stall, shop or service)',
    problem: 'Many small businesses answer the same customer questions over and over on WhatsApp: prices, opening hours, how to order. Build a prototype AI assistant, or a set of ready-made prompts, that helps the owner reply faster without giving wrong information.',
    deliverables: '1. A short interview with the business owner (the 5 most common customer questions).\n2. The prototype: system instructions or a prompt set, with sample conversations.\n3. Test results: at least 10 test questions, including 3 “trick” questions, and the fixes you made.\n4. Notes on how AI was used in the process.',
    rubric: APPLIED_RUBRIC_EN,
  },
  'sma-proyek-terapan-sekolah': {
    client: 'The deputy head for student affairs, or the student council (OSIS)',
    problem: 'Choose one school problem agreed with the student council or a teacher, for example event information that does not reach students, queues at the library, or students struggling to choose a university course. Analyse the problem (Session 16), then build and test a solution that uses AI (Session 17).',
    deliverables: '1. A problem analysis: data, users and root cause.\n2. A design and prototype of the solution.\n3. Test results with at least 3 users, plus a review from another group.\n4. A list of risks (privacy, bias, errors) and how you handle them.\n5. A 7-minute presentation.',
    rubric: APPLIED_RUBRIC_EN,
  },
  'smk-akuntansi-rekap-kas-umkm': {
    client: 'The owner of a small shop or the school cooperative',
    problem: 'The owner records income and spending in an exercise book and does not know whether the business made a profit each week. Design a simple way to use AI to turn the notes into a cash summary and a basic profit-and-loss statement, then check the sums by hand.',
    deliverables: '1. A sample of the original records (customer details hidden).\n2. The AI prompts and the weekly cash summary.\n3. A manual check: at least one AI mistake found and corrected.\n4. A one-page guide for the business owner.',
    rubric: APPLIED_RUBRIC_EN,
  },
  'smk-pemasaran-konten-produk-lokal': {
    client: 'A local craftsperson or small producer',
    problem: 'A small business wants to sell on online marketplaces and social media but has no time to make content. Create a two-week content plan with AI help that is attractive without exaggerated or misleading claims.',
    deliverables: '1. A profile of the target buyer.\n2. A 14-day content calendar and 3 complete sample posts.\n3. A list of claims removed or changed because they could not be proven.\n4. An ethical disclosure of AI use.',
    rubric: APPLIED_RUBRIC_EN,
  },
  'smk-tjkt-panduan-keamanan-jaringan': {
    client: 'An internet café, coffee shop or village office',
    problem: 'Many small businesses keep the router’s default password and share their Wi-Fi with everyone. Put together a network security guide and checklist with AI help, then test every step on the school lab equipment, never on someone else’s network.',
    deliverables: '1. A security checklist (at least 10 items).\n2. Evidence from the school lab for each step.\n3. Notes on AI advice that was wrong or out of date, with corrections.\n4. An illustrated guide for the business owner.',
    rubric: APPLIED_RUBRIC_EN,
  },
  'smk-pplg-chatbot-informasi-sekolah': {
    client: 'The new-student admissions committee (PPDB)',
    problem: 'Every year the admissions committee gets hundreds of identical questions. Build a prototype chatbot that answers only from the school’s official documents, refuses to guess, and never asks applicants for personal data.',
    deliverables: '1. The source documents used.\n2. The prototype code or configuration (a repository or link).\n3. A test report: 20 questions, including questions outside the documents and attempts to extract personal data.\n4. Notes on which code AI helped with and how you checked it.',
    rubric: APPLIED_RUBRIC_EN,
  },
  'smk-perhotelan-layanan-tamu': {
    client: 'A homestay or guesthouse in a tourist area',
    problem: 'Guesthouse staff often struggle to serve foreign guests. Make a two-language guide of conversations and local tourist information with AI help, then check the translations and the local facts.',
    deliverables: '1. 15 guest-service situations with sample sentences in two languages.\n2. A checked sheet of nearby tourist information.\n3. Notes on AI translations that were inaccurate or impolite, with corrections.\n4. A role-play test, recorded or written up.',
    rubric: APPLIED_RUBRIC_EN,
  },
  'smk-kuliner-resep-dan-biaya': {
    client: 'The school canteen or a home catering business',
    problem: 'The canteen wants to add one new dish that is nutritious, popular with students and affordable. Use AI for recipe ideas and ingredient costing, then cook a test batch and check ingredient prices at the local market.',
    deliverables: '1. Three dish ideas from AI and the reason you chose one.\n2. A standard recipe and cost per portion using real market prices.\n3. Taste-test results from at least 5 students.\n4. Notes on food safety and allergens.',
    rubric: APPLIED_RUBRIC_EN,
  },
  'smk-otomotif-diagnosis-kerusakan': {
    client: 'A motorcycle repair shop near the school',
    problem: 'Junior mechanics are often unsure what causes a symptom. Build a diagnosis tree for five common symptoms with AI help, then compare it with the service manual and the opinion of an experienced mechanic.',
    deliverables: '1. A diagnosis tree for 5 symptoms.\n2. A table comparing the AI’s advice, the manual and the mechanic.\n3. Notes on AI advice that was dangerous or wrong.\n4. A test on at least one practice vehicle in the school workshop.',
    rubric: APPLIED_RUBRIC_EN,
  },
  'smk-dkv-identitas-visual-umkm': {
    client: 'A small business without a logo',
    problem: 'A small business needs a logo and a simple colour guide. Use AI to explore ideas, but the final design must be your own work, must not copy other brands, and must respect copyright.',
    deliverables: '1. A moodboard and the AI explorations.\n2. The final logo in vector format, with a colour and typeface guide.\n3. An explanation of which parts you made yourselves and a check for similarity with other brands.\n4. Feedback from the business owner.',
    rubric: APPLIED_RUBRIC_EN,
  },
  'smk-kesehatan-edukasi-obat': {
    client: 'The community health centre (Puskesmas) or school health unit (UKS)',
    problem: 'Many people take medicine without reading the instructions. Make simple education materials with AI help, then check every fact against official sources and ask a health worker to review them. AI must never be used to decide a dose for a particular person.',
    deliverables: '1. A leaflet or short video on reading medicine labels.\n2. A table checking every fact against official sources (BPOM or the Ministry of Health).\n3. Notes on AI information that was wrong or risky.\n4. A signature or review note from a teacher or health worker.',
    rubric: APPLIED_RUBRIC_EN,
  },
}
