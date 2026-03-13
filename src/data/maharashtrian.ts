import { Recipe } from '../types';

const recipes: Recipe[] = [
  {
    id: "vada_pav",
    name: "Vada Pav",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Medium",
    cook_time: 20,
    prep_time: 15,
    servings: 4,
    calories: 350,
    rating: 4.9,
    reviews: 1250,
    image: "https://images.unsplash.com/photo-1626074964005-24ce8fb12891?w=400",
    description: "The iconic street food of Mumbai. A spicy deep-fried potato dumpling placed inside a bread bun (pav) accompanied by dry garlic chutney.",
    ingredients: [
      { name: "Potatoes", quantity: 4, unit: "pcs" },
      { name: "Besan (Gram Flour)", quantity: 1, unit: "cup" },
      { name: "Pav (Bread Buns)", quantity: 4, unit: "pcs" },
      { name: "Green Chilies", quantity: 3, unit: "pcs" },
      { name: "Garlic", quantity: 5, unit: "cloves" },
      { name: "Mustard Seeds", quantity: 1, unit: "tsp" },
      { name: "Turmeric Powder", quantity: 0.5, unit: "tsp" },
      { name: "Curry Leaves", quantity: 8, unit: "leaves" },
      { name: "Oil", quantity: 500, unit: "ml" },
      { name: "Salt", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Potatoes", cut: "boiled and mashed" },
      { ingredient: "Green Chilies and Garlic", cut: "crushed to a coarse paste" }
    ],
    nutrition: { protein: 8, carbs: 45, fat: 15, fiber: 5, sugar: 3 },
    equipment: ["Deep Frying Pan", "Mixing Bowl"],
    steps: [
      { step: 1, instruction: "Heat oil in a pan. Add mustard seeds, curry leaves, and the chili-garlic paste. Sauté well.", time: 3 },
      { step: 2, instruction: "Add turmeric and mashed potatoes. Mix well, let it cool, and shape into round balls.", time: 10 },
      { step: 3, instruction: "Make a smooth batter of besan, a pinch of turmeric, salt, and water.", time: 5 },
      { step: 4, instruction: "Dip the potato balls in the batter and deep fry until golden brown. Serve inside sliced pav.", time: 15 }
    ],
    tips: [
      "Serve with dry red garlic chutney and fried green chilies for an authentic experience.",
      "Ensure the besan batter is not too runny so it coats the potato evenly."
    ],
    tags: ["street food", "snack", "mumbai", "vegan", "potato"]
  },
  {
    id: "misal_pav",
    name: "Misal Pav",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Medium",
    cook_time: 30,
    prep_time: 15,
    servings: 4,
    calories: 420,
    rating: 4.8,
    reviews: 980,
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400",
    description: "A fiery sprouted moth bean curry topped with crunchy farsan, onions, and lemon, served with soft pav.",
    ingredients: [
      { name: "Sprouted Moth Beans (Matki)", quantity: 2, unit: "cups" },
      { name: "Onion", quantity: 2, unit: "pcs" },
      { name: "Tomato", quantity: 2, unit: "pcs" },
      { name: "Goda Masala", quantity: 2, unit: "tbsp" },
      { name: "Red Chili Powder", quantity: 2, unit: "tsp" },
      { name: "Ginger-Garlic Paste", quantity: 1, unit: "tbsp" },
      { name: "Oil", quantity: 4, unit: "tbsp" },
      { name: "Farsan (Mixed Indian Savory)", quantity: 1, unit: "cup" },
      { name: "Pav", quantity: 8, unit: "pcs" },
      { name: "Lemon", quantity: 1, unit: "pc" }
    ],
    preparation: [
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Tomato", cut: "finely chopped" },
      { ingredient: "Sprouted Moth Beans", cut: "boiled until tender" }
    ],
    nutrition: { protein: 14, carbs: 55, fat: 18, fiber: 9, sugar: 6 },
    equipment: ["Heavy Bottom Pan"],
    steps: [
      { step: 1, instruction: "Heat oil, sauté onions until translucent, then add ginger-garlic paste and tomatoes.", time: 10 },
      { step: 2, instruction: "Add goda masala, red chili powder, and cook until oil separates from the masala.", time: 5 },
      { step: 3, instruction: "Add boiled moth beans and 3 cups of water. Simmer to create a thin, spicy gravy (kat/tarri).", time: 15 },
      { step: 4, instruction: "Serve in a bowl: pour misal, top with farsan, chopped onions, coriander, and serve with pav.", time: 2 }
    ],
    tips: [
      "The signature floating oil (tarri) is essential for authentic Misal.",
      "Goda masala is the secret ingredient; do not replace it with garam masala."
    ],
    tags: ["spicy", "breakfast", "curry", "vegan", "beans"]
  },
  {
    id: "kande_pohe",
    name: "Kande Pohe",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 15,
    prep_time: 10,
    servings: 3,
    calories: 280,
    rating: 4.7,
    reviews: 1420,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
    description: "A popular, quick breakfast dish made from flattened rice, tempered with onions, mustard seeds, and peanuts.",
    ingredients: [
      { name: "Thick Poha (Flattened Rice)", quantity: 2, unit: "cups" },
      { name: "Onion", quantity: 2, unit: "pcs" },
      { name: "Peanuts", quantity: 0.25, unit: "cup" },
      { name: "Green Chilies", quantity: 2, unit: "pcs" },
      { name: "Mustard Seeds", quantity: 1, unit: "tsp" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Curry Leaves", quantity: 10, unit: "leaves" },
      { name: "Fresh Coriander", quantity: 2, unit: "tbsp" },
      { name: "Oil", quantity: 2, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Poha", cut: "rinsed in water and drained well" },
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Green Chilies", cut: "slit" }
    ],
    nutrition: { protein: 6, carbs: 40, fat: 11, fiber: 3, sugar: 2 },
    equipment: ["Wok or Kadhai"],
    steps: [
      { step: 1, instruction: "Heat oil in a kadhai. Fry peanuts until crunchy, then remove and set aside.", time: 3 },
      { step: 2, instruction: "In the same oil, add mustard seeds, curry leaves, and green chilies. Sauté for a few seconds.", time: 2 },
      { step: 3, instruction: "Add chopped onions and fry until pink. Stir in turmeric.", time: 5 },
      { step: 4, instruction: "Add the rinsed poha, fried peanuts, salt, and a dash of sugar. Mix gently, cover, and steam on low for 3 mins. Garnish with coriander.", time: 5 }
    ],
    tips: [
      "Do not over-soak the poha; just rinse it briefly under running water.",
      "A squeeze of fresh lemon juice on top elevates the flavor."
    ],
    tags: ["breakfast", "quick", "vegan", "poha", "healthy"]
  },
  {
    id: "puran_poli",
    name: "Puran Poli",
    cuisine: "Maharashtrian",
    diet: "Vegetarian",
    difficulty: "Hard",
    cook_time: 40,
    prep_time: 30,
    servings: 6,
    calories: 310,
    rating: 4.9,
    reviews: 650,
    image: "https://images.unsplash.com/photo-1599557404471-f9257e5e3477?w=400",
    description: "A sweet flatbread stuffed with a delectable filling of chana dal, jaggery, cardamom, and nutmeg.",
    ingredients: [
      { name: "Chana Dal", quantity: 1, unit: "cup" },
      { name: "Jaggery (Gud)", quantity: 1, unit: "cup" },
      { name: "Whole Wheat Flour", quantity: 2, unit: "cups" },
      { name: "Cardamom Powder", quantity: 1, unit: "tsp" },
      { name: "Nutmeg Powder", quantity: 0.25, unit: "tsp" },
      { name: "Ghee", quantity: 4, unit: "tbsp" },
      { name: "Turmeric", quantity: 0.25, unit: "tsp" },
      { name: "Oil", quantity: 2, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Chana Dal", cut: "soaked for 1 hour, then boiled until soft but holding shape" },
      { ingredient: "Jaggery", cut: "grated" },
      { ingredient: "Wheat Flour", cut: "kneaded into a soft dough with oil and a pinch of turmeric" }
    ],
    nutrition: { protein: 8, carbs: 54, fat: 8, fiber: 6, sugar: 20 },
    equipment: ["Pressure Cooker", "Tawa (Griddle)", "Rolling Pin"],
    steps: [
      { step: 1, instruction: "Drain excess water from boiled dal. Mash the dal in a pan on low heat, add jaggery.", time: 10 },
      { step: 2, instruction: "Cook the dal-jaggery mixture (Puran) until it thickens and leaves the sides of the pan. Add cardamom and nutmeg.", time: 15 },
      { step: 3, instruction: "Take a small ball of dough, flatten it, place a portion of Puran in the center, and seal the edges.", time: 5 },
      { step: 4, instruction: "Dust with flour and roll out into a thin flatbread. Cook on a hot tawa, smearing ghee on both sides until golden spots appear.", time: 10 }
    ],
    tips: [
      "Use a Puran Yantra or a fine sieve to mash the Puran mixture for an ultra-smooth texture.",
      "Serve hot with a generous dollop of warm ghee and milk."
    ],
    tags: ["sweet", "festive", "vegetarian", "flatbread", "traditional"]
  },
  {
    id: "pav_bhaji",
    name: "Pav Bhaji",
    cuisine: "Maharashtrian",
    diet: "Vegetarian",
    difficulty: "Medium",
    cook_time: 40,
    prep_time: 20,
    servings: 4,
    calories: 450,
    rating: 4.8,
    reviews: 2100,
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400",
    description: "A thick, deeply spiced vegetable mash cooked on a griddle, served with butter-toasted pav buns.",
    ingredients: [
      { name: "Potatoes", quantity: 3, unit: "pcs" },
      { name: "Cauliflower", quantity: 1, unit: "cup" },
      { name: "Green Peas", quantity: 0.5, unit: "cup" },
      { name: "Capsicum (Bell Pepper)", quantity: 1, unit: "pc" },
      { name: "Onion", quantity: 2, unit: "pcs" },
      { name: "Tomatoes", quantity: 3, unit: "pcs" },
      { name: "Pav Bhaji Masala", quantity: 3, unit: "tbsp" },
      { name: "Butter", quantity: 50, unit: "g" },
      { name: "Pav Buns", quantity: 8, unit: "pcs" },
      { name: "Lemon", quantity: 1, unit: "pc" }
    ],
    preparation: [
      { ingredient: "Potatoes, Cauliflower, Peas", cut: "boiled and mashed" },
      { ingredient: "Onion, Capsicum, Tomatoes", cut: "finely chopped" }
    ],
    nutrition: { protein: 9, carbs: 60, fat: 22, fiber: 8, sugar: 7 },
    equipment: ["Large Tawa or Wide Pan", "Potato Masher"],
    steps: [
      { step: 1, instruction: "Heat butter in a pan. Sauté onions and capsicum until soft.", time: 7 },
      { step: 2, instruction: "Add tomatoes, pav bhaji masala, and salt. Cook until tomatoes are mushy and release oil.", time: 8 },
      { step: 3, instruction: "Add the boiled, mashed vegetables and a little water. Mash continuously while cooking on medium heat.", time: 15 },
      { step: 4, instruction: "Garnish with coriander and extra butter. Toast the pav buns with butter on a hot tawa until slightly crisp.", time: 10 }
    ],
    tips: [
      "The more you mash the bhaji, the better the texture.",
      "A dash of red food color or Kashmiri chili powder gives it that iconic vibrant street-style color."
    ],
    tags: ["street food", "vegetarian", "spicy", "mumbai", "dinner"]
  },
  {
    id: "sabudana_khichdi",
    name: "Sabudana Khichdi",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 15,
    prep_time: 120,
    servings: 2,
    calories: 320,
    rating: 4.7,
    reviews: 890,
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400",
    description: "A popular fasting dish made with soaked tapioca pearls, crushed peanuts, and potatoes.",
    ingredients: [
      { name: "Sabudana (Tapioca Pearls)", quantity: 1, unit: "cup" },
      { name: "Roasted Peanuts", quantity: 0.5, unit: "cup" },
      { name: "Potatoes", quantity: 1, unit: "pc" },
      { name: "Green Chilies", quantity: 3, unit: "pcs" },
      { name: "Cumin Seeds", quantity: 1, unit: "tsp" },
      { name: "Ghee or Peanut Oil", quantity: 2, unit: "tbsp" },
      { name: "Sugar", quantity: 1, unit: "tsp" },
      { name: "Sendha Namak (Rock Salt)", quantity: 1, unit: "tsp" },
      { name: "Lemon", quantity: 0.5, unit: "pc" }
    ],
    preparation: [
      { ingredient: "Sabudana", cut: "washed thoroughly and soaked in just enough water for 4-6 hours" },
      { ingredient: "Peanuts", cut: "coarsely crushed" },
      { ingredient: "Potatoes", cut: "boiled and cubed" }
    ],
    nutrition: { protein: 6, carbs: 55, fat: 10, fiber: 2, sugar: 3 },
    equipment: ["Non-stick Pan"],
    steps: [
      { step: 1, instruction: "Mix the soaked sabudana with crushed peanuts, sugar, and salt in a bowl.", time: 2 },
      { step: 2, instruction: "Heat ghee/oil in a pan. Add cumin seeds and chopped green chilies.", time: 2 },
      { step: 3, instruction: "Add boiled potatoes and sauté for a minute. Then add the sabudana mixture.", time: 3 },
      { step: 4, instruction: "Cook on low heat, stirring gently, until the pearls turn translucent (about 5-8 mins). Squeeze lemon juice and mix.", time: 8 }
    ],
    tips: [
      "Do not add too much water while soaking, or the khichdi will turn mushy. The pearls should remain separate.",
      "Use sendha namak if preparing for religious fasting (vrat)."
    ],
    tags: ["fasting", "vrat", "vegan", "breakfast", "gluten-free"]
  },
  {
    id: "pithla_bhakri",
    name: "Pithla Bhakri",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 20,
    prep_time: 10,
    servings: 4,
    calories: 290,
    rating: 4.8,
    reviews: 512,
    image: "https://images.unsplash.com/photo-1628294895950-98052520c180?w=400",
    description: "The ultimate comfort food of Maharashtra. A quick, savory gram flour porridge served with rustic sorghum (jowar) flatbread.",
    ingredients: [
      { name: "Besan (Gram Flour)", quantity: 1, unit: "cup" },
      { name: "Water", quantity: 3, unit: "cups" },
      { name: "Onion", quantity: 1, unit: "pc" },
      { name: "Garlic", quantity: 6, unit: "cloves" },
      { name: "Green Chilies", quantity: 3, unit: "pcs" },
      { name: "Mustard Seeds", quantity: 1, unit: "tsp" },
      { name: "Cumin Seeds", quantity: 1, unit: "tsp" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Oil", quantity: 2, unit: "tbsp" },
      { name: "Fresh Coriander", quantity: 2, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Besan", cut: "whisked with water to form a lump-free thin batter" },
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Garlic and Chilies", cut: "pounded in a mortar to a coarse paste" }
    ],
    nutrition: { protein: 12, carbs: 35, fat: 12, fiber: 6, sugar: 4 },
    equipment: ["Kadhai", "Whisk"],
    steps: [
      { step: 1, instruction: "Heat oil, add mustard and cumin seeds. Once they splutter, add the pounded chili-garlic paste and sauté.", time: 3 },
      { step: 2, instruction: "Add chopped onions and cook until soft. Stir in turmeric and a pinch of hing (asafoetida).", time: 5 },
      { step: 3, instruction: "Lower the flame and slowly pour in the besan batter while stirring continuously to avoid lumps.", time: 5 },
      { step: 4, instruction: "Season with salt, cover, and let it simmer until it thickens and the raw smell disappears. Garnish with coriander.", time: 7 }
    ],
    tips: [
      "Serve hot with Jowar or Bajra Bhakri, accompanied by raw onion and garlic chutney.",
      "Pithla thickens as it cools, so keep the consistency slightly runny while cooking."
    ],
    tags: ["comfort food", "rustic", "vegan", "quick", "dinner"]
  },
  {
    id: "bharli_vangi",
    name: "Bharli Vangi",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Medium",
    cook_time: 25,
    prep_time: 15,
    servings: 4,
    calories: 220,
    rating: 4.7,
    reviews: 730,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400",
    description: "Baby eggplants stuffed with a spicy, sweet, and tangy coconut-peanut masala.",
    ingredients: [
      { name: "Small Purple Eggplants", quantity: 8, unit: "pcs" },
      { name: "Roasted Peanut Powder", quantity: 0.5, unit: "cup" },
      { name: "Desiccated Coconut", quantity: 0.25, unit: "cup" },
      { name: "Goda Masala", quantity: 2, unit: "tbsp" },
      { name: "Red Chili Powder", quantity: 1, unit: "tsp" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Jaggery", quantity: 1, unit: "tbsp" },
      { name: "Tamarind Paste", quantity: 1, unit: "tbsp" },
      { name: "Oil", quantity: 3, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Eggplants", cut: "slit into 4 quarters keeping the stem intact, soaked in salted water" },
      { ingredient: "Stuffing Mix", cut: "Mix peanut powder, coconut, spices, jaggery, tamarind, and salt" }
    ],
    nutrition: { protein: 6, carbs: 18, fat: 15, fiber: 7, sugar: 6 },
    equipment: ["Pan with Lid"],
    steps: [
      { step: 1, instruction: "Stuff the prepared spice mixture generously into the slit eggplants.", time: 10 },
      { step: 2, instruction: "Heat oil in a pan, add mustard seeds. Place the stuffed eggplants gently into the oil.", time: 3 },
      { step: 3, instruction: "Add any remaining stuffing mixture to the pan, along with 1/2 cup of water.", time: 2 },
      { step: 4, instruction: "Cover and cook on medium-low heat until the eggplants are tender and oil separates.", time: 25 }
    ],
    tips: [
      "Use fresh, tender baby eggplants for the best texture and flavor.",
      "Goda masala is non-negotiable for the authentic Maharashtrian flavor profile."
    ],
    tags: ["curry", "vegan", "eggplant", "traditional", "main course"]
  },
  {
    id: "thalipeeth",
    name: "Thalipeeth",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Medium",
    cook_time: 20,
    prep_time: 15,
    servings: 3,
    calories: 250,
    rating: 4.8,
    reviews: 620,
    image: "https://images.unsplash.com/photo-1626540306161-fbba8986c738?w=400",
    description: "A nutritious, multi-grain savory pancake spiked with onions, coriander, and spices.",
    ingredients: [
      { name: "Bhajani Flour (Mixed Grain Flour)", quantity: 2, unit: "cups" },
      { name: "Onion", quantity: 1, unit: "pc" },
      { name: "Green Chilies", quantity: 2, unit: "pcs" },
      { name: "Fresh Coriander", quantity: 0.25, unit: "cup" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Red Chili Powder", quantity: 0.5, unit: "tsp" },
      { name: "Sesame Seeds", quantity: 1, unit: "tbsp" },
      { name: "Oil", quantity: 3, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Onion", cut: "very finely chopped" },
      { ingredient: "Dough", cut: "mix flour, veggies, spices, and water to form a soft dough" }
    ],
    nutrition: { protein: 8, carbs: 38, fat: 8, fiber: 6, sugar: 2 },
    equipment: ["Tawa (Griddle)", "Parchment Paper or Wet Cloth"],
    steps: [
      { step: 1, instruction: "Take a portion of the dough and pat it evenly onto a wet cotton cloth or parchment paper to form a thin circle.", time: 5 },
      { step: 2, instruction: "Make 3-4 small holes in the center and sides of the thalipeeth.", time: 1 },
      { step: 3, instruction: "Invert the cloth directly over a hot, greased tawa to transfer the flatbread. Carefully peel off the cloth.", time: 2 },
      { step: 4, instruction: "Pour a few drops of oil into the holes and around the edges. Cover and cook until the base is crisp, then flip and cook the other side.", time: 12 }
    ],
    tips: [
      "The holes help the thalipeeth cook evenly and become crisp.",
      "Serve hot with white butter (loni) or fresh yogurt."
    ],
    tags: ["healthy", "breakfast", "vegan", "flatbread", "multigrain"]
  },
  {
    id: "ukadiche_modak",
    name: "Ukadiche Modak",
    cuisine: "Maharashtrian",
    diet: "Vegetarian",
    difficulty: "Hard",
    cook_time: 15,
    prep_time: 40,
    servings: 4,
    calories: 180,
    rating: 4.9,
    reviews: 1300,
    image: "https://images.unsplash.com/photo-1630137330545-802521c78ca9?w=400",
    description: "Steamed rice flour dumplings stuffed with a divine mixture of fresh coconut and jaggery, dedicated to Lord Ganesha.",
    ingredients: [
      { name: "Rice Flour (Fine)", quantity: 1, unit: "cup" },
      { name: "Water", quantity: 1, unit: "cup" },
      { name: "Ghee", quantity: 1, unit: "tsp" },
      { name: "Fresh Grated Coconut", quantity: 1.5, unit: "cups" },
      { name: "Jaggery", quantity: 1, unit: "cup" },
      { name: "Cardamom Powder", quantity: 0.5, unit: "tsp" },
      { name: "Nutmeg Powder", quantity: 0.25, unit: "tsp" },
      { name: "Salt", quantity: 0.25, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Stuffing", cut: "Cook coconut and jaggery in a pan until moisture evaporates. Add cardamom and nutmeg." },
      { ingredient: "Dough", cut: "Boil water, add ghee, salt, and rice flour. Mix, cover for 5 mins, then knead while warm." }
    ],
    nutrition: { protein: 3, carbs: 32, fat: 5, fiber: 2, sugar: 14 },
    equipment: ["Steamer", "Non-stick Pan"],
    steps: [
      { step: 1, instruction: "Grease your palms, take a small ball of dough and flatten it into a cup shape with thin edges.", time: 15 },
      { step: 2, instruction: "Place a spoonful of the coconut-jaggery stuffing in the center.", time: 5 },
      { step: 3, instruction: "Pinch the edges to form pleats, bring them together at the top, and seal tightly to form a peak.", time: 20 },
      { step: 4, instruction: "Place the modaks on a greased banana leaf or steamer rack and steam for 10-12 minutes.", time: 15 }
    ],
    tips: [
      "Kneading the rice flour dough while it is still warm is crucial to prevent the modaks from cracking.",
      "Serve warm, drizzled with pure ghee."
    ],
    tags: ["sweet", "festive", "ganpati", "vegetarian", "steamed"]
  },
  {
    id: "kothimbir_vadi",
    name: "Kothimbir Vadi",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Medium",
    cook_time: 30,
    prep_time: 15,
    servings: 4,
    calories: 210,
    rating: 4.6,
    reviews: 480,
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400",
    description: "Crispy, savory cilantro (coriander) fritters made with gram flour and spices, steamed and then fried.",
    ingredients: [
      { name: "Fresh Coriander Leaves", quantity: 2, unit: "cups" },
      { name: "Besan (Gram Flour)", quantity: 1, unit: "cup" },
      { name: "Rice Flour", quantity: 2, unit: "tbsp" },
      { name: "Green Chilies", quantity: 2, unit: "pcs" },
      { name: "Garlic", quantity: 4, unit: "cloves" },
      { name: "Sesame Seeds", quantity: 1, unit: "tbsp" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Red Chili Powder", quantity: 0.5, unit: "tsp" },
      { name: "Oil", quantity: 4, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Coriander", cut: "washed, dried thoroughly, and finely chopped" },
      { ingredient: "Chili and Garlic", cut: "crushed to a paste" }
    ],
    nutrition: { protein: 6, carbs: 22, fat: 12, fiber: 5, sugar: 1 },
    equipment: ["Steamer", "Frying Pan"],
    steps: [
      { step: 1, instruction: "In a bowl, mix chopped coriander, besan, rice flour, spices, sesame seeds, and chili-garlic paste.", time: 5 },
      { step: 2, instruction: "Add very little water to form a stiff dough. Shape it into cylindrical logs.", time: 5 },
      { step: 3, instruction: "Steam the logs for 15 minutes until a knife inserted comes out clean. Let them cool completely.", time: 15 },
      { step: 4, instruction: "Slice the logs into thick rounds and shallow fry or deep fry until crisp and golden brown.", time: 10 }
    ],
    tips: [
      "Ensure the coriander is completely dry before mixing, otherwise the dough will become too sticky.",
      "Rice flour adds extra crispiness to the vadis."
    ],
    tags: ["snack", "appetizer", "vegan", "coriander", "fried"]
  },
  {
    id: "shrikhand",
    name: "Shrikhand",
    cuisine: "Maharashtrian",
    diet: "Vegetarian",
    difficulty: "Easy",
    cook_time: 0,
    prep_time: 300,
    servings: 4,
    calories: 280,
    rating: 4.9,
    reviews: 1100,
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400",
    description: "A luscious, creamy dessert made of strained yogurt, flavored with saffron, cardamom, and nuts.",
    ingredients: [
      { name: "Plain Yogurt (Curd)", quantity: 4, unit: "cups" },
      { name: "Powdered Sugar", quantity: 0.75, unit: "cup" },
      { name: "Cardamom Powder", quantity: 0.5, unit: "tsp" },
      { name: "Saffron Strands", quantity: 10, unit: "strands" },
      { name: "Warm Milk", quantity: 1, unit: "tbsp" },
      { name: "Pistachios", quantity: 1, unit: "tbsp" },
      { name: "Almonds", quantity: 1, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Yogurt", cut: "tied in a muslin cloth and hung for 4-5 hours to drain all whey (making Chakka)" },
      { ingredient: "Saffron", cut: "soaked in warm milk" },
      { ingredient: "Nuts", cut: "blanched and slivered" }
    ],
    nutrition: { protein: 8, carbs: 35, fat: 12, fiber: 0, sugar: 32 },
    equipment: ["Muslin Cloth", "Mixing Bowl"],
    steps: [
      { step: 1, instruction: "Transfer the thick hung curd (Chakka) to a large mixing bowl.", time: 2 },
      { step: 2, instruction: "Add powdered sugar and whisk continuously until it becomes completely smooth and creamy.", time: 10 },
      { step: 3, instruction: "Stir in the saffron milk, cardamom powder, and half of the chopped nuts. Mix well.", time: 2 },
      { step: 4, instruction: "Transfer to serving bowls, garnish with remaining nuts, and chill in the refrigerator for 1 hour before serving.", time: 0 }
    ],
    tips: [
      "Use fresh, non-sour yogurt for the best taste.",
      "Traditionally served alongside hot, puffy puris during festivals."
    ],
    tags: ["dessert", "sweet", "vegetarian", "yogurt", "summer"]
  },
  {
    id: "aamti",
    name: "Maharashtrian Aamti",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 20,
    prep_time: 10,
    servings: 4,
    calories: 160,
    rating: 4.6,
    reviews: 420,
    image: "https://images.unsplash.com/photo-1548943487-a2e4e43b4859?w=400",
    description: "A staple Maharashtrian yellow lentil dal characterized by a beautiful balance of spicy, sweet, and tangy flavors.",
    ingredients: [
      { name: "Toor Dal (Pigeon Peas)", quantity: 1, unit: "cup" },
      { name: "Goda Masala", quantity: 1, unit: "tbsp" },
      { name: "Kokum or Tamarind Paste", quantity: 1, unit: "tbsp" },
      { name: "Jaggery", quantity: 1, unit: "tbsp" },
      { name: "Mustard Seeds", quantity: 0.5, unit: "tsp" },
      { name: "Cumin Seeds", quantity: 0.5, unit: "tsp" },
      { name: "Curry Leaves", quantity: 6, unit: "leaves" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Oil or Ghee", quantity: 1, unit: "tbsp" },
      { name: "Fresh Coriander", quantity: 2, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Toor Dal", cut: "pressure cooked with turmeric until very soft, then mashed" }
    ],
    nutrition: { protein: 8, carbs: 22, fat: 4, fiber: 6, sugar: 5 },
    equipment: ["Pan", "Whisk"],
    steps: [
      { step: 1, instruction: "Heat oil/ghee in a pan. Add mustard and cumin seeds. Let them crackle.", time: 3 },
      { step: 2, instruction: "Add curry leaves and a pinch of asafoetida (hing). Pour in the mashed dal and 1 cup of water.", time: 2 },
      { step: 3, instruction: "Add goda masala, jaggery, salt, and kokum extract. Stir well.", time: 2 },
      { step: 4, instruction: "Bring to a boil and let it simmer for 5-7 minutes. Garnish with fresh coriander.", time: 10 }
    ],
    tips: [
      "Aamti should have a distinct sweet and sour taste; adjust jaggery and kokum to your liking.",
      "Always serve piping hot over steamed white rice with a dollop of ghee."
    ],
    tags: ["curry", "dal", "vegan", "everyday", "staple"]
  },
  {
    id: "kolhapuri_chicken",
    name: "Chicken Kolhapuri",
    cuisine: "Maharashtrian",
    diet: "Non-Vegetarian",
    difficulty: "Hard",
    cook_time: 40,
    prep_time: 20,
    servings: 4,
    calories: 450,
    rating: 4.8,
    reviews: 1450,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400",
    description: "An incredibly spicy and flavorful chicken curry from the Kolhapur region, known for its fiery red gravy.",
    ingredients: [
      { name: "Chicken (bone-in)", quantity: 500, unit: "g" },
      { name: "Onion", quantity: 2, unit: "pcs" },
      { name: "Dry Red Chilies (Byadagi & Guntur)", quantity: 6, unit: "pcs" },
      { name: "Dry Coconut (Kopra)", quantity: 0.25, unit: "cup" },
      { name: "Poppy Seeds (Khus Khus)", quantity: 1, unit: "tbsp" },
      { name: "Sesame Seeds", quantity: 1, unit: "tbsp" },
      { name: "Ginger-Garlic Paste", quantity: 1, unit: "tbsp" },
      { name: "Whole Spices (Cloves, Cinnamon, Pepper)", quantity: 1, unit: "tbsp" },
      { name: "Oil", quantity: 4, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Chicken", cut: "washed, cut into pieces, and marinated with turmeric, salt, and ginger-garlic paste" },
      { ingredient: "Masala Paste", cut: "Dry roast coconut, whole spices, chilies, poppy and sesame seeds; grind to a fine paste." }
    ],
    nutrition: { protein: 35, carbs: 12, fat: 28, fiber: 3, sugar: 2 },
    equipment: ["Heavy Bottom Kadhai", "Mixer Grinder"],
    steps: [
      { step: 1, instruction: "Heat oil in a heavy bottom pan. Add finely chopped onions and sauté until dark brown.", time: 10 },
      { step: 2, instruction: "Add the freshly ground Kolhapuri masala paste and fry until the oil separates completely.", time: 10 },
      { step: 3, instruction: "Add the marinated chicken pieces and sauté for 5 minutes to sear the meat.", time: 5 },
      { step: 4, instruction: "Add warm water to reach desired consistency. Cover and simmer until chicken is tender.", time: 15 }
    ],
    tips: [
      "Use Byadagi chilies for the bright red color and Guntur chilies for the heat.",
      "Serve with Bhakri or soft Chapati to balance the intense spices."
    ],
    tags: ["spicy", "chicken", "non-vegetarian", "dinner", "kolhapur"]
  },
  {
    id: "sol_kadhi",
    name: "Sol Kadhi",
    cuisine: "Maharashtrian",
    diet: "Vegetarian",
    difficulty: "Easy",
    cook_time: 0,
    prep_time: 15,
    servings: 4,
    calories: 120,
    rating: 4.8,
    reviews: 670,
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400",
    description: "A refreshing, vibrant pink drink from the Konkan region made of coconut milk and kokum. Great for digestion.",
    ingredients: [
      { name: "Thick Coconut Milk", quantity: 2, unit: "cups" },
      { name: "Kokum Petals", quantity: 8, unit: "pcs" },
      { name: "Warm Water", quantity: 0.5, unit: "cup" },
      { name: "Garlic", quantity: 2, unit: "cloves" },
      { name: "Green Chili", quantity: 1, unit: "pc" },
      { name: "Salt", quantity: 0.5, unit: "tsp" },
      { name: "Fresh Coriander", quantity: 1, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Kokum", cut: "soaked in warm water for 30 minutes to extract the deep pink juice" },
      { ingredient: "Garlic and Chili", cut: "pounded into a fine paste" }
    ],
    nutrition: { protein: 2, carbs: 6, fat: 10, fiber: 1, sugar: 2 },
    equipment: ["Mixing Bowl", "Strainer"],
    steps: [
      { step: 1, instruction: "Squeeze the soaked kokum petals into the water to get a concentrated extract. Discard petals.", time: 3 },
      { step: 2, instruction: "In a bowl, mix the kokum extract with the fresh thick coconut milk.", time: 2 },
      { step: 3, instruction: "Add the pounded garlic-chili paste and salt. Mix well.", time: 2 },
      { step: 4, instruction: "Garnish with finely chopped coriander. Chill in the refrigerator before serving.", time: 0 }
    ],
    tips: [
      "Do not boil Sol Kadhi, as the coconut milk will curdle.",
      "Use fresh homemade coconut milk for the most authentic and sweet flavor."
    ],
    tags: ["beverage", "cooling", "digestive", "konkani", "vegan"]
  },
  {
    id: "masale_bhaat",
    name: "Masale Bhaat",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 25,
    prep_time: 15,
    servings: 4,
    calories: 310,
    rating: 4.7,
    reviews: 580,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
    description: "A traditional Maharashtrian spiced rice preparation, typically cooked with ivy gourd (tendli) or mixed vegetables and goda masala.",
    ingredients: [
      { name: "Basmati or Indrayani Rice", quantity: 1, unit: "cup" },
      { name: "Ivy Gourd (Tendli)", quantity: 10, unit: "pcs" },
      { name: "Green Peas", quantity: 0.25, unit: "cup" },
      { name: "Goda Masala", quantity: 1.5, unit: "tbsp" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Mustard Seeds", quantity: 1, unit: "tsp" },
      { name: "Cashews", quantity: 2, unit: "tbsp" },
      { name: "Oil", quantity: 2, unit: "tbsp" },
      { name: "Fresh Coriander & Coconut", quantity: 2, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Rice", cut: "washed and soaked for 20 minutes" },
      { ingredient: "Ivy Gourd", cut: "cut vertically into 4 pieces" }
    ],
    nutrition: { protein: 5, carbs: 55, fat: 9, fiber: 4, sugar: 3 },
    equipment: ["Heavy Bottom Pan or Cooker"],
    steps: [
      { step: 1, instruction: "Heat oil. Add mustard seeds. When they pop, add cashews and sauté until golden.", time: 3 },
      { step: 2, instruction: "Add ivy gourd and green peas. Sauté for 2 minutes. Stir in turmeric and goda masala.", time: 3 },
      { step: 3, instruction: "Drain the soaked rice and add it to the pan. Sauté gently for 1 minute.", time: 2 },
      { step: 4, instruction: "Add 2 cups hot water and salt. Cover and cook on low heat until rice is tender and water is absorbed. Garnish with coconut and coriander.", time: 15 }
    ],
    tips: [
      "Using short-grain, fragrant Indrayani rice gives a truly authentic sticky texture.",
      "Pair with plain yogurt or Sol Kadhi."
    ],
    tags: ["rice", "main course", "vegan", "spiced", "traditional"]
  },
  {
    id: "sabudana_vada",
    name: "Sabudana Vada",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Medium",
    cook_time: 20,
    prep_time: 240,
    servings: 4,
    calories: 380,
    rating: 4.8,
    reviews: 1150,
    image: "https://images.unsplash.com/photo-1626074964005-24ce8fb12891?w=400",
    description: "Crispy deep-fried sago and potato patties, a favorite snack especially during fasting days.",
    ingredients: [
      { name: "Sabudana (Tapioca Pearls)", quantity: 1, unit: "cup" },
      { name: "Potatoes", quantity: 2, unit: "pcs" },
      { name: "Roasted Peanut Powder", quantity: 0.5, unit: "cup" },
      { name: "Green Chilies", quantity: 2, unit: "pcs" },
      { name: "Cumin Seeds", quantity: 1, unit: "tsp" },
      { name: "Fresh Coriander", quantity: 2, unit: "tbsp" },
      { name: "Sendha Namak (Rock Salt)", quantity: 1, unit: "tsp" },
      { name: "Oil", quantity: 500, unit: "ml" }
    ],
    preparation: [
      { ingredient: "Sabudana", cut: "washed and soaked for 4-5 hours until soft" },
      { ingredient: "Potatoes", cut: "boiled and mashed smoothly" },
      { ingredient: "Chilies", cut: "finely chopped" }
    ],
    nutrition: { protein: 5, carbs: 58, fat: 14, fiber: 3, sugar: 1 },
    equipment: ["Deep Frying Pan", "Mixing Bowl"],
    steps: [
      { step: 1, instruction: "Drain the soaked sabudana completely. There should be no excess moisture.", time: 5 },
      { step: 2, instruction: "In a bowl, mix sabudana, mashed potatoes, peanut powder, chilies, cumin, salt, and coriander to form a dough.", time: 5 },
      { step: 3, instruction: "Grease your palms and make small, flat, round patties (vadas) from the dough.", time: 10 },
      { step: 4, instruction: "Heat oil on medium-high. Deep fry the vadas until golden brown and crispy on both sides.", time: 15 }
    ],
    tips: [
      "If the vadas burst in oil, there is too much moisture in the sabudana. Add a little rice flour or chestnut flour to bind.",
      "Serve with sweetened curd or green chutney."
    ],
    tags: ["snack", "fried", "fasting", "vrat", "vegan"]
  },
  {
    id: "zunka",
    name: "Zunka",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 15,
    prep_time: 10,
    servings: 4,
    calories: 240,
    rating: 4.7,
    reviews: 490,
    image: "https://images.unsplash.com/photo-1628294895950-98052520c180?w=400",
    description: "A dry, spiced besan (gram flour) stir-fry usually packed for travel or eaten as a quick meal with Bhakri.",
    ingredients: [
      { name: "Besan (Gram Flour)", quantity: 1, unit: "cup" },
      { name: "Onion", quantity: 2, unit: "pcs" },
      { name: "Garlic", quantity: 5, unit: "cloves" },
      { name: "Green Chilies", quantity: 2, unit: "pcs" },
      { name: "Mustard Seeds", quantity: 1, unit: "tsp" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Red Chili Powder", quantity: 1, unit: "tsp" },
      { name: "Oil", quantity: 3, unit: "tbsp" },
      { name: "Fresh Coriander", quantity: 2, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Onion", cut: "finely chopped" },
      { ingredient: "Garlic & Chilies", cut: "crushed together" }
    ],
    nutrition: { protein: 10, carbs: 28, fat: 11, fiber: 5, sugar: 3 },
    equipment: ["Kadhai or Skillet"],
    steps: [
      { step: 1, instruction: "Heat oil. Add mustard seeds, followed by the crushed garlic and green chilies.", time: 3 },
      { step: 2, instruction: "Add onions and sauté until translucent. Stir in turmeric and red chili powder.", time: 5 },
      { step: 3, instruction: "Sprinkle the dry besan evenly over the onion mixture. Mix well to coat the flour in the oil.", time: 2 },
      { step: 4, instruction: "Sprinkle a few tablespoons of water, cover, and cook on low heat for 5-7 minutes until besan is cooked and crumbly.", time: 7 }
    ],
    tips: [
      "Unlike Pithla, Zunka requires more oil and very little water. It should resemble coarse breadcrumbs.",
      "Thecha (green chili crush) and Zunka with Bhakri is a classic pairing."
    ],
    tags: ["dry curry", "quick", "vegan", "travel food", "rustic"]
  },
  {
    id: "mutton_sukka",
    name: "Maharashtrian Mutton Sukka",
    cuisine: "Maharashtrian",
    diet: "Non-Vegetarian",
    difficulty: "Medium",
    cook_time: 50,
    prep_time: 20,
    servings: 4,
    calories: 480,
    rating: 4.8,
    reviews: 820,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400",
    description: "A dry, deeply spiced and roasted mutton preparation bursting with the flavors of roasted coconut and garlic.",
    ingredients: [
      { name: "Mutton (bone-in)", quantity: 500, unit: "g" },
      { name: "Onion", quantity: 3, unit: "pcs" },
      { name: "Dry Coconut", quantity: 0.5, unit: "cup" },
      { name: "Ginger-Garlic Paste", quantity: 2, unit: "tbsp" },
      { name: "Garam Masala or Sunday Masala", quantity: 1.5, unit: "tbsp" },
      { name: "Turmeric", quantity: 1, unit: "tsp" },
      { name: "Red Chili Powder", quantity: 2, unit: "tsp" },
      { name: "Oil", quantity: 4, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" }
    ],
    preparation: [
      { ingredient: "Mutton", cut: "marinated with turmeric, ginger-garlic paste, and salt, then pressure-cooked until tender" },
      { ingredient: "Coconut & Onion Paste", cut: "Roast sliced onions and dry coconut until dark brown. Grind to a paste." }
    ],
    nutrition: { protein: 32, carbs: 12, fat: 34, fiber: 4, sugar: 3 },
    equipment: ["Pressure Cooker", "Heavy Bottom Kadhai"],
    steps: [
      { step: 1, instruction: "Heat oil in a heavy kadhai. Add finely chopped onion and sauté until golden.", time: 5 },
      { step: 2, instruction: "Add the roasted onion-coconut paste and cook until the oil starts leaving the sides.", time: 8 },
      { step: 3, instruction: "Add red chili powder and garam masala. Mix well and sauté for a minute.", time: 2 },
      { step: 4, instruction: "Add the boiled mutton pieces (without the broth). Roast the meat in the masala on medium-low heat until completely coated and dry.", time: 15 }
    ],
    tips: [
      "Save the mutton broth (Alni Paani) to serve as a mild soup or use it to make a separate gravy (Rassa).",
      "Roasting the coconut until almost black (but not burnt) gives the Sukka its signature dark color."
    ],
    tags: ["meat", "spicy", "dry roast", "dinner", "non-vegetarian"]
  },
  {
    id: "matki_usal",
    name: "Matki Usal",
    cuisine: "Maharashtrian",
    diet: "Vegan",
    difficulty: "Easy",
    cook_time: 20,
    prep_time: 15,
    servings: 4,
    calories: 210,
    rating: 4.6,
    reviews: 540,
    image: "https://images.unsplash.com/photo-1548943487-a2e4e43b4859?w=400",
    description: "A semi-dry curry made with sprouted moth beans, flavored with traditional goda masala, often served in lunch boxes.",
    ingredients: [
      { name: "Sprouted Matki (Moth Beans)", quantity: 2, unit: "cups" },
      { name: "Onion", quantity: 1, unit: "pc" },
      { name: "Tomato", quantity: 1, unit: "pc" },
      { name: "Goda Masala", quantity: 1, unit: "tbsp" },
      { name: "Turmeric", quantity: 0.5, unit: "tsp" },
      { name: "Mustard Seeds", quantity: 1, unit: "tsp" },
      { name: "Curry Leaves", quantity: 8, unit: "leaves" },
      { name: "Jaggery", quantity: 1, unit: "tsp" },
      { name: "Oil", quantity: 2, unit: "tbsp" },
      { name: "Fresh Grated Coconut", quantity: 2, unit: "tbsp" }
    ],
    preparation: [
      { ingredient: "Matki", cut: "washed and drained" },
      { ingredient: "Onion and Tomato", cut: "finely chopped" }
    ],
    nutrition: { protein: 12, carbs: 32, fat: 5, fiber: 8, sugar: 4 },
    equipment: ["Pan with Lid"],
    steps: [
      { step: 1, instruction: "Heat oil, crackle mustard seeds, and add curry leaves.", time: 2 },
      { step: 2, instruction: "Sauté onions until pink, then add tomatoes and cook until soft.", time: 5 },
      { step: 3, instruction: "Add turmeric, goda masala, and the sprouted matki. Sauté for a minute.", time: 3 },
      { step: 4, instruction: "Add 1/2 cup water, salt, and jaggery. Cover and cook until matki is tender but not mushy. Garnish with coconut.", time: 10 }
    ],
    tips: [
      "Do not overcook the sprouts; they should retain a slight bite.",
      "A squeeze of lemon juice at the end brightens up the flavors."
    ],
    tags: ["healthy", "sprouts", "vegan", "lunchbox", "curry"]
  }
];

export default recipes;