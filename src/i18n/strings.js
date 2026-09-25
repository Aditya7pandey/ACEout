/**
 * The string catalogue.
 *
 * English is the source language and the fallback: a key missing from `hi`
 * falls back to `en` rather than showing the raw key, so a half-translated
 * screen degrades into English instead of into rubbish.
 *
 * Only the ray-optics bench is translated so far. Everything else in the app
 * is still English in both languages, which is why the shell carries no keys
 * here yet — adding a screen means adding its keys to both objects.
 *
 * `{name}` placeholders are filled by `t(key, vars)`.
 */

const en = {
  // --- the language control itself (You → Setup) ---------------------------
  'settings.language': 'Language',
  'settings.language.note': 'Ray optics lab only',

  // The mode strip. Generic, but only passed in by a translated bench — an
  // English lab keeps LabShell's own English defaults.
  'lab.mode.guided': 'Guided',
  'lab.mode.free': 'Free play',

  // The observation table is shared by every bench, so these land in English
  // labs too — which is why they are worded to suit any of them.
  'table.title': 'Observation table',
  'table.reading': 'reading',
  'table.readings': 'readings',
  'table.empty': 'No readings recorded yet.',

  // Lab titles come from the catalogue in English; a translated bench names
  // itself here and `LabScreen` prefers this when the key exists.
  'lab.title.eye-defects': 'The human eye: near point, far point and spectacles',

  // --- station copy -------------------------------------------------------
  // Nothing here may contain the answer: `direction` in steps.js is the only
  // steer a student gets, and these strings must not add a second one.
  'eye.normal.ordinal': 'Station one',
  'eye.normal.name': 'The healthy eye',
  'eye.normal.clinical': 'Emmetropia (normal)',
  'eye.normal.readingLabel': 'Near point',
  'eye.normal.brief':
    'Healthy eye: distance is already sharp. Find the near end — watch the lens fatten as you come in.',
  'eye.normal.prompt': 'Slide in. Stop the moment the retina loses the point.',
  'eye.normal.record': 'The near point of a healthy eye — the next two are measured against it.',
  'eye.normal.revealTitle': 'A baseline, not a defect',
  'eye.normal.reveal':
    'Nothing to correct. Infinity relaxed, your reading straining — that gap is its accommodation, and the next two eyes each fail one end of it.',

  'eye.myopia.ordinal': 'Station two',
  'eye.myopia.name': 'Short sight — myopia',
  'eye.myopia.clinical': 'Myopia (short sight)',
  'eye.myopia.readingLabel': 'Far point',
  'eye.myopia.brief':
    'Too long an eyeball: far off, the image lands in front of the retina. Find the furthest point it still holds.',
  'eye.myopia.prompt': 'Slide out. Stop where the point first breaks up.',
  'eye.myopia.record': 'The far point — the whole diagnosis. A healthy eye has none; it reaches infinity.',
  'eye.myopia.revealTitle': 'Short sight — corrected',
  'eye.myopia.reveal':
    'A concave lens spreads the light first, so distant rays arrive as if from your far point — a distance this eye already handles.',

  'eye.hypermetropia.ordinal': 'Station three',
  'eye.hypermetropia.name': 'Long sight — hypermetropia',
  'eye.hypermetropia.clinical': 'Hypermetropia (long sight)',
  'eye.hypermetropia.readingLabel': 'Near point',
  'eye.hypermetropia.brief':
    'Too short an eyeball: up close the lens runs out and the image forms behind the retina. Find where it gives up.',
  'eye.hypermetropia.prompt': 'Slide in. Stop the moment the retina loses the point.',
  'eye.hypermetropia.record': 'Compare with station one — this eye needs the page much further out.',
  'eye.hypermetropia.revealTitle': 'Long sight — corrected',
  'eye.hypermetropia.reveal':
    'A convex lens converges the light first, so a page at reading distance arrives as if out at your near point.',

  // --- guided bench chrome -------------------------------------------------
  'eye.beat.reading': 'Take the reading',
  'eye.beat.correction': 'The correction',
  'eye.action.record': 'Record',
  'eye.action.next': 'Next eye',
  'eye.action.finish': 'Finish and see the theory',
  'eye.nudge.tag': 'Not the limit yet — keep working',
  'eye.nudge.short':
    'Still crisp on the retina. Keep going {dir} until the edges soften.',
  'eye.nudge.past':
    'Gone past it — the retina has a disc, not a point. Come back {dir} until it sharpens, and stop there.',
  'eye.dir.closer': 'closer',
  'eye.dir.further': 'further out',
  'eye.dir.out': 'out',
  'eye.dir.in': 'in',
  'eye.slider.object': 'Object distance · move it {dir} the eye',
  'eye.slider.towards': 'towards',
  'eye.slider.away': 'away from',

  // --- the retinal readout -------------------------------------------------
  'eye.meter.title': 'Retinal image',
  'eye.verdict.sharp': 'Sharp point',
  'eye.verdict.sharpCorrected': 'Sharp — corrected',
  'eye.verdict.softening': 'Softening',
  'eye.verdict.blurred': 'Blurred',
  'eye.verdict.unreadable': 'Unreadable',
  'eye.lensState.corrected': 'spectacle lens doing the work',
  'eye.lensState.straining': 'lens at full accommodation',
  'eye.lensState.relaxed': 'lens relaxed within range',

  // --- free play -----------------------------------------------------------
  'eye.free.eyeball': 'Eyeball',
  'eye.free.rangeWearing': 'Range, wearing it',
  'eye.free.rangeBare': 'Range, bare',
  'eye.free.far': 'far',
  'eye.free.near': 'near',
  'eye.free.straining': 'Lens at full accommodation — nothing left to give',
  'eye.free.relaxed': 'Lens fully relaxed',
  'eye.free.accommodating': 'Lens accommodating · {pct}% of its range',
  'eye.free.objectDistance': 'Object distance',
  'eye.free.axial': 'Eyeball · lens to retina',
  'eye.free.power': 'Corrective power',
  'eye.free.mark.reading': 'reading',
  'eye.free.mark.normal': 'normal',
  'eye.free.mark.none': 'none',
  'eye.diagnosis.myopia': 'Myopia — eyeball too long',
  'eye.diagnosis.hypermetropia': 'Hypermetropia — eyeball too short',
  'eye.diagnosis.normal': 'Emmetropia — normal',

  // --- the report ----------------------------------------------------------
  'eye.report.eyebrow': 'What you just measured',
  'eye.report.title': 'Three distances, two prescriptions',
  'eye.report.lede':
    'You never touched a lens on that bench — you moved an arrow and watched a point turn into a smear. Those three numbers are enough to grind both pairs of glasses.',
  'eye.report.tableTitle': 'Your observations',
  'eye.report.tableCaption':
    'Bench least count {lc} cm, so every reading is quoted to one decimal place. The three columns on the right are calculated from your readings — nothing here was measured for you.',
  'eye.report.col.eye': 'Eye',
  'eye.report.col.limit': 'Limit measured',
  'eye.report.col.reading': 'Reading',
  'eye.report.col.defect': 'Defect',
  'eye.report.col.lens': 'Corrective lens',
  'eye.report.col.power': 'Power',
  'eye.report.unit.dioptres': 'dioptres (D)',
  'eye.defect.none': 'None',
  'eye.defect.myopia': 'Myopia',
  'eye.defect.hypermetropia': 'Hypermetropia',
  'eye.lens.concave': 'Concave (diverging)',
  'eye.lens.convex': 'Convex (converging)',
  'eye.lens.none': 'None needed',
  'eye.report.formulaNote': 'f in metres, P in dioptres',
  'eye.report.workedThrough': 'Your numbers, worked through',
  'eye.report.myopia.title': 'Short sight — the concave lens',
  'eye.report.myopia.setup':
    'Take an object at infinity and land its image on the far point you found, {reading} cm out. With u = ∞, f is simply the far point — negative, because that image is virtual.',
  'eye.report.myopia.verdict':
    '{power} D. A negative number on a prescription always means short sight.',
  'eye.report.hyper.title': 'Long sight — the convex lens',
  'eye.report.hyper.setup':
    'Take a page at a comfortable {normal} cm and throw its image out to the near point you found, {reading} cm, where this eye can reach it.',
  'eye.report.hyper.verdict': '{power} D. A positive number always means long sight.',
  'eye.report.noteLabel': 'What your readings are worth',
  'eye.report.note':
    'The bench resolves {lc} cm, so each reading carries {sf} significant figures and no power above is quoted to more.',
  'eye.report.noteNormal':
    ' Your healthy eye came out at {reading} cm against the textbook {normal} cm — a blur that has only just appeared is a judgement call, and always will be.',
  'eye.report.finish': 'Finish and log this lab',
};

