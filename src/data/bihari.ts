import { Recipe } from '../types';

const recipes: Recipe[] = [
  {
    id: "litti_chokha",
    name: "Litti Chokha",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Medium",
    cook_time: 40,
    prep_time: 20,
    servings: 4,
    calories: 420,
    rating: 4.9,
    reviews: 1240,
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400",
    description:
      "The iconic Bihari dish — baked wheat balls stuffed with spiced sattu, served with roasted eggplant and tomato mash.",
    ingredients: [
      { name: "Whole Wheat Flour", quantity: 2, unit: "cup" },
      { name: "Sattu (Roasted Gram Flour)", quantity: 1, unit: "cup" },
      { name: "Eggplant", quantity: 2, unit: "pcs" },
      { name: "Tomato", quantity: 2, unit: "pcs" },
      { name: "Onion", quantity: 1, unit: "pcs" },
      { name: "Garlic", quantity: 4, unit: "pcs" },
      { name: "Mustard Oil", quantity: 3, unit: "tbsp" },
      { name: "Carom Seeds (Ajwain)", quantity: 1, unit: "tsp" },
      { name: "Kalonji (Nigella Seeds)", quantity: 0.5, unit: "tsp" },
      { name: "Green Chili", quantity: 2, unit: "pcs" },
      { name: "Lemon Juice", quantity: 1, unit: "tbsp" },
      { name: "Salt", quantity: 1.5, unit: "tsp" },
      { name: "Ghee", quantity: 4, unit: "tbsp" },
    ],
    preparation: [
      { ingredient: "Eggplant", cut: "roasted whole and peeled" },
      { ingredient: "Tomato", cut: "roasted whole" },
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Green Chili", cut: "finely chopped" },
    ],
    nutrition: { protein: 14, carbs: 58, fat: 17, fiber: 8, sugar: 4 },
    equipment: ["Oven or Tandoor", "Mixing Bowl", "Tawa"],
    steps: [
      {
        step: 1,
        instruction:
          "Knead wheat flour with water and a pinch of salt into a firm dough. Rest for 15 minutes.",
        time: 15,
      },
      {
        step: 2,
        instruction:
          "Mix sattu with mustard oil, ajwain, kalonji, green chili, salt and lemon juice to make the stuffing.",
        time: 5,
      },
      {
        step: 3,
        instruction:
          "Divide dough into equal balls, flatten each, fill with sattu mixture, seal and reshape into balls.",
        time: 10,
      },
      {
        step: 4,
        instruction:
          "Bake littis in a preheated oven at 200°C for 30–35 minutes, turning halfway, until golden.",
        time: 35,
      },
      {
        step: 5,
        instruction:
          "Roast eggplant and tomatoes directly on flame, peel and mash with onion, chili, mustard oil and salt to make chokha.",
        time: 15,
      },
      {
        step: 6,
        instruction:
          "Dip hot littis in ghee and serve immediately with chokha.",
        time: 2,
      },
    ],
    tips: [
      "Roasting directly on coal gives an authentic smoky flavor.",
      "Sattu filling should be slightly moist — add a few drops of water if too dry.",
    ],
    tags: ["bihari", "traditional", "sattu", "baked", "street food"],
  },
  {
    id: "sattu_paratha",
    name: "Sattu Paratha",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Easy",
    cook_time: 20,
    prep_time: 15,
    servings: 4,
    calories: 310,
    rating: 4.7,
    reviews: 870,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400",
    description:
      "Wholesome whole wheat flatbread stuffed with spiced sattu — a protein-packed Bihari breakfast staple.",
    ingredients: [
      { name: "Whole Wheat Flour", quantity: 2, unit: "cup" },
      { name: "Sattu", quantity: 1, unit: "cup" },
      { name: "Onion", quantity: 1, unit: "pcs" },
      { name: "Green Chili", quantity: 2, unit: "pcs" },
      { name: "Mustard Oil", quantity: 2, unit: "tbsp" },
      { name: "Carom Seeds", quantity: 0.5, unit: "tsp" },
      { name: "Mango Pickle (Achar)", quantity: 1, unit: "tbsp" },
      { name: "Coriander Leaves", quantity: 2, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" },
      { name: "Ghee", quantity: 3, unit: "tbsp" },
    ],
    preparation: [
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Green Chili", cut: "finely chopped" },
      { ingredient: "Coriander Leaves", cut: "finely chopped" },
    ],
    nutrition: { protein: 13, carbs: 44, fat: 12, fiber: 6, sugar: 2 },
    equipment: ["Tawa", "Rolling Pin", "Mixing Bowl"],
    steps: [
      {
        step: 1,
        instruction: "Knead wheat flour with water into a soft dough and rest for 10 minutes.",
        time: 10,
      },
      {
        step: 2,
        instruction:
          "Mix sattu, onion, green chili, coriander, mustard oil, ajwain, achar and salt to prepare filling.",
        time: 5,
      },
      {
        step: 3,
        instruction:
          "Roll dough balls flat, place filling in center, seal edges and roll gently again.",
        time: 10,
      },
      {
        step: 4,
        instruction:
          "Cook on hot tawa with ghee on both sides until golden brown spots appear.",
        time: 10,
      },
    ],
    tips: [
      "Adding mango pickle to the sattu filling is traditional and gives a tangy kick.",
      "Serve with curd and green chutney.",
    ],
    tags: ["bihari", "breakfast", "sattu", "paratha", "protein-rich"],
  },
  {
    id: "dal_puri_bihari",
    name: "Bihari Dal Puri",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Medium",
    cook_time: 30,
    prep_time: 20,
    servings: 4,
    calories: 350,
    rating: 4.6,
    reviews: 620,
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400",
    description:
      "Deep-fried puffy bread stuffed with spiced chana dal paste — a beloved festive and everyday dish in Bihar.",
    ingredients: [
      { name: "Whole Wheat Flour", quantity: 2, unit: "cup" },
      { name: "Chana Dal", quantity: 0.75, unit: "cup" },
      { name: "Fennel Seeds", quantity: 1, unit: "tsp" },
      { name: "Cumin Seeds", quantity: 1, unit: "tsp" },
      { name: "Green Chili", quantity: 2, unit: "pcs" },
      { name: "Ginger", quantity: 1, unit: "tsp" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Red Chili Powder", quantity: 0.5, unit: "tsp" },
      { name: "Asafoetida (Hing)", quantity: 1, unit: "pinch" },
      { name: "Salt", quantity: 1, unit: "tsp" },
      { name: "Oil", quantity: 3, unit: "cup" },
    ],
    preparation: [
      { ingredient: "Chana Dal", cut: "soaked 2 hours and drained" },
      { ingredient: "Green Chili", cut: "roughly chopped" },
      { ingredient: "Ginger", cut: "grated" },
    ],
    nutrition: { protein: 12, carbs: 48, fat: 15, fiber: 7, sugar: 2 },
    equipment: ["Deep Pan", "Mixer Grinder", "Rolling Pin"],
    steps: [
      {
        step: 1,
        instruction:
          "Coarsely grind soaked chana dal with green chili, ginger and spices — do not add water.",
        time: 5,
      },
      {
        step: 2,
        instruction:
          "Sauté dal mixture in 1 tsp oil with hing and fennel for 5 minutes until dry. Cool completely.",
        time: 8,
      },
      {
        step: 3,
        instruction: "Knead wheat flour into stiff dough. Divide into balls, stuff with dal filling and seal.",
        time: 15,
      },
      {
        step: 4,
        instruction:
          "Gently roll stuffed balls into puris and deep fry in hot oil until puffed and golden.",
        time: 15,
      },
    ],
    tips: [
      "Keep the dal filling as dry as possible to prevent puris from bursting.",
      "Best served with aloo sabzi or chutney.",
    ],
    tags: ["bihari", "fried", "dal", "puri", "festive"],
  },
  {
    id: "chana_ghugni",
    name: "Chana Ghugni",
    cuisine: "Bihari",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 30,
    prep_time: 10,
    servings: 4,
    calories: 280,
    rating: 4.5,
    reviews: 510,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    description:
      "A tangy and spicy white pea curry popular as a street snack and breakfast side in Bihar.",
    ingredients: [
      { name: "White Peas (Safed Matar)", quantity: 1.5, unit: "cup" },
      { name: "Onion", quantity: 2, unit: "pcs" },
      { name: "Tomato", quantity: 2, unit: "pcs" },
      { name: "Ginger-Garlic Paste", quantity: 1, unit: "tbsp" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Cumin Seeds", quantity: 1, unit: "tsp" },
      { name: "Coriander Powder", quantity: 1, unit: "tsp" },
      { name: "Red Chili Powder", quantity: 1, unit: "tsp" },
      { name: "Amchur (Dry Mango Powder)", quantity: 1, unit: "tsp" },
      { name: "Oil", quantity: 2, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" },
    ],
    preparation: [
      { ingredient: "White Peas", cut: "soaked overnight and boiled" },
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Tomato", cut: "chopped" },
    ],
    nutrition: { protein: 10, carbs: 38, fat: 7, fiber: 9, sugar: 4 },
    equipment: ["Pressure Cooker", "Pan"],
    steps: [
      {
        step: 1,
        instruction:
          "Pressure cook soaked white peas with salt and turmeric for 4–5 whistles.",
        time: 20,
      },
      {
        step: 2,
        instruction:
          "Heat oil, add cumin seeds, then sauté onions until golden. Add ginger-garlic paste.",
        time: 8,
      },
      {
        step: 3,
        instruction:
          "Add tomatoes, all dry spices and cook until oil separates.",
        time: 7,
      },
      {
        step: 4,
        instruction:
          "Add boiled peas, mix well and simmer for 10 minutes. Finish with amchur.",
        time: 10,
      },
    ],
    tips: [
      "Top with raw onion, green chili and lemon juice while serving.",
      "Add tamarind water instead of amchur for extra tanginess.",
    ],
    tags: ["bihari", "street food", "vegan", "snack", "peas"],
  },
  {
    id: "thekua",
    name: "Thekua",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Easy",
    cook_time: 25,
    prep_time: 15,
    servings: 6,
    calories: 290,
    rating: 4.8,
    reviews: 760,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    description:
      "Crispy deep-fried wheat cookies sweetened with jaggery and flavored with fennel — the sacred prasad of Chhath Puja.",
    ingredients: [
      { name: "Whole Wheat Flour", quantity: 2, unit: "cup" },
      { name: "Jaggery (Gur)", quantity: 0.75, unit: "cup" },
      { name: "Fennel Seeds (Saunf)", quantity: 1, unit: "tbsp" },
      { name: "Desiccated Coconut", quantity: 3, unit: "tbsp" },
      { name: "Cardamom Powder", quantity: 0.5, unit: "tsp" },
      { name: "Ghee", quantity: 3, unit: "tbsp" },
      { name: "Oil", quantity: 2, unit: "cup" },
    ],
    preparation: [
      { ingredient: "Jaggery", cut: "dissolved in warm water" },
    ],
    nutrition: { protein: 5, carbs: 46, fat: 13, fiber: 3, sugar: 20 },
    equipment: ["Deep Pan", "Thekua Mold or Fork", "Mixing Bowl"],
    steps: [
      {
        step: 1,
        instruction:
          "Dissolve jaggery in minimum warm water. Mix wheat flour, fennel, coconut, cardamom and ghee.",
        time: 5,
      },
      {
        step: 2,
        instruction:
          "Add jaggery water gradually and knead into a firm, non-sticky dough.",
        time: 8,
      },
      {
        step: 3,
        instruction:
          "Shape dough using a thekua mold or press with fork to create patterns.",
        time: 10,
      },
      {
        step: 4,
        instruction:
          "Deep fry on medium-low flame until dark golden brown and crisp.",
        time: 20,
      },
    ],
    tips: [
      "Thekua stays fresh for 7–10 days at room temperature.",
      "Fry on low flame to ensure it cooks through without burning.",
    ],
    tags: ["bihari", "sweet", "chhath", "prasad", "festival", "fried"],
  },
  {
    id: "bihari_mutton_curry",
    name: "Bihari Mutton Curry",
    cuisine: "Bihari",
    diet: "Non-Vegetarian",
    difficulty: "Hard",
    cook_time: 60,
    prep_time: 20,
    servings: 4,
    calories: 480,
    rating: 4.8,
    reviews: 930,
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400",
    description:
      "A robustly spiced slow-cooked mutton curry with a mustard oil base — a Sunday classic across Bihari households.",
    ingredients: [
      { name: "Mutton", quantity: 750, unit: "g" },
      { name: "Onion", quantity: 3, unit: "pcs" },
      { name: "Tomato", quantity: 2, unit: "pcs" },
      { name: "Ginger-Garlic Paste", quantity: 2, unit: "tbsp" },
      { name: "Mustard Oil", quantity: 4, unit: "tbsp" },
      { name: "Curd", quantity: 0.5, unit: "cup" },
      { name: "Turmeric", quantity: 1, unit: "tsp" },
      { name: "Red Chili Powder", quantity: 2, unit: "tsp" },
      { name: "Coriander Powder", quantity: 2, unit: "tsp" },
      { name: "Garam Masala", quantity: 1, unit: "tsp" },
      { name: "Bay Leaf", quantity: 2, unit: "pcs" },
      { name: "Cloves", quantity: 4, unit: "pcs" },
      { name: "Salt", quantity: 1.5, unit: "tsp" },
    ],
    preparation: [
      { ingredient: "Mutton", cut: "bone-in pieces, washed" },
      { ingredient: "Onion", cut: "thinly sliced" },
      { ingredient: "Tomato", cut: "chopped" },
    ],
    nutrition: { protein: 36, carbs: 10, fat: 32, fiber: 2, sugar: 4 },
    equipment: ["Pressure Cooker", "Heavy Bottom Pan"],
    steps: [
      {
        step: 1,
        instruction:
          "Marinate mutton in curd, turmeric, red chili and salt for at least 30 minutes.",
        time: 30,
      },
      {
        step: 2,
        instruction:
          "Heat mustard oil to smoking point, add bay leaves, cloves then sliced onions. Fry until deep brown.",
        time: 15,
      },
      {
        step: 3,
        instruction:
          "Add ginger-garlic paste, cook 2 minutes, then add tomatoes and all dry spices until oil separates.",
        time: 10,
      },
      {
        step: 4,
        instruction:
          "Add marinated mutton, sear on high flame for 5 minutes, then pressure cook for 6–7 whistles.",
        time: 35,
      },
      {
        step: 5,
        instruction:
          "Open cooker, cook on open flame to thicken gravy. Finish with garam masala.",
        time: 10,
      },
    ],
    tips: [
      "Smoking the mustard oil first removes its pungency.",
      "Deep brown onions are key to the rich gravy color.",
    ],
    tags: ["bihari", "mutton", "non-veg", "curry", "slow-cooked"],
  },
  {
    id: "bihari_fish_curry",
    name: "Bihari Maach Jhol (Fish Curry)",
    cuisine: "Bihari",
    diet: "Non-Vegetarian",
    difficulty: "Medium",
    cook_time: 30,
    prep_time: 15,
    servings: 4,
    calories: 320,
    rating: 4.6,
    reviews: 540,
    image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400",
    description:
      "A light, tangy fish curry cooked in mustard oil with onion-tomato gravy — popular in Mithila and Bhojpur regions.",
    ingredients: [
      { name: "Rohu or Catla Fish", quantity: 600, unit: "g" },
      { name: "Onion", quantity: 2, unit: "pcs" },
      { name: "Tomato", quantity: 2, unit: "pcs" },
      { name: "Ginger-Garlic Paste", quantity: 1.5, unit: "tbsp" },
      { name: "Mustard Oil", quantity: 4, unit: "tbsp" },
      { name: "Turmeric", quantity: 1, unit: "tsp" },
      { name: "Red Chili Powder", quantity: 1.5, unit: "tsp" },
      { name: "Cumin Seeds", quantity: 1, unit: "tsp" },
      { name: "Coriander Powder", quantity: 1, unit: "tsp" },
      { name: "Salt", quantity: 1.5, unit: "tsp" },
      { name: "Green Chili", quantity: 3, unit: "pcs" },
    ],
    preparation: [
      { ingredient: "Fish", cut: "cleaned and cut into steaks" },
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Tomato", cut: "pureed" },
    ],
    nutrition: { protein: 28, carbs: 8, fat: 18, fiber: 2, sugar: 3 },
    equipment: ["Pan", "Spatula"],
    steps: [
      {
        step: 1,
        instruction:
          "Marinate fish with turmeric and salt, then shallow fry in mustard oil until golden. Set aside.",
        time: 10,
      },
      {
        step: 2,
        instruction:
          "In the same oil, add cumin seeds, sauté onions until golden brown.",
        time: 8,
      },
      {
        step: 3,
        instruction:
          "Add ginger-garlic paste, tomato puree and dry spices. Cook until oil separates.",
        time: 8,
      },
      {
        step: 4,
        instruction:
          "Add 1.5 cups water, bring to boil, add fried fish and green chili. Simmer 10 minutes.",
        time: 12,
      },
    ],
    tips: [
      "Never over-stir after adding fish to keep pieces intact.",
      "Serve with plain boiled rice for a classic Bihari meal.",
    ],
    tags: ["bihari", "fish", "non-veg", "curry", "mithila"],
  },
  {
    id: "chura_dahi",
    name: "Chura Dahi (Poha with Curd)",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Easy",
    cook_time: 5,
    prep_time: 10,
    servings: 2,
    calories: 220,
    rating: 4.5,
    reviews: 390,
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
    description:
      "A simple, cooling no-cook breakfast of thick flattened rice soaked in fresh curd, sweetened with jaggery.",
    ingredients: [
      { name: "Thick Poha (Chura)", quantity: 1.5, unit: "cup" },
      { name: "Fresh Curd", quantity: 1, unit: "cup" },
      { name: "Jaggery", quantity: 3, unit: "tbsp" },
      { name: "Banana", quantity: 1, unit: "pcs" },
      { name: "Cardamom Powder", quantity: 0.25, unit: "tsp" },
      { name: "Salt", quantity: 1, unit: "pinch" },
    ],
    preparation: [
      { ingredient: "Poha", cut: "rinsed and soaked in water for 5 minutes, drained" },
      { ingredient: "Banana", cut: "sliced" },
    ],
    nutrition: { protein: 7, carbs: 44, fat: 4, fiber: 2, sugar: 18 },
    equipment: ["Mixing Bowl"],
    steps: [
      {
        step: 1,
        instruction:
          "Soak thick poha in water for 5 minutes until softened. Drain thoroughly.",
        time: 5,
      },
      {
        step: 2,
        instruction:
          "Mix soaked poha with fresh curd, grated jaggery, cardamom and a pinch of salt.",
        time: 3,
      },
      {
        step: 3,
        instruction:
          "Top with sliced banana and serve immediately.",
        time: 2,
      },
    ],
    tips: [
      "Use thick variety of poha — thin poha becomes mushy.",
      "Traditionally eaten during festivals like Chhath as a satvik meal.",
    ],
    tags: ["bihari", "breakfast", "no-cook", "chhath", "sweet"],
  },
  {
    id: "balushahi",
    name: "Balushahi",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Medium",
    cook_time: 30,
    prep_time: 15,
    servings: 6,
    calories: 360,
    rating: 4.7,
    reviews: 680,
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400",
    description:
      "Flaky, melt-in-the-mouth deep-fried pastries dipped in sugar syrup — Bihar's answer to the donut.",
    ingredients: [
      { name: "All Purpose Flour (Maida)", quantity: 2, unit: "cup" },
      { name: "Ghee", quantity: 4, unit: "tbsp" },
      { name: "Curd", quantity: 3, unit: "tbsp" },
      { name: "Baking Soda", quantity: 0.25, unit: "tsp" },
      { name: "Sugar", quantity: 1.5, unit: "cup" },
      { name: "Water", quantity: 0.75, unit: "cup" },
      { name: "Cardamom Powder", quantity: 0.5, unit: "tsp" },
      { name: "Saffron", quantity: 1, unit: "pinch" },
      { name: "Oil", quantity: 2, unit: "cup" },
    ],
    preparation: [],
    nutrition: { protein: 4, carbs: 54, fat: 16, fiber: 1, sugar: 32 },
    equipment: ["Deep Pan", "Mixing Bowl"],
    steps: [
      {
        step: 1,
        instruction:
          "Rub ghee into maida until it resembles breadcrumbs. Add curd, baking soda and mix into a crumbly dough. Do not over-knead.",
        time: 10,
      },
      {
        step: 2,
        instruction:
          "Shape dough into slightly thick patties, pressing a small indent in the center.",
        time: 8,
      },
      {
        step: 3,
        instruction:
          "Deep fry on low-medium flame for 20–25 minutes until light golden and cooked through.",
        time: 25,
      },
      {
        step: 4,
        instruction:
          "Prepare single-thread sugar syrup with cardamom and saffron. Soak fried balushahi for 15 minutes.",
        time: 20,
      },
    ],
    tips: [
      "Frying slowly on low flame creates the characteristic flaky layers.",
      "Do not knead the dough too much — minimal handling keeps it flaky.",
    ],
    tags: ["bihari", "sweet", "mithai", "festival", "fried"],
  },
  {
    id: "kheer_makhana",
    name: "Makhana Kheer",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Easy",
    cook_time: 35,
    prep_time: 5,
    servings: 4,
    calories: 310,
    rating: 4.8,
    reviews: 590,
    image: "https://images.unsplash.com/photo-1594210565536-574596f77942?w=400",
    description:
      "Creamy, fragrant rice pudding made with fox nuts (makhana), milk and sugar — a Bihari specialty served during fasting and festivals.",
    ingredients: [
      { name: "Fox Nuts (Makhana)", quantity: 1.5, unit: "cup" },
      { name: "Full Fat Milk", quantity: 1, unit: "l" },
      { name: "Sugar", quantity: 4, unit: "tbsp" },
      { name: "Cardamom Powder", quantity: 0.5, unit: "tsp" },
      { name: "Ghee", quantity: 1, unit: "tbsp" },
      { name: "Cashews", quantity: 10, unit: "pcs" },
      { name: "Raisins", quantity: 2, unit: "tbsp" },
      { name: "Saffron", quantity: 1, unit: "pinch" },
    ],
    preparation: [],
    nutrition: { protein: 12, carbs: 38, fat: 14, fiber: 1, sugar: 28 },
    equipment: ["Heavy Bottom Pan"],
    steps: [
      {
        step: 1,
        instruction:
          "Roast makhana in ghee until crispy. Roughly crush 1/3 of them.",
        time: 8,
      },
      {
        step: 2,
        instruction:
          "Boil milk in a heavy pan, add all makhana and simmer on medium flame, stirring frequently.",
        time: 20,
      },
      {
        step: 3,
        instruction:
          "Once milk thickens slightly, add sugar, cardamom, saffron, cashews and raisins.",
        time: 10,
      },
      {
        step: 4,
        instruction:
          "Simmer 5 more minutes. Serve hot or refrigerate and serve chilled.",
        time: 5,
      },
    ],
    tips: [
      "Bihar is the largest producer of makhana in India — always use fresh, white fox nuts.",
      "Serve chilled for maximum flavor.",
    ],
    tags: ["bihari", "sweet", "makhana", "kheer", "fasting", "festival"],
  },
  {
    id: "laai_bihari",
    name: "Laai (Puffed Rice Chikki)",
    cuisine: "Bihari",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 15,
    prep_time: 5,
    servings: 6,
    calories: 210,
    rating: 4.4,
    reviews: 320,
    image: "https://images.unsplash.com/photo-1548340748-6af4da875b1c?w=400",
    description:
      "Crunchy jaggery-bound puffed rice bars — a traditional winter sweet and popular Chhath Puja offering.",
    ingredients: [
      { name: "Puffed Rice (Murmura)", quantity: 3, unit: "cup" },
      { name: "Jaggery", quantity: 1, unit: "cup" },
      { name: "Water", quantity: 3, unit: "tbsp" },
      { name: "Ghee", quantity: 1, unit: "tbsp" },
      { name: "Cardamom Powder", quantity: 0.25, unit: "tsp" },
    ],
    preparation: [],
    nutrition: { protein: 2, carbs: 48, fat: 2, fiber: 1, sugar: 30 },
    equipment: ["Pan", "Greased Tray or Plate"],
    steps: [
      {
        step: 1,
        instruction: "Melt jaggery in water on medium heat, stirring constantly until it reaches hard-ball stage.",
        time: 8,
      },
      {
        step: 2,
        instruction: "Add ghee and cardamom, then quickly mix in puffed rice and stir to coat evenly.",
        time: 3,
      },
      {
        step: 3,
        instruction: "Spread mixture on a greased surface, flatten and cut into bars before it sets.",
        time: 5,
      },
    ],
    tips: [
      "Test jaggery syrup readiness by dropping a bit in cold water — it should form a hard ball.",
      "Work very quickly once jaggery is added to the murmura.",
    ],
    tags: ["bihari", "sweet", "chhath", "snack", "jaggery", "winter"],
  },
  {
    id: "bihari_aloo_chokha",
    name: "Aloo Chokha",
    cuisine: "Bihari",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 20,
    prep_time: 10,
    servings: 4,
    calories: 180,
    rating: 4.6,
    reviews: 450,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    description:
      "Smoky, rustic mashed potato side dish seasoned with mustard oil, chili and onion — a must-have companion to litti.",
    ingredients: [
      { name: "Potato", quantity: 4, unit: "pcs" },
      { name: "Onion", quantity: 1, unit: "pcs" },
      { name: "Green Chili", quantity: 3, unit: "pcs" },
      { name: "Garlic", quantity: 3, unit: "pcs" },
      { name: "Mustard Oil", quantity: 2, unit: "tbsp" },
      { name: "Coriander Leaves", quantity: 3, unit: "tbsp" },
      { name: "Lemon Juice", quantity: 1, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" },
    ],
    preparation: [
      { ingredient: "Potato", cut: "boiled and peeled" },
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Green Chili", cut: "finely chopped" },
      { ingredient: "Garlic", cut: "minced" },
    ],
    nutrition: { protein: 4, carbs: 28, fat: 7, fiber: 3, sugar: 2 },
    equipment: ["Mixing Bowl"],
    steps: [
      {
        step: 1,
        instruction:
          "Roast potatoes directly on flame or in oven until skin is charred for smoky flavor. Peel and mash.",
        time: 20,
      },
      {
        step: 2,
        instruction:
          "Add raw mustard oil, chopped onion, garlic, green chili, coriander and lemon juice.",
        time: 3,
      },
      {
        step: 3,
        instruction:
          "Mix well by hand, adjust salt and serve alongside litti or dal puri.",
        time: 2,
      },
    ],
    tips: [
      "Raw mustard oil is key — do not cook it.",
      "Roasting the potatoes over fire gives an authentic smoky depth.",
    ],
    tags: ["bihari", "side dish", "potato", "vegan", "litti"],
  },
  {
    id: "kala_chana_bihari",
    name: "Bihari Kala Chana",
    cuisine: "Bihari",
    diet: "Vegan",
    difficulty: "Medium",
    cook_time: 40,
    prep_time: 10,
    servings: 4,
    calories: 290,
    rating: 4.5,
    reviews: 480,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    description:
      "Earthy black chickpeas cooked in an aromatic onion-tomato masala — a wholesome protein-packed Bihari staple.",
    ingredients: [
      { name: "Black Chickpeas (Kala Chana)", quantity: 1.5, unit: "cup" },
      { name: "Onion", quantity: 2, unit: "pcs" },
      { name: "Tomato", quantity: 2, unit: "pcs" },
      { name: "Ginger-Garlic Paste", quantity: 1, unit: "tbsp" },
      { name: "Mustard Oil", quantity: 3, unit: "tbsp" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Red Chili Powder", quantity: 1, unit: "tsp" },
      { name: "Coriander Powder", quantity: 1, unit: "tsp" },
      { name: "Cumin Seeds", quantity: 1, unit: "tsp" },
      { name: "Amchur", quantity: 0.5, unit: "tsp" },
      { name: "Salt", quantity: 1, unit: "tsp" },
    ],
    preparation: [
      { ingredient: "Black Chickpeas", cut: "soaked overnight" },
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Tomato", cut: "finely chopped" },
    ],
    nutrition: { protein: 14, carbs: 40, fat: 9, fiber: 10, sugar: 4 },
    equipment: ["Pressure Cooker", "Pan"],
    steps: [
      {
        step: 1,
        instruction: "Pressure cook soaked kala chana with salt and turmeric for 5–6 whistles.",
        time: 25,
      },
      {
        step: 2,
        instruction:
          "Heat mustard oil, add cumin seeds then golden-fry onions. Add ginger-garlic paste.",
        time: 10,
      },
      {
        step: 3,
        instruction:
          "Add tomatoes and all spices, cook until masala is thick and oil separates.",
        time: 8,
      },
      {
        step: 4,
        instruction:
          "Add cooked chana with some cooking water, simmer 10 minutes. Finish with amchur.",
        time: 10,
      },
    ],
    tips: [
      "Reserve the boiling water — it adds flavor and nutrients to the curry.",
      "A pinch of baking soda while soaking reduces cooking time.",
    ],
    tags: ["bihari", "chana", "vegan", "protein", "everyday"],
  },
  {
    id: "bihari_kadhi",
    name: "Bihari Kadhi",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Medium",
    cook_time: 35,
    prep_time: 10,
    servings: 4,
    calories: 220,
    rating: 4.5,
    reviews: 370,
    image: "https://images.unsplash.com/photo-1601050690117-64b6d9a8d3f3?w=400",
    description:
      "A simple mustard-seeds-tempered yogurt and besan curry, lighter than Punjabi kadhi and unique in its Bihari spicing.",
    ingredients: [
      { name: "Sour Curd", quantity: 2, unit: "cup" },
      { name: "Besan", quantity: 4, unit: "tbsp" },
      { name: "Mustard Seeds", quantity: 1, unit: "tsp" },
      { name: "Fenugreek Seeds (Methi)", quantity: 0.5, unit: "tsp" },
      { name: "Dry Red Chili", quantity: 2, unit: "pcs" },
      { name: "Curry Leaves", quantity: 8, unit: "pcs" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Mustard Oil", quantity: 2, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" },
    ],
    preparation: [],
    nutrition: { protein: 9, carbs: 18, fat: 10, fiber: 2, sugar: 6 },
    equipment: ["Pot", "Whisk"],
    steps: [
      {
        step: 1,
        instruction:
          "Whisk curd with besan, turmeric, salt and 2 cups of water until smooth with no lumps.",
        time: 5,
      },
      {
        step: 2,
        instruction:
          "Heat mustard oil to smoking, add mustard seeds, fenugreek, dry red chili and curry leaves.",
        time: 3,
      },
      {
        step: 3,
        instruction:
          "Pour in curd-besan mixture and cook on medium flame, stirring constantly, until it thickens.",
        time: 25,
      },
    ],
    tips: [
      "Stir continuously to avoid lumps and prevent curd from breaking.",
      "Fenugreek seeds add a distinctive bitter depth — don't skip them.",
    ],
    tags: ["bihari", "kadhi", "vegetarian", "everyday", "yogurt"],
  },
  {
    id: "pittha_bihari",
    name: "Pittha",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Medium",
    cook_time: 25,
    prep_time: 20,
    servings: 4,
    calories: 250,
    rating: 4.6,
    reviews: 410,
    image: "https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=400",
    description:
      "Soft steamed rice flour dumplings stuffed with a sweet coconut-jaggery or savory chana dal filling — a Bihari-Jharkhandi classic.",
    ingredients: [
      { name: "Rice Flour", quantity: 2, unit: "cup" },
      { name: "Chana Dal", quantity: 0.5, unit: "cup" },
      { name: "Jaggery", quantity: 0.5, unit: "cup" },
      { name: "Desiccated Coconut", quantity: 0.25, unit: "cup" },
      { name: "Cardamom Powder", quantity: 0.5, unit: "tsp" },
      { name: "Salt", quantity: 0.5, unit: "tsp" },
      { name: "Hot Water", quantity: 1, unit: "cup" },
    ],
    preparation: [
      { ingredient: "Chana Dal", cut: "soaked and boiled until soft" },
    ],
    nutrition: { protein: 8, carbs: 50, fat: 3, fiber: 4, sugar: 18 },
    equipment: ["Steamer", "Mixing Bowl"],
    steps: [
      {
        step: 1,
        instruction:
          "Mix rice flour with salt. Gradually add hot water and knead into a soft, pliable dough.",
        time: 10,
      },
      {
        step: 2,
        instruction:
          "Mash boiled chana dal with jaggery, coconut and cardamom to make the filling.",
        time: 5,
      },
      {
        step: 3,
        instruction:
          "Flatten small dough balls, place filling inside and seal to form oval or half-moon shapes.",
        time: 15,
      },
      {
        step: 4,
        instruction:
          "Steam over boiling water for 15–20 minutes until pittha is firm and cooked through.",
        time: 20,
      },
    ],
    tips: [
      "Keep the rice dough covered with a damp cloth to prevent it from drying.",
      "Savory version can be made with spiced mashed lentils as filling.",
    ],
    tags: ["bihari", "steamed", "dumplings", "sweet", "festival"],
  },
  {
    id: "bihari_shahi_paneer",
    name: "Bihari Style Shahi Paneer",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Medium",
    cook_time: 30,
    prep_time: 15,
    servings: 4,
    calories: 400,
    rating: 4.7,
    reviews: 530,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400",
    description:
      "Rich paneer curry in a cashew-cream gravy with whole spices — Bihar's festive spin on a North Indian classic.",
    ingredients: [
      { name: "Paneer", quantity: 300, unit: "g" },
      { name: "Onion", quantity: 2, unit: "pcs" },
      { name: "Tomato", quantity: 2, unit: "pcs" },
      { name: "Cashews", quantity: 15, unit: "pcs" },
      { name: "Heavy Cream", quantity: 3, unit: "tbsp" },
      { name: "Ginger-Garlic Paste", quantity: 1, unit: "tbsp" },
      { name: "Ghee", quantity: 3, unit: "tbsp" },
      { name: "Cardamom", quantity: 3, unit: "pcs" },
      { name: "Cloves", quantity: 4, unit: "pcs" },
      { name: "Bay Leaf", quantity: 2, unit: "pcs" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Red Chili Powder", quantity: 1, unit: "tsp" },
      { name: "Sugar", quantity: 1, unit: "tsp" },
      { name: "Salt", quantity: 1.5, unit: "tsp" },
    ],
    preparation: [
      { ingredient: "Paneer", cut: "cubed" },
      { ingredient: "Onion", cut: "roughly chopped" },
      { ingredient: "Tomato", cut: "roughly chopped" },
      { ingredient: "Cashews", cut: "soaked in warm water 20 minutes" },
    ],
    nutrition: { protein: 18, carbs: 16, fat: 30, fiber: 2, sugar: 6 },
    equipment: ["Pan", "Blender"],
    steps: [
      {
        step: 1,
        instruction:
          "Boil onion, tomato and soaked cashews together, then cool and blend into a smooth paste.",
        time: 15,
      },
      {
        step: 2,
        instruction:
          "Heat ghee, add whole spices, then ginger-garlic paste. Sauté 1 minute.",
        time: 5,
      },
      {
        step: 3,
        instruction:
          "Add blended paste with all dry spices and cook on medium flame until ghee surfaces.",
        time: 12,
      },
      {
        step: 4,
        instruction:
          "Add paneer cubes, cream, sugar and ½ cup water. Simmer 5 minutes gently.",
        time: 7,
      },
    ],
    tips: [
      "Lightly fry paneer in ghee before adding to the curry for a richer texture.",
      "Do not boil after adding cream to prevent curdling.",
    ],
    tags: ["bihari", "paneer", "vegetarian", "festive", "rich"],
  },
  {
    id: "bihari_baingan_bharta",
    name: "Bihari Baingan Bharta",
    cuisine: "Bihari",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 25,
    prep_time: 10,
    servings: 4,
    calories: 160,
    rating: 4.5,
    reviews: 390,
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400",
    description:
      "Smoky fire-roasted eggplant mashed with mustard oil, green chili and garlic — a rustic Bihari bharta with bold flavors.",
    ingredients: [
      { name: "Large Eggplant (Baingan)", quantity: 2, unit: "pcs" },
      { name: "Onion", quantity: 1, unit: "pcs" },
      { name: "Tomato", quantity: 1, unit: "pcs" },
      { name: "Green Chili", quantity: 3, unit: "pcs" },
      { name: "Garlic", quantity: 4, unit: "pcs" },
      { name: "Mustard Oil", quantity: 2, unit: "tbsp" },
      { name: "Coriander Leaves", quantity: 3, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" },
    ],
    preparation: [
      { ingredient: "Eggplant", cut: "roasted whole on flame until charred" },
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Tomato", cut: "finely chopped" },
    ],
    nutrition: { protein: 3, carbs: 14, fat: 8, fiber: 5, sugar: 5 },
    equipment: ["Mixing Bowl"],
    steps: [
      {
        step: 1,
        instruction:
          "Roast eggplants directly on open flame, turning regularly, until completely charred outside.",
        time: 15,
      },
      {
        step: 2,
        instruction:
          "Cool slightly, peel charred skin, drain excess liquid and mash the flesh roughly.",
        time: 5,
      },
      {
        step: 3,
        instruction:
          "Mix in raw mustard oil, raw onion, garlic, tomato, green chili, coriander and salt.",
        time: 5,
      },
    ],
    tips: [
      "The Bihari version uses raw mustard oil — it's not cooked after mixing.",
      "Serve as a side with litti, roti or rice.",
    ],
    tags: ["bihari", "baingan", "vegan", "smoky", "side dish"],
  },
  {
    id: "kheer_bihari",
    name: "Bihari Chawal Ki Kheer",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Easy",
    cook_time: 50,
    prep_time: 5,
    servings: 6,
    calories: 320,
    rating: 4.8,
    reviews: 720,
    image: "https://images.unsplash.com/photo-1594210565536-574596f77942?w=400",
    description:
      "Slowly simmered rice pudding with full-fat milk, perfumed with cardamom and saffron — served at every Bihari celebration.",
    ingredients: [
      { name: "Basmati Rice", quantity: 0.25, unit: "cup" },
      { name: "Full Fat Milk", quantity: 1.5, unit: "l" },
      { name: "Sugar", quantity: 5, unit: "tbsp" },
      { name: "Cardamom Powder", quantity: 0.5, unit: "tsp" },
      { name: "Saffron", quantity: 1, unit: "pinch" },
      { name: "Almonds", quantity: 10, unit: "pcs" },
      { name: "Pistachios", quantity: 10, unit: "pcs" },
      { name: "Raisins", quantity: 2, unit: "tbsp" },
    ],
    preparation: [
      { ingredient: "Basmati Rice", cut: "washed and soaked 20 minutes" },
      { ingredient: "Almonds", cut: "slivered" },
      { ingredient: "Pistachios", cut: "slivered" },
    ],
    nutrition: { protein: 11, carbs: 46, fat: 12, fiber: 1, sugar: 30 },
    equipment: ["Heavy Bottom Pan"],
    steps: [
      {
        step: 1,
        instruction:
          "Boil milk in a heavy pan, add soaked rice and cook on low flame, stirring every 5 minutes.",
        time: 35,
      },
      {
        step: 2,
        instruction:
          "Once rice is fully cooked and milk has thickened, add sugar and saffron. Stir well.",
        time: 10,
      },
      {
        step: 3,
        instruction:
          "Add cardamom, raisins and half the nuts. Simmer 5 more minutes.",
        time: 5,
      },
      {
        step: 4,
        instruction:
          "Garnish with remaining sliced nuts. Serve warm or chilled.",
        time: 2,
      },
    ],
    tips: [
      "Patience is key — never rush on high flame or the milk will scorch.",
      "Serve chilled with a pinch of extra saffron on top for special occasions.",
    ],
    tags: ["bihari", "kheer", "sweet", "festive", "dessert"],
  },
  {
    id: "bihari_dhuska",
    name: "Dhuska",
    cuisine: "Bihari",
    diet: "Vegetarian",
    difficulty: "Easy",
    cook_time: 20,
    prep_time: 15,
    servings: 4,
    calories: 270,
    rating: 4.6,
    reviews: 460,
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
    description:
      "Fluffy deep-fried rice and lentil pancakes — a beloved Jharkhand-Bihar street snack served with aloo sabzi or chutney.",
    ingredients: [
      { name: "Rice", quantity: 1, unit: "cup" },
      { name: "Chana Dal", quantity: 0.5, unit: "cup" },
      { name: "Onion", quantity: 1, unit: "pcs" },
      { name: "Green Chili", quantity: 2, unit: "pcs" },
      { name: "Ginger", quantity: 1, unit: "tsp" },
      { name: "Cumin Seeds", quantity: 1, unit: "tsp" },
      { name: "Salt", quantity: 1, unit: "tsp" },
      { name: "Oil", quantity: 2, unit: "cup" },
    ],
    preparation: [
      { ingredient: "Rice", cut: "soaked 4 hours" },
      { ingredient: "Chana Dal", cut: "soaked 4 hours" },
      { ingredient: "Onion", cut: "finely chopped" },
    ],
    nutrition: { protein: 9, carbs: 40, fat: 11, fiber: 4, sugar: 2 },
    equipment: ["Mixer Grinder", "Deep Pan"],
    steps: [
      {
        step: 1,
        instruction:
          "Grind soaked rice and chana dal together with ginger, green chili and cumin into a coarse batter.",
        time: 5,
      },
      {
        step: 2,
        instruction:
          "Mix in chopped onion and salt. Batter should be thick.",
        time: 2,
      },
      {
        step: 3,
        instruction:
          "Heat oil in a deep pan, drop spoonfuls of batter and fry on medium flame until golden brown.",
        time: 15,
      },
    ],
    tips: [
      "Keep the batter thick — thin batter will not puff up properly.",
      "Best served hot with spicy aloo curry and green chutney.",
    ],
    tags: ["bihari", "street food", "fried", "breakfast", "snack"],
  },
  {
    id: "bihari_aloo_dum",
    name: "Bihari Aloo Dum",
    cuisine: "Bihari",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 25,
    prep_time: 10,
    servings: 4,
    calories: 230,
    rating: 4.6,
    reviews: 510,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    description:
      "Baby potatoes cooked in a spiced onion-tomato gravy on slow dum — the classic accompaniment to dal puri in Bihar.",
    ingredients: [
      { name: "Baby Potatoes", quantity: 500, unit: "g" },
      { name: "Onion", quantity: 2, unit: "pcs" },
      { name: "Tomato", quantity: 2, unit: "pcs" },
      { name: "Ginger-Garlic Paste", quantity: 1, unit: "tbsp" },
      { name: "Mustard Oil", quantity: 3, unit: "tbsp" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Red Chili Powder", quantity: 1, unit: "tsp" },
      { name: "Coriander Powder", quantity: 1, unit: "tsp" },
      { name: "Cumin Seeds", quantity: 1, unit: "tsp" },
      { name: "Fennel Powder", quantity: 0.5, unit: "tsp" },
      { name: "Salt", quantity: 1, unit: "tsp" },
    ],
    preparation: [
      { ingredient: "Baby Potatoes", cut: "boiled and peeled, pricked with fork" },
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Tomato", cut: "pureed" },
    ],
    nutrition: { protein: 4, carbs: 32, fat: 9, fiber: 4, sugar: 4 },
    equipment: ["Pan with Lid"],
    steps: [
      {
        step: 1,
        instruction:
          "Shallow fry boiled baby potatoes in mustard oil until golden. Set aside.",
        time: 8,
      },
      {
        step: 2,
        instruction:
          "In the same pan, add cumin seeds, onions and sauté until brown. Add ginger-garlic paste.",
        time: 8,
      },
      {
        step: 3,
        instruction:
          "Add tomato puree and all dry spices. Cook on medium until masala is thick.",
        time: 7,
      },
      {
        step: 4,
        instruction:
          "Add fried potatoes and ½ cup water. Cover and cook on low flame (dum) for 10 minutes.",
        time: 10,
      },
    ],
    tips: [
      "Pricking the potatoes helps them absorb the masala deeply.",
      "Fennel powder is a signature spice in Bihari aloo dum — don't substitute it.",
    ],
    tags: ["bihari", "aloo", "dum", "vegan", "side dish", "dal puri"],
  },
];

export default recipes;