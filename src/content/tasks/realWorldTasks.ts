import { RealWorldTask } from "../../types";

export const REAL_WORLD_TASKS: RealWorldTask[] = [
  // ── 1. Transportation & Travel Tasks ──
  {
    id: "task_airport_checkin",
    title: "Flight Check-In & Bag Drop",
    arabicTitle: "تسجيل الوصول وشحن الحقائب بالمطار",
    locationCategory: "airport",
    roomName: "Check-in Desks",
    cefrLevel: "A1",
    scenarioContext: "You are standing before the airline check-in agent. You need to check in for your flight to London and state how many bags you have.",
    objectiveText: "Present your ticket and state your baggage count clearly.",
    arabicObjective: "قدم تذكرتك واذكر عدد الحقائب التي تود شحنها.",
    targetVocab: ["passport", "boarding pass", "window seat", "luggage", "scale"],
    targetGrammar: ["Could I please...", "I have...", "Would it be possible to..."],
    starterPhrase: "Hello, I would like to check in for my flight, please.",
    sampleExchanges: [
      {
        prompt: "Agent: 'Good morning! May I see your passport and booking reference?'",
        expectedReply: "Here is my passport and booking confirmation.",
      },
      {
        prompt: "Agent: 'Are you checking any bags today, or just carrying on?'",
        expectedReply: "I have one suitcase to check and one carry-on bag.",
      },
      {
        prompt: "Agent: 'Would you prefer an aisle or a window seat today?'",
        expectedReply: "I would prefer a window seat, if possible.",
      },
    ],
    rewardXp: 150,
    rewardCoins: 50,
  },
  {
    id: "task_airport_customs",
    title: "Border Control & Customs Declaration",
    arabicTitle: "مراقبة الجوازات والإقرار الجمركي",
    locationCategory: "airport",
    roomName: "Customs & Passport Control",
    cefrLevel: "A2",
    scenarioContext: "The immigration officer asks about the purpose and duration of your visit to English City.",
    objectiveText: "State your purpose of visit, length of stay, and accommodation details.",
    arabicObjective: "اذكر سبب زيارتك، مدة إقامتك، ومكان سكنك في المدينة.",
    targetVocab: ["purpose", "vacation", "studying", "duration", "hotel", "declaration"],
    targetGrammar: ["I am here to...", "I will be staying for...", "I am residing at..."],
    starterPhrase: "Good day, Officer. I am visiting for language study and tourism.",
    sampleExchanges: [
      {
        prompt: "Officer: 'What is the primary purpose of your trip to English City?'",
        expectedReply: "I am here to study English and explore the cultural landmarks for two weeks.",
      },
      {
        prompt: "Officer: 'Where will you be residing during your stay?'",
        expectedReply: "I have a reservation at the Grand Horizon Hotel downtown.",
      },
      {
        prompt: "Officer: 'Are you carrying any commercial goods or restricted items?'",
        expectedReply: "No, Officer. Only my personal clothing and study materials.",
      },
    ],
    rewardXp: 180,
    rewardCoins: 60,
  },
  {
    id: "task_transit_ticket_purchase",
    title: "Purchase Subway Travelcard",
    arabicTitle: "شراء بطاقة المترو الذكية",
    locationCategory: "subway",
    roomName: "Main Metro Platform",
    cefrLevel: "A1",
    scenarioContext: "You need to purchase a weekly unlimited subway pass at the central transit kiosk.",
    objectiveText: "Ask the transit agent for a 7-day multi-zone metro card and pay with a credit card.",
    arabicObjective: "اطلب من موظف المترو بطاقة أسبوعية لجميع المناطق وادفع بالبطاقة الائتمانية.",
    targetVocab: ["travelcard", "unlimited", "fare", "zones", "contactless"],
    targetGrammar: ["I'd like to buy...", "How much is...", "Can I pay by card?"],
    starterPhrase: "Excuse me, I would like to buy a 7-day unlimited subway card, please.",
    sampleExchanges: [
      {
        prompt: "Agent: 'Sure thing! Do you need Zone 1 only, or all metropolitan zones?'",
        expectedReply: "All metropolitan zones, please.",
      },
      {
        prompt: "Agent: 'That will be $28.00 total. Cash or contactless card?'",
        expectedReply: "I will pay with my contactless card, thank you.",
      },
    ],
    rewardXp: 120,
    rewardCoins: 40,
  },

  // ── 2. Cafe & Dining Tasks ──
  {
    id: "task_cafe_custom_order",
    title: "Order Custom Beverage & Warm Pastry",
    arabicTitle: "طلب مشروب مخصص ومعجنات طازجة",
    locationCategory: "cafe",
    roomName: "Barista Counter",
    cefrLevel: "A2",
    scenarioContext: "Order an iced latte with oat milk, specify your sweetness preference, and ask for a heated croissant.",
    objectiveText: "Order your custom coffee with milk preference and request a warm pastry.",
    arabicObjective: "اطلب قهوتك بنوع الحليب المفضل واطلب تسخين المعجنات.",
    targetVocab: ["latte", "oat milk", "warm", "receipt", "sugar-free", "croissant"],
    targetGrammar: ["Could I get...", "Can you make it...", "I'd also like..."],
    starterPhrase: "Hi! Could I please get a medium iced latte with oat milk?",
    sampleExchanges: [
      {
        prompt: "Barista: 'Sure thing! Any sweetness or flavor syrups in that?'",
        expectedReply: "Just one pump of vanilla syrup and not too sweet, please.",
      },
      {
        prompt: "Barista: 'Would you like that almond croissant warmed up?'",
        expectedReply: "Yes please, warming it up would be lovely.",
      },
    ],
    rewardXp: 140,
    rewardCoins: 45,
  },
  {
    id: "task_restaurant_bill_split",
    title: "Request the Bill & Split Card Payment",
    arabicTitle: "طلب الفاتورة وتقسيم الحساب",
    locationCategory: "restaurant",
    roomName: "Dining Room",
    cefrLevel: "B1",
    scenarioContext: "You have finished dinner with your friends. You need to ask the server for the check and inquire if you can pay separately with cards.",
    objectiveText: "Ask for the bill and politely check if split card payments are accepted.",
    arabicObjective: "اطلب الفاتورة واستفسر عن إمكانية الدفع المنفصل بالبطاقات.",
    targetVocab: ["bill", "check", "split", "tip", "contactless", "receipt"],
    targetGrammar: ["Could we please have...", "Is it possible to...", "We'd like to pay..."],
    starterPhrase: "Excuse me, whenever you have a moment, could we please have the bill?",
    sampleExchanges: [
      {
        prompt: "Server: 'Certainly! How would you like to settle the payment this evening?'",
        expectedReply: "Could we please split the bill equally between two credit cards?",
      },
      {
        prompt: "Server: 'No problem at all! I will bring two card terminals over to your table.'",
        expectedReply: "Thank you so much. The service was wonderful!",
      },
    ],
    rewardXp: 180,
    rewardCoins: 60,
  },

  // ── 3. Hotel & Hospitality Tasks ──
  {
    id: "task_hotel_checkin",
    title: "Hotel Check-In & Quiet Room Request",
    arabicTitle: "تسجيل الدخول بالفندق وطلب غرفة هادئة",
    locationCategory: "hotel",
    roomName: "Front Desk & Concierge",
    cefrLevel: "A2",
    scenarioContext: "Check into your reserved room at the Grand Horizon Hotel and request a quiet room on an upper floor.",
    objectiveText: "Provide your reservation name, show ID, and request a high-floor room away from the elevator.",
    arabicObjective: "قدم اسم الحجز والهوية واطلب غرفة في طابق علوي هادئ بعيداً عن المصعد.",
    targetVocab: ["reservation", "keycard", "amenities", "quiet", "elevators", "luggage"],
    targetGrammar: ["I have a reservation under...", "Would it be possible to have...", "What time is..."],
    starterPhrase: "Good evening! I have a reservation under my name for two nights.",
    sampleExchanges: [
      {
        prompt: "Concierge: 'Welcome to the Grand Horizon! May I please see your passport for the registration?'",
        expectedReply: "Here is my passport and booking reference code.",
      },
      {
        prompt: "Concierge: 'We have a standard room on the 2nd floor ready, or a deluxe room on the 8th floor. Do you have any preferences?'",
        expectedReply: "Could I please have the 8th-floor room away from the elevator? I prefer a quiet room.",
      },
    ],
    rewardXp: 170,
    rewardCoins: 55,
  },
  {
    id: "task_hotel_room_service",
    title: "Order Room Service & Inquire Late Checkout",
    arabicTitle: "طلب خدمة الغرف والاستفسار عن تمديد المغادرة",
    locationCategory: "hotel",
    roomName: "Guest Room",
    cefrLevel: "B1",
    scenarioContext: "Call the front desk from your hotel telephone to order breakfast and request a 1:00 PM late checkout.",
    objectiveText: "Order continental breakfast for room delivery and ask if late checkout is complimentary.",
    arabicObjective: "اطلب وجبة الإفطار للغرفة واستفسر عن إمكانية تمديد المغادرة مجاناً.",
    targetVocab: ["room service", "continental breakfast", "late checkout", "complimentary", "extension"],
    targetGrammar: ["I am calling from room...", "I would like to order...", "Is there an additional charge for..."],
    starterPhrase: "Hello, Front Desk? I am calling from Room 804. I would like to order room service breakfast.",
    sampleExchanges: [
      {
        prompt: "Staff: 'Good morning! What can we prepare for your breakfast in Room 804?'",
        expectedReply: "I would like the continental breakfast with fresh orange juice and black coffee, please.",
      },
      {
        prompt: "Staff: 'It will be delivered in 20 minutes! Can I assist you with anything else?'",
        expectedReply: "Yes, would it be possible to request a late checkout until 1:00 PM today?",
      },
    ],
    rewardXp: 200,
    rewardCoins: 70,
  },

  // ── 4. Retail & Shopping Tasks ──
  {
    id: "task_clothing_return",
    title: "Return Clothing Item & Size Exchange",
    arabicTitle: "إرجاع قطعة ملابس واستبدال المقاس",
    locationCategory: "store",
    roomName: "Boutique Showroom",
    cefrLevel: "A2",
    scenarioContext: "You bought a wool jacket yesterday, but the sleeves are too long. You want to exchange it for a medium size or receive store credit.",
    objectiveText: "Explain why the jacket does not fit and ask to exchange it for a medium.",
    arabicObjective: "اشرح أن مقاس السترة غير مناسب واطلب استبدالها بمقاس متوسط.",
    targetVocab: ["receipt", "exchange", "fit", "sleeves", "medium", "store credit"],
    targetGrammar: ["I bought this yesterday...", "It's a bit too...", "Could I exchange it for..."],
    starterPhrase: "Hello! I bought this jacket yesterday, but unfortunately it doesn't fit properly.",
    sampleExchanges: [
      {
        prompt: "Sales Assistant: 'I can certainly help with that. What seems to be the issue with the fit?'",
        expectedReply: "The sleeves are a bit too long for me. Could I try on a medium size instead?",
      },
      {
        prompt: "Sales Assistant: 'Let me check our stock in the back room. Do you have the original receipt?'",
        expectedReply: "Yes, here is the original receipt and the price tag is still attached.",
      },
    ],
    rewardXp: 160,
    rewardCoins: 50,
  },

  // ── 5. Medical & Pharmacy Tasks ──
  {
    id: "task_hospital_consultation",
    title: "Physician Medical Consultation & Describing Symptoms",
    arabicTitle: "استشارة الطبيب ووصف الأعراض المرضية",
    locationCategory: "hospital",
    roomName: "Consultation Room 3",
    cefrLevel: "A2",
    scenarioContext: "Explain to Dr. Hayes that you have had a throbbing headache and mild fever for two days.",
    objectiveText: "Describe the onset, frequency, and severity of your symptoms accurately.",
    arabicObjective: "صف للطبيب بداية الأعراض وشدتها ومدتها بدقة ووضوح.",
    targetVocab: ["headache", "fever", "throbbing", "symptoms", "allergies", "dizziness"],
    targetGrammar: ["I have been experiencing...", "It started about...", "On a scale of 1 to 10, the pain is..."],
    starterPhrase: "Hello Doctor. I haven't been feeling well for the past two days.",
    sampleExchanges: [
      {
        prompt: "Doctor: 'Hello. Tell me, what primary symptoms have you been dealing with?'",
        expectedReply: "I have had a throbbing headache and a mild fever since yesterday morning.",
      },
      {
        prompt: "Doctor: 'Have you taken any over-the-counter pain medication or experienced dizziness?'",
        expectedReply: "I took some ibuprofen, but the headache hasn't completely gone away.",
      },
    ],
    rewardXp: 190,
    rewardCoins: 65,
  },
  {
    id: "task_pharmacy_prescription",
    title: "Filling a Prescription & Inquiring Side Effects",
    arabicTitle: "صرف الوصفة الطبية والاستفسار عن الآثار الجانبية",
    locationCategory: "hospital",
    roomName: "Pharmacy Counter",
    cefrLevel: "B1",
    scenarioContext: "Present your doctor's prescription slip and ask the pharmacist about dosage, frequency, and whether it causes drowsiness.",
    objectiveText: "Hand over the prescription, ask how many times a day to take the pills, and ask about side effects.",
    arabicObjective: "سلم الوصفة الطبية واستفسر عن الجرعة اليومية وإذا كان الدواء يسبب النعاس.",
    targetVocab: ["prescription", "dosage", "drowsiness", "side effects", "meal", "capsules"],
    targetGrammar: ["I'd like to fill this prescription...", "How often should I take...", "Does this cause..."],
    starterPhrase: "Good afternoon. I would like to fill this prescription from Dr. Hayes, please.",
    sampleExchanges: [
      {
        prompt: "Pharmacist: 'Here are your antibiotics. Take one capsule twice daily after meals.'",
        expectedReply: "Thank you. Should I finish the entire course, even if I feel better?",
      },
      {
        prompt: "Pharmacist: 'Yes, always complete the full 7-day course. Any questions regarding side effects?'",
        expectedReply: "Does this medication cause drowsiness or affect driving?",
      },
    ],
    rewardXp: 180,
    rewardCoins: 60,
  },

  // ── 6. Banking & Financial Tasks ──
  {
    id: "task_bank_open_account",
    title: "Opening a Checking Account & Currency Exchange",
    arabicTitle: "فتح حساب جاري وتحويل العملات الأجنبية",
    locationCategory: "bank",
    roomName: "Teller Windows & Currency Exchange",
    cefrLevel: "B1",
    scenarioContext: "You want to open a standard student/resident checking account and inquire about international debit card fees.",
    objectiveText: "Inquire about opening an account, minimum balance requirements, and international wire fees.",
    arabicObjective: "استفسر عن فتح حساب مصرفي والحد الأدنى للرصيد ورسوم التحويل الدولي.",
    targetVocab: ["checking account", "identification", "minimum balance", "debit card", "maintenance fee"],
    targetGrammar: ["I would like to open a...", "Are there any monthly fees for...", "What documents do I need to..."],
    starterPhrase: "Good morning. I would like to open a checking account and apply for a debit card.",
    sampleExchanges: [
      {
        prompt: "Bank Teller: 'Welcome! Do you have your government-issued passport and proof of residence address?'",
        expectedReply: "Yes, I have my passport and my apartment lease agreement right here.",
      },
      {
        prompt: "Bank Teller: 'Our student checking has no monthly maintenance fee if you maintain a $50 minimum balance.'",
        expectedReply: "That sounds great. How long will it take for my physical debit card to arrive?",
      },
    ],
    rewardXp: 200,
    rewardCoins: 75,
  },

  // ── 7. Business & Tech Tasks ──
  {
    id: "task_job_interview",
    title: "Nexus Tech Behavioral Job Interview",
    arabicTitle: "المقابلة الوظيفية السلوكية في نكسس تك",
    locationCategory: "office",
    roomName: "Executive Boardroom",
    cefrLevel: "B2",
    scenarioContext: "Answer structured interview questions regarding a past problem-solving achievement and why you want to join Nexus Tech.",
    objectiveText: "Use the STAR method (Situation, Task, Action, Result) to describe a challenging technical or collaborative project.",
    arabicObjective: "استخدم طريقة STAR لوصف تحدٍ تقني أو مشروع جماعي نجحت في إنجازه.",
    targetVocab: ["collaboration", "scalable", "initiative", "stakeholders", "deliverable", "architecture"],
    targetGrammar: ["In my previous role, I was responsible for...", "To resolve the bottleneck, I implemented...", "As a result, our team achieved..."],
    starterPhrase: "Thank you for the opportunity to interview with the engineering leadership team today.",
    sampleExchanges: [
      {
        prompt: "Interviewer: 'Can you describe a time when you faced a tight deadline and how you prioritized deliverables?'",
        expectedReply: "In my previous project, we faced an impending deployment deadline. I broke down the user stories, prioritized core modules, and communicated transparently with stakeholders.",
      },
      {
        prompt: "Interviewer: 'How do you handle technical disagreements or divergent architecture ideas within your team?'",
        expectedReply: "I believe in data-driven consensus. I organize benchmark tests, listen to alternate perspectives, and focus on the solution that best serves long-term system scalability.",
      },
    ],
    rewardXp: 260,
    rewardCoins: 100,
  },

  // ── 8. Academic & University Tasks ──
  {
    id: "task_library_research",
    title: "Academic Thesis & JSTOR Literature Search",
    arabicTitle: "البحث الأكاديمي عن المراجع في مكتبة أكسفورد",
    locationCategory: "university",
    roomName: "Silent Research Stacks",
    cefrLevel: "B2",
    scenarioContext: "Consult with Professor Arthur or Chloe to locate peer-reviewed papers on computational linguistics.",
    objectiveText: "Ask for assistance locating peer-reviewed journals and microfiche archives on language acquisition.",
    arabicObjective: "اطلب المساعدة في العثور على أبحاث محكمة في مجال اللغويات واكتساب اللغة.",
    targetVocab: ["peer-reviewed", "thesis", "methodology", "citation", "bibliography", "catalogue"],
    targetGrammar: ["I am conducting research on...", "Could you direct me to the section for...", "How can I access digital..."],
    starterPhrase: "Excuse me, Professor. I am looking for peer-reviewed articles regarding applied linguistic acquisition.",
    sampleExchanges: [
      {
        prompt: "Professor: 'Splendid topic! Have you searched our digital catalogue or are you seeking physical manuscripts?'",
        expectedReply: "I have consulted the digital JSTOR index, but I would like to examine the archived manuscripts in Section 4.",
      },
      {
        prompt: "Professor: 'Section 4 is located on the second-floor mezzanine. Make sure to consult the citation index.'",
        expectedReply: "Thank you, Professor. I will make sure to record the citations for my bibliography.",
      },
    ],
    rewardXp: 220,
    rewardCoins: 80,
  },

  // ── 9. Coastal & Beach Tasks ──
  {
    id: "task_surf_rental",
    title: "Rent Surf Equipment & Check Ocean Tides",
    arabicTitle: "استئجار معدات ركوب الأمواج وتفقد التيارات",
    locationCategory: "beach",
    roomName: "Equipment Rental Deck",
    cefrLevel: "A1",
    scenarioContext: "Rent a foam beginner surfboard and a wetsuit from Kai at the surf shack.",
    objectiveText: "State your height, ask for a beginner board, and check what time high tide occurs.",
    arabicObjective: "اذكر طولك واطلب لوح ركوب أمواج للمبتدئين واستفسر عن موعد المد العالي.",
    targetVocab: ["surfboard", "wetsuit", "beginner", "high tide", "lifeguard", "rental"],
    targetGrammar: ["I would like to rent...", "How much is it per hour?", "Is the water safe for..."],
    starterPhrase: "Hi! I would like to rent a surfboard and a wetsuit for two hours, please.",
    sampleExchanges: [
      {
        prompt: "Kai: 'Right on! Are you a beginner, or looking for an intermediate shortboard?'",
        expectedReply: "I am a beginner, so a foam longboard would be great.",
      },
      {
        prompt: "Kai: 'What size wetsuit do you need, and have you checked today's tide flags?'",
        expectedReply: "I need a medium wetsuit. Is the yellow flag up today?",
      },
    ],
    rewardXp: 140,
    rewardCoins: 45,
  },
];