const hi = {
  'settings.language': 'भाषा',
  'settings.language.note': 'केवल किरण प्रकाशिकी प्रयोग',

  'lab.mode.guided': 'निर्देशित',
  'lab.mode.free': 'स्वतंत्र',

  'table.title': 'प्रेक्षण सारणी',
  'table.reading': 'पाठ्यांक',
  'table.readings': 'पाठ्यांक',
  'table.empty': 'अभी कोई पाठ्यांक दर्ज नहीं हुआ।',

  'lab.title.eye-defects': 'मानव नेत्र: निकट बिंदु, दूर बिंदु और चश्मा',

  'eye.normal.ordinal': 'पड़ाव एक',
  'eye.normal.name': 'स्वस्थ नेत्र',
  'eye.normal.clinical': 'सामान्य दृष्टि (एमेट्रोपिया)',
  'eye.normal.readingLabel': 'निकट बिंदु',
  'eye.normal.brief':
    'यह नेत्र स्वस्थ है: दूर का दृश्य पहले से स्पष्ट है। निकट वाला सिरा खोजिए — पास आते समय लेंस को मोटा होते देखिए।',
  'eye.normal.prompt': 'तीर को नेत्र की ओर खिसकाइए। जैसे ही रेटिना पर बिंदु टूटे, रुक जाइए।',
  'eye.normal.record': 'स्वस्थ नेत्र का निकट बिंदु — अगले दोनों पड़ाव इसी से तुलना करके मापे जाएँगे।',
  'eye.normal.revealTitle': 'यह दोष नहीं, आधार है',
  'eye.normal.reveal':
    'यहाँ सुधारने को कुछ नहीं। शिथिल लेंस अनंत तक देखता है और पूरा तनकर आपके पाठ्यांक तक — यही अंतर इसकी समंजन क्षमता है। आगे के दोनों नेत्र इसी के एक-एक सिरे पर विफल होते हैं।',

  'eye.myopia.ordinal': 'पड़ाव दो',
  'eye.myopia.name': 'निकट दृष्टि दोष (मायोपिया)',
  'eye.myopia.clinical': 'निकट दृष्टि दोष',
  'eye.myopia.readingLabel': 'दूर बिंदु',
  'eye.myopia.brief':
    'नेत्रगोलक कुछ अधिक लंबा है: दूर की वस्तु का प्रतिबिंब रेटिना से पहले ही बन जाता है। वह सबसे दूर बिंदु खोजिए जहाँ तक यह नेत्र स्पष्ट देख पाता है।',
  'eye.myopia.prompt': 'तीर को दूर खिसकाइए। जहाँ बिंदु पहली बार बिखरे, वहीं रुकिए।',
  'eye.myopia.record': 'यही दूर बिंदु है, और यही पूरा निदान है। स्वस्थ नेत्र का दूर बिंदु अनंत पर होता है।',
  'eye.myopia.revealTitle': 'निकट दृष्टि दोष — सुधार के बाद',
  'eye.myopia.reveal':
    'अवतल लेंस प्रकाश को पहले फैला देता है, इसलिए दूर से आती किरणें ऐसे पहुँचती हैं मानो आपके दूर बिंदु से आ रही हों — इतनी दूरी यह नेत्र पहले से सँभाल लेता है।',

  'eye.hypermetropia.ordinal': 'पड़ाव तीन',
  'eye.hypermetropia.name': 'दूर दृष्टि दोष (हाइपरमेट्रोपिया)',
  'eye.hypermetropia.clinical': 'दूर दृष्टि दोष',
  'eye.hypermetropia.readingLabel': 'निकट बिंदु',
  'eye.hypermetropia.brief':
    'नेत्रगोलक कुछ छोटा है: पास की वस्तु पर लेंस की समंजन क्षमता चुक जाती है और प्रतिबिंब रेटिना के पीछे बनने लगता है। खोजिए कि यह कहाँ हार मान लेता है।',
  'eye.hypermetropia.prompt': 'तीर को नेत्र की ओर खिसकाइए। जैसे ही रेटिना पर बिंदु टूटे, रुक जाइए।',
  'eye.hypermetropia.record': 'पड़ाव एक से तुलना कीजिए — इस नेत्र को पन्ना कहीं अधिक दूर चाहिए।',
  'eye.hypermetropia.revealTitle': 'दूर दृष्टि दोष — सुधार के बाद',
  'eye.hypermetropia.reveal':
    'उत्तल लेंस प्रकाश को पहले ही अभिसरित कर देता है, इसलिए सामान्य पठन दूरी पर रखा पन्ना ऐसे दिखता है मानो आपके निकट बिंदु पर रखा हो।',

  'eye.beat.reading': 'पाठ्यांक लीजिए',
  'eye.beat.correction': 'सुधार',
  'eye.action.record': 'दर्ज करें',
  'eye.action.next': 'अगला नेत्र',
  'eye.action.finish': 'समाप्त करें और सिद्धांत देखें',
  'eye.nudge.tag': 'अभी सीमा नहीं आई — खोजते रहिए',
  'eye.nudge.short': 'रेटिना पर अब भी स्पष्ट है। किनारे धुंधले होने तक {dir} बढ़ते रहिए।',
  'eye.nudge.past':
    'सीमा निकल गई — रेटिना पर बिंदु नहीं, चकती है। स्पष्ट होने तक {dir} लौटिए और वहीं रुकिए।',
  'eye.dir.closer': 'और पास',
  'eye.dir.further': 'और दूर',
  'eye.dir.out': 'बाहर की ओर',
  'eye.dir.in': 'अंदर की ओर',
  'eye.slider.object': 'वस्तु की दूरी · इसे नेत्र {dir} ले जाइए',
  'eye.slider.towards': 'की ओर',
  'eye.slider.away': 'से दूर',

  'eye.meter.title': 'रेटिना पर प्रतिबिंब',
  'eye.verdict.sharp': 'स्पष्ट बिंदु',
  'eye.verdict.sharpCorrected': 'स्पष्ट — सुधार सहित',
  'eye.verdict.softening': 'किनारे धुँधलाते हुए',
  'eye.verdict.blurred': 'धुंधला',
  'eye.verdict.unreadable': 'अपठनीय',
  'eye.lensState.corrected': 'काम चश्मे का लेंस कर रहा है',
  'eye.lensState.straining': 'लेंस पूरी समंजन क्षमता पर',
  'eye.lensState.relaxed': 'लेंस सीमा के भीतर शिथिल',

  'eye.free.eyeball': 'नेत्रगोलक',
  'eye.free.rangeWearing': 'परास, लेंस सहित',
  'eye.free.rangeBare': 'परास, बिना लेंस',
  'eye.free.far': 'दूर',
  'eye.free.near': 'निकट',
  'eye.free.straining': 'लेंस पूरी समंजन क्षमता पर — अब कुछ शेष नहीं',
  'eye.free.relaxed': 'लेंस पूरी तरह शिथिल',
  'eye.free.accommodating': 'लेंस समंजन कर रहा है · क्षमता का {pct}%',
  'eye.free.objectDistance': 'वस्तु की दूरी',
  'eye.free.axial': 'नेत्रगोलक · लेंस से रेटिना',
  'eye.free.power': 'सुधारक क्षमता',
  'eye.free.mark.reading': 'पठन',
  'eye.free.mark.normal': 'सामान्य',
  'eye.free.mark.none': 'शून्य',
  'eye.diagnosis.myopia': 'निकट दृष्टि दोष — नेत्रगोलक अधिक लंबा',
  'eye.diagnosis.hypermetropia': 'दूर दृष्टि दोष — नेत्रगोलक छोटा',
  'eye.diagnosis.normal': 'सामान्य दृष्टि',

  'eye.report.eyebrow': 'आपने अभी क्या मापा',
  'eye.report.title': 'तीन दूरियाँ, दो नुस्खे',
  'eye.report.lede':
    'उस बेंच पर आपने एक भी लेंस नहीं छुआ — आपने केवल तीर खिसकाया और बिंदु को धब्बे में बदलते देखा। वही तीन संख्याएँ दोनों चश्मे बनवाने के लिए पर्याप्त हैं।',
  'eye.report.tableTitle': 'आपके प्रेक्षण',
  'eye.report.tableCaption':
    'बेंच का अल्पतमांक {lc} सेमी है, इसलिए हर पाठ्यांक एक दशमलव स्थान तक लिखा गया है। दाईं ओर के तीनों स्तंभ आपके अपने पाठ्यांकों से निकाले गए हैं — यहाँ कुछ भी आपके लिए मापा नहीं गया।',
  'eye.report.col.eye': 'नेत्र',
  'eye.report.col.limit': 'मापी गई सीमा',
  'eye.report.col.reading': 'पाठ्यांक',
  'eye.report.col.defect': 'दोष',
  'eye.report.col.lens': 'सुधारक लेंस',
  'eye.report.col.power': 'क्षमता',
  'eye.report.unit.dioptres': 'डाइऑप्टर (D)',
  'eye.defect.none': 'कोई नहीं',
  'eye.defect.myopia': 'निकट दृष्टि दोष',
  'eye.defect.hypermetropia': 'दूर दृष्टि दोष',
  'eye.lens.concave': 'अवतल (अपसारी)',
  'eye.lens.convex': 'उत्तल (अभिसारी)',
  'eye.lens.none': 'आवश्यकता नहीं',
  'eye.report.formulaNote': 'f मीटर में, P डाइऑप्टर में',
  'eye.report.workedThrough': 'आपकी संख्याएँ, हल करके',
  'eye.report.myopia.title': 'निकट दृष्टि दोष — अवतल लेंस',
  'eye.report.myopia.setup':
    'अनंत पर रखी वस्तु का प्रतिबिंब उस दूर बिंदु पर लाइए जो आपने मापा, {reading} सेमी। u = ∞ होने पर f दूर बिंदु के बराबर ही होता है — ऋणात्मक, क्योंकि वह प्रतिबिंब आभासी है।',
  'eye.report.myopia.verdict':
    '{power} D। नुस्खे पर ऋणात्मक संख्या का अर्थ सदैव निकट दृष्टि दोष होता है।',
  'eye.report.hyper.title': 'दूर दृष्टि दोष — उत्तल लेंस',
  'eye.report.hyper.setup':
    'सामान्य पठन दूरी {normal} सेमी पर रखे पन्ने का प्रतिबिंब उस निकट बिंदु तक फेंकिए जो आपने मापा, {reading} सेमी — वहाँ तक यह नेत्र पहुँच सकता है।',
  'eye.report.hyper.verdict': '{power} D। धनात्मक संख्या का अर्थ सदैव दूर दृष्टि दोष होता है।',
  'eye.report.noteLabel': 'आपके पाठ्यांकों का मोल',
  'eye.report.note':
    'बेंच {lc} सेमी तक ही पढ़ती है, इसलिए हर पाठ्यांक में {sf} सार्थक अंक हैं और ऊपर कोई भी क्षमता इससे अधिक अंकों तक नहीं लिखी गई।',
  'eye.report.noteNormal':
    ' आपका स्वस्थ नेत्र {reading} सेमी पर आया, जबकि पुस्तक कहती है {normal} सेमी — अभी-अभी उभरी धुंधलाहट पहचानना सदैव एक निर्णय का विषय रहेगा।',
  'eye.report.finish': 'प्रयोग पूरा करें और दर्ज करें',
};

export const CATALOG = { en, hi };
