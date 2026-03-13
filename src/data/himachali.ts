import { Recipe } from '../types';

const recipes: Recipe[] = [
  {
    "id": "dham",
    "name": "Dham",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Hard",
    "cook_time": 120,
    "prep_time": 30,
    "servings": 6,
    "calories": 480,
    "rating": 4.9,
    "reviews": 850,
    "image": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    "description": "A traditional festive meal of Himachal Pradesh cooked by Botis (traditional cooks), featuring rice, dal, rajma, and sweet boondi served on a leaf plate.",
    "ingredients": [
      { "name": "Basmati Rice", "quantity": 500, "unit": "g" },
      { "name": "Chana Dal", "quantity": 200, "unit": "g" },
      { "name": "Rajma", "quantity": 200, "unit": "g" },
      { "name": "Curd", "quantity": 300, "unit": "ml" },
      { "name": "Boondi", "quantity": 100, "unit": "g" },
      { "name": "Ghee", "quantity": 4, "unit": "tbsp" },
      { "name": "Cumin Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Ginger", "quantity": 2, "unit": "inch" },
      { "name": "Dried Red Chili", "quantity": 4, "unit": "pcs" },
      { "name": "Salt", "quantity": 2, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Rajma", "cut": "soaked overnight" },
      { "ingredient": "Chana Dal", "cut": "soaked for 2 hours" },
      { "ingredient": "Ginger", "cut": "finely grated" }
    ],
    "nutrition": { "protein": 18, "carbs": 72, "fat": 14, "fiber": 12, "sugar": 5 },
    "equipment": ["Large Pot", "Pressure Cooker", "Ladle", "Leaf Plates"],
    "steps": [
      { "step": 1, "instruction": "Soak rajma overnight and pressure cook with salt until soft.", "time": 30 },
      { "step": 2, "instruction": "Cook chana dal separately with turmeric until tender.", "time": 20 },
      { "step": 3, "instruction": "Cook basmati rice with ghee and cumin seeds until fluffy.", "time": 20 },
      { "step": 4, "instruction": "Prepare madra by cooking curd-based gravy with chickpeas and spices on low flame.", "time": 30 },
      { "step": 5, "instruction": "Heat ghee, add dried red chilies and pour tempering over dal.", "time": 5 },
      { "step": 6, "instruction": "Soak boondi in sweetened water for 10 minutes.", "time": 10 },
      { "step": 7, "instruction": "Serve rice, dal, rajma, madra, and sweet boondi together on a leaf plate.", "time": 5 }
    ],
    "tips": [
      "Authentic Dham is cooked in copper vessels over wood fire.",
      "Never stir Dham preparations too vigorously — slow cooking is the secret.",
      "Serve in the traditional sequence: rice, dal, rajma, madra, then boondi."
    ],
    "tags": ["festive", "traditional", "himachali", "vegetarian", "celebratory"]
  },
  {
    "id": "madra",
    "name": "Chana Madra",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 45,
    "prep_time": 20,
    "servings": 4,
    "calories": 310,
    "rating": 4.7,
    "reviews": 620,
    "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    "description": "A signature Himachali dish where chickpeas are cooked in a yogurt-based gravy with aromatic whole spices, creating a tangy, creamy curry unique to Chamba and Kangra valleys.",
    "ingredients": [
      { "name": "Kabuli Chana", "quantity": 250, "unit": "g" },
      { "name": "Whisked Curd", "quantity": 400, "unit": "ml" },
      { "name": "Ghee", "quantity": 3, "unit": "tbsp" },
      { "name": "Bay Leaves", "quantity": 2, "unit": "pcs" },
      { "name": "Cloves", "quantity": 4, "unit": "pcs" },
      { "name": "Cardamom", "quantity": 3, "unit": "pcs" },
      { "name": "Cinnamon", "quantity": 1, "unit": "inch" },
      { "name": "Turmeric Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Coriander Powder", "quantity": 2, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Kabuli Chana", "cut": "soaked overnight and boiled" },
      { "ingredient": "Curd", "cut": "whisked smooth" }
    ],
    "nutrition": { "protein": 15, "carbs": 32, "fat": 12, "fiber": 8, "sugar": 4 },
    "equipment": ["Heavy Bottom Pan", "Whisk", "Pressure Cooker"],
    "steps": [
      { "step": 1, "instruction": "Pressure cook soaked chana with salt until completely tender.", "time": 20 },
      { "step": 2, "instruction": "Heat ghee in a heavy pan, add bay leaves, cloves, cardamom, and cinnamon.", "time": 2 },
      { "step": 3, "instruction": "Add turmeric and coriander powder, sauté for 30 seconds.", "time": 1 },
      { "step": 4, "instruction": "Add whisked curd slowly while continuously stirring on low flame to prevent curdling.", "time": 8 },
      { "step": 5, "instruction": "Add boiled chana and mix well into the curd gravy.", "time": 3 },
      { "step": 6, "instruction": "Simmer on low heat for 15 minutes, stirring occasionally, until gravy thickens.", "time": 15 },
      { "step": 7, "instruction": "Adjust salt and serve hot with steamed rice.", "time": 2 }
    ],
    "tips": [
      "Always stir curd continuously when adding to avoid it curdling.",
      "Low and slow cooking is key — never rush the madra.",
      "Adding a pinch of besan to the curd helps stabilize it."
    ],
    "tags": ["himachali", "vegetarian", "yogurt-based", "traditional", "chamba"]
  },
  {
    "id": "siddu",
    "name": "Siddu",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Hard",
    "cook_time": 60,
    "prep_time": 40,
    "servings": 4,
    "calories": 390,
    "rating": 4.8,
    "reviews": 540,
    "image": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
    "description": "Soft steamed wheat flour buns stuffed with a spiced poppy seed and walnut filling, a staple winter comfort food from the Kullu and Mandi valleys of Himachal Pradesh.",
    "ingredients": [
      { "name": "Wheat Flour", "quantity": 400, "unit": "g" },
      { "name": "Yeast", "quantity": 7, "unit": "g" },
      { "name": "Poppy Seeds", "quantity": 50, "unit": "g" },
      { "name": "Walnuts", "quantity": 50, "unit": "g" },
      { "name": "Jaggery", "quantity": 30, "unit": "g" },
      { "name": "Ghee", "quantity": 3, "unit": "tbsp" },
      { "name": "Green Chilies", "quantity": 2, "unit": "pcs" },
      { "name": "Ginger", "quantity": 1, "unit": "inch" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Warm Water", "quantity": 200, "unit": "ml" }
    ],
    "preparation": [
      { "ingredient": "Wheat Flour", "cut": "sifted" },
      { "ingredient": "Walnuts", "cut": "coarsely crushed" },
      { "ingredient": "Green Chilies", "cut": "finely chopped" },
      { "ingredient": "Ginger", "cut": "grated" }
    ],
    "nutrition": { "protein": 12, "carbs": 58, "fat": 16, "fiber": 6, "sugar": 8 },
    "equipment": ["Steamer", "Mixing Bowl", "Rolling Pin", "Grinder"],
    "steps": [
      { "step": 1, "instruction": "Activate yeast in warm water with a pinch of sugar for 10 minutes.", "time": 10 },
      { "step": 2, "instruction": "Mix wheat flour with salt and activated yeast to form a soft dough. Rest for 30 minutes.", "time": 35 },
      { "step": 3, "instruction": "Dry roast poppy seeds and grind coarsely. Mix with crushed walnuts, jaggery, green chili, and ginger.", "time": 10 },
      { "step": 4, "instruction": "Divide dough into equal balls. Flatten each and place a spoonful of filling in the center.", "time": 10 },
      { "step": 5, "instruction": "Seal the edges tightly and shape into round buns.", "time": 5 },
      { "step": 6, "instruction": "Steam the siddus for 20–25 minutes until cooked through.", "time": 25 },
      { "step": 7, "instruction": "Brush with ghee and serve hot with green chutney or more ghee.", "time": 3 }
    ],
    "tips": [
      "Let the dough rise fully for the fluffiest texture.",
      "Traditionally served with a generous drizzle of pure ghee.",
      "Sesame seeds can be added to the filling for extra crunch."
    ],
    "tags": ["himachali", "steamed", "winter", "kullu", "mandi", "stuffed-bread"]
  },
  {
    "id": "babru",
    "name": "Babru",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 30,
    "prep_time": 25,
    "servings": 4,
    "calories": 340,
    "rating": 4.6,
    "reviews": 430,
    "image": "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400",
    "description": "Crispy deep-fried black gram stuffed flatbreads from the Mandi region, traditionally served at temple fairs and festive occasions with tamarind chutney.",
    "ingredients": [
      { "name": "Wheat Flour", "quantity": 300, "unit": "g" },
      { "name": "Urad Dal (Black Gram)", "quantity": 150, "unit": "g" },
      { "name": "Cumin Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Green Chilies", "quantity": 3, "unit": "pcs" },
      { "name": "Ginger", "quantity": 1, "unit": "inch" },
      { "name": "Asafoetida", "quantity": 0.25, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Oil", "quantity": 500, "unit": "ml" },
      { "name": "Coriander Leaves", "quantity": 20, "unit": "g" }
    ],
    "preparation": [
      { "ingredient": "Urad Dal", "cut": "soaked for 4 hours and coarsely ground" },
      { "ingredient": "Green Chilies", "cut": "finely chopped" },
      { "ingredient": "Ginger", "cut": "grated" }
    ],
    "nutrition": { "protein": 11, "carbs": 45, "fat": 15, "fiber": 5, "sugar": 1 },
    "equipment": ["Deep Frying Pan", "Rolling Pin", "Mixing Bowl"],
    "steps": [
      { "step": 1, "instruction": "Soak urad dal for 4 hours and grind to a coarse paste without water.", "time": 5 },
      { "step": 2, "instruction": "Mix dal paste with cumin, green chilies, ginger, asafoetida, salt, and coriander.", "time": 5 },
      { "step": 3, "instruction": "Knead wheat flour with salt and water into a firm dough.", "time": 10 },
      { "step": 4, "instruction": "Roll out small discs, place filling in center, seal and re-roll gently.", "time": 10 },
      { "step": 5, "instruction": "Heat oil in deep pan. Deep fry babrus on medium heat until golden and crisp.", "time": 15 },
      { "step": 6, "instruction": "Drain on paper towels and serve hot with tamarind chutney.", "time": 3 }
    ],
    "tips": [
      "Do not add water while grinding dal — a dry coarse paste gives the best filling.",
      "Fry on medium heat to ensure the inside cooks through.",
      "Traditionally paired with imli (tamarind) chutney."
    ],
    "tags": ["himachali", "fried", "mandi", "festive", "street-food", "dal-stuffed"]
  },
  {
    "id": "himachali_rajma",
    "name": "Himachali Rajma Madra",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 50,
    "prep_time": 15,
    "servings": 4,
    "calories": 295,
    "rating": 4.7,
    "reviews": 710,
    "image": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400",
    "description": "Red kidney beans slow-cooked in a velvety yogurt-based gravy with whole spices — the Himachali version distinctly different from the Punjabi counterpart with its subtle tang and aroma.",
    "ingredients": [
      { "name": "Rajma (Red Kidney Beans)", "quantity": 250, "unit": "g" },
      { "name": "Whisked Curd", "quantity": 350, "unit": "ml" },
      { "name": "Ghee", "quantity": 3, "unit": "tbsp" },
      { "name": "Onion", "quantity": 1, "unit": "pcs" },
      { "name": "Cardamom", "quantity": 3, "unit": "pcs" },
      { "name": "Cloves", "quantity": 4, "unit": "pcs" },
      { "name": "Fennel Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Dry Ginger Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Rajma", "cut": "soaked overnight and pressure cooked" },
      { "ingredient": "Onion", "cut": "finely sliced" },
      { "ingredient": "Curd", "cut": "whisked smooth" }
    ],
    "nutrition": { "protein": 16, "carbs": 38, "fat": 11, "fiber": 10, "sugar": 3 },
    "equipment": ["Pressure Cooker", "Heavy Pan", "Whisk"],
    "steps": [
      { "step": 1, "instruction": "Soak rajma overnight. Pressure cook with salt and turmeric until tender.", "time": 25 },
      { "step": 2, "instruction": "Heat ghee, add cardamom, cloves, and fennel seeds and let them splutter.", "time": 2 },
      { "step": 3, "instruction": "Add sliced onion and fry until golden brown.", "time": 8 },
      { "step": 4, "instruction": "Reduce flame to lowest and add whisked curd while stirring continuously.", "time": 5 },
      { "step": 5, "instruction": "Add dry ginger powder and salt. Keep stirring to prevent curdling.", "time": 3 },
      { "step": 6, "instruction": "Add cooked rajma and simmer on low heat for 15 minutes.", "time": 15 },
      { "step": 7, "instruction": "Serve hot with steamed rice or mandua roti.", "time": 2 }
    ],
    "tips": [
      "Himachali rajma is smaller and darker than regular kidney beans — use if available.",
      "Fennel seeds are the secret spice that sets this apart from Punjabi rajma.",
      "Never cook curd-based curries on high heat."
    ],
    "tags": ["himachali", "rajma", "yogurt-based", "traditional", "beans"]
  },
  {
    "id": "aktori",
    "name": "Aktori (Buckwheat Pancake)",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 20,
    "prep_time": 10,
    "servings": 4,
    "calories": 220,
    "rating": 4.5,
    "reviews": 310,
    "image": "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400",
    "description": "Rustic buckwheat flour pancakes prepared during festivals in the Kullu valley, offering a nutty, earthy flavor and traditionally eaten with ghee and honey or green chutney.",
    "ingredients": [
      { "name": "Buckwheat Flour (Kuttu)", "quantity": 250, "unit": "g" },
      { "name": "Water", "quantity": 250, "unit": "ml" },
      { "name": "Green Chilies", "quantity": 2, "unit": "pcs" },
      { "name": "Ginger", "quantity": 1, "unit": "inch" },
      { "name": "Cumin Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Ghee", "quantity": 2, "unit": "tbsp" },
      { "name": "Coriander Leaves", "quantity": 15, "unit": "g" }
    ],
    "preparation": [
      { "ingredient": "Green Chilies", "cut": "finely chopped" },
      { "ingredient": "Ginger", "cut": "grated" },
      { "ingredient": "Coriander Leaves", "cut": "finely chopped" }
    ],
    "nutrition": { "protein": 6, "carbs": 40, "fat": 7, "fiber": 4, "sugar": 1 },
    "equipment": ["Non-stick Pan", "Mixing Bowl", "Ladle"],
    "steps": [
      { "step": 1, "instruction": "Mix buckwheat flour with water, salt, and cumin seeds to form a smooth thin batter.", "time": 5 },
      { "step": 2, "instruction": "Add green chilies, ginger, and coriander leaves to the batter. Mix well.", "time": 2 },
      { "step": 3, "instruction": "Heat a pan over medium heat and grease lightly with ghee.", "time": 2 },
      { "step": 4, "instruction": "Pour a ladleful of batter and spread into a round pancake.", "time": 2 },
      { "step": 5, "instruction": "Cook for 3 minutes until edges lift, flip and cook the other side for 2 minutes.", "time": 5 },
      { "step": 6, "instruction": "Serve hot with generous ghee drizzle and honey or green chutney.", "time": 2 }
    ],
    "tips": [
      "Keep the batter slightly thin for lacy, crisp edges.",
      "Traditionally made during Navratri as a fasting food.",
      "Buckwheat gives a distinct nutty flavor — don't substitute with regular flour."
    ],
    "tags": ["himachali", "buckwheat", "pancake", "kullu", "fasting", "breakfast"]
  },
  {
    "id": "patande",
    "name": "Patande",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 25,
    "prep_time": 10,
    "servings": 4,
    "calories": 240,
    "rating": 4.6,
    "reviews": 290,
    "image": "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400",
    "description": "A traditional Himachali sweet pancake made with wheat flour, sugar, and cardamom, cooked in ghee — a popular breakfast dish in the Shimla and Sirmaur regions.",
    "ingredients": [
      { "name": "Wheat Flour", "quantity": 200, "unit": "g" },
      { "name": "Sugar", "quantity": 50, "unit": "g" },
      { "name": "Cardamom Powder", "quantity": 0.5, "unit": "tsp" },
      { "name": "Milk", "quantity": 200, "unit": "ml" },
      { "name": "Ghee", "quantity": 3, "unit": "tbsp" },
      { "name": "Baking Soda", "quantity": 0.25, "unit": "tsp" },
      { "name": "Salt", "quantity": 0.25, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Wheat Flour", "cut": "sifted" }
    ],
    "nutrition": { "protein": 5, "carbs": 44, "fat": 9, "fiber": 2, "sugar": 14 },
    "equipment": ["Non-stick Pan", "Mixing Bowl", "Ladle"],
    "steps": [
      { "step": 1, "instruction": "Mix wheat flour, sugar, cardamom powder, baking soda, and salt in a bowl.", "time": 3 },
      { "step": 2, "instruction": "Gradually add milk and whisk to form a smooth lump-free batter.", "time": 5 },
      { "step": 3, "instruction": "Heat a pan on medium-low heat and add half a teaspoon of ghee.", "time": 2 },
      { "step": 4, "instruction": "Pour batter to form a thick pancake and cover with a lid.", "time": 5 },
      { "step": 5, "instruction": "Cook until bubbles appear on top and base is golden, then flip.", "time": 4 },
      { "step": 6, "instruction": "Cook the other side for 3 minutes until golden. Repeat with remaining batter.", "time": 9 }
    ],
    "tips": [
      "Cook on low-medium heat for even cooking without burning.",
      "A drop of ghee on top while cooking adds beautiful flavor.",
      "Can be served with fresh butter or local honey."
    ],
    "tags": ["himachali", "sweet", "breakfast", "shimla", "pancake", "traditional"]
  },
  {
    "id": "tudkiya_bhath",
    "name": "Tudkiya Bhath",
    "cuisine": "Himachali",
    "diet": "Non-Vegetarian",
    "difficulty": "Medium",
    "cook_time": 50,
    "prep_time": 20,
    "servings": 4,
    "calories": 420,
    "rating": 4.7,
    "reviews": 480,
    "image": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400",
    "description": "An aromatic one-pot pulao from Himachal Pradesh cooked with lamb, lentils, potatoes, and whole spices — a hearty dish often prepared for wedding feasts and festivals.",
    "ingredients": [
      { "name": "Basmati Rice", "quantity": 300, "unit": "g" },
      { "name": "Lamb (Mutton)", "quantity": 300, "unit": "g" },
      { "name": "Chana Dal", "quantity": 100, "unit": "g" },
      { "name": "Potato", "quantity": 2, "unit": "pcs" },
      { "name": "Onion", "quantity": 2, "unit": "pcs" },
      { "name": "Tomato", "quantity": 2, "unit": "pcs" },
      { "name": "Ghee", "quantity": 4, "unit": "tbsp" },
      { "name": "Whole Garam Masala", "quantity": 1, "unit": "tbsp" },
      { "name": "Ginger Garlic Paste", "quantity": 2, "unit": "tbsp" },
      { "name": "Curd", "quantity": 100, "unit": "ml" },
      { "name": "Salt", "quantity": 2, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Basmati Rice", "cut": "soaked for 30 minutes" },
      { "ingredient": "Onion", "cut": "thinly sliced" },
      { "ingredient": "Potato", "cut": "quartered" },
      { "ingredient": "Tomato", "cut": "roughly chopped" }
    ],
    "nutrition": { "protein": 28, "carbs": 54, "fat": 16, "fiber": 6, "sugar": 3 },
    "equipment": ["Heavy Bottom Pot", "Pressure Cooker", "Ladle"],
    "steps": [
      { "step": 1, "instruction": "Heat ghee, add whole garam masala and sliced onions. Fry until dark golden.", "time": 10 },
      { "step": 2, "instruction": "Add ginger garlic paste and sauté for 2 minutes.", "time": 2 },
      { "step": 3, "instruction": "Add mutton pieces and brown well on all sides.", "time": 10 },
      { "step": 4, "instruction": "Add chopped tomatoes, curd, and salt. Cook until oil separates.", "time": 10 },
      { "step": 5, "instruction": "Add soaked chana dal, potatoes, and 2 cups water. Pressure cook for 2 whistles.", "time": 15 },
      { "step": 6, "instruction": "Add soaked rice and adjust water. Cook until rice is fully done.", "time": 15 },
      { "step": 7, "instruction": "Fluff gently and serve hot with raita.", "time": 3 }
    ],
    "tips": [
      "Use bone-in mutton for deeper flavor.",
      "The caramelized onions are essential — don't skip the deep browning step.",
      "Traditionally cooked in a sealed pot over slow wood fire."
    ],
    "tags": ["himachali", "non-vegetarian", "pulao", "mutton", "festive", "one-pot"]
  },
  {
    "id": "kullu_trout_fry",
    "name": "Kullu Trout Fry",
    "cuisine": "Himachali",
    "diet": "Non-Vegetarian",
    "difficulty": "Easy",
    "cook_time": 20,
    "prep_time": 15,
    "servings": 2,
    "calories": 290,
    "rating": 4.8,
    "reviews": 560,
    "image": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400",
    "description": "Freshly caught Beas River trout marinated in local spices and pan-fried to golden perfection — a prized delicacy of the Kullu valley, simple yet extraordinarily flavorful.",
    "ingredients": [
      { "name": "Fresh Trout", "quantity": 2, "unit": "pcs" },
      { "name": "Lemon Juice", "quantity": 2, "unit": "tbsp" },
      { "name": "Ginger Garlic Paste", "quantity": 1, "unit": "tbsp" },
      { "name": "Turmeric Powder", "quantity": 0.5, "unit": "tsp" },
      { "name": "Red Chili Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Ajwain (Carom Seeds)", "quantity": 0.5, "unit": "tsp" },
      { "name": "Mustard Oil", "quantity": 3, "unit": "tbsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Coriander Leaves", "quantity": 10, "unit": "g" }
    ],
    "preparation": [
      { "ingredient": "Fresh Trout", "cut": "cleaned, scored with diagonal cuts" },
      { "ingredient": "Coriander Leaves", "cut": "finely chopped for garnish" }
    ],
    "nutrition": { "protein": 34, "carbs": 3, "fat": 16, "fiber": 0, "sugar": 0 },
    "equipment": ["Cast Iron Pan", "Brush", "Knife"],
    "steps": [
      { "step": 1, "instruction": "Clean and score the trout with deep diagonal cuts on both sides.", "time": 5 },
      { "step": 2, "instruction": "Mix lemon juice, ginger garlic paste, turmeric, red chili, ajwain, and salt into a marinade.", "time": 3 },
      { "step": 3, "instruction": "Rub marinade deep into the cuts and all over the fish. Rest for 15 minutes.", "time": 15 },
      { "step": 4, "instruction": "Heat mustard oil in cast iron pan until it starts to smoke, then reduce to medium.", "time": 3 },
      { "step": 5, "instruction": "Place trout carefully and cook without touching for 7 minutes until crust forms.", "time": 7 },
      { "step": 6, "instruction": "Flip gently and cook the other side for 6 minutes until golden and cooked through.", "time": 6 },
      { "step": 7, "instruction": "Garnish with coriander and serve with lemon wedges and mint chutney.", "time": 2 }
    ],
    "tips": [
      "Use mustard oil for authentic Himachali flavor — it makes a big difference.",
      "Scoring the fish lets the marinade penetrate deeper.",
      "Do not move the fish while frying to get a proper crust."
    ],
    "tags": ["himachali", "non-vegetarian", "fish", "kullu", "river-trout", "pan-fried"]
  },
  {
    "id": "bhey",
    "name": "Bhey (Spiced Lotus Stems)",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 35,
    "prep_time": 15,
    "servings": 4,
    "calories": 185,
    "rating": 4.6,
    "reviews": 370,
    "image": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400",
    "description": "Thinly sliced lotus stems cooked with gram flour coating and bold spices — a beloved winter preparation across Himachal Pradesh with a satisfying crunch and earthy depth.",
    "ingredients": [
      { "name": "Lotus Stem (Kamal Kakdi)", "quantity": 400, "unit": "g" },
      { "name": "Gram Flour (Besan)", "quantity": 3, "unit": "tbsp" },
      { "name": "Mustard Oil", "quantity": 3, "unit": "tbsp" },
      { "name": "Onion", "quantity": 2, "unit": "pcs" },
      { "name": "Ginger Garlic Paste", "quantity": 1, "unit": "tbsp" },
      { "name": "Coriander Powder", "quantity": 2, "unit": "tsp" },
      { "name": "Amchur (Dry Mango Powder)", "quantity": 1, "unit": "tsp" },
      { "name": "Red Chili Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Lotus Stem", "cut": "peeled and thinly sliced into rounds" },
      { "ingredient": "Onion", "cut": "finely chopped" }
    ],
    "nutrition": { "protein": 5, "carbs": 28, "fat": 8, "fiber": 5, "sugar": 3 },
    "equipment": ["Heavy Pan", "Knife", "Peeler"],
    "steps": [
      { "step": 1, "instruction": "Peel and slice lotus stems. Boil in salted water for 10 minutes until slightly tender.", "time": 12 },
      { "step": 2, "instruction": "Drain and pat dry the lotus stem slices.", "time": 3 },
      { "step": 3, "instruction": "Heat mustard oil to smoking point, reduce heat and add chopped onions.", "time": 8 },
      { "step": 4, "instruction": "Add ginger garlic paste and sauté for 2 minutes.", "time": 2 },
      { "step": 5, "instruction": "Add all dry spices and gram flour. Stir fry for 1 minute.", "time": 1 },
      { "step": 6, "instruction": "Add boiled lotus stems and toss well to coat with masala.", "time": 3 },
      { "step": 7, "instruction": "Cook on medium heat for 10 minutes until stems are crispy and golden. Finish with amchur.", "time": 10 }
    ],
    "tips": [
      "Pre-boiling the lotus stems cuts down total frying time.",
      "Mustard oil is essential for the authentic Himachali taste.",
      "Amchur added at the end keeps the tartness fresh and bright."
    ],
    "tags": ["himachali", "lotus-stem", "vegetarian", "winter", "stir-fry", "traditional"]
  },{
    "id": "chha_gosht",
    "name": "Chha Gosht",
    "cuisine": "Himachali",
    "diet": "Non-Vegetarian",
    "difficulty": "Hard",
    "cook_time": 90,
    "prep_time": 30,
    "servings": 4,
    "calories": 510,
    "rating": 4.9,
    "reviews": 730,
    "image": "https://images.unsplash.com/photo-1545247181-516773cae754?w=400",
    "description": "A royal Himachali lamb curry where marinated meat is slow-cooked in a mustard-infused yogurt gravy with besan — a signature dish of the Kangra region served at grand feasts.",
    "ingredients": [
      { "name": "Lamb (Bone-in)", "quantity": 500, "unit": "g" },
      { "name": "Whisked Curd", "quantity": 400, "unit": "ml" },
      { "name": "Gram Flour (Besan)", "quantity": 2, "unit": "tbsp" },
      { "name": "Mustard Oil", "quantity": 4, "unit": "tbsp" },
      { "name": "Onion", "quantity": 2, "unit": "pcs" },
      { "name": "Ginger Garlic Paste", "quantity": 2, "unit": "tbsp" },
      { "name": "Cardamom", "quantity": 4, "unit": "pcs" },
      { "name": "Cloves", "quantity": 5, "unit": "pcs" },
      { "name": "Dry Ginger Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Fennel Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Red Chili Powder", "quantity": 1.5, "unit": "tsp" },
      { "name": "Salt", "quantity": 2, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Lamb", "cut": "cut into medium pieces, cleaned" },
      { "ingredient": "Onion", "cut": "finely sliced" },
      { "ingredient": "Curd", "cut": "whisked with besan until smooth" }
    ],
    "nutrition": { "protein": 36, "carbs": 12, "fat": 28, "fiber": 2, "sugar": 4 },
    "equipment": ["Heavy Bottom Pot", "Whisk", "Ladle"],
    "steps": [
      { "step": 1, "instruction": "Marinate lamb with curd-besan mixture, ginger garlic paste, and red chili for 30 minutes.", "time": 30 },
      { "step": 2, "instruction": "Heat mustard oil to smoking point in a heavy pot, reduce heat then add cardamom and cloves.", "time": 3 },
      { "step": 3, "instruction": "Add sliced onions and fry until deep golden brown.", "time": 12 },
      { "step": 4, "instruction": "Add marinated lamb and cook on high heat, stirring frequently, for 10 minutes.", "time": 10 },
      { "step": 5, "instruction": "Reduce to low heat, add dry ginger powder and fennel powder.", "time": 2 },
      { "step": 6, "instruction": "Cover and slow cook for 45 minutes, stirring every 10 minutes, until lamb is tender and gravy thick.", "time": 45 },
      { "step": 7, "instruction": "Adjust salt and serve hot with mandua roti or steamed rice.", "time": 3 }
    ],
    "tips": [
      "Besan mixed with curd prevents curdling and thickens the gravy beautifully.",
      "Smoking the mustard oil first removes its pungency.",
      "Authentic Chha Gosht is never watery — the gravy should coat the meat thickly."
    ],
    "tags": ["himachali", "non-vegetarian", "lamb", "kangra", "yogurt-based", "festive"]
  },
  {
    "id": "sepu_vadi",
    "name": "Sepu Vadi",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Hard",
    "cook_time": 55,
    "prep_time": 30,
    "servings": 4,
    "calories": 270,
    "rating": 4.7,
    "reviews": 390,
    "image": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    "description": "Steamed urad dal dumplings cooked in a tangy spinach and yogurt gravy — a two-stage Himachali delicacy that is labor-intensive but deeply rewarding in flavor and nutrition.",
    "ingredients": [
      { "name": "Urad Dal", "quantity": 200, "unit": "g" },
      { "name": "Spinach", "quantity": 300, "unit": "g" },
      { "name": "Whisked Curd", "quantity": 300, "unit": "ml" },
      { "name": "Ghee", "quantity": 3, "unit": "tbsp" },
      { "name": "Asafoetida", "quantity": 0.25, "unit": "tsp" },
      { "name": "Cumin Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Ginger", "quantity": 2, "unit": "inch" },
      { "name": "Green Chilies", "quantity": 3, "unit": "pcs" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Coriander Powder", "quantity": 2, "unit": "tsp" },
      { "name": "Salt", "quantity": 1.5, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Urad Dal", "cut": "soaked 4 hours and ground to fluffy batter" },
      { "ingredient": "Spinach", "cut": "blanched and roughly chopped" },
      { "ingredient": "Ginger", "cut": "grated" },
      { "ingredient": "Green Chilies", "cut": "finely chopped" }
    ],
    "nutrition": { "protein": 16, "carbs": 26, "fat": 10, "fiber": 7, "sugar": 3 },
    "equipment": ["Steamer", "Heavy Pan", "Grinder", "Whisk"],
    "steps": [
      { "step": 1, "instruction": "Beat soaked urad dal to a light fluffy batter with salt, asafoetida, and ginger.", "time": 10 },
      { "step": 2, "instruction": "Steam spoonfuls of batter in a greased steamer for 15 minutes to form vadis.", "time": 18 },
      { "step": 3, "instruction": "Let vadis cool, then lightly shallow fry in ghee until golden on all sides.", "time": 8 },
      { "step": 4, "instruction": "In same pan, add cumin seeds, then blanched spinach. Sauté for 3 minutes.", "time": 5 },
      { "step": 5, "instruction": "Add turmeric and coriander powder, then slowly stir in whisked curd on low flame.", "time": 5 },
      { "step": 6, "instruction": "Add fried vadis into the spinach-curd gravy and simmer for 12 minutes.", "time": 12 },
      { "step": 7, "instruction": "Finish with a ghee drizzle and serve hot with rice.", "time": 2 }
    ],
    "tips": [
      "Beat the urad dal batter well — the fluffier the batter, the softer the vadis.",
      "Lightly frying the steamed vadis before adding to gravy helps them hold their shape.",
      "Use young fresh spinach for the best color and taste."
    ],
    "tags": ["himachali", "vegetarian", "dumplings", "spinach", "yogurt-based", "traditional"]
  },
  {
    "id": "til_chutney",
    "name": "Himachali Til Chutney",
    "cuisine": "Himachali",
    "diet": "Vegan",
    "difficulty": "Easy",
    "cook_time": 10,
    "prep_time": 10,
    "servings": 6,
    "calories": 110,
    "rating": 4.6,
    "reviews": 280,
    "image": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400",
    "description": "A bold and nutty sesame seed chutney tempered with red chilies and garlic — a universal condiment across Himachal Pradesh served alongside every meal from breakfast to dinner.",
    "ingredients": [
      { "name": "White Sesame Seeds", "quantity": 100, "unit": "g" },
      { "name": "Dry Red Chilies", "quantity": 4, "unit": "pcs" },
      { "name": "Garlic", "quantity": 6, "unit": "cloves" },
      { "name": "Tamarind Pulp", "quantity": 1, "unit": "tbsp" },
      { "name": "Mustard Oil", "quantity": 1, "unit": "tbsp" },
      { "name": "Cumin Seeds", "quantity": 0.5, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Water", "quantity": 50, "unit": "ml" }
    ],
    "preparation": [
      { "ingredient": "Garlic", "cut": "peeled" },
      { "ingredient": "Dry Red Chilies", "cut": "stems removed" }
    ],
    "nutrition": { "protein": 4, "carbs": 6, "fat": 8, "fiber": 2, "sugar": 1 },
    "equipment": ["Dry Pan", "Grinder", "Small Tadka Pan"],
    "steps": [
      { "step": 1, "instruction": "Dry roast sesame seeds on medium heat until golden and fragrant. Cool completely.", "time": 5 },
      { "step": 2, "instruction": "Dry roast red chilies briefly until they puff up slightly.", "time": 2 },
      { "step": 3, "instruction": "Grind sesame seeds, red chilies, garlic, tamarind, and salt with minimal water to a coarse paste.", "time": 3 },
      { "step": 4, "instruction": "Heat mustard oil, add cumin seeds and let them splutter.", "time": 2 },
      { "step": 5, "instruction": "Pour hot tempering over the chutney and mix well.", "time": 1 },
      { "step": 6, "instruction": "Adjust consistency with water. Serve at room temperature.", "time": 2 }
    ],
    "tips": [
      "Do not over-roast sesame seeds or the chutney will turn bitter.",
      "Keep the chutney coarse for the best texture — don't over-blend.",
      "Stores well in the fridge for up to 5 days."
    ],
    "tags": ["himachali", "chutney", "vegan", "sesame", "condiment", "side-dish"]
  },
  {
    "id": "mash_dal_himachali",
    "name": "Himachali Mash Dal",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 40,
    "prep_time": 10,
    "servings": 4,
    "calories": 255,
    "rating": 4.7,
    "reviews": 490,
    "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    "description": "Whole black urad dal slow-cooked with ghee and subtle Himachali spices — a simpler, earthier cousin of dal makhani that is a daily staple in households across the state.",
    "ingredients": [
      { "name": "Whole Urad Dal (Black)", "quantity": 200, "unit": "g" },
      { "name": "Ghee", "quantity": 3, "unit": "tbsp" },
      { "name": "Onion", "quantity": 1, "unit": "pcs" },
      { "name": "Tomato", "quantity": 1, "unit": "pcs" },
      { "name": "Ginger", "quantity": 1, "unit": "inch" },
      { "name": "Dry Red Chilies", "quantity": 3, "unit": "pcs" },
      { "name": "Cumin Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Coriander Powder", "quantity": 1.5, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Coriander Leaves", "quantity": 15, "unit": "g" }
    ],
    "preparation": [
      { "ingredient": "Whole Urad Dal", "cut": "soaked overnight" },
      { "ingredient": "Onion", "cut": "finely chopped" },
      { "ingredient": "Ginger", "cut": "julienned" },
      { "ingredient": "Tomato", "cut": "finely chopped" }
    ],
    "nutrition": { "protein": 14, "carbs": 30, "fat": 10, "fiber": 9, "sugar": 2 },
    "equipment": ["Pressure Cooker", "Tadka Pan", "Ladle"],
    "steps": [
      { "step": 1, "instruction": "Pressure cook soaked urad dal with turmeric and salt for 6–7 whistles until very soft.", "time": 25 },
      { "step": 2, "instruction": "Mash about one-third of the dal to thicken the consistency naturally.", "time": 3 },
      { "step": 3, "instruction": "Heat ghee in a pan, add cumin seeds and dry red chilies. Let them crackle.", "time": 2 },
      { "step": 4, "instruction": "Add chopped onions and ginger, sauté until golden.", "time": 7 },
      { "step": 5, "instruction": "Add tomatoes and coriander powder. Cook until tomatoes are fully soft.", "time": 5 },
      { "step": 6, "instruction": "Pour tempering into the dal and simmer together for 10 minutes.", "time": 10 },
      { "step": 7, "instruction": "Garnish with fresh coriander and a dollop of ghee. Serve with chapati or rice.", "time": 2 }
    ],
    "tips": [
      "The longer the dal simmers after tempering, the better the flavor.",
      "A final knob of pure desi ghee on top is non-negotiable for authenticity.",
      "This dal is intentionally kept lighter than dal makhani — avoid adding cream."
    ],
    "tags": ["himachali", "dal", "vegetarian", "everyday", "urad", "comfort-food"]
  },
  {
    "id": "khatta",
    "name": "Khatta (Sweet & Sour Tamarind Curry)",
    "cuisine": "Himachali",
    "diet": "Vegan",
    "difficulty": "Easy",
    "cook_time": 20,
    "prep_time": 10,
    "servings": 4,
    "calories": 145,
    "rating": 4.5,
    "reviews": 340,
    "image": "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400",
    "description": "A light and tangy tamarind-based curry made with jaggery and bold spices — served as a digestive side dish in Himachali thalis and Dham feasts to balance rich, heavy preparations.",
    "ingredients": [
      { "name": "Tamarind", "quantity": 50, "unit": "g" },
      { "name": "Jaggery", "quantity": 40, "unit": "g" },
      { "name": "Mustard Oil", "quantity": 2, "unit": "tbsp" },
      { "name": "Cumin Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Dry Red Chilies", "quantity": 3, "unit": "pcs" },
      { "name": "Asafoetida", "quantity": 0.25, "unit": "tsp" },
      { "name": "Fennel Seeds", "quantity": 0.5, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Coriander Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Water", "quantity": 400, "unit": "ml" }
    ],
    "preparation": [
      { "ingredient": "Tamarind", "cut": "soaked in warm water and pulp extracted" }
    ],
    "nutrition": { "protein": 1, "carbs": 24, "fat": 6, "fiber": 2, "sugar": 16 },
    "equipment": ["Saucepan", "Strainer", "Ladle"],
    "steps": [
      { "step": 1, "instruction": "Soak tamarind in warm water for 15 minutes and extract thick pulp. Strain out seeds.", "time": 15 },
      { "step": 2, "instruction": "Heat mustard oil, add asafoetida, cumin, fennel seeds, and dry red chilies.", "time": 2 },
      { "step": 3, "instruction": "Add turmeric and coriander powder and sauté for 30 seconds.", "time": 1 },
      { "step": 4, "instruction": "Pour in tamarind pulp with 400ml water and bring to a boil.", "time": 5 },
      { "step": 5, "instruction": "Add jaggery and salt. Stir until jaggery dissolves completely.", "time": 3 },
      { "step": 6, "instruction": "Simmer for 10 minutes until khatta reaches a thin pouring consistency.", "time": 10 }
    ],
    "tips": [
      "Adjust jaggery and tamarind ratio to your sweet-sour preference.",
      "Khatta should be thin and pourable — it is a curry, not a chutney.",
      "Best served warm as the last course of a Himachali meal for digestion."
    ],
    "tags": ["himachali", "vegan", "tamarind", "sour", "digestive", "dham", "side-dish"]
  },
  {
    "id": "mandua_roti",
    "name": "Mandua Roti (Finger Millet Flatbread)",
    "cuisine": "Himachali",
    "diet": "Vegan",
    "difficulty": "Medium",
    "cook_time": 20,
    "prep_time": 15,
    "servings": 4,
    "calories": 195,
    "rating": 4.6,
    "reviews": 420,
    "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
    "description": "Dark, rustic flatbreads made from finger millet (ragi) flour grown in the high Himachali valleys — a nutritional powerhouse traditionally eaten through harsh winters with ghee and local vegetable curries.",
    "ingredients": [
      { "name": "Finger Millet Flour (Mandua)", "quantity": 300, "unit": "g" },
      { "name": "Wheat Flour", "quantity": 50, "unit": "g" },
      { "name": "Warm Water", "quantity": 200, "unit": "ml" },
      { "name": "Salt", "quantity": 0.5, "unit": "tsp" },
      { "name": "Ghee", "quantity": 2, "unit": "tbsp" },
      { "name": "Carom Seeds (Ajwain)", "quantity": 0.5, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Finger Millet Flour", "cut": "sifted" }
    ],
    "nutrition": { "protein": 7, "carbs": 38, "fat": 5, "fiber": 5, "sugar": 1 },
    "equipment": ["Tawa (Griddle)", "Rolling Pin", "Mixing Bowl"],
    "steps": [
      { "step": 1, "instruction": "Mix mandua flour, wheat flour, ajwain, and salt. Knead with warm water into a soft dough.", "time": 10 },
      { "step": 2, "instruction": "Rest the dough covered for 10 minutes.", "time": 10 },
      { "step": 3, "instruction": "Divide into equal balls. Roll on a floured surface to medium thickness — mandua cracks easily so roll gently.", "time": 8 },
      { "step": 4, "instruction": "Heat tawa over medium-high heat. Cook roti for 2 minutes until small bubbles appear.", "time": 2 },
      { "step": 5, "instruction": "Flip and cook the other side for 2 minutes, pressing gently with a cloth.", "time": 2 },
      { "step": 6, "instruction": "Apply generous ghee on top and serve immediately with madra or mash dal.", "time": 1 }
    ],
    "tips": [
      "Adding a small portion of wheat flour prevents the roti from cracking while rolling.",
      "Warm water is essential for a pliable dough — cold water makes it brittle.",
      "Cook on a slightly higher flame than regular rotis for the authentic charred flavor."
    ],
    "tags": ["himachali", "vegan", "millet", "flatbread", "winter", "nutritious", "staple"]
  },
  {
    "id": "palda",
    "name": "Aloo Palda",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 30,
    "prep_time": 10,
    "servings": 4,
    "calories": 210,
    "rating": 4.5,
    "reviews": 360,
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
    "description": "Baby potatoes simmered in a fragrant yogurt-based gravy with whole spices — a humble everyday Himachali dish that showcases the region's signature technique of yogurt cooking.",
    "ingredients": [
      { "name": "Baby Potatoes", "quantity": 400, "unit": "g" },
      { "name": "Whisked Curd", "quantity": 300, "unit": "ml" },
      { "name": "Ghee", "quantity": 2, "unit": "tbsp" },
      { "name": "Bay Leaf", "quantity": 2, "unit": "pcs" },
      { "name": "Cloves", "quantity": 3, "unit": "pcs" },
      { "name": "Black Cardamom", "quantity": 1, "unit": "pcs" },
      { "name": "Fennel Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Dry Ginger Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Baby Potatoes", "cut": "boiled and peeled, pricked with fork" },
      { "ingredient": "Curd", "cut": "whisked smooth with turmeric" }
    ],
    "nutrition": { "protein": 7, "carbs": 30, "fat": 8, "fiber": 3, "sugar": 5 },
    "equipment": ["Heavy Pan", "Whisk", "Fork"],
    "steps": [
      { "step": 1, "instruction": "Boil baby potatoes until just cooked. Peel and prick all over with a fork.", "time": 15 },
      { "step": 2, "instruction": "Heat ghee and add bay leaves, cloves, black cardamom, and fennel seeds.", "time": 2 },
      { "step": 3, "instruction": "Add boiled potatoes and lightly fry for 5 minutes until edges are golden.", "time": 5 },
      { "step": 4, "instruction": "Reduce flame to lowest. Add whisked curd slowly while stirring continuously.", "time": 5 },
      { "step": 5, "instruction": "Add dry ginger powder and salt. Keep stirring until the curd is fully incorporated.", "time": 3 },
      { "step": 6, "instruction": "Simmer uncovered on low heat for 12 minutes until gravy coats the potatoes.", "time": 12 }
    ],
    "tips": [
      "Pricking the potatoes lets the yogurt gravy seep into them for better flavor.",
      "Black cardamom is the flavor backbone of this dish — don't substitute with green.",
      "Pairs beautifully with mandua roti or plain paratha."
    ],
    "tags": ["himachali", "vegetarian", "potato", "yogurt-based", "everyday", "easy"]
  },
  {
    "id": "bhagjery",
    "name": "Bhagjery",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 15,
    "prep_time": 10,
    "servings": 4,
    "calories": 160,
    "rating": 4.4,
    "reviews": 240,
    "image": "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400",
    "description": "A simple, wholesome stir-fry of mixed seasonal mountain greens tempered with mustard seeds and garlic — a daily winter preparation in remote Himachali villages using locally foraged leafy vegetables.",
    "ingredients": [
      { "name": "Mixed Mountain Greens (Spinach, Bathua, Fenugreek)", "quantity": 500, "unit": "g" },
      { "name": "Mustard Oil", "quantity": 2, "unit": "tbsp" },
      { "name": "Garlic", "quantity": 5, "unit": "cloves" },
      { "name": "Dry Red Chilies", "quantity": 3, "unit": "pcs" },
      { "name": "Mustard Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Onion", "quantity": 1, "unit": "pcs" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Lemon Juice", "quantity": 1, "unit": "tbsp" }
    ],
    "preparation": [
      { "ingredient": "Mixed Mountain Greens", "cut": "washed thoroughly and roughly chopped" },
      { "ingredient": "Garlic", "cut": "thinly sliced" },
      { "ingredient": "Onion", "cut": "finely sliced" }
    ],
    "nutrition": { "protein": 5, "carbs": 10, "fat": 7, "fiber": 6, "sugar": 2 },
    "equipment": ["Wok or Heavy Pan", "Ladle"],
    "steps": [
      { "step": 1, "instruction": "Heat mustard oil to smoking point, then reduce to medium heat.", "time": 2 },
      { "step": 2, "instruction": "Add mustard seeds and dry red chilies. Let them splutter.", "time": 1 },
      { "step": 3, "instruction": "Add sliced garlic and onion, sauté until softened and lightly golden.", "time": 5 },
      { "step": 4, "instruction": "Add turmeric, then pile in all the greens. Toss well.", "time": 2 },
      { "step": 5, "instruction": "Stir-fry on high heat for 8 minutes until greens are wilted but not mushy.", "time": 8 },
      { "step": 6, "instruction": "Season with salt, finish with lemon juice, and serve hot.", "time": 2 }
    ],
    "tips": [
      "Use as many different greens as possible for the most complex flavor.",
      "Do not cover while cooking — this keeps the greens vibrant and prevents waterlogging.",
      "Bathua (chenopodium) is especially nutritious and authentic to this preparation."
    ],
    "tags": ["himachali", "vegan", "greens", "winter", "village-style", "stir-fry", "foraged"]
  },
  {
    "id": "gur_chawal",
    "name": "Gur Chawal (Jaggery Rice)",
    "cuisine": "Himachali",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 25,
    "prep_time": 5,
    "servings": 4,
    "calories": 310,
    "rating": 4.6,
    "reviews": 290,
    "image": "https://images.unsplash.com/photo-1536304993881-ff86e0c9b915?w=400",
    "description": "Sweet aromatic rice cooked with raw jaggery, ghee, and cardamom — a sacred offering prepared during Himachali religious ceremonies and festivals, loved equally as a comfort dessert.",
    "ingredients": [
      { "name": "Basmati Rice", "quantity": 250, "unit": "g" },
      { "name": "Jaggery (Grated)", "quantity": 120, "unit": "g" },
      { "name": "Ghee", "quantity": 4, "unit": "tbsp" },
      { "name": "Cardamom Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Dry Fruits (Cashews, Raisins)", "quantity": 40, "unit": "g" },
      { "name": "Water", "quantity": 500, "unit": "ml" },
      { "name": "Bay Leaves", "quantity": 2, "unit": "pcs" },
      { "name": "Salt", "quantity": 0.25, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Basmati Rice", "cut": "washed and soaked 20 minutes" },
      { "ingredient": "Jaggery", "cut": "finely grated" }
    ],
    "nutrition": { "protein": 4, "carbs": 62, "fat": 10, "fiber": 1, "sugar": 28 },
    "equipment": ["Heavy Pot with Lid", "Ladle"],
    "steps": [
      { "step": 1, "instruction": "Heat ghee in a heavy pot. Fry cashews and raisins until golden. Remove and set aside.", "time": 3 },
      { "step": 2, "instruction": "In same ghee, add bay leaves and soaked drained rice. Sauté for 3 minutes.", "time": 3 },
      { "step": 3, "instruction": "Add water and a pinch of salt. Bring to a boil.", "time": 5 },
      { "step": 4, "instruction": "Cover and cook on low flame until rice is 90% done and water is absorbed.", "time": 12 },
      { "step": 5, "instruction": "Sprinkle grated jaggery and cardamom powder over the rice without mixing.", "time": 1 },
      { "step": 6, "instruction": "Cover tightly and steam on lowest heat for 8 minutes until jaggery melts.", "time": 8 },
      { "step": 7, "instruction": "Gently fold in jaggery, top with fried dry fruits and serve warm.", "time": 2 }
    ],
    "tips": [
      "Add jaggery only after rice is mostly cooked — adding early makes the rice mushy.",
      "Use dark, earthy Himachali jaggery if available for the most authentic flavor.",
      "A pinch of salt balances the sweetness beautifully."
    ],
    "tags": ["himachali", "sweet", "jaggery", "rice", "festive", "dessert", "prasad"]
  },
  {
    "id": "chilra",
    "name": "Chilra (Rice Flour Crepe)",
    "cuisine": "Himachali",
    "diet": "Vegan",
    "difficulty": "Easy",
    "cook_time": 20,
    "prep_time": 10,
    "servings": 4,
    "calories": 175,
    "rating": 4.5,
    "reviews": 310,
    "image": "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=400",
    "description": "Thin crispy savory crepes made from fermented rice flour batter with green onions and herbs — a popular Himachali breakfast from the Lahaul-Spiti and Chamba districts, light yet satisfying.",
    "ingredients": [
      { "name": "Rice Flour", "quantity": 200, "unit": "g" },
      { "name": "Water", "quantity": 350, "unit": "ml" },
      { "name": "Spring Onions", "quantity": 3, "unit": "stalks" },
      { "name": "Green Chilies", "quantity": 2, "unit": "pcs" },
      { "name": "Ginger", "quantity": 0.5, "unit": "inch" },
      { "name": "Cumin Seeds", "quantity": 0.5, "unit": "tsp" },
      { "name": "Coriander Leaves", "quantity": 15, "unit": "g" },
      { "name": "Mustard Oil", "quantity": 2, "unit": "tbsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Spring Onions", "cut": "finely chopped" },
      { "ingredient": "Green Chilies", "cut": "finely chopped" },
      { "ingredient": "Ginger", "cut": "grated" },
      { "ingredient": "Coriander Leaves", "cut": "finely chopped" }
    ],
    "nutrition": { "protein": 3, "carbs": 34, "fat": 5, "fiber": 1, "sugar": 1 },
    "equipment": ["Non-stick Pan or Iron Tawa", "Ladle", "Mixing Bowl"],
    "steps": [
      { "step": 1, "instruction": "Mix rice flour with water and salt to form a thin, smooth, lump-free batter.", "time": 5 },
      { "step": 2, "instruction": "Add spring onions, green chilies, ginger, cumin, and coriander. Mix well.", "time": 2 },
      { "step": 3, "instruction": "Rest the batter for 10 minutes.", "time": 10 },
      { "step": 4, "instruction": "Heat iron tawa, grease lightly with mustard oil, pour a ladleful of batter and swirl thin.", "time": 2 },
      { "step": 5, "instruction": "Cook on medium heat for 3 minutes until edges turn crispy and surface is set.", "time": 3 },
      { "step": 6, "instruction": "Drizzle a few drops of oil, flip, cook for 1 more minute. Serve hot with til chutney.", "time": 2 }
    ],
    "tips": [
      "The batter should be thinner than dosa batter for lacy, crispy edges.",
      "An iron tawa gives the best results and authentic smoky flavor.",
      "Pairs perfectly with Himachali til chutney or local yogurt."
    ],
    "tags": ["himachali", "vegan", "crepe", "rice-flour", "breakfast", "lahaul", "chamba"]
  }
];

export default recipes;