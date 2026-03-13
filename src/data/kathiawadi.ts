import { Recipe } from "../types";

const recipes: Recipe[] = [
{
id: "kathiawadi_sev_tameta",
name: "Sev Tameta Nu Shaak",
cuisine: "Kathiawadi",
diet: "Vegetarian",
difficulty: "Easy",
cook_time: 20,
prep_time: 10,
servings: 4,
calories: 260,
rating: 4.7,
reviews: 620,
image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400",
description: "A tangy and spicy tomato curry topped with crunchy sev — one of the most iconic Kathiawadi dishes.",
ingredients: [
{ name: "Tomato", quantity: 4, unit: "pcs" },
{ name: "Onion", quantity: 1, unit: "pcs" },
{ name: "Garlic", quantity: 5, unit: "cloves" },
{ name: "Green Chili", quantity: 2, unit: "pcs" },
{ name: "Oil", quantity: 2, unit: "tbsp" },
{ name: "Red Chili Powder", quantity: 1, unit: "tsp" },
{ name: "Turmeric", quantity: 0.5, unit: "tsp" },
{ name: "Coriander Powder", quantity: 1, unit: "tsp" },
{ name: "Sugar", quantity: 1, unit: "tsp" },
{ name: "Salt", quantity: 1, unit: "tsp" },
{ name: "Sev", quantity: 100, unit: "g" }
],
preparation: [
{ ingredient: "Tomato", cut: "finely chopped" },
{ ingredient: "Onion", cut: "finely chopped" },
{ ingredient: "Garlic", cut: "crushed" }
],
nutrition: { protein: 6, carbs: 32, fat: 11, fiber: 4, sugar: 6 },
equipment: ["Kadai"],
steps: [
{ step: 1, instruction: "Heat oil and sauté garlic, chili, and onion.", time: 5 },
{ step: 2, instruction: "Add tomatoes and cook until soft.", time: 7 },
{ step: 3, instruction: "Add spices, sugar and salt and simmer.", time: 5 },
{ step: 4, instruction: "Add sev just before serving.", time: 2 }
],
tips: [
"Add sev only before serving to maintain crunch.",
"Balance sweet and spicy flavor."
],
tags: ["kathiawadi", "sev", "tomato", "spicy"]
},

{
id: "kathiawadi_lasaniya_batata",
name: "Lasaniya Batata",
cuisine: "Kathiawadi",
diet: "Vegan",
difficulty: "Easy",
cook_time: 25,
prep_time: 10,
servings: 4,
calories: 240,
rating: 4.8,
reviews: 700,
image: "https://images.unsplash.com/photo-1605478521996-6a5d9a12d38f?w=400",
description: "Fiery garlic potato curry cooked in Kathiawadi style with lots of red chili and garlic.",
ingredients: [
{ name: "Potatoes", quantity: 500, unit: "g" },
{ name: "Garlic", quantity: 12, unit: "cloves" },
{ name: "Red Chili Powder", quantity: 2, unit: "tsp" },
{ name: "Turmeric", quantity: 0.5, unit: "tsp" },
{ name: "Oil", quantity: 3, unit: "tbsp" },
{ name: "Salt", quantity: 1, unit: "tsp" },
{ name: "Cumin Seeds", quantity: 1, unit: "tsp" }
],
preparation: [
{ ingredient: "Potatoes", cut: "boiled and cubed" },
{ ingredient: "Garlic", cut: "crushed paste" }
],
nutrition: { protein: 5, carbs: 34, fat: 10, fiber: 4, sugar: 2 },
equipment: ["Kadai"],
steps: [
{ step: 1, instruction: "Heat oil and add cumin seeds.", time: 2 },
{ step: 2, instruction: "Add garlic paste and sauté until aromatic.", time: 4 },
{ step: 3, instruction: "Add potatoes and spices.", time: 8 },
{ step: 4, instruction: "Cook until masala coats potatoes.", time: 10 }
],
tips: [
"Use mustard oil for authentic flavor.",
"Serve with bajra rotla."
],
tags: ["kathiawadi", "potato", "garlic", "spicy"]
},

{
id: "kathiawadi_ringan_no_olo",
name: "Ringan No Olo",
cuisine: "Kathiawadi",
diet: "Vegan",
difficulty: "Easy",
cook_time: 25,
prep_time: 10,
servings: 4,
calories: 180,
rating: 4.7,
reviews: 540,
image: "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400",
description: "Smoky roasted eggplant mash cooked with onions, garlic and spices.",
ingredients: [
{ name: "Eggplant", quantity: 2, unit: "pcs" },
{ name: "Onion", quantity: 1, unit: "pcs" },
{ name: "Garlic", quantity: 6, unit: "cloves" },
{ name: "Tomato", quantity: 1, unit: "pcs" },
{ name: "Oil", quantity: 2, unit: "tbsp" },
{ name: "Green Chili", quantity: 2, unit: "pcs" },
{ name: "Salt", quantity: 1, unit: "tsp" }
],
preparation: [
{ ingredient: "Eggplant", cut: "roasted and mashed" },
{ ingredient: "Onion", cut: "finely chopped" }
],
nutrition: { protein: 4, carbs: 18, fat: 9, fiber: 6, sugar: 5 },
equipment: ["Pan"],
steps: [
{ step: 1, instruction: "Roast eggplants until soft and smoky.", time: 12 },
{ step: 2, instruction: "Heat oil and sauté onions, garlic, chili.", time: 5 },
{ step: 3, instruction: "Add mashed eggplant and spices.", time: 6 },
{ step: 4, instruction: "Cook until well combined.", time: 4 }
],
tips: [
"Roasting on open flame gives best flavor."
],
tags: ["kathiawadi", "eggplant", "smoky"]
},

{
id: "kathiawadi_bajra_rotla",
name: "Bajra Rotla",
cuisine: "Kathiawadi",
diet: "Vegan",
difficulty: "Medium",
cook_time: 15,
prep_time: 10,
servings: 4,
calories: 210,
rating: 4.8,
reviews: 800,
image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa6c90?w=400",
description: "Traditional thick pearl millet flatbread served with ghee and jaggery.",
ingredients: [
{ name: "Bajra Flour", quantity: 300, unit: "g" },
{ name: "Salt", quantity: 0.5, unit: "tsp" },
{ name: "Water", quantity: 200, unit: "ml" }
],
preparation: [
{ ingredient: "Bajra Flour", cut: "kneaded into dough" }
],
nutrition: { protein: 7, carbs: 40, fat: 3, fiber: 6, sugar: 1 },
equipment: ["Tawa"],
steps: [
{ step: 1, instruction: "Knead dough with warm water.", time: 5 },
{ step: 2, instruction: "Shape thick rotla by hand.", time: 3 },
{ step: 3, instruction: "Cook on hot tawa until brown spots.", time: 7 }
],
tips: [
"Serve hot with white butter."
],
tags: ["kathiawadi", "rotla", "bajra"]
},

{
id: "kathiawadi_khichdi",
name: "Kathiawadi Khichdi",
cuisine: "Kathiawadi",
diet: "Vegetarian",
difficulty: "Easy",
cook_time: 25,
prep_time: 10,
servings: 4,
calories: 290,
rating: 4.6,
reviews: 510,
image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400",
description: "Comforting rice and lentil khichdi served with kadhi and ghee.",
ingredients: [
{ name: "Rice", quantity: 200, unit: "g" },
{ name: "Moong Dal", quantity: 100, unit: "g" },
{ name: "Turmeric", quantity: 0.5, unit: "tsp" },
{ name: "Salt", quantity: 1, unit: "tsp" },
{ name: "Ghee", quantity: 2, unit: "tbsp" }
],
preparation: [
{ ingredient: "Rice", cut: "washed" },
{ ingredient: "Moong Dal", cut: "washed" }
],
nutrition: { protein: 10, carbs: 45, fat: 8, fiber: 4, sugar: 2 },
equipment: ["Pressure Cooker"],
steps: [
{ step: 1, instruction: "Add rice, dal and spices to cooker.", time: 5 },
{ step: 2, instruction: "Pressure cook with water.", time: 15 },
{ step: 3, instruction: "Serve with ghee.", time: 2 }
],
tips: [
"Use desi ghee for authentic flavor."
],
tags: ["kathiawadi", "khichdi"]
},
{
id: "kathiawadi_dudhi_chana_dal",
name: "Dudhi Chana Dal",
cuisine: "Kathiawadi",
diet: "Vegetarian",
difficulty: "Easy",
cook_time: 25,
prep_time: 10,
servings: 4,
calories: 210,
rating: 4.5,
reviews: 310,
image: "https://images.unsplash.com/photo-1604908177522-402b1d5c8d60?w=400",
description: "Bottle gourd cooked with chana dal in a lightly spiced Kathiawadi gravy.",
ingredients: [
{ name: "Bottle Gourd", quantity: 400, unit: "g" },
{ name: "Chana Dal", quantity: 120, unit: "g" },
{ name: "Onion", quantity: 1, unit: "pcs" },
{ name: "Tomato", quantity: 1, unit: "pcs" },
{ name: "Garlic", quantity: 4, unit: "cloves" },
{ name: "Oil", quantity: 2, unit: "tbsp" },
{ name: "Turmeric", quantity: 0.5, unit: "tsp" },
{ name: "Red Chili Powder", quantity: 1, unit: "tsp" },
{ name: "Salt", quantity: 1, unit: "tsp" }
],
preparation: [
{ ingredient: "Bottle Gourd", cut: "peeled and cubed" },
{ ingredient: "Chana Dal", cut: "soaked 30 minutes" }
],
nutrition: { protein: 9, carbs: 28, fat: 6, fiber: 7, sugar: 4 },
equipment: ["Pressure Cooker"],
steps: [
{ step: 1, instruction: "Heat oil and sauté onion and garlic.", time: 5 },
{ step: 2, instruction: "Add tomatoes and spices.", time: 5 },
{ step: 3, instruction: "Add dudhi and chana dal with water.", time: 10 },
{ step: 4, instruction: "Pressure cook until soft.", time: 5 }
],
tips: ["Serve with bajra rotla."],
tags: ["kathiawadi", "dudhi", "dal"]
},

{
id: "kathiawadi_karela_batata",
name: "Karela Batata",
cuisine: "Kathiawadi",
diet: "Vegan",
difficulty: "Medium",
cook_time: 25,
prep_time: 15,
servings: 4,
calories: 200,
rating: 4.4,
reviews: 280,
image: "https://images.unsplash.com/photo-1604908177075-8f8c6f0d6c8e?w=400",
description: "A bitter gourd and potato stir fry with strong Kathiawadi spices.",
ingredients: [
{ name: "Bitter Gourd", quantity: 300, unit: "g" },
{ name: "Potatoes", quantity: 250, unit: "g" },
{ name: "Oil", quantity: 2, unit: "tbsp" },
{ name: "Turmeric", quantity: 0.5, unit: "tsp" },
{ name: "Red Chili Powder", quantity: 1, unit: "tsp" },
{ name: "Salt", quantity: 1, unit: "tsp" }
],
preparation: [
{ ingredient: "Bitter Gourd", cut: "thin slices with salt rub" },
{ ingredient: "Potatoes", cut: "cubed" }
],
nutrition: { protein: 5, carbs: 22, fat: 9, fiber: 6, sugar: 3 },
equipment: ["Kadai"],
steps: [
{ step: 1, instruction: "Heat oil and sauté karela.", time: 8 },
{ step: 2, instruction: "Add potatoes and spices.", time: 10 },
{ step: 3, instruction: "Cook covered until tender.", time: 7 }
],
tips: ["Salt the karela to reduce bitterness."],
tags: ["kathiawadi", "karela"]
},

{
id: "kathiawadi_besan_gatta",
name: "Besan Gatta Sabzi",
cuisine: "Kathiawadi",
diet: "Vegetarian",
difficulty: "Medium",
cook_time: 35,
prep_time: 15,
servings: 4,
calories: 320,
rating: 4.6,
reviews: 410,
image: "https://images.unsplash.com/photo-1604908177531-dbb02e3d4b22?w=400",
description: "Gram flour dumplings simmered in a spicy Kathiawadi gravy.",
ingredients: [
{ name: "Besan", quantity: 200, unit: "g" },
{ name: "Yogurt", quantity: 150, unit: "g" },
{ name: "Red Chili Powder", quantity: 1, unit: "tsp" },
{ name: "Turmeric", quantity: 0.5, unit: "tsp" },
{ name: "Oil", quantity: 2, unit: "tbsp" },
{ name: "Salt", quantity: 1, unit: "tsp" }
],
preparation: [
{ ingredient: "Besan", cut: "kneaded with spices into dough" }
],
nutrition: { protein: 11, carbs: 34, fat: 12, fiber: 5, sugar: 3 },
equipment: ["Pan"],
steps: [
{ step: 1, instruction: "Shape besan dough into rolls and boil.", time: 10 },
{ step: 2, instruction: "Cut into pieces.", time: 3 },
{ step: 3, instruction: "Prepare yogurt gravy and add gatta.", time: 12 },
{ step: 4, instruction: "Simmer until thick.", time: 10 }
],
tips: ["Do not overcook gatta or it becomes hard."],
tags: ["kathiawadi", "besan"]
},

{
id: "kathiawadi_methi_thepla",
name: "Methi Thepla",
cuisine: "Kathiawadi",
diet: "Vegetarian",
difficulty: "Easy",
cook_time: 20,
prep_time: 10,
servings: 4,
calories: 210,
rating: 4.9,
reviews: 920,
image: "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=400",
description: "Soft Gujarati flatbread made with fenugreek leaves and whole wheat flour.",
ingredients: [
{ name: "Wheat Flour", quantity: 250, unit: "g" },
{ name: "Fenugreek Leaves", quantity: 80, unit: "g" },
{ name: "Yogurt", quantity: 50, unit: "g" },
{ name: "Turmeric", quantity: 0.5, unit: "tsp" },
{ name: "Red Chili Powder", quantity: 1, unit: "tsp" },
{ name: "Oil", quantity: 2, unit: "tbsp" }
],
preparation: [
{ ingredient: "Fenugreek Leaves", cut: "finely chopped" }
],
nutrition: { protein: 7, carbs: 32, fat: 8, fiber: 5, sugar: 2 },
equipment: ["Tawa"],
steps: [
{ step: 1, instruction: "Mix flour, methi and spices.", time: 5 },
{ step: 2, instruction: "Knead dough with yogurt.", time: 5 },
{ step: 3, instruction: "Roll thin and cook on tawa.", time: 10 }
],
tips: ["Best served with pickle and yogurt."],
tags: ["kathiawadi", "thepla"]
},

{
id: "kathiawadi_guvar_batata",
name: "Guvar Batata",
cuisine: "Kathiawadi",
diet: "Vegan",
difficulty: "Easy",
cook_time: 25,
prep_time: 10,
servings: 4,
calories: 190,
rating: 4.4,
reviews: 260,
image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400",
description: "Cluster beans and potatoes cooked in traditional Gujarati spices.",
ingredients: [
{ name: "Cluster Beans", quantity: 300, unit: "g" },
{ name: "Potatoes", quantity: 200, unit: "g" },
{ name: "Oil", quantity: 2, unit: "tbsp" },
{ name: "Turmeric", quantity: 0.5, unit: "tsp" },
{ name: "Red Chili Powder", quantity: 1, unit: "tsp" },
{ name: "Salt", quantity: 1, unit: "tsp" }
],
preparation: [
{ ingredient: "Cluster Beans", cut: "chopped" },
{ ingredient: "Potatoes", cut: "cubed" }
],
nutrition: { protein: 5, carbs: 24, fat: 7, fiber: 6, sugar: 3 },
equipment: ["Kadai"],
steps: [
{ step: 1, instruction: "Heat oil and sauté beans.", time: 8 },
{ step: 2, instruction: "Add potatoes and spices.", time: 10 },
{ step: 3, instruction: "Cook until soft.", time: 7 }
],
tips: ["Add a pinch of sugar for Gujarati flavor."],
tags: ["kathiawadi", "beans"]
},

{
id: "kathiawadi_kadhi",
name: "Kathiawadi Kadhi",
cuisine: "Kathiawadi",
diet: "Vegetarian",
difficulty: "Easy",
cook_time: 20,
prep_time: 10,
servings: 4,
calories: 160,
rating: 4.7,
reviews: 420,
image: "https://images.unsplash.com/photo-1626500155530-93676f02a8c7?w=400",
description: "Spicy yogurt and gram flour curry served with khichdi.",
ingredients: [
{ name: "Yogurt", quantity: 400, unit: "g" },
{ name: "Besan", quantity: 40, unit: "g" },
{ name: "Curry Leaves", quantity: 8, unit: "pcs" },
{ name: "Mustard Seeds", quantity: 1, unit: "tsp" },
{ name: "Green Chili", quantity: 2, unit: "pcs" },
{ name: "Salt", quantity: 1, unit: "tsp" }
],
preparation: [
{ ingredient: "Yogurt", cut: "whisked with besan" }
],
nutrition: { protein: 7, carbs: 14, fat: 6, fiber: 1, sugar: 5 },
equipment: ["Saucepan"],
steps: [
{ step: 1, instruction: "Whisk yogurt and besan.", time: 4 },
{ step: 2, instruction: "Simmer with spices.", time: 12 },
{ step: 3, instruction: "Add tempering.", time: 4 }
],
tips: ["Serve hot with khichdi."],
tags: ["kathiawadi", "kadhi"]
},

{
id: "kathiawadi_tindora_shaak",
name: "Tindora Nu Shaak",
cuisine: "Kathiawadi",
diet: "Vegan",
difficulty: "Easy",
cook_time: 20,
prep_time: 10,
servings: 4,
calories: 170,
rating: 4.3,
reviews: 190,
image: "https://images.unsplash.com/photo-1626500155530-93676f02a8c7?w=400",
description: "Ivy gourd stir fried with spices in traditional Kathiawadi style.",
ingredients: [
{ name: "Tindora", quantity: 350, unit: "g" },
{ name: "Oil", quantity: 2, unit: "tbsp" },
{ name: "Turmeric", quantity: 0.5, unit: "tsp" },
{ name: "Red Chili Powder", quantity: 1, unit: "tsp" },
{ name: "Salt", quantity: 1, unit: "tsp" }
],
preparation: [
{ ingredient: "Tindora", cut: "thin slices" }
],
nutrition: { protein: 4, carbs: 16, fat: 8, fiber: 5, sugar: 3 },
equipment: ["Kadai"],
steps: [
{ step: 1, instruction: "Heat oil and add tindora.", time: 10 },
{ step: 2, instruction: "Add spices and cook until tender.", time: 10 }
],
tips: ["Cook uncovered for crispy texture."],
tags: ["kathiawadi", "tindora"]
},

{
id: "kathiawadi_dahi_tikhari",
name: "Dahi Tikhari",
cuisine: "Kathiawadi",
diet: "Vegetarian",
difficulty: "Easy",
cook_time: 10,
prep_time: 5,
servings: 4,
calories: 120,
rating: 4.4,
reviews: 210,
image: "https://images.unsplash.com/photo-1626500155530-93676f02a8c7?w=400",
description: "Spicy yogurt tempered with garlic and chili.",
ingredients: [
{ name: "Yogurt", quantity: 300, unit: "g" },
{ name: "Garlic", quantity: 5, unit: "cloves" },
{ name: "Red Chili Powder", quantity: 1, unit: "tsp" },
{ name: "Oil", quantity: 1, unit: "tbsp" },
{ name: "Salt", quantity: 1, unit: "tsp" }
],
preparation: [
{ ingredient: "Garlic", cut: "crushed" }
],
nutrition: { protein: 6, carbs: 10, fat: 6, fiber: 0, sugar: 6 },
equipment: ["Pan"],
steps: [
{ step: 1, instruction: "Heat oil and sauté garlic.", time: 2 },
{ step: 2, instruction: "Add chili powder.", time: 1 },
{ step: 3, instruction: "Pour over whisked yogurt.", time: 2 }
],
tips: ["Serve with rotla."],
tags: ["kathiawadi", "yogurt"]
},

{
id: "kathiawadi_jowar_rotla",
name: "Jowar Rotla",
cuisine: "Kathiawadi",
diet: "Vegan",
difficulty: "Medium",
cook_time: 15,
prep_time: 10,
servings: 4,
calories: 200,
rating: 4.5,
reviews: 330,
image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa6c90?w=400",
description: "Traditional sorghum flatbread eaten with spicy Kathiawadi curries.",
ingredients: [
{ name: "Jowar Flour", quantity: 300, unit: "g" },
{ name: "Salt", quantity: 0.5, unit: "tsp" },
{ name: "Water", quantity: 200, unit: "ml" }
],
preparation: [
{ ingredient: "Jowar Flour", cut: "kneaded dough" }
],
nutrition: { protein: 6, carbs: 38, fat: 2, fiber: 6, sugar: 1 },
equipment: ["Tawa"],
steps: [
{ step: 1, instruction: "Prepare dough.", time: 5 },
{ step: 2, instruction: "Flatten and cook on tawa.", time: 10 }
],
tips: ["Serve with garlic chutney."],
tags: ["kathiawadi", "rotla"]
},

{
id: "kathiawadi_garlic_chutney",
name: "Kathiawadi Garlic Chutney",
cuisine: "Kathiawadi",
diet: "Vegan",
difficulty: "Easy",
cook_time: 5,
prep_time: 5,
servings: 4,
calories: 90,
rating: 4.8,
reviews: 600,
image: "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400",
description: "Fiery red garlic chutney served with rotla and shaak.",
ingredients: [
{ name: "Garlic", quantity: 20, unit: "cloves" },
{ name: "Red Chili Powder", quantity: 2, unit: "tsp" },
{ name: "Oil", quantity: 2, unit: "tbsp" },
{ name: "Salt", quantity: 1, unit: "tsp" }
],
preparation: [
{ ingredient: "Garlic", cut: "crushed paste" }
],
nutrition: { protein: 2, carbs: 6, fat: 7, fiber: 1, sugar: 1 },
equipment: ["Mixer"],
steps: [
{ step: 1, instruction: "Grind garlic and chili powder.", time: 3 },
{ step: 2, instruction: "Add oil and salt and mix.", time: 2 }
],
tips: ["Store in fridge up to 1 week."],
tags: ["kathiawadi", "chutney", "garlic"]
}

];

export default recipes;