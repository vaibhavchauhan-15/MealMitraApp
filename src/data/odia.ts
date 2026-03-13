import { Recipe } from '../types';

const recipes: Recipe[] = [
  {
    id: "dalma_traditional",
    name: "Odia Dalma",
    cuisine: "Odia",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 30,
    prep_time: 15,
    servings: 4,
    calories: 180,
    rating: 4.9,
    reviews: 1250,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    description: "The quintessential Odia dish—a nutritious blend of lentils and local vegetables tempered with panch phoron and roasted cumin.",
    ingredients: [
      { name: "Toor Dal", quantity: 1, unit: "cup" },
      { name: "Raw Papaya", quantity: 100, unit: "g" },
      { name: "Potato", quantity: 1, unit: "pc" },
      { name: "Pumpkin", quantity: 100, unit: "g" },
      { name: "Raw Banana", quantity: 1, unit: "pc" },
      { name: "Panch Phoron", quantity: 1, unit: "tsp" },
      { name: "Roasted Cumin-Chili Powder", quantity: 1, unit: "tbsp" },
      { name: "Ginger (grated)", quantity: 1, unit: "inch" },
      { name: "Ghee or Oil", quantity: 1, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Vegetables", cut: "cubed into 1-inch pieces" },
      { ingredient: "Toor Dal", cut: "washed and soaked for 20 mins" }
    ],
    nutrition: { protein: 9, carbs: 28, fat: 4, fiber: 7, sugar: 3 },
    equipment: ["Pressure Cooker", "Tadka Pan"],
    steps: [
      { step: 1, instruction: "Pressure cook dal and vegetables with turmeric, salt, and ginger for 2 whistles.", time: 15 },
      { step: 2, instruction: "Heat oil/ghee in a pan, add panch phoron and whole red chilies until they splutter.", time: 3 },
      { step: 3, instruction: "Pour the tempering over the cooked dal and simmer for 5 minutes.", time: 5 },
      { step: 4, instruction: "Sprinkle roasted cumin-chili powder before serving.", time: 2 }
    ],
    tips: ["Using roasted moong dal instead of toor dal gives an authentic temple-style flavor.", "Don't overcook the vegetables; they should hold their shape."],
    tags: ["staple", "healthy", "temple food", "odia classic"]
  },
  {
    id: "pakhala_bhata",
    name: "Pakhala Bhata",
    cuisine: "Odia",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 10,
    prep_time: 480,
    servings: 2,
    calories: 310,
    rating: 4.8,
    reviews: 890,
    image: "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400",
    description: "Fermented rice water dish, the ultimate summer comfort food of Odisha, traditionally served with Badi Chura.",
    ingredients: [
      { name: "Cooked Rice", quantity: 2, unit: "cups" },
      { name: "Water", quantity: 3, unit: "cups" },
      { name: "Curd", quantity: 0.5, unit: "cup" },
      { name: "Ginger (crushed)", quantity: 0.5, unit: "inch" },
      { name: "Roasted Cumin Powder", quantity: 1, unit: "tsp" },
      { name: "Salt", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Cooked Rice", cut: "cooled to room temperature" }
    ],
    nutrition: { protein: 5, carbs: 65, fat: 2, fiber: 2, sugar: 1 },
    equipment: ["Earthen Pot or Bowl"],
    steps: [
      { step: 1, instruction: "Add water to cooked rice and let it ferment overnight (8-10 hours).", time: 480 },
      { step: 2, instruction: "Add curd, salt, crushed ginger, and roasted cumin powder to the fermented rice.", time: 5 },
      { step: 3, instruction: "Mix well and serve chilled with fried vegetables or fish.", time: 2 }
    ],
    tips: ["Use an earthen pot for the most authentic cooling effect.", "Adding mango ginger (Amada) elevates the aroma significantly."],
    tags: ["summer", "fermented", "probiotic", "traditional"]
  },
  {
    id: "chhena_poda",
    name: "Chhena Poda",
    cuisine: "Odia",
    diet: "Vegetarian",
    difficulty: "Medium",
    cook_time: 45,
    prep_time: 20,
    servings: 8,
    calories: 280,
    rating: 5.0,
    reviews: 2100,
    image: "https://images.unsplash.com/photo-1589118949245-7d40afb47515?w=400",
    description: "The 'Cheese Burn' of Odisha. A caramelized cottage cheese cake baked until the crust is golden brown.",
    ingredients: [
      { name: "Fresh Chhena", quantity: 500, unit: "g" },
      { name: "Sugar", quantity: 1, unit: "cup" },
      { name: "Semolina (Suji)", quantity: 2, unit: "tbsp" },
      { name: "Cardamom Powder", quantity: 1, unit: "tsp" },
      { name: "Ghee", quantity: 1, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Chhena", cut: "kneaded until smooth" }
    ],
    nutrition: { protein: 12, carbs: 35, fat: 14, fiber: 0, sugar: 30 },
    equipment: ["Baking Tin", "Oven or Pressure Cooker"],
    steps: [
      { step: 1, instruction: "Mix chhena, sugar, and suji; knead well until the sugar dissolves.", time: 10 },
      { step: 2, instruction: "Add cardamom powder and grease a tin with ghee.", time: 5 },
      { step: 3, instruction: "Bake at 180°C or in a salt-layered cooker for 40-45 minutes until the top is dark brown.", time: 45 }
    ],
    tips: ["Do not over-knead or the cake will become too dense.", "The caramelization of sugar at the bottom provides the signature smoky flavor."],
    tags: ["dessert", "sweet", "iconic", "baked"]
  },
  {
    id: "besara_veg",
    name: "Odia Besara",
    cuisine: "Odia",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 25,
    prep_time: 15,
    servings: 4,
    calories: 190,
    rating: 4.7,
    reviews: 430,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    description: "Assorted vegetables cooked in a pungent and flavorful mustard paste, a hallmark of Odia cooking.",
    ingredients: [
      { name: "Mixed Veg (Potato, Drumstick, Pumpkin)", quantity: 500, unit: "g" },
      { name: "Mustard Seeds", quantity: 2, unit: "tbsp" },
      { name: "Cumin Seeds", quantity: 1, unit: "tsp" },
      { name: "Garlic", quantity: 6, unit: "cloves" },
      { name: "Ambula (Dried Mango)", quantity: 2, unit: "pcs" },
      { name: "Mustard Oil", quantity: 2, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Mustard Paste", cut: "ground with garlic and cumin into a fine paste" },
      { ingredient: "Vegetables", cut: "long slices" }
    ],
    nutrition: { protein: 4, carbs: 22, fat: 10, fiber: 5, sugar: 3 },
    equipment: ["Kadai"],
    steps: [
      { step: 1, instruction: "Boil vegetables with turmeric and salt until half-cooked.", time: 10 },
      { step: 2, instruction: "Add the mustard paste and ambula; simmer on low heat.", time: 10 },
      { step: 3, instruction: "Temper with mustard seeds and dry chilies in mustard oil.", time: 5 }
    ],
    tips: ["Always use mustard oil for the authentic 'jhal' (pungency).", "Do not over-boil the mustard paste or it might turn bitter."],
    tags: ["mustard", "tangy", "traditional", "vegan"]
  },
  {
    id: "macha_ghanta",
    name: "Macha Ghanta",
    cuisine: "Odia",
    diet: "Non-Vegetarian",
    difficulty: "Medium",
    cook_time: 40,
    prep_time: 20,
    servings: 4,
    calories: 350,
    rating: 4.9,
    reviews: 670,
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400",
    description: "A rich, festive mixed vegetable curry cooked with fried fish head, usually prepared during Durga Puja.",
    ingredients: [
      { name: "Fish Head (Rohu/Bhakura)", quantity: 1, unit: "pc" },
      { name: "Chana Dal (soaked)", quantity: 0.5, unit: "cup" },
      { name: "Mixed Veg (Yam, Potato, Eggplant)", quantity: 300, unit: "g" },
      { name: "Onion-Ginger-Garlic Paste", quantity: 3, unit: "tbsp" },
      { name: "Garam Masala", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Fish Head", cut: "cleaned and marinated with turmeric" },
      { ingredient: "Vegetables", cut: "large cubes" }
    ],
    nutrition: { protein: 22, carbs: 30, fat: 18, fiber: 6, sugar: 4 },
    equipment: ["Deep Kadai"],
    steps: [
      { step: 1, instruction: "Deep fry the fish head until crunchy and break into smaller pieces.", time: 10 },
      { step: 2, instruction: "Sauté onions and spice paste, then add soaked dal and vegetables.", time: 15 },
      { step: 3, instruction: "Add the fried fish head, water, and simmer until everything is tender.", time: 15 }
    ],
    tips: ["The secret is in breaking the fish head so the juices mix with the gravy.", "Use a bit of ghee at the end for richness."],
    tags: ["festive", "seafood", "mixed veg", "odia special"]
  },
  {
    id: "kanika_sweet_rice",
    name: "Kanika",
    cuisine: "Odia",
    diet: "Vegetarian",
    difficulty: "Easy",
    cook_time: 25,
    prep_time: 15,
    servings: 4,
    calories: 320,
    rating: 4.7,
    reviews: 540,
    image: "https://images.unsplash.com/photo-1512058560550-42749359f84b?w=400",
    description: "A fragrant, sweet yellow rice dish flavored with ghee, cloves, and cardamom, served as part of the Chappan Bhog.",
    ingredients: [
      { name: "Basmati Rice", quantity: 1, unit: "cup" },
      { name: "Sugar", quantity: 0.5, unit: "cup" },
      { name: "Ghee", quantity: 2, unit: "tbsp" },
      { name: "Cinnamon & Cloves", quantity: 2, unit: "pcs" },
      { name: "Turmeric", quantity: 0.25, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Rice", cut: "washed and soaked for 20 mins" }
    ],
    nutrition: { protein: 4, carbs: 55, fat: 8, fiber: 1, sugar: 20 },
    equipment: ["Heavy Bottom Pan"],
    steps: [
      { step: 1, instruction: "Sauté whole spices in ghee, then add soaked rice and turmeric.", time: 5 },
      { step: 2, instruction: "Add water (1:2 ratio) and cook until the rice is 90% done.", time: 15 },
      { step: 3, instruction: "Add sugar and dry fruits, cover and simmer for 5 minutes.", time: 5 }
    ],
    tips: ["Be careful not to over-stir once the rice is cooked to avoid breaking grains.", "Garnish with fried cashews and raisins."],
    tags: ["sweet rice", "temple style", "vegetarian", "pulao"]
  },
  {
    id: "chakuli_pitha",
    name: "Chakuli Pitha",
    cuisine: "Odia",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 15,
    prep_time: 480,
    servings: 3,
    calories: 210,
    rating: 4.8,
    reviews: 720,
    image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400",
    description: "Soft, thin pancakes made from a fermented batter of rice and black gram, a breakfast staple in Odisha.",
    ingredients: [
      { name: "Rice", quantity: 1, unit: "cup" },
      { name: "Urad Dal", quantity: 0.5, unit: "cup" },
      { name: "Salt", quantity: 1, unit: "tsp" },
      { name: "Oil", quantity: 2, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Batter", cut: "soaked for 6 hours, ground, and fermented overnight" }
    ],
    nutrition: { protein: 6, carbs: 38, fat: 4, fiber: 3, sugar: 0 },
    equipment: ["Tawa / Griddle"],
    steps: [
      { step: 1, instruction: "Heat the tawa and grease lightly with oil.", time: 2 },
      { step: 2, instruction: "Spread a ladle of batter in a circular motion.", time: 1 },
      { step: 3, instruction: "Cook on medium heat until edges crisp up, then flip.", time: 2 }
    ],
    tips: ["The batter should be slightly thinner than dosa batter.", "Serve with Dalma or Aloo Dum for a classic breakfast."],
    tags: ["breakfast", "pancake", "vegan", "fermented"]
  },
  {
    id: "dahi_vada_aloo_dum",
    name: "Cuttack Dahi Vada Aloo Dum",
    cuisine: "Odia",
    diet: "Vegetarian",
    difficulty: "Hard",
    cook_time: 45,
    prep_time: 360,
    servings: 4,
    calories: 450,
    rating: 5.0,
    reviews: 3200,
    image: "https://images.unsplash.com/photo-1589118949245-7d40afb47515?w=400",
    description: "The crown jewel of Odisha street food—thin dahi vadas served with a spicy potato curry and garnished with sev.",
    ingredients: [
      { name: "Urad Dal", quantity: 1, unit: "cup" },
      { name: "Curd", quantity: 2, unit: "cups" },
      { name: "Potatoes", quantity: 3, unit: "pcs" },
      { name: "Ginger-Garlic Paste", quantity: 1, unit: "tbsp" },
      { name: "Sev", quantity: 0.5, unit: "cup" }
    ],
    preparation: [
      { ingredient: "Vada", cut: "soaked, ground, and fried into small balls" },
      { ingredient: "Aloo", cut: "boiled and cubed" }
    ],
    nutrition: { protein: 12, carbs: 55, fat: 18, fiber: 8, sugar: 5 },
    equipment: ["Deep Fryer", "Kadai"],
    steps: [
      { step: 1, instruction: "Fry vadas and soak them in thin tempered buttermilk.", time: 20 },
      { step: 2, instruction: "Prepare a spicy aloo dum gravy with ginger-garlic and spices.", time: 20 },
      { step: 3, instruction: "Plate the vadas, top with aloo dum, and garnish with sev/onions.", time: 5 }
    ],
    tips: ["The dahi vada water (torani) should be light and tangy.", "Cuttack style is distinct because the aloo dum is extra spicy."],
    tags: ["street food", "legendary", "cuttack", "spicy"]
  },
  {
    id: "santula_veg",
    name: "Santula",
    cuisine: "Odia",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 20,
    prep_time: 15,
    servings: 4,
    calories: 120,
    rating: 4.6,
    reviews: 310,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400",
    description: "A healthy, low-oil vegetable stew boiled with milk or water and tempered with garlic and chilies.",
    ingredients: [
      { name: "Mixed Veg (Brinjal, Beans, Papaya)", quantity: 500, unit: "g" },
      { name: "Milk (optional)", quantity: 0.5, unit: "cup" },
      { name: "Garlic (crushed)", quantity: 8, unit: "cloves" },
      { name: "Panch Phoron", quantity: 1, unit: "tsp" },
      { name: "Green Chilies", quantity: 3, unit: "pcs" }
    ],
    preparation: [
      { ingredient: "Vegetables", cut: "small cubes" }
    ],
    nutrition: { protein: 3, carbs: 15, fat: 5, fiber: 6, sugar: 4 },
    equipment: ["Kadai with Lid"],
    steps: [
      { step: 1, instruction: "Boil vegetables with salt and turmeric until soft.", time: 12 },
      { step: 2, instruction: "Add milk and simmer for 2 minutes.", time: 2 },
      { step: 3, instruction: "In a separate pan, temper panch phoron, garlic, and chilies, then add to the stew.", time: 6 }
    ],
    tips: ["Crush the garlic roughly to release maximum flavor during tempering.", "Use seasonal vegetables like drumsticks for better taste."],
    tags: ["healthy", "low calorie", "stew", "vegan"]
  },
  {
    id: "chingudi_malai_odia",
    name: "Chingudi Malai Curry",
    cuisine: "Odia",
    diet: "Non-Vegetarian",
    difficulty: "Medium",
    cook_time: 30,
    prep_time: 15,
    servings: 3,
    calories: 410,
    rating: 4.9,
    reviews: 820,
    image: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=400",
    description: "Prawns cooked in a creamy coconut milk gravy with mild Odia spices—a coastal delicacy.",
    ingredients: [
      { name: "Prawns", quantity: 500, unit: "g" },
      { name: "Coconut Milk", quantity: 1, unit: "cup" },
      { name: "Onion Paste", quantity: 2, unit: "tbsp" },
      { name: "Garam Masala", quantity: 0.5, unit: "tsp" },
      { name: "Mustard Oil", quantity: 2, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Prawns", cut: "cleaned and deveined" }
    ],
    nutrition: { protein: 28, carbs: 10, fat: 32, fiber: 2, sugar: 4 },
    equipment: ["Pan"],
    steps: [
      { step: 1, instruction: "Lightly fry prawns with turmeric and set aside.", time: 5 },
      { step: 2, instruction: "Sauté onion paste and spices until the oil separates.", time: 10 },
      { step: 3, instruction: "Add coconut milk and prawns; simmer until the gravy thickens.", time: 15 }
    ],
    tips: ["Do not overcook prawns or they will become rubbery.", "Freshly squeezed coconut milk works best."],
    tags: ["prawns", "seafood", "creamy", "coastal"]
  },
  {
    id: "ghanta_tarkari",
    name: "Ghanta Tarkari",
    cuisine: "Odia",
    diet: "Vegan",
    difficulty: "Medium",
    cook_time: 45,
    prep_time: 25,
    servings: 6,
    calories: 240,
    rating: 4.8,
    reviews: 410,
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400",
    description: "A festive mixed vegetable curry with sprouts and legumes, traditionally made during Habisha or Osha.",
    ingredients: [
      { name: "Mixed Vegetables", quantity: 1, unit: "kg" },
      { name: "Sprouted Moong/Chana", quantity: 1, unit: "cup" },
      { name: "Coconut (grated)", quantity: 0.5, unit: "cup" },
      { name: "Roasted Cumin Powder", quantity: 1, unit: "tbsp" },
      { name: "Ghee", quantity: 1, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Legumes", cut: "soaked and sprouted" },
      { ingredient: "Vegetables", cut: "chopped into uniform cubes" }
    ],
    nutrition: { protein: 10, carbs: 35, fat: 7, fiber: 12, sugar: 5 },
    equipment: ["Large Pot"],
    steps: [
      { step: 1, instruction: "Boil all veggies and sprouts with salt and turmeric.", time: 25 },
      { step: 2, instruction: "Add grated coconut and roasted spices.", time: 5 },
      { step: 3, instruction: "Temper with ghee, bay leaves, and cumin seeds.", time: 15 }
    ],
    tips: ["Adding a bit of jaggery balances the earthy flavors of the legumes.", "Best enjoyed with hot steamed rice."],
    tags: ["festive", "mixed veg", "nutritious", "habitual"]
  },
  {
    id: "rasabali_sweet",
    name: "Rasabali",
    cuisine: "Odia",
    diet: "Vegetarian",
    difficulty: "Hard",
    cook_time: 50,
    prep_time: 20,
    servings: 5,
    calories: 340,
    rating: 4.9,
    reviews: 950,
    image: "https://images.unsplash.com/photo-1589118949245-7d40afb47515?w=400",
    description: "Deep-fried flattened chhena patties soaked in thickened, cardamom-infused milk.",
    ingredients: [
      { name: "Fresh Chhena", quantity: 250, unit: "g" },
      { name: "Milk", quantity: 1, unit: "litre" },
      { name: "Sugar", quantity: 0.5, unit: "cup" },
      { name: "Cardamom Powder", quantity: 1, unit: "tsp" },
      { name: "Wheat Flour", quantity: 1, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Patties", cut: "chhena mixed with flour and flattened into small discs" }
    ],
    nutrition: { protein: 14, carbs: 40, fat: 16, fiber: 0, sugar: 32 },
    equipment: ["Frying Pan", "Deep Milk Pot"],
    steps: [
      { step: 1, instruction: "Reduce milk to half its volume with sugar and cardamom.", time: 30 },
      { step: 2, instruction: "Fry the chhena patties until reddish-brown.", time: 10 },
      { step: 3, instruction: "Soak the hot patties in the reduced milk for 2 hours before serving.", time: 10 }
    ],
    tips: ["Don't make the patties too thick, or they won't absorb the milk well.", "Kendrapara is world-famous for this specific dessert."],
    tags: ["dessert", "milk-based", "festive", "chhena"]
  },
  {
    id: "chatu_besara",
    name: "Chatu Besara",
    cuisine: "Odia",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 20,
    prep_time: 15,
    servings: 3,
    calories: 160,
    rating: 4.7,
    reviews: 380,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
    description: "Oyster or Button mushrooms cooked in a spicy mustard and garlic gravy—a rural favorite.",
    ingredients: [
      { name: "Mushrooms", quantity: 250, unit: "g" },
      { name: "Mustard Paste", quantity: 2, unit: "tbsp" },
      { name: "Potato (cubed)", quantity: 1, unit: "pc" },
      { name: "Tomato", quantity: 1, unit: "pc" },
      { name: "Mustard Oil", quantity: 1, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Mushrooms", cut: "torn by hand or sliced" }
    ],
    nutrition: { protein: 6, carbs: 12, fat: 9, fiber: 3, sugar: 2 },
    equipment: ["Kadai"],
    steps: [
      { step: 1, instruction: "Sauté potatoes and mushrooms with salt and turmeric.", time: 8 },
      { step: 2, instruction: "Add chopped tomatoes and the mustard paste with a little water.", time: 7 },
      { step: 3, instruction: "Cook covered until tender and garnish with coriander.", time: 5 }
    ],
    tips: ["Wild mushrooms (Bali Chatu) taste the best for this recipe.", "Add a piece of Ambula for a tangy kick."],
    tags: ["mushroom", "mustard", "village food", "vegan"]
  },
  {
    id: "kadali_manja_rai",
    name: "Kadali Manja Rai",
    cuisine: "Odia",
    diet: "Vegan",
    difficulty: "Medium",
    cook_time: 25,
    prep_time: 20,
    servings: 4,
    calories: 140,
    rating: 4.5,
    reviews: 210,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    description: "Banana stem curry prepared with mustard paste and small pieces of potato, rich in fiber.",
    ingredients: [
      { name: "Banana Stem (Manja)", quantity: 500, unit: "g" },
      { name: "Mustard Paste", quantity: 2, unit: "tbsp" },
      { name: "Badi (Lentil dumplings)", quantity: 5, unit: "pcs" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Mustard Oil", quantity: 1, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Banana Stem", cut: "finely chopped and fibers removed" }
    ],
    nutrition: { protein: 3, carbs: 20, fat: 6, fiber: 10, sugar: 2 },
    equipment: ["Pressure Cooker", "Pan"],
    steps: [
      { step: 1, instruction: "Pressure cook manja with salt and turmeric for 1 whistle.", time: 10 },
      { step: 2, instruction: "Fry badis, crush them, and set aside.", time: 5 },
      { step: 3, instruction: "Sauté the mustard paste, add manja, and top with crushed badis.", time: 10 }
    ],
    tips: ["To remove fibers, rotate a finger in the chopped manja; the threads will stick.", "Very healthy for kidney stones and digestion."],
    tags: ["banana stem", "fiber-rich", "healthy", "mustard"]
  },
  {
    id: "badi_chura",
    name: "Badi Chura",
    cuisine: "Odia",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 5,
    prep_time: 5,
    servings: 4,
    calories: 90,
    rating: 4.9,
    reviews: 1100,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb01793?w=400",
    description: "A crunchy, flavorful accompaniment made of crushed fried lentil dumplings, onions, and garlic.",
    ingredients: [
      { name: "Sun-dried Badi", quantity: 10, unit: "pcs" },
      { name: "Onion", quantity: 1, unit: "pc" },
      { name: "Garlic", quantity: 4, unit: "cloves" },
      { name: "Green Chili", quantity: 2, unit: "pcs" },
      { name: "Mustard Oil", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Onion & Garlic", cut: "finely minced" }
    ],
    nutrition: { protein: 4, carbs: 8, fat: 5, fiber: 2, sugar: 1 },
    equipment: ["Pan", "Mortar and Pestle"],
    steps: [
      { step: 1, instruction: "Deep or shallow fry the badis until golden and crisp.", time: 3 },
      { step: 2, instruction: "Crush them using a mortar and pestle or by hand.", time: 1 },
      { step: 3, instruction: "Mix with minced onion, garlic, chili, and raw mustard oil.", time: 1 }
    ],
    tips: ["Don't use a mixer/grinder; the texture must be coarse and crunchy.", "The raw mustard oil at the end is non-negotiable for flavor."],
    tags: ["side dish", "crunchy", "pakhala partner", "quick"]
  },
  {
    id: "aloo_potala_rasa",
    name: "Aloo Potala Rasa",
    cuisine: "Odia",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 25,
    prep_time: 15,
    servings: 4,
    calories: 210,
    rating: 4.7,
    reviews: 620,
    image: "https://images.unsplash.com/photo-1589118949245-7d40afb47515?w=400",
    description: "A classic gravy curry featuring potatoes and pointed gourd, flavored with ginger and garam masala.",
    ingredients: [
      { name: "Potala (Pointed Gourd)", quantity: 250, unit: "g" },
      { name: "Potato", quantity: 2, unit: "pcs" },
      { name: "Onion-Ginger-Garlic Paste", quantity: 2, unit: "tbsp" },
      { name: "Tomato", quantity: 1, unit: "pc" },
      { name: "Cumin Powder", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Potala", cut: "peeled in stripes and halved" },
      { ingredient: "Potato", cut: "cubed" }
    ],
    nutrition: { protein: 4, carbs: 28, fat: 10, fiber: 5, sugar: 4 },
    equipment: ["Kadai"],
    steps: [
      { step: 1, instruction: "Shallow fry the potala and potatoes until golden.", time: 10 },
      { step: 2, instruction: "Sauté spices and tomato until mushy.", time: 8 },
      { step: 3, instruction: "Add fried veggies and water; simmer until cooked through.", time: 7 }
    ],
    tips: ["Frying the pointed gourd first removes its raw smell.", "Add a little bit of sugar to enhance the color of the gravy."],
    tags: ["curry", "pointed gourd", "everyday", "odia lunch"]
  },
  {
    id: "saga_bhaja",
    name: "Saga Bhaja",
    cuisine: "Odia",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 10,
    prep_time: 10,
    servings: 2,
    calories: 85,
    rating: 4.6,
    reviews: 290,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    description: "Stir-fried leafy greens (Amaranth or Spinach) with garlic, red chilies, and often fried badis.",
    ingredients: [
      { name: "Leafy Greens (Kosala/Koshala)", quantity: 1, unit: "bunch" },
      { name: "Garlic (crushed)", quantity: 6, unit: "cloves" },
      { name: "Dry Red Chili", quantity: 2, unit: "pcs" },
      { name: "Mustard Oil", quantity: 1, unit: "tbsp" },
      { name: "Badi (optional)", quantity: 3, unit: "pcs" }
    ],
    preparation: [
      { ingredient: "Saga", cut: "washed and finely chopped" }
    ],
    nutrition: { protein: 3, carbs: 5, fat: 6, fiber: 4, sugar: 0 },
    equipment: ["Pan"],
    steps: [
      { step: 1, instruction: "Heat oil and temper with red chili and garlic.", time: 3 },
      { step: 2, instruction: "Add chopped greens and salt; cook on high heat without covering.", time: 5 },
      { step: 3, instruction: "Mix in crushed fried badis at the end.", time: 2 }
    ],
    tips: ["Don't cover the pan while cooking saga to keep the green color vibrant.", "Use mustard oil for a pungent kick."],
    tags: ["leafy greens", "healthy", "side dish", "iron-rich"]
  },
  {
    id: "chhena_jhili",
    name: "Chhena Jhili",
    cuisine: "Odia",
    diet: "Vegetarian",
    difficulty: "Medium",
    cook_time: 30,
    prep_time: 15,
    servings: 4,
    calories: 310,
    rating: 4.9,
    reviews: 580,
    image: "https://images.unsplash.com/photo-1589118949245-7d40afb47515?w=400",
    description: "Soft chhena fried into light, porous golden balls and soaked in a thin sugar syrup. A Nimapada specialty.",
    ingredients: [
      { name: "Fresh Chhena", quantity: 200, unit: "g" },
      { name: "Semolina (Suji)", quantity: 1, unit: "tsp" },
      { name: "Sugar", quantity: 1, unit: "cup" },
      { name: "Cardamom", quantity: 2, unit: "pcs" },
      { name: "Ghee", quantity: 1, unit: "cup" }
    ],
    preparation: [
      { ingredient: "Chhena", cut: "kneaded with suji into a smooth dough" }
    ],
    nutrition: { protein: 8, carbs: 45, fat: 12, fiber: 0, sugar: 38 },
    equipment: ["Deep Fryer", "Syrup Pot"],
    steps: [
      { step: 1, instruction: "Make a single-thread sugar syrup with cardamom.", time: 10 },
      { step: 2, instruction: "Shape chhena into small rings or balls and deep fry in ghee until golden.", time: 10 },
      { step: 3, instruction: "Drop the hot fried balls into the warm syrup and let soak for 30 minutes.", time: 10 }
    ],
    tips: ["The syrup should be thin; if it's too thick, the jhili won't be soft.", "Nimapada version uses ghee for frying, which is essential for the taste."],
    tags: ["sweet", "chhena", "nimapada", "dessert"]
  },
  {
    id: "muga_dalma",
    name: "Habisha Dalma",
    cuisine: "Odia",
    diet: "Vegetarian",
    difficulty: "Easy",
    cook_time: 30,
    prep_time: 15,
    servings: 4,
    calories: 195,
    rating: 4.8,
    reviews: 340,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    description: "A special no-onion-no-garlic version of Dalma made with roasted Moong Dal, typically eaten during the month of Kartik.",
    ingredients: [
      { name: "Roasted Moong Dal", quantity: 1, unit: "cup" },
      { name: "Raw Banana & Elephant Apple (Ouu)", quantity: 200, unit: "g" },
      { name: "Grated Coconut", quantity: 2, unit: "tbsp" },
      { name: "Ghee", quantity: 1, unit: "tbsp" },
      { name: "Roasted Cumin Powder", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Moong Dal", cut: "dry roasted until fragrant" }
    ],
    nutrition: { protein: 11, carbs: 30, fat: 5, fiber: 8, sugar: 2 },
    equipment: ["Pressure Cooker"],
    steps: [
      { step: 1, instruction: "Cook dal and vegetables in a pressure cooker with ginger and salt.", time: 15 },
      { step: 2, instruction: "Add Ouu (Elephant Apple) for a unique sour tang.", time: 5 },
      { step: 3, instruction: "Temper with ghee and cumin, then garnish with coconut.", time: 10 }
    ],
    tips: ["Elephant apple (Ouu) is the soul of Habisha Dalma.", "Use only Desi Ghee for the tempering."],
    tags: ["kartik masa", "habisha", "no onion no garlic", "pure veg"]
  },
  {
    id: "khicede_temple_style",
    name: "Jagannath Temple Khicede",
    cuisine: "Odia",
    diet: "Vegetarian",
    difficulty: "Medium",
    cook_time: 40,
    prep_time: 20,
    servings: 4,
    calories: 280,
    rating: 5.0,
    reviews: 1500,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    description: "The divine Khichdi offered to Lord Jagannath; a simple, aromatic rice and lentil dish cooked with ghee and no onion or garlic.",
    ingredients: [
      { name: "Rice (Arua Chaula)", quantity: 1, unit: "cup" },
      { name: "Moong Dal", quantity: 0.5, unit: "cup" },
      { name: "Ghee", quantity: 3, unit: "tbsp" },
      { name: "Ginger (crushed)", quantity: 1, unit: "inch" },
      { name: "Cinnamon & Cardamom", quantity: 2, unit: "pcs" }
    ],
    preparation: [
      { ingredient: "Rice & Dal", cut: "washed and drained" }
    ],
    nutrition: { protein: 8, carbs: 48, fat: 10, fiber: 4, sugar: 1 },
    equipment: ["Earthen Pot (Kudua) or Heavy Pot"],
    steps: [
      { step: 1, instruction: "Roast moong dal slightly until aromatic.", time: 5 },
      { step: 2, instruction: "Boil water with ginger and whole spices, then add rice and dal.", time: 25 },
      { step: 3, instruction: "Stir in plenty of ghee once cooked and keep covered.", time: 10 }
    ],
    tips: ["Cooking in an earthen pot adds a distinct flavor impossible to replicate in steel.", "Use only Arua (raw) rice, never parboiled rice."],
    tags: ["temple food", "jagannath puri", "khichdi", "pure veg"]
  }
];

export default recipes;