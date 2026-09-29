/* Traductions : le texte français sert de clé ; chaque entrée donne [anglais, arabe].
   t('Texte {0}', [valeur]) traduit et remplace les paramètres ; traduireDom traduit les textes et attributs de la page.
   Les montants gardent le format tunisien (espace des milliers, virgule décimale) dans toutes les langues. */
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.I18n = fabrique();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LANGUES = ['fr', 'en', 'ar'];
  var LOCALES = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-TN' };

  var D = {
    /* ---------- En-tête, héros, pied de page ---------- */
    'Simulateur Assurance Vie et Compte Épargne en Actions (CEA)': ['Life Insurance and Equity Savings Account (CEA) Simulator', 'محاكي التأمين على الحياة وحساب الادخار في الأسهم'],
    'Simulateur assurance vie et CEA, accueil': ['Life insurance and CEA simulator, home', 'محاكي التأمين على الحياة وحساب الادخار في الأسهم، الصفحة الرئيسية'],
    'Assurance vie & CEA': ['Life insurance & CEA', 'التأمين على الحياة وحساب الادخار في الأسهم'],
    'Langue': ['Language', 'اللغة'],
    'Année du barème': ['Tax scale year', 'سنة الجدول الضريبي'],
    'Ajoute les références du client et du conseiller au rapport': ['Adds the client and adviser references to the report', 'يضيف مراجع الحريف والمستشار إلى التقرير'],
    'Mode conseiller': ['Adviser mode', 'وضع المستشار'],
    'Télécharge le rapport au format PDF': ['Downloads the report as a PDF', 'تنزيل التقرير بصيغة PDF'],
    'Basculer le thème clair / sombre': ['Toggle light / dark theme', 'التبديل بين الوضع الفاتح والداكن'],
    'Thème clair / sombre': ['Light / dark theme', 'الوضع الفاتح / الداكن'],
    'Rapport de simulation : assurance vie et CEA': ['Simulation report: life insurance and CEA', 'تقرير المحاكاة: التأمين على الحياة وحساب الادخار في الأسهم'],
    'Barème en vigueur': ['Current tax scale', 'الجدول الضريبي الساري'],
    'Calculez et optimisez votre impôt en quelques clics : économie réalisée, montant optimal à investir et détail tranche par tranche, mis à jour en temps réel.': ['Calculate and optimise your income tax in a few clicks: tax saved, optimal amount to invest and a bracket-by-bracket breakdown, updated in real time.', 'احسب ضريبتك وحسّنها في بضع نقرات: الوفر الضريبي، المبلغ الأمثل للاستثمار والتفصيل حسب كل شريحة، مع تحديث فوري.'],
    'Application faite par': ['App made by', 'تطبيق من إنجاز'],
    'Avertissement': ['Disclaimer', 'تنبيه'],
    'Simulation indicative, non contractuelle.': ['Indicative, non-contractual simulation.', 'محاكاة تقديرية وغير تعاقدية.'],
    'Elle ne constitue ni un conseil en investissement ni un engagement de l\'assureur. Les rendements et les frais de la projection sont des hypothèses modifiables, non garanties : la valeur d\'un contrat peut varier à la hausse comme à la baisse. Le calcul de l\'impôt suit le Code de l\'impôt sur le revenu des personnes physiques et de l\'impôt sur les sociétés tel que saisi dans le simulateur ; seules les dispositions officielles en vigueur font foi.': ['It is neither investment advice nor a commitment by the insurer. Projection returns and fees are adjustable, non-guaranteed assumptions: the value of a contract may go up as well as down. The tax calculation follows the Tunisian Personal Income Tax and Corporate Tax Code as entered in the simulator; only the official provisions in force are authoritative.', 'لا تمثل نصيحة استثمارية ولا التزامًا من المؤمِّن. العوائد والمصاريف في الإسقاط فرضيات قابلة للتعديل وغير مضمونة: قد ترتفع قيمة العقد أو تنخفض. يتبع احتساب الضريبة مجلة الضريبة على دخل الأشخاص الطبيعيين والضريبة على الشركات كما أُدخلت في المحاكي؛ ولا يُعتدّ إلا بالنصوص الرسمية السارية.'],
    'Simulation indicative, sans valeur contractuelle : les montants sont calculés au millime selon le barème progressif.': ['Indicative simulation with no contractual value: amounts are calculated to the millime using the progressive scale.', 'محاكاة تقديرية دون قيمة تعاقدية: تُحتسب المبالغ بالمليم وفق الجدول التصاعدي.'],

    /* ---------- Mode conseiller ---------- */
    'Références inscrites sur le rapport PDF': ['References printed on the PDF report', 'مراجع تظهر في تقرير PDF'],
    'Nom du client': ['Client name', 'اسم الحريف'],
    'Ex. Mme Ben Salah': ['E.g. Mrs Ben Salah', 'مثال: السيدة بن صالح'],
    'Nom du conseiller': ['Adviser name', 'اسم المستشار'],
    'Ex. Mohamed Aziz Jaouadi': ['E.g. Mohamed Aziz Jaouadi', 'مثال: محمد عزيز الجوادي'],
    'Référence du dossier': ['File reference', 'مرجع الملف'],
    'Facultatif': ['Optional', 'اختياري'],
    'Ex. AV-2026-014': ['E.g. AV-2026-014', 'مثال: AV-2026-014'],

    /* ---------- Situation familiale ---------- */
    'Situation familiale': ['Family situation', 'الوضعية العائلية'],
    'Revenu et personnes à charge': ['Income and dependants', 'الدخل والأشخاص في الكفالة'],
    'Revenu brut annuel imposable': ['Annual gross taxable income', 'الدخل الخام السنوي الخاضع للضريبة'],
    'Ex. 45 000': ['E.g. 45 000', 'مثال: 45 000'],
    'Revenu brut annuel, curseur': ['Annual gross income, slider', 'الدخل الخام السنوي، مؤشر'],
    'Chef de famille': ['Head of household', 'رئيس العائلة'],
    'Non chef de famille': ['Not head of household', 'ليس رئيس عائلة'],
    'Déduction de 300 TND': ['300 TND deduction', 'طرح 300 دينار'],
    'Non': ['No', 'لا'],
    'Oui': ['Yes', 'نعم'],
    'Enfants à charge (moins de 20 ans)': ['Dependent children (under 20)', 'الأبناء في الكفالة (أقل من 20 سنة)'],
    '100 TND par enfant, 400 max.': ['100 TND per child, 400 max.', '100 دينار لكل طفل، 400 كحد أقصى'],
    'Retirer un enfant à charge': ['Remove a dependent child', 'حذف طفل في الكفالة'],
    'Ajouter un enfant à charge': ['Add a dependent child', 'إضافة طفل في الكفالة'],
    'Enfants infirmes': ['Children with disabilities', 'الأبناء ذوو الإعاقة'],
    '2 000 TND par enfant': ['2 000 TND per child', '2 000 دينار لكل طفل'],
    'Retirer un enfant infirme': ['Remove a child with a disability', 'حذف طفل ذي إعاقة'],
    'Ajouter un enfant infirme': ['Add a child with a disability', 'إضافة طفل ذي إعاقة'],
    'Étudiants sans bourse': ['Students without a grant', 'الطلبة دون منحة'],
    '1 000 TND par étudiant, 4 000 max.': ['1 000 TND per student, 4 000 max.', '1 000 دينار لكل طالب، 4 000 كحد أقصى'],
    'Retirer un étudiant': ['Remove a student', 'حذف طالب'],
    'Ajouter un étudiant': ['Add a student', 'إضافة طالب'],
    'Parents à charge (max 2)': ['Dependent parents (max 2)', 'الوالدان في الكفالة (2 كحد أقصى)'],
    '450 TND par parent': ['450 TND per parent', '450 دينار لكل والد'],
    'Retirer un parent à charge': ['Remove a dependent parent', 'حذف والد في الكفالة'],
    'Ajouter un parent à charge': ['Add a dependent parent', 'إضافة والد في الكفالة'],

    /* ---------- Investissement ---------- */
    'Investissement': ['Investment', 'الاستثمار'],
    'Assurance vie ou CEA': ['Life insurance or CEA', 'التأمين على الحياة أو حساب الادخار في الأسهم'],
    'Fractionnement': ['Payment frequency', 'دورية الدفع'],
    'Mensuel': ['Monthly', 'شهري'],
    'Trimestriel': ['Quarterly', 'ثلاثي'],
    'Semestriel': ['Half-yearly', 'سداسي'],
    'Annuel': ['Yearly', 'سنوي'],
    'par mois': ['per month', 'شهريًا'],
    'par trimestre': ['per quarter', 'كل ثلاثية'],
    'par semestre': ['per half-year', 'كل سداسية'],
    'par an': ['per year', 'سنويًا'],
    'Montant à investir par mois': ['Amount to invest per month', 'المبلغ المراد استثماره شهريًا'],
    'Montant à investir {0}': ['Amount to invest {0}', 'المبلغ المراد استثماره {0}'],
    'Ex. 500': ['E.g. 500', 'مثال: 500'],
    'Montant total à investir': ['Total amount to invest', 'المبلغ الجملي للاستثمار'],
    '0 × 12 versements par an': ['0 × 12 payments per year', '0 × 12 دفعة في السنة'],
    '{0} × {1} versement(s) par an': ['{0} × {1} payment(s) per year', '{0} × {1} دفعة في السنة'],
    'Suggestion optimale': ['Optimal suggestion', 'الاقتراح الأمثل'],
    'Investissez ce montant pour réduire votre impôt au plancher légal (45 %).': ['Invest this amount to bring your tax down to the legal floor (45%).', 'استثمر هذا المبلغ لتخفيض ضريبتك إلى الحد الأدنى القانوني (45 %).'],
    'Appliquer ce montant': ['Apply this amount', 'تطبيق هذا المبلغ'],
    'Plancher atteint': ['Floor reached', 'تم بلوغ الحد الأدنى'],
    'Au-delà de {0} par an, l\'investissement supplémentaire ({1}) ne réduit plus votre impôt : le plancher de 45 % est déjà atteint.': ['Above {0} per year, the extra investment ({1}) no longer reduces your tax: the 45% floor has already been reached.', 'ما فوق {0} سنويًا، لا يخفّض الاستثمار الإضافي ({1}) ضريبتك: تم بلوغ الحد الأدنى البالغ 45 %.'],
    'Montant appliqué : {0} {1}.': ['Amount applied: {0} {1}.', 'تم تطبيق المبلغ: {0} {1}.'],

    /* ---------- Saisie ---------- */
    'Saisissez un montant valide (ex. 45 000).': ['Enter a valid amount (e.g. 45 000).', 'أدخل مبلغًا صحيحًا (مثال: 45 000).'],
    'Saisissez un montant valide (ex. 500).': ['Enter a valid amount (e.g. 500).', 'أدخل مبلغًا صحيحًا (مثال: 500).'],
    '« {0} » est lu comme {1}. Vouliez-vous saisir {2} ?': ['“{0}” is read as {1}. Did you mean {2}?', '«{0}» يُقرأ {1}. هل كنت تقصد {2}؟'],
    'Corriger en {0}': ['Change to {0}', 'التصحيح إلى {0}'],

    /* ---------- Mode inverse ---------- */
    'Mode inverse : économie d\'impôt annuelle visée': ['Reverse mode: target annual tax saving', 'الوضع العكسي: الوفر الضريبي السنوي المنشود'],
    'Ex. 1 500': ['E.g. 1 500', 'مثال: 1 500'],
    'Indiquez l\'économie souhaitée : le simulateur calcule le montant à verser.': ['Enter the saving you want: the simulator works out the amount to pay in.', 'أدخل الوفر المطلوب: يحسب المحاكي المبلغ الواجب دفعه.'],
    'Saisissez d\'abord votre revenu brut annuel imposable.': ['First enter your annual gross taxable income.', 'أدخل أولًا دخلك الخام السنوي الخاضع للضريبة.'],
    'Objectif impossible : l\'économie maximale est de {0} par an (plancher légal de 45 %).': ['Target not achievable: the maximum saving is {0} per year (legal floor of 45%).', 'الهدف غير ممكن: أقصى وفر هو {0} سنويًا (الحد الأدنى القانوني 45 %).'],
    'Aucune économie possible : votre impôt est déjà nul.': ['No saving possible: your tax is already zero.', 'لا وفر ممكن: ضريبتك منعدمة أصلًا.'],
    'Versez {0} par an, soit {1} {2}.': ['Pay in {0} per year, i.e. {1} {2}.', 'ادفع {0} سنويًا، أي {1} {2}.'],

    /* ---------- Résultats ---------- */
    'Vos résultats apparaîtront ici': ['Your results will appear here', 'ستظهر نتائجك هنا'],
    'Saisissez votre revenu brut annuel imposable : l\'impôt, l\'économie réalisée et le montant optimal à investir s\'affichent aussitôt.': ['Enter your annual gross taxable income: your tax, the saving and the optimal amount to invest appear instantly.', 'أدخل دخلك الخام السنوي الخاضع للضريبة: تظهر الضريبة والوفر والمبلغ الأمثل للاستثمار فورًا.'],
    'Télécharger le rapport PDF': ['Download the PDF report', 'تنزيل تقرير PDF'],
    'Partager la simulation': ['Share the simulation', 'مشاركة المحاكاة'],
    'Enregistrer': ['Save', 'حفظ'],
    'Lien de la simulation (les noms du client et du conseiller n\'y figurent pas)': ['Simulation link (client and adviser names are not included)', 'رابط المحاكاة (لا يتضمن اسمي الحريف والمستشار)'],
    'Copier': ['Copy', 'نسخ'],
    'QR code du lien de la simulation': ['QR code of the simulation link', 'رمز QR لرابط المحاكاة'],
    'Économie d\'impôt': ['Tax saving', 'الوفر الضريبي'],
    'soit': ['i.e.', 'أي'],
    'Taux de réduction d\'impôt': ['Tax reduction rate', 'نسبة تخفيض الضريبة'],
    '55 % au maximum': ['55% maximum', '55 % كحد أقصى'],
    'plafond<br>atteint': ['cap<br>reached', 'تم بلوغ<br>السقف'],
    'restants': ['remaining', 'متبقية'],
    'plancher 45 %': ['45% floor', 'الحد الأدنى 45 %'],
    'Impôt annuel': ['Annual tax', 'الضريبة السنوية'],
    'Avant et après investissement': ['Before and after investment', 'قبل الاستثمار وبعده'],
    'Avant': ['Before', 'قبل'],
    'Après': ['After', 'بعد'],
    'Impôt total avant investissement': ['Total tax before investment', 'مجموع الضريبة قبل الاستثمار'],
    'Impôt total après investissement': ['Total tax after investment', 'مجموع الضريبة بعد الاستثمار'],
    'Minimum d\'impôt (45 %)': ['Minimum tax (45%)', 'الحد الأدنى للضريبة (45 %)'],
    'Montant optimal à investir': ['Optimal amount to invest', 'المبلغ الأمثل للاستثمار'],
    'Revenu net imposable': ['Net taxable income', 'الدخل الصافي الخاضع للضريبة'],
    'Détail des déductions appliquées': ['Breakdown of deductions applied', 'تفصيل الطروحات المطبقة'],
    'Frais professionnels ({0} %, {1} max.)': ['Professional expenses ({0}%, {1} max.)', 'المصاريف المهنية ({0} %، {1} كحد أقصى)'],
    'Enfants à charge': ['Dependent children', 'الأبناء في الكفالة'],
    'Parents à charge': ['Dependent parents', 'الوالدان في الكفالة'],
    'Investissement déduit': ['Investment deducted', 'الاستثمار المطروح'],
    'Revenu net après investissement': ['Net income after investment', 'الدخل الصافي بعد الاستثمار'],
    'Impôt par tranche': ['Tax by bracket', 'الضريبة حسب الشريحة'],
    'Comparaison sans et avec investissement': ['Comparison without and with investment', 'مقارنة دون استثمار ومع استثمار'],
    'Tableau de l\'impôt par tranche, défilable': ['Tax by bracket table, scrollable', 'جدول الضريبة حسب الشريحة، قابل للتمرير'],
    'Tranche (TND)': ['Bracket (TND)', 'الشريحة (دينار)'],
    'Taux': ['Rate', 'النسبة'],
    'Impôt sans inv.': ['Tax without inv.', 'الضريبة دون استثمار'],
    'Impôt avec inv.': ['Tax with inv.', 'الضريبة مع استثمار'],
    'Économie': ['Saving', 'الوفر'],
    'Total': ['Total', 'المجموع'],
    'et plus': ['and above', 'فما فوق'],
    'Barème : {0}': ['Tax scale: {0}', 'الجدول الضريبي: {0}'],
    'Ce tableau applique le barème suivant : {0}.': ['This table applies the following scale: {0}.', 'يطبّق هذا الجدول السلّم التالي: {0}.'],
    'Économie selon le montant investi': ['Saving by amount invested', 'الوفر حسب المبلغ المستثمر'],
    'Le gain s\'arrête au plancher légal de 45 %': ['The gain stops at the 45% legal floor', 'يتوقف الربح عند الحد الأدنى القانوني 45 %'],
    'Votre montant actuel': ['Your current amount', 'مبلغك الحالي'],
    'Montant optimal': ['Optimal amount', 'المبلغ الأمثل'],
    'Optimal': ['Optimal', 'الأمثل'],
    'Courbe de l\'économie d\'impôt selon le montant investi par an': ['Tax saving curve by amount invested per year', 'منحنى الوفر الضريبي حسب المبلغ المستثمر سنويًا'],
    'Montant investi par an (TND)': ['Amount invested per year (TND)', 'المبلغ المستثمر سنويًا (دينار)'],
    'Économie d\'impôt de {0} par an, soit {1} de réduction. Montant optimal à investir : {2}.': ['Tax saving of {0} per year, a {1} reduction. Optimal amount to invest: {2}.', 'وفر ضريبي قدره {0} سنويًا، أي تخفيض بنسبة {1}. المبلغ الأمثل للاستثمار: {2}.'],

    /* ---------- Projection ---------- */
    'Projection du capital': ['Capital projection', 'إسقاط رأس المال'],
    'Hypothèses modifiables, non garanties': ['Adjustable, non-guaranteed assumptions', 'فرضيات قابلة للتعديل وغير مضمونة'],
    'Durée': ['Term', 'المدة'],
    'ans': ['years', 'سنوات'],
    'an': ['year', 'سنة'],
    'pts': ['pts', 'نقاط'],
    'Rendement annuel': ['Annual return', 'العائد السنوي'],
    'Frais de gestion': ['Management fees', 'مصاريف التصرف'],
    'Placement classique': ['Standard investment', 'توظيف تقليدي'],
    'Hypothèses avancées : support, hausse des revenus, inflation': ['Advanced assumptions: fund type, income growth, inflation', 'فرضيات متقدمة: نوع الصندوق، ارتفاع الدخل، التضخم'],
    'Type de support': ['Fund type', 'نوع الصندوق'],
    'Fonds en euros (écart ± 1 pt)': ['Guaranteed fund (spread ± 1 pt)', 'صندوق مضمون (فارق ± 1 نقطة)'],
    'Multisupport équilibré (écart ± 2 pts)': ['Balanced multi-fund (spread ± 2 pts)', 'متعدد الصناديق متوازن (فارق ± 2 نقطة)'],
    'Unités de compte dynamiques (écart ± 4 pts)': ['Dynamic unit-linked funds (spread ± 4 pts)', 'وحدات حساب ديناميكية (فارق ± 4 نقاط)'],
    'Personnalisé': ['Custom', 'مخصص'],
    'Écart entre scénarios': ['Spread between scenarios', 'الفارق بين السيناريوهات'],
    'Hausse annuelle du revenu et des versements': ['Annual growth of income and payments', 'الارتفاع السنوي للدخل والدفعات'],
    'Inflation annuelle': ['Annual inflation', 'التضخم السنوي'],
    'Le barème et les déductions restent ceux de l\'année choisie pendant toute la projection. Avec une inflation, le capital est aussi présenté en dinars constants (pouvoir d\'achat d\'aujourd\'hui).': ['The tax scale and deductions of the chosen year apply throughout the projection. With inflation, capital is also shown in constant dinars (today\'s purchasing power).', 'يبقى الجدول الضريبي والطروحات الخاصة بالسنة المختارة ساريةً طوال مدة الإسقاط. مع التضخم، يُعرض رأس المال أيضًا بالدينار الثابت (القدرة الشرائية الحالية).'],
    'Réinvestir chaque année l\'économie d\'impôt dans le contrat': ['Reinvest the tax saving in the contract every year', 'إعادة استثمار الوفر الضريبي في العقد كل سنة'],
    'Saisissez un montant à investir pour voir la projection.': ['Enter an amount to invest to see the projection.', 'أدخل مبلغًا للاستثمار لعرض الإسقاط.'],
    'Prudent': ['Cautious', 'حذر'],
    'Médian': ['Median', 'وسيط'],
    'Dynamique': ['Dynamic', 'ديناميكي'],
    'Versements cumulés': ['Cumulative payments', 'الدفعات المتراكمة'],
    'Médian en dinars constants': ['Median in constant dinars', 'الوسيط بالدينار الثابت'],
    'Exporter la projection annuelle (Excel)': ['Export the yearly projection (Excel)', 'تصدير الإسقاط السنوي (Excel)'],
    'Capital constitué par année selon trois scénarios de rendement': ['Capital built up each year under three return scenarios', 'رأس المال المكوَّن سنويًا حسب ثلاثة سيناريوهات للعائد'],
    'Années': ['Years', 'السنوات'],
    'La durée doit être un nombre entier d\'années entre 1 et {0}.': ['The term must be a whole number of years between 1 and {0}.', 'يجب أن تكون المدة عددًا صحيحًا من السنوات بين 1 و{0}.'],
    'Le rendement annuel doit être compris entre 0 et 50 %.': ['The annual return must be between 0 and 50%.', 'يجب أن يكون العائد السنوي بين 0 و50 %.'],
    'Les frais de gestion doivent être compris entre 0 et 20 %.': ['Management fees must be between 0 and 20%.', 'يجب أن تكون مصاريف التصرف بين 0 و20 %.'],
    'Le taux du placement classique doit être compris entre 0 et 50 %.': ['The standard investment rate must be between 0 and 50%.', 'يجب أن تكون نسبة التوظيف التقليدي بين 0 و50 %.'],
    'L\'écart entre scénarios doit être compris entre 0 et 20 points.': ['The spread between scenarios must be between 0 and 20 points.', 'يجب أن يكون الفارق بين السيناريوهات بين 0 و20 نقطة.'],
    'La hausse annuelle doit être comprise entre 0 et 20 %.': ['Annual growth must be between 0 and 20%.', 'يجب أن يكون الارتفاع السنوي بين 0 و20 %.'],
    'L\'inflation doit être comprise entre 0 et 30 %.': ['Inflation must be between 0 and 30%.', 'يجب أن يكون التضخم بين 0 و30 %.'],
    'Total versé sur {0} an(s)': ['Total paid in over {0} year(s)', 'مجموع الدفعات على {0} سنة'],
    'Capital au terme (scénario médian)': ['Capital at maturity (median scenario)', 'رأس المال عند الأجل (السيناريو الوسيط)'],
    'Capital au terme en dinars constants (inflation {0})': ['Capital at maturity in constant dinars (inflation {0})', 'رأس المال عند الأجل بالدينار الثابت (تضخم {0})'],
    'Versement de la dernière année (hausse de {0} par an)': ['Final-year payments ({0} growth per year)', 'دفعات السنة الأخيرة (ارتفاع {0} سنويًا)'],
    'Gain financier': ['Financial gain', 'الربح المالي'],
    'Économie d\'impôt cumulée': ['Cumulative tax saving', 'الوفر الضريبي المتراكم'],
    '(réinvestie)': ['(reinvested)', '(مُعاد استثماره)'],
    'Valeur totale (capital + économie d\'impôt)': ['Total value (capital + tax saving)', 'القيمة الجملية (رأس المال + الوفر الضريبي)'],
    'Rendement annuel effectif, économie d\'impôt comprise': ['Effective annual return, including tax saving', 'العائد السنوي الفعلي، بما في ذلك الوفر الضريبي'],
    'Placement classique à {0} (mêmes versements)': ['Standard investment at {0} (same payments)', 'توظيف تقليدي بنسبة {0} (نفس الدفعات)'],
    'Avantage sur le placement classique': ['Advantage over standard investment', 'الأفضلية مقارنة بالتوظيف التقليدي'],
    'Année': ['Year', 'السنة'],
    'Total versé': ['Total paid in', 'مجموع الدفعات'],
    'Capital (scénario médian)': ['Capital (median scenario)', 'رأس المال (السيناريو الوسيط)'],
    'Capital en dinars constants': ['Capital in constant dinars', 'رأس المال بالدينار الثابت'],

    /* ---------- Rachat ---------- */
    'Simulation de rachat anticipé': ['Early surrender simulation', 'محاكاة الاسترداد المسبق'],
    'Coût d\'une sortie avant le terme': ['Cost of exiting before maturity', 'كلفة الخروج قبل الأجل'],
    'Année du rachat': ['Surrender year', 'سنة الاسترداد'],
    'Part rachetée': ['Share surrendered', 'الحصة المستردة'],
    'Pénalité de rachat du contrat': ['Contract surrender penalty', 'غرامة الاسترداد حسب العقد'],
    'Selon le contrat': ['Per contract', 'حسب العقد'],
    'Capital racheté en fin d\'année {0} ({1})': ['Capital surrendered at the end of year {0} ({1})', 'رأس المال المسترد في نهاية السنة {0} ({1})'],
    'Pénalité de rachat': ['Surrender penalty', 'غرامة الاسترداد'],
    'Montant réintégré au revenu imposable': ['Amount added back to taxable income', 'المبلغ المُعاد إدماجه في الدخل الخاضع للضريبة'],
    'Impôt supplémentaire dû (réintégration)': ['Additional tax due (add-back)', 'الضريبة الإضافية المستحقة (إعادة الإدماج)'],
    'Montant net perçu': ['Net amount received', 'المبلغ الصافي المقبوض'],
    'Versements correspondants': ['Corresponding payments', 'الدفعات المقابلة'],
    'Gain ou perte nette sur les versements': ['Net gain or loss on payments', 'الربح أو الخسارة الصافية على الدفعات'],
    'Économies d\'impôt déjà obtenues sur cette part': ['Tax savings already obtained on this share', 'الوفر الضريبي المتحصل عليه على هذه الحصة'],
    'Coût total de la sortie (pénalité + impôt)': ['Total exit cost (penalty + tax)', 'الكلفة الجملية للخروج (غرامة + ضريبة)'],
    'L\'année du rachat doit être un nombre entier entre 1 et {0}.': ['The surrender year must be a whole number between 1 and {0}.', 'يجب أن تكون سنة الاسترداد عددًا صحيحًا بين 1 و{0}.'],
    'La part rachetée doit être comprise entre 0 et 100 %.': ['The share surrendered must be between 0 and 100%.', 'يجب أن تكون الحصة المستردة بين 0 و100 %.'],
    'La pénalité doit être comprise entre 0 et 100 %.': ['The penalty must be between 0 and 100%.', 'يجب أن تكون الغرامة بين 0 و100 %.'],
    'Rachat avant {0} ans : les montants déduits sont réintégrés au revenu imposable de l\'année du rachat.': ['Surrender before {0} years: the amounts deducted are added back to taxable income in the surrender year.', 'استرداد قبل {0} سنوات: تُعاد المبالغ المطروحة إلى الدخل الخاضع للضريبة لسنة الاسترداد.'],
    'Contrat d\'au moins {0} ans : pas de réintégration fiscale.': ['Contract held for at least {0} years: no tax add-back.', 'عقد مدته {0} سنوات على الأقل: لا إعادة إدماج ضريبي.'],
    'Hypothèses : rachat en fin d\'année, scénario médian. Réintégration si le contrat a moins de {0} ans : paramètre du barème, à confirmer avec le texte officiel et les conditions du contrat.': ['Assumptions: surrender at year end, median scenario. Add-back if the contract is less than {0} years old: tax scale parameter, to be confirmed against the official text and the contract terms.', 'الفرضيات: استرداد في نهاية السنة، السيناريو الوسيط. إعادة الإدماج إذا كان عمر العقد أقل من {0} سنوات: معيار من الجدول الضريبي يجب التثبت منه في النص الرسمي وشروط العقد.'],

    /* ---------- Prévoyance ---------- */
    'Prévoyance': ['Protection', 'الحيطة'],
    'Rente au terme et capital en cas de décès': ['Annuity at maturity and death benefit', 'الجراية عند الأجل ورأس المال في حالة الوفاة'],
    'Durée de service de la rente': ['Annuity payment period', 'مدة صرف الجراية'],
    'Taux technique': ['Technical rate', 'النسبة الفنية'],
    'Décès survenant en année': ['Death occurring in year', 'وفاة في السنة'],
    'Capital garanti en cas de décès': ['Guaranteed death benefit', 'رأس المال المضمون في حالة الوفاة'],
    'Estimation indicative : la rente viagère réelle dépend des tables de mortalité et des conditions du contrat.': ['Indicative estimate: the actual life annuity depends on mortality tables and the contract terms.', 'تقدير استرشادي: تتوقف الجراية العمرية الفعلية على جداول الوفيات وشروط العقد.'],
    'Rente annuelle estimée pendant {0} ans': ['Estimated annual annuity for {0} years', 'الجراية السنوية التقديرية لمدة {0} سنة'],
    'Soit par mois': ['Per month', 'أي شهريًا'],
    'Capital acquis en cas de décès en année {0}': ['Capital acquired if death occurs in year {0}', 'رأس المال المكتسب في حالة الوفاة في السنة {0}'],
    'Versements cumulés à cette date': ['Cumulative payments at that date', 'الدفعات المتراكمة في ذلك التاريخ'],
    'Capital versé aux bénéficiaires': ['Capital paid to beneficiaries', 'رأس المال المدفوع للمستفيدين'],
    'capital acquis': ['acquired capital', 'رأس المال المكتسب'],
    'versements remboursés': ['payments refunded', 'استرجاع الدفعات'],
    'capital garanti': ['guaranteed capital', 'رأس المال المضمون'],
    'La durée de la rente doit être un nombre entier entre 1 et 50 ans.': ['The annuity period must be a whole number between 1 and 50 years.', 'يجب أن تكون مدة الجراية عددًا صحيحًا بين 1 و50 سنة.'],
    'Le taux technique doit être compris entre 0 et 20 %.': ['The technical rate must be between 0 and 20%.', 'يجب أن تكون النسبة الفنية بين 0 و20 %.'],
    'L\'année du décès doit être un nombre entier entre 1 et {0}.': ['The year of death must be a whole number between 1 and {0}.', 'يجب أن تكون سنة الوفاة عددًا صحيحًا بين 1 و{0}.'],

    /* ---------- Partage, PDF ---------- */
    'Simulation chargée depuis le lien.': ['Simulation loaded from the link.', 'تم تحميل المحاكاة من الرابط.'],
    'Lien copié : envoyez-le à votre client.': ['Link copied: send it to your client.', 'تم نسخ الرابط: أرسله إلى حريفك.'],
    'Copie impossible : sélectionnez le lien et copiez-le.': ['Could not copy: select the link and copy it.', 'تعذّر النسخ: حدّد الرابط وانسخه.'],
    'Rapport PDF téléchargé.': ['PDF report downloaded.', 'تم تنزيل تقرير PDF.'],
    'Rapport de simulation': ['Simulation report', 'تقرير المحاكاة'],
    'Assurance vie et CEA': ['Life insurance and CEA', 'التأمين على الحياة وحساب الادخار في الأسهم'],
    'Édité le {0}': ['Issued on {0}', 'حُرّر في {0}'],
    'Dossier': ['File', 'الملف'],
    'Client : {0}': ['Client: {0}', 'الحريف: {0}'],
    'Conseiller : {0}': ['Adviser: {0}', 'المستشار: {0}'],
    'Dossier : {0}': ['File: {0}', 'الملف: {0}'],
    'Hypothèses': ['Assumptions', 'الفرضيات'],
    'Taux de réduction': ['Reduction rate', 'نسبة التخفيض'],
    'Barème provisoire : à confirmer avec le texte officiel.': ['Provisional tax scale: to be confirmed against the official text.', 'جدول ضريبي مؤقت: يجب التثبت منه في النص الرسمي.'],
    'Retrouver cette simulation': ['Open this simulation again', 'استرجاع هذه المحاكاة'],
    'Scannez le QR code ou ouvrez le lien ci-dessous pour retrouver la simulation dans le simulateur.': ['Scan the QR code or open the link below to reopen the simulation in the simulator.', 'امسح رمز QR أو افتح الرابط أدناه لاسترجاع المحاكاة في المحاكي.'],
    'Mentions légales': ['Legal notice', 'إشعار قانوني'],
    'Simulation indicative, non contractuelle': ['Indicative, non-contractual simulation', 'محاكاة تقديرية وغير تعاقدية'],
    'Page {0} / {1}': ['Page {0} / {1}', 'الصفحة {0} / {1}'],
    'Revenu brut annuel : {0} · Investissement : {1} par an ({2} {3})': ['Annual gross income: {0} · Investment: {1} per year ({2} {3})', 'الدخل الخام السنوي: {0} · الاستثمار: {1} سنويًا ({2} {3})'],
    '{0} enfant(s), {1} infirme(s), {2} étudiant(s), {3} parent(s)': ['{0} child(ren), {1} with disabilities, {2} student(s), {3} parent(s)', '{0} طفل، {1} ذو إعاقة، {2} طالب، {3} والد'],
    '{0} ans, rendement {1}, frais {2}, écart entre scénarios ± {3} pts': ['{0} years, return {1}, fees {2}, spread between scenarios ± {3} pts', '{0} سنة، عائد {1}، مصاريف {2}، فارق بين السيناريوهات ± {3} نقطة'],
    'hausse annuelle {0}': ['annual growth {0}', 'ارتفاع سنوي {0}'],
    'inflation {0}': ['inflation {0}', 'تضخم {0}'],
    'économie d\'impôt réinvestie': ['tax saving reinvested', 'الوفر الضريبي مُعاد استثماره'],

    /* ---------- Portefeuille et comparateur ---------- */
    'Portefeuille du conseiller': ['Adviser portfolio', 'محفظة المستشار'],
    'Simulations enregistrées dans ce navigateur uniquement, sans serveur': ['Simulations saved in this browser only, no server', 'محاكاة محفوظة في هذا المتصفح فقط، دون خادم'],
    'Comparer la sélection': ['Compare selection', 'مقارنة المحدد'],
    'Comparer la sélection ({0})': ['Compare selection ({0})', 'مقارنة المحدد ({0})'],
    'Exporter en Excel': ['Export to Excel', 'تصدير إلى Excel'],
    'Tout supprimer': ['Delete all', 'حذف الكل'],
    'Aucune simulation enregistrée. Utilisez « Enregistrer » à côté des résultats.': ['No saved simulations. Use “Save” next to the results.', 'لا توجد محاكاة محفوظة. استعمل «حفظ» بجانب النتائج.'],
    'Comparaison des simulations, défilable': ['Simulation comparison, scrollable', 'مقارنة المحاكاة، قابلة للتمرير'],
    'Simulation sans nom': ['Untitled simulation', 'محاكاة دون اسم'],
    'revenu {0}': ['income {0}', 'الدخل {0}'],
    'économie par an': ['saving per year', 'الوفر السنوي'],
    'capital médian': ['median capital', 'رأس المال الوسيط'],
    'Ouvrir': ['Open', 'فتح'],
    'Supprimer cette simulation': ['Delete this simulation', 'حذف هذه المحاكاة'],
    'Critère': ['Criterion', 'المعيار'],
    'meilleure valeur': ['best value', 'أفضل قيمة'],
    'Simulation enregistrée dans le portefeuille.': ['Simulation saved to the portfolio.', 'تم حفظ المحاكاة في المحفظة.'],
    'Enregistrement impossible.': ['Could not save.', 'تعذّر الحفظ.'],
    'Simulation ouverte.': ['Simulation opened.', 'تم فتح المحاكاة.'],
    'Simulation supprimée.': ['Simulation deleted.', 'تم حذف المحاكاة.'],
    'Supprimer toutes les simulations enregistrées dans ce navigateur ?': ['Delete all simulations saved in this browser?', 'حذف كل المحاكاة المحفوظة في هذا المتصفح؟'],
    'Portefeuille vidé.': ['Portfolio cleared.', 'تم إفراغ المحفظة.'],
    'Le portefeuille n\'est pas disponible dans ce navigateur.': ['The portfolio is not available in this browser.', 'المحفظة غير متاحة في هذا المتصفح.'],
    'Le portefeuille n\'est pas disponible dans ce navigateur (stockage local désactivé).': ['The portfolio is not available in this browser (local storage disabled).', 'المحفظة غير متاحة في هذا المتصفح (التخزين المحلي معطّل).'],
    'Revenu brut annuel': ['Annual gross income', 'الدخل الخام السنوي'],
    'Investissement annuel': ['Annual investment', 'الاستثمار السنوي'],
    'Durée (ans)': ['Term (years)', 'المدة (سنوات)'],
    'Économie d\'impôt annuelle': ['Annual tax saving', 'الوفر الضريبي السنوي'],
    'Capital prudent': ['Cautious capital', 'رأس المال (حذر)'],
    'Capital médian': ['Median capital', 'رأس المال (وسيط)'],
    'Capital dynamique': ['Dynamic capital', 'رأس المال (ديناميكي)'],
    'Capital médian en dinars constants': ['Median capital in constant dinars', 'رأس المال الوسيط بالدينار الثابت'],
    'Rendement annuel effectif': ['Effective annual return', 'العائد السنوي الفعلي'],
    'Langue : français': ['Language: English', 'اللغة: العربية'],

    /* ---------- Agence, envoi, retraite, objectif, comparatif, portefeuille, aide et FAQ ---------- */
    'Agence : logo et coordonnées sur le PDF': ['Agency: logo and contact details on the PDF', 'الوكالة: الشعار والعنوان في تقرير PDF'],
    'Nom de l\'agence': ['Agency name', 'اسم الوكالة'],
    'Téléphone': ['Phone', 'الهاتف'],
    'E-mail': ['Email', 'البريد الإلكتروني'],
    'Adresse': ['Address', 'العنوان'],
    'Logo de l\'agence': ['Agency logo', 'شعار الوكالة'],
    'PNG ou JPEG': ['PNG or JPEG', 'PNG أو JPEG'],
    'Choisir un logo': ['Choose a logo', 'اختيار شعار'],
    'Retirer le logo': ['Remove the logo', 'حذف الشعار'],
    'Mémorisé sur cet appareil uniquement, avec le nom du conseiller.': ['Stored on this device only, together with the adviser name.', 'يُحفظ على هذا الجهاز فقط، مع اسم المستشار.'],
    'Choisissez une image PNG ou JPEG.': ['Choose a PNG or JPEG image.', 'اختر صورة بصيغة PNG أو JPEG.'],
    'Logo trop lourd pour être mémorisé.': ['Logo too large to be stored.', 'الشعار كبير جدًا ولا يمكن حفظه.'],
    'Logo enregistré : il figurera sur le rapport PDF.': ['Logo saved: it will appear on the PDF report.', 'تم حفظ الشعار: سيظهر في تقرير PDF.'],
    'Logo retiré.': ['Logo removed.', 'تم حذف الشعار.'],
    'WhatsApp': ['WhatsApp', 'واتساب'],
    'Envoyer le PDF': ['Send the PDF', 'إرسال ملف PDF'],
    'Voici votre simulation d\'assurance vie et de CEA : {0}': ['Here is your life insurance and CEA simulation: {0}', 'إليك محاكاة التأمين على الحياة وحساب الادخار في الأسهم: {0}'],
    'Votre simulation d\'assurance vie et de CEA': ['Your life insurance and CEA simulation', 'محاكاة التأمين على الحياة وحساب الادخار في الأسهم الخاصة بك'],
    'Envoi impossible depuis ce navigateur : téléchargez le PDF.': ['Cannot send from this browser: download the PDF instead.', 'تعذّر الإرسال من هذا المتصفح: نزّل ملف PDF.'],
    'Explication': ['Explanation', 'شرح'],
    'L\'impôt après investissement ne peut pas descendre sous 45 % de l\'impôt initial : la réduction est donc de 55 % au plus. Le montant optimal est le plus petit investissement qui atteint ce plancher ; au-delà, l\'économie n\'augmente plus.': ['Tax after investment cannot fall below 45% of the initial tax, so the reduction is 55% at most. The optimal amount is the smallest investment that reaches this floor; beyond it, the saving no longer increases.', 'لا يمكن أن تقل الضريبة بعد الاستثمار عن 45 % من الضريبة الأصلية، أي أن التخفيض لا يتجاوز 55 %. المبلغ الأمثل هو أصغر استثمار يبلغ هذا الحد الأدنى؛ وما زاد عليه لا يرفع الوفر.'],
    'Trois scénarios encadrent le rendement saisi (prudent, médian, dynamique). Le rendement annuel effectif (TRI) tient compte des versements, de l\'économie d\'impôt de chaque année et du capital final : c\'est le rendement qu\'il faudrait obtenir sans avantage fiscal pour arriver au même résultat.': ['Three scenarios frame the return entered (cautious, median, dynamic). The effective annual return (IRR) takes into account payments, each year\'s tax saving and the final capital: it is the return you would need without any tax advantage to reach the same result.', 'تحيط ثلاثة سيناريوهات بالعائد المُدخل (حذر، وسيط، ديناميكي). يأخذ العائد السنوي الفعلي بعين الاعتبار الدفعات والوفر الضريبي لكل سنة ورأس المال النهائي: وهو العائد الذي يلزم تحقيقه دون امتياز ضريبي للوصول إلى النتيجة نفسها.'],
    'Racheter, c\'est récupérer tout ou partie de son épargne avant le terme. Le contrat peut prévoir une pénalité, et si le rachat intervient trop tôt, les montants déduits de l\'impôt sont réintégrés au revenu de l\'année du rachat : l\'avantage fiscal obtenu est alors en partie repris.': ['A surrender means withdrawing all or part of your savings before maturity. The contract may charge a penalty, and if the surrender happens too early, the amounts deducted from tax are added back to that year\'s income: part of the tax advantage is clawed back.', 'الاسترداد هو سحب كل الادخار أو جزء منه قبل الأجل. قد ينص العقد على غرامة، وإذا تم الاسترداد مبكرًا تُعاد المبالغ المطروحة من الضريبة إلى دخل سنة الاسترداد: فيُسترجع جزء من الامتياز الضريبي.'],
    'Au terme, le capital peut être converti en rente versée chaque année. Le taux technique est le rendement garanti retenu pour calculer cette rente : plus il est élevé, plus la rente est forte. En cas de décès, les bénéficiaires reçoivent le plus élevé du capital acquis, des versements et du capital garanti éventuel.': ['At maturity, the capital can be converted into an annuity paid each year. The technical rate is the guaranteed return used to calculate it: the higher it is, the larger the annuity. On death, beneficiaries receive the highest of the capital acquired, the payments made and any guaranteed capital.', 'عند الأجل، يمكن تحويل رأس المال إلى جراية تُصرف كل سنة. النسبة الفنية هي العائد المضمون المعتمد لاحتسابها: كلما ارتفعت ارتفعت الجراية. وفي حالة الوفاة، يتحصل المستفيدون على الأعلى بين رأس المال المكتسب والدفعات ورأس المال المضمون إن وُجد.'],
    'Calculer la durée jusqu\'à la retraite': ['Calculate the term until retirement', 'احتساب المدة حتى التقاعد'],
    'Âge actuel': ['Current age', 'السن الحالية'],
    'Âge de départ à la retraite': ['Retirement age', 'سن التقاعد'],
    'Ex. 35': ['E.g. 35', 'مثال: 35'],
    'Indiquez votre âge actuel.': ['Enter your current age.', 'أدخل سنك الحالية.'],
    'L\'âge actuel doit être un nombre entier entre 18 et 75 ans.': ['Current age must be a whole number between 18 and 75.', 'يجب أن تكون السن الحالية عددًا صحيحًا بين 18 و75 سنة.'],
    'L\'âge de départ doit être un nombre entier entre 40 et 80 ans.': ['Retirement age must be a whole number between 40 and 80.', 'يجب أن تكون سن التقاعد عددًا صحيحًا بين 40 و80 سنة.'],
    'L\'écart entre les deux âges doit être compris entre 1 et {0} ans.': ['The gap between the two ages must be between 1 and {0} years.', 'يجب أن يكون الفارق بين السنّين بين 1 و{0} سنة.'],
    'Retraite': ['Retirement', 'التقاعد'],
    'Âge actuel {0} ans, départ à {1} ans': ['Current age {0}, retiring at {1}', 'السن الحالية {0} سنة، التقاعد في سن {1}'],
    'Pension de retraite mensuelle estimée': ['Estimated monthly pension', 'جراية التقاعد الشهرية التقديرية'],
    'Rente annuelle estimée à partir de {0} ans, pendant {1} ans': ['Estimated annual annuity from age {0}, for {1} years', 'الجراية السنوية التقديرية ابتداءً من سن {0} ولمدة {1} سنة'],
    'Revenu mensuel à la retraite (pension + rente)': ['Monthly retirement income (pension + annuity)', 'الدخل الشهري عند التقاعد (جراية التقاعد + الجراية)'],
    'Part du revenu apportée par la rente': ['Share of income from the annuity', 'حصة الجراية من الدخل'],
    'Impôt sur les intérêts du placement classique': ['Tax on interest from the standard investment', 'الضريبة على فوائد التوظيف التقليدي'],
    'L\'impôt sur les intérêts doit être compris entre 0 et 50 %.': ['Tax on interest must be between 0 and 50%.', 'يجب أن تكون الضريبة على الفوائد بين 0 و50 %.'],
    'Objectif de capital au terme': ['Capital target at maturity', 'رأس المال المنشود عند الأجل'],
    'Scénario médian': ['Median scenario', 'السيناريو الوسيط'],
    'Ex. 100 000': ['E.g. 100 000', 'مثال: 100 000'],
    'Appliquer ce versement': ['Apply this payment', 'تطبيق هذه الدفعة'],
    'Indiquez le capital souhaité au terme : le simulateur calcule le versement nécessaire.': ['Enter the capital you want at maturity: the simulator works out the payment needed.', 'أدخل رأس المال المطلوب عند الأجل: يحسب المحاكي الدفعة اللازمة.'],
    'Corrigez d\'abord les hypothèses de projection.': ['First correct the projection assumptions.', 'صحّح أولًا فرضيات الإسقاط.'],
    'Versez {0} {1} (soit {2} par an) pour atteindre {3} en {4} ans.': ['Pay in {0} {1} ({2} per year) to reach {3} in {4} years.', 'ادفع {0} {1} (أي {2} سنويًا) لبلوغ {3} خلال {4} سنة.'],
    'Montant de la première année, puis en hausse de {0} par an.': ['First-year amount, then rising by {0} per year.', 'مبلغ السنة الأولى، ثم يرتفع بنسبة {0} سنويًا.'],
    'Comparatif des placements au terme': ['Investment comparison at maturity', 'مقارنة التوظيفات عند الأجل'],
    'Assurance vie ou CEA : capital + économie d\'impôt': ['Life insurance or CEA: capital + tax saving', 'التأمين على الحياة أو حساب الادخار في الأسهم: رأس المال + الوفر الضريبي'],
    'Placement classique à {0}, avant impôt': ['Standard investment at {0}, before tax', 'توظيف تقليدي بنسبة {0}، قبل الضريبة'],
    'Placement classique à {0}, après impôt sur les intérêts ({1})': ['Standard investment at {0}, after tax on interest ({1})', 'توظيف تقليدي بنسبة {0}، بعد الضريبة على الفوائد ({1})'],
    'Placement classique après impôt sur les intérêts ({0})': ['Standard investment after tax on interest ({0})', 'التوظيف التقليدي بعد الضريبة على الفوائد ({0})'],
    'Sauvegarder (fichier)': ['Back up (file)', 'نسخة احتياطية (ملف)'],
    'Restaurer une sauvegarde': ['Restore a backup', 'استرجاع نسخة احتياطية'],
    'Fichier de sauvegarde non reconnu.': ['Backup file not recognised.', 'ملف النسخة الاحتياطية غير معروف.'],
    '{0} simulation(s) restaurée(s).': ['{0} simulation(s) restored.', 'تم استرجاع {0} محاكاة.'],
    'Sauvegarde téléchargée : conservez ce fichier pour restaurer le portefeuille sur un autre appareil.': ['Backup downloaded: keep this file to restore the portfolio on another device.', 'تم تنزيل النسخة الاحتياطية: احتفظ بهذا الملف لاسترجاع المحفظة على جهاز آخر.'],
    'Simulations': ['Simulations', 'المحاكاة'],
    'Épargne annuelle proposée': ['Annual savings proposed', 'الادخار السنوي المقترح'],
    'Économies d\'impôt par an': ['Tax savings per year', 'الوفر الضريبي السنوي'],
    'Capital médian projeté': ['Projected median capital', 'رأس المال الوسيط المتوقع'],
    'Questions fréquentes': ['Frequently asked questions', 'أسئلة متداولة'],
    'L\'essentiel pour comprendre la simulation': ['The essentials to understand the simulation', 'الأساسيات لفهم المحاكاة'],
    'Qu\'est-ce que le plancher de 45 % ?': ['What is the 45% floor?', 'ما هو الحد الأدنى البالغ 45 %؟'],
    'Après déduction de l\'investissement, l\'impôt ne peut pas être inférieur à 45 % de l\'impôt dû sans investissement. L\'économie maximale est donc de 55 % de l\'impôt initial. Investir davantage reste possible, mais ne réduit plus l\'impôt.': ['After the investment is deducted, tax cannot be lower than 45% of the tax due without investment. The maximum saving is therefore 55% of the initial tax. You can invest more, but it no longer reduces your tax.', 'بعد طرح الاستثمار، لا يمكن أن تقل الضريبة عن 45 % من الضريبة المستحقة دون استثمار. أقصى وفر هو إذن 55 % من الضريبة الأصلية. يمكن استثمار المزيد، لكنه لا يخفض الضريبة.'],
    'Quelle différence entre assurance vie et CEA ?': ['What is the difference between life insurance and a CEA?', 'ما الفرق بين التأمين على الحياة وحساب الادخار في الأسهم؟'],
    'L\'assurance vie est un contrat d\'épargne souscrit auprès d\'un assureur : elle permet de désigner des bénéficiaires et peut comporter des garanties de prévoyance. Le Compte Épargne en Actions (CEA) est un compte investi en actions cotées en bourse, avec des titres bloqués pendant une durée minimale. Les deux ouvrent droit à une déduction du revenu imposable, sous conditions propres à chacun : vérifiez-les auprès de votre conseiller.': ['Life insurance is a savings contract taken out with an insurer: it lets you name beneficiaries and may include protection cover. The Equity Savings Account (CEA) is invested in listed shares, which are locked in for a minimum period. Both give a deduction from taxable income, each under its own conditions: check them with your adviser.', 'التأمين على الحياة عقد ادخار يُبرم مع مؤمِّن: يتيح تعيين مستفيدين وقد يتضمن ضمانات حيطة. أما حساب الادخار في الأسهم فهو حساب مستثمر في أسهم مدرجة في البورصة، مع تجميد السندات لمدة دنيا. يخول كلاهما طرحًا من الدخل الخاضع للضريبة وفق شروط خاصة بكل منهما: تثبّت منها لدى مستشارك.'],
    'Pourquoi un rachat anticipé coûte-t-il cher ?': ['Why is an early surrender expensive?', 'لماذا يكون الاسترداد المسبق مكلفًا؟'],
    'En cas de sortie avant la durée minimale, les montants déduits sont réintégrés au revenu imposable de l\'année du rachat, souvent dans une tranche élevée ; le contrat peut aussi prévoir une pénalité. La carte « Simulation de rachat anticipé » chiffre ce coût.': ['If you exit before the minimum term, the amounts deducted are added back to taxable income in the surrender year, often in a high bracket; the contract may also charge a penalty. The “Early surrender simulation” card calculates this cost.', 'في حالة الخروج قبل المدة الدنيا، تُعاد المبالغ المطروحة إلى الدخل الخاضع للضريبة لسنة الاسترداد، وغالبًا في شريحة مرتفعة؛ وقد ينص العقد أيضًا على غرامة. تحتسب بطاقة «محاكاة الاسترداد المسبق» هذه الكلفة.'],
    'Que signifie « en dinars constants » ?': ['What does “in constant dinars” mean?', 'ماذا يعني «بالدينار الثابت»؟'],
    'C\'est la valeur du capital futur exprimée en pouvoir d\'achat d\'aujourd\'hui, une fois l\'inflation retirée. Renseignez l\'inflation dans les hypothèses avancées pour l\'afficher.': ['It is the value of the future capital in today\'s purchasing power, once inflation is removed. Enter inflation in the advanced assumptions to display it.', 'هي قيمة رأس المال المستقبلي معبَّرًا عنها بالقدرة الشرائية الحالية بعد استبعاد التضخم. أدخل التضخم في الفرضيات المتقدمة لعرضها.'],
    'Comment atteindre un capital précis ?': ['How can I reach a specific amount of capital?', 'كيف أبلغ رأس مال محددًا؟'],
    'Indiquez l\'objectif de capital dans la carte « Projection du capital » : le simulateur calcule le versement nécessaire avec les hypothèses choisies, puis l\'applique en un clic. Cochez « Calculer la durée jusqu\'à la retraite » pour caler la durée sur votre âge.': ['Enter the capital target in the “Capital projection” card: the simulator calculates the payment needed with the chosen assumptions, then applies it in one click. Tick “Calculate the term until retirement” to base the term on your age.', 'أدخل رأس المال المنشود في بطاقة «إسقاط رأس المال»: يحسب المحاكي الدفعة اللازمة وفق الفرضيات المختارة ثم يطبقها بنقرة واحدة. فعّل «احتساب المدة حتى التقاعد» لضبط المدة حسب سنك.'],
    'Mes données sont-elles envoyées quelque part ?': ['Is my data sent anywhere?', 'هل تُرسل بياناتي إلى أي جهة؟'],
    'Non. Tous les calculs se font dans votre navigateur. Le portefeuille et les coordonnées de l\'agence restent sur cet appareil ; le lien de partage ne contient que les paramètres de calcul, jamais les noms.': ['No. All calculations run in your browser. The portfolio and the agency details stay on this device; the share link contains only the calculation parameters, never names.', 'لا. تتم كل العمليات الحسابية في متصفحك. تبقى المحفظة وعنوان الوكالة على هذا الجهاز؛ ولا يتضمن رابط المشاركة سوى معايير الحساب، دون أي أسماء.'],

    /* ---------- Installation ---------- */
    'Installer l\'application': ['Install the app', 'تثبيت التطبيق'],
    'Compris': ['Got it', 'فهمت'],
    'Sur iPhone ou iPad : touchez le bouton Partager de Safari, puis « Sur l\'écran d\'accueil ».': ['On iPhone or iPad: tap Safari\'s Share button, then “Add to Home Screen”.', 'على iPhone أو iPad: المس زر المشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».'],
    'Sur Mac avec Safari : menu Fichier, puis « Ajouter au Dock ».': ['On a Mac with Safari: File menu, then “Add to Dock”.', 'على Mac مع Safari: قائمة «ملف» ثم «إضافة إلى Dock».'],
    'Sur Android : ouvrez le menu ⋮ du navigateur, puis « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».': ['On Android: open the browser\'s ⋮ menu, then “Install app” or “Add to Home screen”.', 'على Android: افتح قائمة ⋮ في المتصفح ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».'],
    'Ouvrez cette page avec Chrome ou Edge, puis cliquez sur l\'icône d\'installation dans la barre d\'adresse (ou menu ⋮, « Installer »).': ['Open this page in Chrome or Edge, then click the install icon in the address bar (or ⋮ menu, “Install”).', 'افتح هذه الصفحة في Chrome أو Edge ثم انقر على أيقونة التثبيت في شريط العنوان (أو القائمة ⋮، «تثبيت»).'],
    'Installation en cours : l\'application sera disponible depuis votre écran d\'accueil.': ['Installing: the app will be available from your home screen.', 'جارٍ التثبيت: سيكون التطبيق متاحًا من شاشتك الرئيسية.'],
    'Application installée.': ['App installed.', 'تم تثبيت التطبيق.'],
    /* ---------- Barèmes ---------- */
    'Loi de finances 2025': ['2025 Finance Act', 'قانون المالية لسنة 2025'],
    'Paramètres repris de la version précédente du simulateur ; à confirmer avec le texte officiel (Code de l\'IRPP et de l\'IS).': ['Parameters carried over from the previous version of the simulator; to be confirmed against the official text (Personal Income Tax and Corporate Tax Code).', 'معايير مأخوذة من النسخة السابقة للمحاكي؛ يجب التثبت منها في النص الرسمي (مجلة الضريبة على دخل الأشخاص الطبيعيين والضريبة على الشركات).']
  };

  var courante = 'fr';
  var titre = null;
  var ATTRIBUTS = ['placeholder', 'aria-label', 'title'];

  function definir(l) { courante = LANGUES.indexOf(l) !== -1 ? l : 'fr'; }
  function langue() { return courante; }
  function locale() { return LOCALES[courante]; }

  function t(fr, vars) {
    var s = fr;
    if (courante !== 'fr' && Object.prototype.hasOwnProperty.call(D, fr)) s = D[fr][courante === 'en' ? 0 : 1] || fr;
    if (vars) s = s.replace(/\{(\d+)\}/g, function (m, i) { return vars[i] !== undefined ? String(vars[i]) : m; });
    return s;
  }

  function connu(fr) { return Object.prototype.hasOwnProperty.call(D, fr); }

  /* Traduit les nœuds de texte et les attributs (le français d'origine est conservé pour revenir en arrière) */
  function traduireDom(racineDom) {
    if (titre === null) titre = document.title;
    var parcours = document.createTreeWalker(racineDom, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = parcours.nextNode())) {
      var parent = n.parentNode && n.parentNode.nodeName;
      if (parent === 'SCRIPT' || parent === 'STYLE') continue;
      var brut = n.nodeValue;
      var fr = n._fr || brut.trim();
      if (!fr || (!n._fr && !connu(fr))) continue;
      n._fr = fr;
      var debut = brut.match(/^\s*/)[0], fin = brut.match(/\s*$/)[0];
      var cible = debut + t(fr) + fin;
      if (cible !== brut) n.nodeValue = cible;
    }
    Array.prototype.forEach.call(racineDom.querySelectorAll('[placeholder],[aria-label],[title]'), function (el) {
      el._frAttr = el._frAttr || {};
      ATTRIBUTS.forEach(function (a) {
        if (!el.hasAttribute(a)) return;
        var fr = el._frAttr[a] || el.getAttribute(a);
        if (!el._frAttr[a] && !connu(fr)) return;
        el._frAttr[a] = fr;
        el.setAttribute(a, t(fr));
      });
    });
  }

  function titreOriginal() { return titre === null ? document.title : titre; }

  return { LANGUES: LANGUES, D: D, definir: definir, langue: langue, locale: locale, t: t, connu: connu, traduireDom: traduireDom, titreOriginal: titreOriginal };
});
