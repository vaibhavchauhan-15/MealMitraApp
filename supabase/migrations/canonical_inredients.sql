-- ── Seed: common English + Hindi ingredient aliases ───────────────────────────
INSERT INTO public.ingredient_aliases (alias, canonical) VALUES
  -- Eggs
  ('eggs',                 'egg'),         ('anda',               'egg'),
  ('anday',                'egg'),
  -- Tomato
  ('tomatoes',             'tomato'),      ('tamatar',            'tomato'),
  -- Onion
  ('onions',               'onion'),       ('pyaz',               'onion'),
  ('pyaaz',                'onion'),
  -- Potato
  ('potatoes',             'potato'),      ('aloo',               'potato'),
  ('alu',                  'potato'),
  -- Garlic
  ('garlic cloves',        'garlic'),      ('garlic clove',       'garlic'),
  ('lahsun',               'garlic'),
  -- Ginger
  ('adrak',                'ginger'),
  -- Chilli
  ('green chilli',         'chilli'),      ('green chili',        'chilli'),
  ('chili',                'chilli'),      ('mirchi',             'chilli'),
  ('hari mirch',           'chilli'),      ('chilli pepper',      'chilli'),
  ('red chili',            'red chilli'),  ('lal mirch',          'red chilli'),
  ('chilli powder',        'red chilli'),  ('red chilli powder',  'red chilli'),
  -- Butter
  ('makhan',               'butter'),
  -- Oil
  ('tel',                  'oil'),         ('cooking oil',        'oil'),
  -- Salt
  ('namak',                'salt'),        ('rock salt',          'salt'),
  -- Water
  ('paani',                'water'),
  -- Milk
  ('doodh',                'milk'),
  -- Flour
  ('maida',                'flour'),       ('all purpose flour',  'flour'),
  ('wheat flour',          'atta'),        ('gehun ka atta',      'atta'),
  -- Rice
  ('chawal',               'rice'),        ('basmati',            'rice'),
  -- Cumin
  ('jeera',                'cumin'),       ('cumin seeds',        'cumin'),
  -- Coriander
  ('dhania',               'coriander'),   ('cilantro',           'coriander'),
  ('coriander leaves',     'coriander'),   ('coriander powder',   'coriander'),
  -- Turmeric
  ('haldi',                'turmeric'),    ('turmeric powder',    'turmeric'),
  -- Mustard
  ('mustard seeds',        'mustard'),     ('sarso',              'mustard'),
  ('rai',                  'mustard'),
  -- Paneer
  ('cottage cheese',       'paneer'),
  -- Chickpea
  ('chickpeas',            'chickpea'),    ('chana',              'chickpea'),
  ('chole',                'chickpea'),    ('kabuli chana',       'chickpea'),
  -- Lentil
  ('lentils',              'lentil'),      ('dal',                'lentil'),
  ('daal',                 'lentil'),
  -- Spinach
  ('palak',                'spinach'),
  -- Pea
  ('peas',                 'pea'),         ('matar',              'pea'),
  ('mutter',               'pea'),
  -- Carrot
  ('carrots',              'carrot'),      ('gajar',              'carrot'),
  -- Cauliflower
  ('gobhi',                'cauliflower'), ('gobi',               'cauliflower'),
  -- Capsicum
  ('bell pepper',          'capsicum'),    ('shimla mirch',       'capsicum'),
  ('capsicums',            'capsicum'),
  -- Yogurt
  ('curd',                 'yogurt'),      ('dahi',               'yogurt'),
  -- Cream
  ('malai',                'cream'),       ('heavy cream',        'cream'),
  ('fresh cream',          'cream'),
  -- Sugar
  ('cheeni',               'sugar'),       ('shakkar',            'sugar'),
  -- Lemon
  ('nimbu',                'lemon'),       ('lime',               'lemon'),
  ('lemon juice',          'lemon'),
  -- Coconut
  ('nariyal',              'coconut'),     ('coconut milk',       'coconut'),
  -- Bread
  ('pav',                  'bread'),       ('bun',                'bread'),
  -- Gram flour
  ('besan',                'gram flour')
ON CONFLICT (alias) DO NOTHING;