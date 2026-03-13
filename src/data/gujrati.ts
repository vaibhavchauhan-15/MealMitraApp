import { Recipe } from '../types';

const recipes: Recipe[] = [
  {
    "id": "dhokla",
    "name": "Dhokla",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 20,
    "prep_time": 10,
    "servings": 4,
    "calories": 160,
    "rating": 4.8,
    "reviews": 2100,
    "image": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400",
    "description": "A light and fluffy steamed savory cake made from fermented chickpea batter, topped with a tangy-sweet tempering — Gujarat's most iconic snack.",
    "ingredients": [
      { "name": "Besan (Chickpea Flour)", "quantity": 200, "unit": "g" },
      { "name": "Semolina (Rava)", "quantity": 2, "unit": "tbsp" },
      { "name": "Curd (Yogurt)", "quantity": 150, "unit": "ml" },
      { "name": "Eno Fruit Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Green Chili Paste", "quantity": 1, "unit": "tsp" },
      { "name": "Ginger Paste", "quantity": 1, "unit": "tsp" },
      { "name": "Sugar", "quantity": 1, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Oil", "quantity": 2, "unit": "tbsp" },
      { "name": "Mustard Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Curry Leaves", "quantity": 8, "unit": "pcs" },
      { "name": "Green Chilies", "quantity": 2, "unit": "pcs" },
      { "name": "Fresh Coriander", "quantity": 2, "unit": "tbsp" },
      { "name": "Grated Coconut", "quantity": 2, "unit": "tbsp" }
    ],
    "preparation": [
      { "ingredient": "Green Chilies", "cut": "slit lengthwise" },
      { "ingredient": "Fresh Coriander", "cut": "finely chopped" }
    ],
    "nutrition": { "protein": 8, "carbs": 24, "fat": 5, "fiber": 3, "sugar": 3 },
    "equipment": ["Steamer", "Mixing Bowl", "Tadka Pan", "Greased Tray"],
    "steps": [
      { "step": 1, "instruction": "Mix besan, rava, curd, turmeric, green chili paste, ginger paste, sugar, and salt into a smooth batter. Let it rest for 10 minutes.", "time": 10 },
      { "step": 2, "instruction": "Grease a steaming tray with oil and preheat the steamer.", "time": 2 },
      { "step": 3, "instruction": "Add Eno fruit salt to the batter and mix gently until frothy. Pour immediately into the greased tray.", "time": 1 },
      { "step": 4, "instruction": "Steam on medium-high heat for 15–18 minutes until a toothpick inserted comes out clean.", "time": 18 },
      { "step": 5, "instruction": "Allow to cool for 5 minutes, then cut into square or diamond pieces.", "time": 5 },
      { "step": 6, "instruction": "Heat oil in a small pan. Add mustard seeds and let them splutter. Add curry leaves and slit green chilies.", "time": 2 },
      { "step": 7, "instruction": "Pour the tempering evenly over the dhokla pieces.", "time": 1 },
      { "step": 8, "instruction": "Garnish with chopped coriander and grated coconut. Serve with green chutney.", "time": 1 }
    ],
    "tips": [
      "Add Eno right before steaming for the fluffiest texture.",
      "Use slightly sour curd for the authentic tangy flavor.",
      "A sugar-water drizzle before tempering keeps dhokla moist."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "steamed", "snack", "breakfast"]
  },
  {
    "id": "khandvi",
    "name": "Khandvi",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 25,
    "prep_time": 10,
    "servings": 4,
    "calories": 140,
    "rating": 4.7,
    "reviews": 980,
    "image": "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
    "description": "Silky, melt-in-the-mouth rolls made from a cooked chickpea flour and buttermilk batter, tempered with sesame and coconut — a true Gujarati delicacy.",
    "ingredients": [
      { "name": "Besan (Chickpea Flour)", "quantity": 100, "unit": "g" },
      { "name": "Buttermilk", "quantity": 400, "unit": "ml" },
      { "name": "Turmeric", "quantity": 0.25, "unit": "tsp" },
      { "name": "Ginger-Green Chili Paste", "quantity": 1, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Oil", "quantity": 2, "unit": "tbsp" },
      { "name": "Mustard Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Sesame Seeds", "quantity": 1, "unit": "tbsp" },
      { "name": "Dried Red Chilies", "quantity": 2, "unit": "pcs" },
      { "name": "Curry Leaves", "quantity": 8, "unit": "pcs" },
      { "name": "Grated Coconut", "quantity": 3, "unit": "tbsp" },
      { "name": "Fresh Coriander", "quantity": 2, "unit": "tbsp" }
    ],
    "preparation": [
      { "ingredient": "Fresh Coriander", "cut": "finely chopped" }
    ],
    "nutrition": { "protein": 7, "carbs": 18, "fat": 6, "fiber": 2, "sugar": 2 },
    "equipment": ["Heavy-Bottom Pan", "Flat Plates or Marble Surface", "Spatula"],
    "steps": [
      { "step": 1, "instruction": "Whisk together besan, buttermilk, turmeric, ginger-chili paste, and salt into a lump-free batter.", "time": 5 },
      { "step": 2, "instruction": "Cook the batter in a heavy-bottom pan on medium heat, stirring continuously to avoid lumps.", "time": 12 },
      { "step": 3, "instruction": "Cook until the mixture thickens and leaves the sides of the pan. Test by spreading a small amount on a plate — it should peel off easily when set.", "time": 5 },
      { "step": 4, "instruction": "Immediately spread a thin layer onto the back of greased flat plates or a marble surface using a flat spatula.", "time": 3 },
      { "step": 5, "instruction": "Allow to cool for 3–4 minutes, then gently roll each sheet into tight cylinders.", "time": 4 },
      { "step": 6, "instruction": "Arrange rolls on a serving plate. Heat oil, splutter mustard seeds, add sesame seeds, dried red chilies, and curry leaves.", "time": 3 },
      { "step": 7, "instruction": "Pour the tempering over the khandvi rolls. Garnish with grated coconut and coriander.", "time": 1 }
    ],
    "tips": [
      "Work quickly when spreading the batter — it sets fast.",
      "The batter is ready when a small amount spread on a plate peels off cleanly after cooling.",
      "Use a thick buttermilk for best results."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "snack", "steamed", "festive"]
  },
  {
    "id": "thepla",
    "name": "Thepla",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 20,
    "prep_time": 15,
    "servings": 4,
    "calories": 180,
    "rating": 4.8,
    "reviews": 1650,
    "image": "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400",
    "description": "Soft and spiced flatbreads made with whole wheat flour and fresh fenugreek leaves — Gujarat's ultimate travel food and everyday staple.",
    "ingredients": [
      { "name": "Whole Wheat Flour", "quantity": 200, "unit": "g" },
      { "name": "Fresh Fenugreek (Methi) Leaves", "quantity": 50, "unit": "g" },
      { "name": "Besan (Chickpea Flour)", "quantity": 2, "unit": "tbsp" },
      { "name": "Curd (Yogurt)", "quantity": 3, "unit": "tbsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Red Chili Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Coriander-Cumin Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Ginger-Garlic Paste", "quantity": 1, "unit": "tsp" },
      { "name": "Sesame Seeds", "quantity": 1, "unit": "tbsp" },
      { "name": "Oil", "quantity": 2, "unit": "tbsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Fresh Fenugreek Leaves", "cut": "finely chopped" }
    ],
    "nutrition": { "protein": 6, "carbs": 28, "fat": 7, "fiber": 4, "sugar": 1 },
    "equipment": ["Mixing Bowl", "Rolling Pin", "Tawa (Griddle)"],
    "steps": [
      { "step": 1, "instruction": "Combine wheat flour, besan, chopped methi leaves, curd, all spices, sesame seeds, ginger-garlic paste, salt, and 1 tbsp oil. Mix well.", "time": 5 },
      { "step": 2, "instruction": "Knead into a soft, smooth dough, adding water sparingly. Let it rest for 10 minutes.", "time": 10 },
      { "step": 3, "instruction": "Divide the dough into equal balls. Roll each ball into a thin round flatbread (approx. 6–7 inch diameter).", "time": 5 },
      { "step": 4, "instruction": "Heat a tawa over medium flame. Cook each thepla for 1–2 minutes on one side.", "time": 2 },
      { "step": 5, "instruction": "Flip, apply a little oil, and cook until golden spots appear. Repeat for other side.", "time": 2 },
      { "step": 6, "instruction": "Press gently with a spatula while cooking for even browning. Serve hot with pickle or curd.", "time": 1 }
    ],
    "tips": [
      "Slightly bitter methi leaves are normal — salt them and squeeze before adding to reduce bitterness.",
      "Theplas stay fresh for 2–3 days, making them perfect travel food.",
      "Add grated bottle gourd for a variation called Lauki Thepla."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "breakfast", "flatbread", "travel-food"]
  },
  {
    "id": "undhiyu",
    "name": "Undhiyu",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Hard",
    "cook_time": 60,
    "prep_time": 30,
    "servings": 6,
    "calories": 290,
    "rating": 4.9,
    "reviews": 870,
    "image": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    "description": "A hearty, slow-cooked winter specialty packed with seasonal vegetables, muthia dumplings, and aromatic spices — the crown jewel of Gujarati cuisine.",
    "ingredients": [
      { "name": "Raw Banana", "quantity": 2, "unit": "pcs" },
      { "name": "Purple Yam (Kand)", "quantity": 150, "unit": "g" },
      { "name": "Sweet Potato", "quantity": 150, "unit": "g" },
      { "name": "Brinjal (Small)", "quantity": 4, "unit": "pcs" },
      { "name": "Valor Papdi (Flat Beans)", "quantity": 100, "unit": "g" },
      { "name": "Green Garlic", "quantity": 4, "unit": "stalks" },
      { "name": "Fresh Fenugreek Leaves", "quantity": 50, "unit": "g" },
      { "name": "Besan (Chickpea Flour)", "quantity": 100, "unit": "g" },
      { "name": "Coconut (Grated)", "quantity": 4, "unit": "tbsp" },
      { "name": "Green Chili-Ginger Paste", "quantity": 2, "unit": "tbsp" },
      { "name": "Coriander-Cumin Powder", "quantity": 2, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 1, "unit": "tsp" },
      { "name": "Red Chili Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Sugar", "quantity": 1, "unit": "tsp" },
      { "name": "Lemon Juice", "quantity": 1, "unit": "tbsp" },
      { "name": "Oil", "quantity": 4, "unit": "tbsp" },
      { "name": "Salt", "quantity": 2, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Raw Banana", "cut": "peeled and cut into chunks" },
      { "ingredient": "Purple Yam", "cut": "peeled and cubed" },
      { "ingredient": "Sweet Potato", "cut": "peeled and cubed" },
      { "ingredient": "Brinjal", "cut": "slit crosswise keeping stem intact" }
    ],
    "nutrition": { "protein": 9, "carbs": 38, "fat": 12, "fiber": 8, "sugar": 7 },
    "equipment": ["Heavy-Bottom Pot or Pressure Cooker", "Mixing Bowl", "Knife"],
    "steps": [
      { "step": 1, "instruction": "Make muthia: Mix besan, chopped methi leaves, half the chili-ginger paste, spices, and salt into a stiff dough. Shape into small cylinders.", "time": 10 },
      { "step": 2, "instruction": "Shallow-fry muthias until golden brown on all sides. Set aside.", "time": 8 },
      { "step": 3, "instruction": "Mix grated coconut, green garlic, remaining chili-ginger paste, coriander-cumin powder, salt, sugar, and lemon juice into a stuffing masala.", "time": 5 },
      { "step": 4, "instruction": "Stuff the slit brinjals generously with the masala. Also coat banana, yam, and sweet potato pieces.", "time": 7 },
      { "step": 5, "instruction": "Heat oil in a heavy pot. Layer the valor papdi at the bottom, then add stuffed vegetables.", "time": 5 },
      { "step": 6, "instruction": "Top with fried muthias. Sprinkle remaining masala and any leftover stuffing.", "time": 2 },
      { "step": 7, "instruction": "Cover tightly and cook on low heat for 30–35 minutes, shaking the pot occasionally. Do not stir.", "time": 35 },
      { "step": 8, "instruction": "Check that all vegetables are cooked through. Garnish with fresh coriander and coconut. Serve with puri.", "time": 3 }
    ],
    "tips": [
      "Authentic Undhiyu is cooked upside-down in a clay pot buried underground — a pressure cooker is a modern shortcut.",
      "Use fresh winter vegetables like papdi and green garlic for the best flavor.",
      "Do not open the lid frequently — the steam is key to cooking everything evenly."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "festive", "winter", "slow-cooked"]
  },
  {
    "id": "dal_dhokli",
    "name": "Dal Dhokli",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 35,
    "prep_time": 15,
    "servings": 4,
    "calories": 310,
    "rating": 4.8,
    "reviews": 1120,
    "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    "description": "A comforting one-pot dish of spiced wheat flour dumplings simmered in a sweet-tangy toor dal — Gujarat's answer to pasta in sauce.",
    "ingredients": [
      { "name": "Toor Dal (Split Pigeon Peas)", "quantity": 200, "unit": "g" },
      { "name": "Whole Wheat Flour", "quantity": 150, "unit": "g" },
      { "name": "Tomato", "quantity": 2, "unit": "pcs" },
      { "name": "Peanuts", "quantity": 30, "unit": "g" },
      { "name": "Tamarind Pulp", "quantity": 2, "unit": "tbsp" },
      { "name": "Jaggery", "quantity": 1, "unit": "tbsp" },
      { "name": "Ghee", "quantity": 2, "unit": "tbsp" },
      { "name": "Mustard Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Cumin Seeds", "quantity": 0.5, "unit": "tsp" },
      { "name": "Curry Leaves", "quantity": 8, "unit": "pcs" },
      { "name": "Turmeric", "quantity": 1, "unit": "tsp" },
      { "name": "Red Chili Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Coriander-Cumin Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Ginger-Green Chili Paste", "quantity": 1, "unit": "tsp" },
      { "name": "Salt", "quantity": 1.5, "unit": "tsp" },
      { "name": "Fresh Coriander", "quantity": 2, "unit": "tbsp" }
    ],
    "preparation": [
      { "ingredient": "Tomato", "cut": "roughly chopped" },
      { "ingredient": "Toor Dal", "cut": "soaked 30 minutes, then pressure cooked" }
    ],
    "nutrition": { "protein": 14, "carbs": 45, "fat": 9, "fiber": 7, "sugar": 5 },
    "equipment": ["Pressure Cooker", "Rolling Pin", "Deep Pan"],
    "steps": [
      { "step": 1, "instruction": "Pressure cook toor dal with turmeric and water until soft (3–4 whistles). Mash well.", "time": 15 },
      { "step": 2, "instruction": "Mix wheat flour with turmeric, chili powder, salt, and oil. Knead into a stiff dough. Roll thin and cut into diamond-shaped dhoklis.", "time": 10 },
      { "step": 3, "instruction": "In a large pan, heat ghee. Add mustard seeds, cumin, curry leaves, and dried red chilies for tempering.", "time": 2 },
      { "step": 4, "instruction": "Add chopped tomatoes and ginger-chili paste. Cook until tomatoes turn mushy.", "time": 5 },
      { "step": 5, "instruction": "Add mashed dal, tamarind pulp, jaggery, peanuts, remaining spices, and enough water to get a flowing consistency.", "time": 5 },
      { "step": 6, "instruction": "Bring the dal to a boil, then gently slide in the dhokli pieces one by one to prevent sticking.", "time": 3 },
      { "step": 7, "instruction": "Simmer on medium heat for 10–12 minutes until dhoklis are cooked through and the dal thickens.", "time": 12 },
      { "step": 8, "instruction": "Drizzle with extra ghee, garnish with fresh coriander. Serve hot in a bowl.", "time": 1 }
    ],
    "tips": [
      "Roll dhoklis thin so they cook through evenly in the dal.",
      "Adjust the jaggery and tamarind ratio to balance sweet and tangy to your liking.",
      "Add a generous drizzle of ghee just before serving for authentic flavor."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "comfort-food", "one-pot", "lunch"]
  },
  {
    "id": "gujarati_kadhi",
    "name": "Gujarati Kadhi",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 15,
    "prep_time": 5,
    "servings": 4,
    "calories": 110,
    "rating": 4.7,
    "reviews": 890,
    "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    "description": "A distinctively sweet and tangy yogurt-based soup tempered with whole spices — lighter and sweeter than its North Indian cousin, best enjoyed with rice.",
    "ingredients": [
      { "name": "Curd (Yogurt)", "quantity": 300, "unit": "ml" },
      { "name": "Besan (Chickpea Flour)", "quantity": 2, "unit": "tbsp" },
      { "name": "Jaggery", "quantity": 2, "unit": "tbsp" },
      { "name": "Ginger", "quantity": 1, "unit": "inch" },
      { "name": "Green Chilies", "quantity": 2, "unit": "pcs" },
      { "name": "Ghee", "quantity": 1, "unit": "tbsp" },
      { "name": "Mustard Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Cumin Seeds", "quantity": 0.5, "unit": "tsp" },
      { "name": "Fenugreek Seeds", "quantity": 0.25, "unit": "tsp" },
      { "name": "Cloves", "quantity": 3, "unit": "pcs" },
      { "name": "Cinnamon Stick", "quantity": 1, "unit": "inch" },
      { "name": "Dried Red Chilies", "quantity": 2, "unit": "pcs" },
      { "name": "Curry Leaves", "quantity": 8, "unit": "pcs" },
      { "name": "Turmeric", "quantity": 0.25, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Ginger", "cut": "grated" },
      { "ingredient": "Green Chilies", "cut": "slit lengthwise" }
    ],
    "nutrition": { "protein": 5, "carbs": 14, "fat": 5, "fiber": 1, "sugar": 8 },
    "equipment": ["Mixing Bowl", "Deep Saucepan", "Tadka Pan"],
    "steps": [
      { "step": 1, "instruction": "Whisk together curd, besan, turmeric, salt, jaggery, and 400ml water until completely smooth with no lumps.", "time": 3 },
      { "step": 2, "instruction": "Pour the mixture into a saucepan and cook on low-medium heat, stirring continuously to prevent curdling.", "time": 10 },
      { "step": 3, "instruction": "Bring to a gentle boil while stirring. The kadhi will thicken slightly. Taste and adjust salt and jaggery.", "time": 5 },
      { "step": 4, "instruction": "In a separate tadka pan, heat ghee. Add mustard seeds, cumin, fenugreek seeds, cloves, cinnamon, and dried red chilies.", "time": 2 },
      { "step": 5, "instruction": "Add curry leaves, slit green chilies, and grated ginger to the tempering. Sizzle for 30 seconds.", "time": 1 },
      { "step": 6, "instruction": "Pour tempering into the kadhi. Stir and serve hot over steamed rice.", "time": 1 }
    ],
    "tips": [
      "Stir continuously while cooking to prevent the curd from splitting.",
      "Gujarati kadhi is intentionally sweeter than Punjabi kadhi — the jaggery is key.",
      "Add pakoras for a hearty kadhi-pakora variation."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "comfort-food", "lunch", "rice"]
  },
  {
    "id": "khaman",
    "name": "Khaman",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 20,
    "prep_time": 10,
    "servings": 4,
    "calories": 150,
    "rating": 4.7,
    "reviews": 1340,
    "image": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400",
    "description": "Instant, spongy savory cakes made from chickpea flour, softer and more intensely flavored than dhokla, with a signature sweet-tangy tempering.",
    "ingredients": [
      { "name": "Besan (Chickpea Flour)", "quantity": 200, "unit": "g" },
      { "name": "Water", "quantity": 200, "unit": "ml" },
      { "name": "Citric Acid", "quantity": 0.5, "unit": "tsp" },
      { "name": "Eno Fruit Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.25, "unit": "tsp" },
      { "name": "Green Chili Paste", "quantity": 1, "unit": "tsp" },
      { "name": "Ginger Paste", "quantity": 0.5, "unit": "tsp" },
      { "name": "Sugar", "quantity": 2, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Oil", "quantity": 1, "unit": "tbsp" },
      { "name": "Mustard Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Curry Leaves", "quantity": 8, "unit": "pcs" },
      { "name": "Green Chilies", "quantity": 3, "unit": "pcs" },
      { "name": "Fresh Coriander", "quantity": 2, "unit": "tbsp" },
      { "name": "Grated Coconut", "quantity": 2, "unit": "tbsp" }
    ],
    "preparation": [
      { "ingredient": "Green Chilies", "cut": "slit lengthwise" }
    ],
    "nutrition": { "protein": 8, "carbs": 22, "fat": 5, "fiber": 3, "sugar": 4 },
    "equipment": ["Steamer", "Mixing Bowl", "Greased Plate", "Small Pan"],
    "steps": [
      { "step": 1, "instruction": "Mix besan, water, turmeric, green chili paste, ginger paste, citric acid, sugar, and salt into a smooth batter.", "time": 5 },
      { "step": 2, "instruction": "Preheat the steamer. Grease the steaming plate generously with oil.", "time": 3 },
      { "step": 3, "instruction": "Add Eno fruit salt to the batter, mix gently until foamy, and immediately pour into the greased plate.", "time": 1 },
      { "step": 4, "instruction": "Steam on high heat for 15 minutes until set and cooked through.", "time": 15 },
      { "step": 5, "instruction": "Mix sugar and water (2:1 ratio) and drizzle over hot khaman. Let it absorb for 2 minutes.", "time": 2 },
      { "step": 6, "instruction": "Heat oil, splutter mustard seeds, add slit green chilies and curry leaves. Pour over khaman.", "time": 2 },
      { "step": 7, "instruction": "Cut into pieces. Garnish with fresh coriander and coconut. Serve with green and tamarind chutney.", "time": 2 }
    ],
    "tips": [
      "The sugar-water drizzle is essential for keeping khaman soft and moist.",
      "Do not over-mix after adding Eno — gentle folding preserves the fluffiness.",
      "Khaman batter should be of flowing pouring consistency, not thick."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "snack", "steamed", "breakfast"]
  },
  {
    "id": "sev_tameta_nu_shaak",
    "name": "Sev Tameta Nu Shaak",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 15,
    "prep_time": 5,
    "servings": 4,
    "calories": 130,
    "rating": 4.6,
    "reviews": 760,
    "image": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    "description": "A quick, rustic tomato curry topped with crunchy sev — a beloved everyday Gujarati dish that transforms simple pantry ingredients into something magical.",
    "ingredients": [
      { "name": "Tomato", "quantity": 4, "unit": "pcs" },
      { "name": "Sev (Chickpea Noodles)", "quantity": 100, "unit": "g" },
      { "name": "Oil", "quantity": 2, "unit": "tbsp" },
      { "name": "Mustard Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Cumin Seeds", "quantity": 0.5, "unit": "tsp" },
      { "name": "Curry Leaves", "quantity": 6, "unit": "pcs" },
      { "name": "Green Chilies", "quantity": 2, "unit": "pcs" },
      { "name": "Ginger", "quantity": 0.5, "unit": "inch" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Red Chili Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Coriander-Cumin Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Sugar", "quantity": 0.5, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Fresh Coriander", "quantity": 2, "unit": "tbsp" }
    ],
    "preparation": [
      { "ingredient": "Tomato", "cut": "roughly chopped" },
      { "ingredient": "Green Chilies", "cut": "finely chopped" },
      { "ingredient": "Ginger", "cut": "grated" }
    ],
    "nutrition": { "protein": 4, "carbs": 16, "fat": 7, "fiber": 3, "sugar": 4 },
    "equipment": ["Pan", "Spatula"],
    "steps": [
      { "step": 1, "instruction": "Heat oil in a pan. Add mustard seeds and cumin. Once they splutter, add curry leaves and green chilies.", "time": 1 },
      { "step": 2, "instruction": "Add grated ginger and sauté for 30 seconds.", "time": 1 },
      { "step": 3, "instruction": "Add chopped tomatoes, turmeric, red chili powder, and salt. Mix well.", "time": 2 },
      { "step": 4, "instruction": "Cover and cook until tomatoes are completely soft and mushy, about 8–10 minutes.", "time": 10 },
      { "step": 5, "instruction": "Add coriander-cumin powder and sugar. Mash tomatoes slightly to form a chunky gravy.", "time": 2 },
      { "step": 6, "instruction": "Serve hot in a bowl. Top generously with sev just before serving. Garnish with fresh coriander.", "time": 1 }
    ],
    "tips": [
      "Always add sev just before serving — it turns soggy quickly.",
      "Use ripe, juicy tomatoes for the best flavor.",
      "A pinch of asafoetida (hing) in the tempering adds authentic flavor."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "quick", "everyday", "curry"]
  },
  {
    "id": "patra",
    "name": "Patra (Alu Vadi)",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 30,
    "prep_time": 20,
    "servings": 4,
    "calories": 170,
    "rating": 4.7,
    "reviews": 690,
    "image": "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
    "description": "Elegantly rolled colocasia leaves filled with a spiced chickpea batter, steamed and then tempered — a visually stunning and flavor-packed Gujarati snack.",
    "ingredients": [
      { "name": "Colocasia (Arbi) Leaves", "quantity": 8, "unit": "pcs" },
      { "name": "Besan (Chickpea Flour)", "quantity": 150, "unit": "g" },
      { "name": "Tamarind Pulp", "quantity": 2, "unit": "tbsp" },
      { "name": "Jaggery", "quantity": 2, "unit": "tbsp" },
      { "name": "Coconut (Grated)", "quantity": 3, "unit": "tbsp" },
      { "name": "Sesame Seeds", "quantity": 1, "unit": "tbsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Red Chili Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Coriander-Cumin Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Ginger-Green Chili Paste", "quantity": 1, "unit": "tbsp" },
      { "name": "Oil", "quantity": 2, "unit": "tbsp" },
      { "name": "Mustard Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Colocasia Leaves", "cut": "washed, stems removed, veins trimmed" }
    ],
    "nutrition": { "protein": 7, "carbs": 22, "fat": 7, "fiber": 4, "sugar": 5 },
    "equipment": ["Steamer", "Mixing Bowl", "Knife", "Pan"],
    "steps": [
      { "step": 1, "instruction": "Mix besan with tamarind pulp, jaggery, all spices, ginger-chili paste, coconut, sesame seeds, oil, and salt to form a thick spreadable paste.", "time": 5 },
      { "step": 2, "instruction": "Place a colocasia leaf with the underside (rough side) facing up. Spread a thin layer of batter over the leaf.", "time": 3 },
      { "step": 3, "instruction": "Place a second leaf on top, spread batter again. Repeat with 3–4 leaves per roll.", "time": 3 },
      { "step": 4, "instruction": "Fold the sides inward and roll tightly from the bottom up, like a log. Repeat with remaining leaves.", "time": 5 },
      { "step": 5, "instruction": "Steam the rolls for 20–25 minutes until firm and cooked through.", "time": 25 },
      { "step": 6, "instruction": "Cool slightly, then cut into 1-cm thick slices.", "time": 3 },
      { "step": 7, "instruction": "Shallow-fry slices in oil until golden and crisp on both sides. Or temper with mustard seeds, sesame seeds, and curry leaves.", "time": 5 },
      { "step": 8, "instruction": "Garnish with fresh coconut and coriander. Serve as a snack or starter.", "time": 1 }
    ],
    "tips": [
      "Trim the thick central rib from leaves to prevent tearing while rolling.",
      "The tamarind-jaggery combo is essential to neutralize the itchiness of colocasia.",
      "Shallow-frying after steaming gives a delightful crispy exterior."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "snack", "steamed", "festive"]
  },
  {
    "id": "mohanthal",
    "name": "Mohanthal",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 25,
    "prep_time": 10,
    "servings": 8,
    "calories": 380,
    "rating": 4.8,
    "reviews": 540,
    "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    "description": "A rich, fudgy chickpea flour sweet slow-roasted in ghee with cardamom and garnished with nuts — an indulgent Gujarati festive mithai.",
    "ingredients": [
      { "name": "Besan (Chickpea Flour)", "quantity": 200, "unit": "g" },
      { "name": "Ghee", "quantity": 100, "unit": "g" },
      { "name": "Sugar", "quantity": 150, "unit": "g" },
      { "name": "Water", "quantity": 80, "unit": "ml" },
      { "name": "Milk", "quantity": 4, "unit": "tbsp" },
      { "name": "Cardamom Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Nutmeg Powder", "quantity": 0.25, "unit": "tsp" },
      { "name": "Almonds", "quantity": 15, "unit": "pcs" },
      { "name": "Pistachios", "quantity": 10, "unit": "pcs" },
      { "name": "Saffron", "quantity": 10, "unit": "strands" }
    ],
    "preparation": [
      { "ingredient": "Almonds", "cut": "sliced" },
      { "ingredient": "Pistachios", "cut": "sliced" },
      { "ingredient": "Saffron", "cut": "soaked in 1 tbsp warm milk" }
    ],
    "nutrition": { "protein": 7, "carbs": 44, "fat": 20, "fiber": 2, "sugar": 30 },
    "equipment": ["Heavy-Bottom Pan", "Greased Tray", "Spatula"],
    "steps": [
      { "step": 1, "instruction": "Rub 2 tbsp ghee and 2 tbsp milk into the besan. Rub well with your palms until it resembles coarse breadcrumbs. Sieve through a colander.", "time": 5 },
      { "step": 2, "instruction": "Heat the remaining ghee in a heavy-bottom pan over low heat. Add the rubbed besan.", "time": 2 },
      { "step": 3, "instruction": "Roast the besan on low heat, stirring continuously, for 15–18 minutes until deep golden and aromatic.", "time": 18 },
      { "step": 4, "instruction": "Prepare a one-string sugar syrup: boil sugar and water together until it reaches one-string consistency.", "time": 5 },
      { "step": 5, "instruction": "Remove besan from heat. Quickly add cardamom, nutmeg, saffron milk, and pour the hot sugar syrup. Mix vigorously.", "time": 3 },
      { "step": 6, "instruction": "Pour into a greased tray and spread evenly. Garnish with sliced almonds and pistachios.", "time": 2 },
      { "step": 7, "instruction": "Let it set at room temperature for 1 hour, then cut into squares or diamonds.", "time": 60 }
    ],
    "tips": [
      "Low and slow roasting is the secret — do not rush this step on high heat.",
      "Work quickly once the sugar syrup is added as the mixture sets fast.",
      "Mohanthal keeps well for 1–2 weeks stored in an airtight container."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "sweet", "festive", "mithai"]
  },
  {
    "id": "khichdi",
    "name": "Gujarati Khichdi",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 20,
    "prep_time": 10,
    "servings": 4,
    "calories": 250,
    "rating": 4.6,
    "reviews": 980,
    "image": "https://images.unsplash.com/photo-1631292784640-2b24be784d5d?w=400",
    "description": "A wholesome, comforting rice and lentil porridge cooked with ghee and mild spices — the quintessential Gujarati soul food, traditionally paired with kadhi and pickle.",
    "ingredients": [
      { "name": "Rice", "quantity": 150, "unit": "g" },
      { "name": "Moong Dal (Yellow)", "quantity": 100, "unit": "g" },
      { "name": "Ghee", "quantity": 2, "unit": "tbsp" },
      { "name": "Cumin Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Cloves", "quantity": 3, "unit": "pcs" },
      { "name": "Bay Leaf", "quantity": 1, "unit": "pc" },
      { "name": "Cinnamon Stick", "quantity": 0.5, "unit": "inch" },
      { "name": "Peppercorns", "quantity": 4, "unit": "pcs" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Ginger", "quantity": 0.5, "unit": "inch" },
      { "name": "Green Chilies", "quantity": 2, "unit": "pcs" },
      { "name": "Salt", "quantity": 1.5, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Rice", "cut": "washed and soaked for 20 minutes" },
      { "ingredient": "Moong Dal", "cut": "washed" },
      { "ingredient": "Ginger", "cut": "grated" }
    ],
    "nutrition": { "protein": 11, "carbs": 42, "fat": 7, "fiber": 4, "sugar": 1 },
    "equipment": ["Pressure Cooker", "Tadka Pan"],
    "steps": [
      { "step": 1, "instruction": "Heat ghee in a pressure cooker. Add cumin, cloves, bay leaf, cinnamon, and peppercorns. Sauté for 30 seconds.", "time": 1 },
      { "step": 2, "instruction": "Add grated ginger and green chilies. Sauté briefly.", "time": 1 },
      { "step": 3, "instruction": "Add washed rice and dal. Stir to coat with ghee and spices.", "time": 1 },
      { "step": 4, "instruction": "Add turmeric, salt, and 5 cups of water. Mix well.", "time": 1 },
      { "step": 5, "instruction": "Pressure cook for 3 whistles on medium heat. Allow pressure to release naturally.", "time": 15 },
      { "step": 6, "instruction": "Open and mash lightly for a slightly mushy, flowing consistency. Adjust water if needed.", "time": 2 },
      { "step": 7, "instruction": "Serve hot with a generous drizzle of ghee on top, alongside kadhi, pickle, and papad.", "time": 1 }
    ],
    "tips": [
      "The classic Gujarati ratio is 1:1 rice to dal for a balanced khichdi.",
      "A flowing, slightly runny consistency is traditional — not dry and separate.",
      "Pair with Gujarati kadhi and mango pickle for the ultimate comfort meal."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "comfort-food", "healthy", "everyday"]
  },
  {
    "id": "surti_locho",
    "name": "Surti Locho",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 25,
    "prep_time": 15,
    "servings": 4,
    "calories": 190,
    "rating": 4.8,
    "reviews": 610,
    "image": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400",
    "description": "A deliberately half-cooked, crumbly steamed chickpea batter specialty from Surat, known for its unique soft-yet-crumbly texture and intensely flavorful toppings.",
    "ingredients": [
      { "name": "Chana Dal (Split Chickpeas)", "quantity": 200, "unit": "g" },
      { "name": "Urad Dal", "quantity": 50, "unit": "g" },
      { "name": "Ginger-Green Chili Paste", "quantity": 2, "unit": "tbsp" },
      { "name": "Eno Fruit Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Salt", "quantity": 1.5, "unit": "tsp" },
      { "name": "Sev", "quantity": 50, "unit": "g" },
      { "name": "Onion", "quantity": 1, "unit": "pc" },
      { "name": "Fresh Coriander", "quantity": 3, "unit": "tbsp" },
      { "name": "Green Chutney", "quantity": 3, "unit": "tbsp" },
      { "name": "Garlic Chutney", "quantity": 2, "unit": "tbsp" },
      { "name": "Butter", "quantity": 1, "unit": "tbsp" },
      { "name": "Masala (Chaat Masala)", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Chana Dal", "cut": "soaked overnight, coarsely ground" },
      { "ingredient": "Urad Dal", "cut": "soaked overnight, coarsely ground" },
      { "ingredient": "Onion", "cut": "finely chopped" }
    ],
    "nutrition": { "protein": 11, "carbs": 26, "fat": 7, "fiber": 5, "sugar": 2 },
    "equipment": ["Steamer", "Mixing Bowl", "Greased Pan"],
    "steps": [
      { "step": 1, "instruction": "Mix the coarsely ground chana and urad dal. Add ginger-chili paste, turmeric, and salt. Mix well.", "time": 5 },
      { "step": 2, "instruction": "Add Eno fruit salt to the batter, mix quickly, and pour into a greased steaming pan.", "time": 1 },
      { "step": 3, "instruction": "Steam for only 10–12 minutes — the batter should remain moist and crumbly (not fully set like dhokla). This is intentional.", "time": 12 },
      { "step": 4, "instruction": "Scoop the locho into a bowl or plate. Break it into crumbles — the texture should be soft and grainy.", "time": 2 },
      { "step": 5, "instruction": "Top with green chutney, garlic chutney, and a dollop of butter.", "time": 1 },
      { "step": 6, "instruction": "Add finely chopped onions, sev, fresh coriander, and a sprinkle of chaat masala.", "time": 1 },
      { "step": 7, "instruction": "Serve immediately while hot and fresh from the steamer.", "time": 1 }
    ],
    "tips": [
      "Locho is supposed to be underdone and crumbly — do not over-steam.",
      "The garlic chutney and butter are non-negotiable for authentic Surti flavor.",
      "Serve immediately as it loses its texture quickly."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "surat", "street-food", "snack"]
  },
  {
    "id": "fafda_jalebi",
    "name": "Fafda",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 20,
    "prep_time": 15,
    "servings": 4,
    "calories": 220,
    "rating": 4.7,
    "reviews": 830,
    "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    "description": "Crispy, savory strips made from chickpea flour — Gujarat's iconic Sunday morning street snack, traditionally eaten with jalebi, papaya chutney, and kadhi.",
    "ingredients": [
      { "name": "Besan (Chickpea Flour)", "quantity": 200, "unit": "g" },
      { "name": "Carom Seeds (Ajwain)", "quantity": 0.5, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.25, "unit": "tsp" },
      { "name": "Papad Khar (Sodium Bicarbonate)", "quantity": 0.25, "unit": "tsp" },
      { "name": "Black Pepper", "quantity": 0.5, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Oil (for dough)", "quantity": 1, "unit": "tbsp" },
      { "name": "Oil (for frying)", "quantity": 500, "unit": "ml" }
    ],
    "preparation": [],
    "nutrition": { "protein": 9, "carbs": 26, "fat": 12, "fiber": 3, "sugar": 1 },
    "equipment": ["Mixing Bowl", "Deep Kadhai", "Fafda Press or Hands"],
    "steps": [
      { "step": 1, "instruction": "Mix besan, ajwain, turmeric, black pepper, papad khar, salt, and oil. Knead into a stiff dough using minimal water.", "time": 7 },
      { "step": 2, "instruction": "Divide the dough into small balls. Roll each into a thin long strip or press with a fafda press.", "time": 8 },
      { "step": 3, "instruction": "Heat oil in a kadhai over medium heat. Test with a small piece — it should rise slowly.", "time": 3 },
      { "step": 4, "instruction": "Gently slide fafda strips into the oil. Fry on medium-low heat until completely golden and crisp.", "time": 8 },
      { "step": 5, "instruction": "Drain on paper towels. Serve immediately with jalebi, raw papaya chutney, and kadhi.", "time": 1 }
    ],
    "tips": [
      "Papad khar (or baking soda) is key for the characteristic crispy, light texture.",
      "Fry on medium-low heat — high heat turns them golden outside but raw inside.",
      "Knead the dough very stiff for crispier fafda."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "street-food", "crispy", "breakfast"]
  },
  {
    "id": "handvo",
    "name": "Handvo",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 40,
    "prep_time": 20,
    "servings": 6,
    "calories": 200,
    "rating": 4.6,
    "reviews": 490,
    "image": "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400",
    "description": "A savory baked or pan-fried lentil and vegetable cake with a crunchy sesame crust — a nutritious, filling Gujarati tea-time snack.",
    "ingredients": [
      { "name": "Rice", "quantity": 100, "unit": "g" },
      { "name": "Chana Dal", "quantity": 50, "unit": "g" },
      { "name": "Moong Dal", "quantity": 50, "unit": "g" },
      { "name": "Urad Dal", "quantity": 30, "unit": "g" },
      { "name": "Curd (Yogurt)", "quantity": 100, "unit": "ml" },
      { "name": "Bottle Gourd (Lauki)", "quantity": 150, "unit": "g" },
      { "name": "Carrot", "quantity": 1, "unit": "pc" },
      { "name": "Eno Fruit Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Sesame Seeds", "quantity": 2, "unit": "tbsp" },
      { "name": "Ginger-Green Chili Paste", "quantity": 1, "unit": "tbsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Red Chili Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Mustard Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Oil", "quantity": 3, "unit": "tbsp" },
      { "name": "Salt", "quantity": 1.5, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Rice and Dals", "cut": "soaked together overnight, then coarsely ground" },
      { "ingredient": "Bottle Gourd", "cut": "grated" },
      { "ingredient": "Carrot", "cut": "grated" }
    ],
    "nutrition": { "protein": 10, "carbs": 28, "fat": 8, "fiber": 4, "sugar": 2 },
    "equipment": ["Mixing Bowl", "Heavy Non-Stick Pan with Lid", "Grater"],
    "steps": [
      { "step": 1, "instruction": "Mix ground batter with curd, grated bottle gourd, carrot, ginger-chili paste, all spices, and salt. Ferment for 6–8 hours or overnight.", "time": 8 },
      { "step": 2, "instruction": "Add Eno to the fermented batter and mix gently.", "time": 1 },
      { "step": 3, "instruction": "Heat 2 tbsp oil in a heavy pan. Add mustard seeds and sesame seeds and let them crackle.", "time": 2 },
      { "step": 4, "instruction": "Pour the batter into the pan. Sprinkle sesame seeds on top. Cover with a lid.", "time": 2 },
      { "step": 5, "instruction": "Cook on low heat for 20 minutes until the bottom forms a golden crust.", "time": 20 },
      { "step": 6, "instruction": "Carefully flip the handvo. Add 1 tbsp oil around the edges. Cover and cook for 15 more minutes.", "time": 15 },
      { "step": 7, "instruction": "Cut into wedges and serve hot with green chutney.", "time": 2 }
    ],
    "tips": [
      "Fermentation is key for authentic tang and fluffiness — don't skip it.",
      "A cast-iron pan gives the best crust.",
      "Grate and squeeze excess water from bottle gourd before adding to batter."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "baked", "snack", "healthy"]
  },
  {
    "id": "muthia",
    "name": "Muthia",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 25,
    "prep_time": 15,
    "servings": 4,
    "calories": 160,
    "rating": 4.5,
    "reviews": 580,
    "image": "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
    "description": "Steamed and tempered dumplings made from wheat flour, besan, and fenugreek leaves — wholesome, versatile, and delicious as a snack or side dish.",
    "ingredients": [
      { "name": "Whole Wheat Flour", "quantity": 100, "unit": "g" },
      { "name": "Besan (Chickpea Flour)", "quantity": 50, "unit": "g" },
      { "name": "Fresh Fenugreek (Methi) Leaves", "quantity": 50, "unit": "g" },
      { "name": "Curd (Yogurt)", "quantity": 2, "unit": "tbsp" },
      { "name": "Ginger-Chili Paste", "quantity": 1, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Red Chili Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Sugar", "quantity": 1, "unit": "tsp" },
      { "name": "Sesame Seeds", "quantity": 1, "unit": "tbsp" },
      { "name": "Eno Fruit Salt", "quantity": 0.5, "unit": "tsp" },
      { "name": "Oil", "quantity": 2, "unit": "tbsp" },
      { "name": "Mustard Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Curry Leaves", "quantity": 6, "unit": "pcs" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Fresh Fenugreek Leaves", "cut": "finely chopped" }
    ],
    "nutrition": { "protein": 7, "carbs": 22, "fat": 6, "fiber": 4, "sugar": 2 },
    "equipment": ["Steamer", "Mixing Bowl", "Pan"],
    "steps": [
      { "step": 1, "instruction": "Mix wheat flour, besan, methi, curd, all spices, sesame seeds, ginger-chili paste, sugar, and salt. Add Eno and mix.", "time": 5 },
      { "step": 2, "instruction": "Knead into a soft but firm dough using minimal water.", "time": 5 },
      { "step": 3, "instruction": "Shape into cylindrical rolls using your palms (muthia means 'fist').", "time": 5 },
      { "step": 4, "instruction": "Steam for 20 minutes until firm and cooked through. A toothpick should come out clean.", "time": 20 },
      { "step": 5, "instruction": "Cool and slice into 1.5cm thick rounds.", "time": 3 },
      { "step": 6, "instruction": "Heat oil in a pan. Add mustard seeds and curry leaves. Add sliced muthia and toss until golden.", "time": 5 },
      { "step": 7, "instruction": "Serve hot with green chutney and a cup of chai.", "time": 1 }
    ],
    "tips": [
      "Dough should be firm enough to shape — not too sticky.",
      "Muthias can be made ahead and tempered just before serving.",
      "Substitute spinach or grated bottle gourd for the methi as a variation."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "steamed", "snack", "healthy"]
  },
  {
    "id": "basundi",
    "name": "Basundi",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 45,
    "prep_time": 5,
    "servings": 4,
    "calories": 290,
    "rating": 4.8,
    "reviews": 720,
    "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
    "description": "A rich, slow-reduced condensed milk dessert infused with saffron, cardamom, and nuts — Gujarat's beloved festive sweet served chilled.",
    "ingredients": [
      { "name": "Full-Fat Milk", "quantity": 1, "unit": "l" },
      { "name": "Sugar", "quantity": 80, "unit": "g" },
      { "name": "Cardamom Powder", "quantity": 0.5, "unit": "tsp" },
      { "name": "Saffron", "quantity": 15, "unit": "strands" },
      { "name": "Almonds", "quantity": 15, "unit": "pcs" },
      { "name": "Pistachios", "quantity": 10, "unit": "pcs" },
      { "name": "Charoli (Chironji)", "quantity": 1, "unit": "tbsp" },
      { "name": "Rose Water", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Almonds", "cut": "blanched and sliced" },
      { "ingredient": "Pistachios", "cut": "sliced" },
      { "ingredient": "Saffron", "cut": "soaked in 2 tbsp warm milk" }
    ],
    "nutrition": { "protein": 10, "carbs": 34, "fat": 14, "fiber": 0, "sugar": 30 },
    "equipment": ["Heavy-Bottom Pan", "Spatula"],
    "steps": [
      { "step": 1, "instruction": "Heat full-fat milk in a heavy-bottom pan over medium heat, stirring frequently to prevent scorching.", "time": 5 },
      { "step": 2, "instruction": "Once it reaches a boil, reduce heat to low-medium. Continue cooking, stirring every few minutes.", "time": 30 },
      { "step": 3, "instruction": "Cook until the milk reduces to approximately half its volume. Scrape the cream from the sides and stir it back in.", "time": 15 },
      { "step": 4, "instruction": "Add sugar and stir until dissolved.", "time": 2 },
      { "step": 5, "instruction": "Add saffron milk, cardamom powder, and rose water. Stir well.", "time": 1 },
      { "step": 6, "instruction": "Add sliced nuts and charoli. Simmer for 2 more minutes.", "time": 2 },
      { "step": 7, "instruction": "Allow to cool. Refrigerate for at least 2 hours. Serve chilled in small bowls or glasses.", "time": 120 }
    ],
    "tips": [
      "Low and slow is the secret — do not rush the reduction on high heat.",
      "Stir frequently to prevent the milk solids from sticking and burning.",
      "Basundi tastes best when served cold the next day."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "dessert", "festive", "sweet"]
  },
  {
    "id": "shrikhand",
    "name": "Shrikhand",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 0,
    "prep_time": 15,
    "servings": 4,
    "calories": 260,
    "rating": 4.8,
    "reviews": 1100,
    "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
    "description": "A lusciously smooth, sweet strained yogurt dessert flavored with saffron, cardamom, and nuts — light, creamy, and irresistibly refreshing.",
    "ingredients": [
      { "name": "Hung Curd (Thick Yogurt)", "quantity": 500, "unit": "g" },
      { "name": "Powdered Sugar", "quantity": 100, "unit": "g" },
      { "name": "Saffron", "quantity": 15, "unit": "strands" },
      { "name": "Cardamom Powder", "quantity": 0.5, "unit": "tsp" },
      { "name": "Almonds", "quantity": 10, "unit": "pcs" },
      { "name": "Pistachios", "quantity": 10, "unit": "pcs" },
      { "name": "Nutmeg Powder", "quantity": 0.125, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Curd", "cut": "hung in muslin cloth overnight to drain whey" },
      { "ingredient": "Almonds", "cut": "blanched and slivered" },
      { "ingredient": "Pistachios", "cut": "slivered" },
      { "ingredient": "Saffron", "cut": "dissolved in 1 tbsp warm milk" }
    ],
    "nutrition": { "protein": 9, "carbs": 36, "fat": 10, "fiber": 0, "sugar": 32 },
    "equipment": ["Muslin Cloth", "Mixing Bowl", "Whisk"],
    "steps": [
      { "step": 1, "instruction": "Ensure the curd is well-strained overnight — it should be thick like cream cheese.", "time": 5 },
      { "step": 2, "instruction": "Whisk the hung curd until smooth and creamy, breaking all lumps.", "time": 3 },
      { "step": 3, "instruction": "Add powdered sugar gradually and whisk until completely dissolved and the mixture is silky.", "time": 3 },
      { "step": 4, "instruction": "Add saffron milk, cardamom powder, and nutmeg. Fold in gently.", "time": 1 },
      { "step": 5, "instruction": "Refrigerate for at least 2 hours until chilled and set.", "time": 120 },
      { "step": 6, "instruction": "Serve in individual bowls. Garnish generously with slivered almonds and pistachios.", "time": 2 }
    ],
    "tips": [
      "The better the quality of hung curd, the creamier the shrikhand.",
      "Use powdered sugar, not granulated — it dissolves smoothly without graininess.",
      "Shrikhand is traditionally served with hot puri for the beloved Puri-Shrikhand combination."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "dessert", "festive", "no-cook"]
  },
  {
    "id": "papdi_gathiya",
    "name": "Papdi Gathiya",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Medium",
    "cook_time": 20,
    "prep_time": 10,
    "servings": 6,
    "calories": 200,
    "rating": 4.6,
    "reviews": 640,
    "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    "description": "Thin, crispy fried chickpea flour crackers with a distinct carom seed flavor — a ubiquitous Gujarati farsan that pairs perfectly with chai.",
    "ingredients": [
      { "name": "Besan (Chickpea Flour)", "quantity": 250, "unit": "g" },
      { "name": "Carom Seeds (Ajwain)", "quantity": 1, "unit": "tsp" },
      { "name": "Papad Khar", "quantity": 0.5, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.25, "unit": "tsp" },
      { "name": "Black Pepper Powder", "quantity": 0.5, "unit": "tsp" },
      { "name": "Oil (for dough)", "quantity": 2, "unit": "tbsp" },
      { "name": "Oil (for frying)", "quantity": 500, "unit": "ml" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [],
    "nutrition": { "protein": 9, "carbs": 24, "fat": 11, "fiber": 3, "sugar": 1 },
    "equipment": ["Mixing Bowl", "Sev Press or Gathiya Mold", "Deep Kadhai"],
    "steps": [
      { "step": 1, "instruction": "Mix besan, ajwain, papad khar, turmeric, black pepper, salt, and oil. Knead into a firm, smooth dough using water.", "time": 7 },
      { "step": 2, "instruction": "Fill the sev press with the flat disc attachment. Press long ribbons of dough directly into hot oil.", "time": 5 },
      { "step": 3, "instruction": "Heat oil to 160°C (medium heat). Fry the gathiya on low-medium heat, turning gently.", "time": 10 },
      { "step": 4, "instruction": "Fry until completely golden and crisp. They should snap cleanly when bent.", "time": 8 },
      { "step": 5, "instruction": "Drain on paper towels. Cool completely before storing in an airtight container.", "time": 5 }
    ],
    "tips": [
      "Fry on low heat for crunch — high heat causes browning outside but chewy center.",
      "Papad khar ensures the characteristic light, crispy bite.",
      "Gathiya stays fresh and crispy for up to 2 weeks in an airtight container."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "snack", "farsan", "crispy"]
  },
  {
    "id": "ringan_no_olo",
    "name": "Ringan No Olo",
    "cuisine": "Gujarati",
    "diet": "Vegetarian",
    "difficulty": "Easy",
    "cook_time": 25,
    "prep_time": 10,
    "servings": 4,
    "calories": 130,
    "rating": 4.5,
    "reviews": 410,
    "image": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    "description": "A smoky, fire-roasted brinjal mash cooked with minimal spices — Gujarat's rustic take on baingan bharta, prized for its deep, charred flavor.",
    "ingredients": [
      { "name": "Large Brinjal (Eggplant)", "quantity": 2, "unit": "pcs" },
      { "name": "Onion", "quantity": 1, "unit": "pc" },
      { "name": "Tomato", "quantity": 1, "unit": "pc" },
      { "name": "Green Chilies", "quantity": 2, "unit": "pcs" },
      { "name": "Ginger", "quantity": 0.5, "unit": "inch" },
      { "name": "Garlic", "quantity": 3, "unit": "cloves" },
      { "name": "Oil", "quantity": 2, "unit": "tbsp" },
      { "name": "Mustard Seeds", "quantity": 1, "unit": "tsp" },
      { "name": "Cumin Seeds", "quantity": 0.5, "unit": "tsp" },
      { "name": "Turmeric", "quantity": 0.5, "unit": "tsp" },
      { "name": "Coriander-Cumin Powder", "quantity": 1, "unit": "tsp" },
      { "name": "Salt", "quantity": 1, "unit": "tsp" },
      { "name": "Fresh Coriander", "quantity": 2, "unit": "tbsp" },
      { "name": "Lemon Juice", "quantity": 1, "unit": "tsp" }
    ],
    "preparation": [
      { "ingredient": "Brinjal", "cut": "fire-roasted whole until charred, then peeled and mashed" },
      { "ingredient": "Onion", "cut": "finely chopped" },
      { "ingredient": "Tomato", "cut": "finely chopped" }
    ],
    "nutrition": { "protein": 3, "carbs": 14, "fat": 7, "fiber": 5, "sugar": 6 },
    "equipment": ["Gas Flame or Grill", "Pan", "Mixing Bowl"],
    "steps": [
      { "step": 1, "instruction": "Roast the brinjals directly over a gas flame, turning frequently until completely charred on the outside and soft inside.", "time": 12 },
      { "step": 2, "instruction": "Peel off the charred skin under running water. Mash the pulp well and set aside.", "time": 5 },
      { "step": 3, "instruction": "Heat oil in a pan. Add mustard seeds, cumin, and let them crackle.", "time": 1 },
      { "step": 4, "instruction": "Add chopped onions, green chilies, ginger, and garlic. Sauté until golden.", "time": 5 },
      { "step": 5, "instruction": "Add tomatoes, turmeric, and coriander-cumin powder. Cook until tomatoes break down.", "time": 5 },
      { "step": 6, "instruction": "Add mashed brinjal and salt. Mix well. Cook for 3–4 minutes.", "time": 4 },
      { "step": 7, "instruction": "Squeeze lemon juice on top. Garnish with fresh coriander. Serve with bajra rotla or thepla.", "time": 1 }
    ],
    "tips": [
      "The more charred the brinjal, the smokier and better the flavor.",
      "Do not rinse out all the smoky juices — they're where the flavor lives.",
      "Serve with bajri rotla for an authentic Gujarati village meal."
    ],
    "tags": ["popular", "gujarati", "vegetarian", "smoky", "rustic", "everyday"]
  }
];

export default recipes;