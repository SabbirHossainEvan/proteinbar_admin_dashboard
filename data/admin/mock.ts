export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered";

export const dashboardStats = [
  { title: "Today Orders", value: "84" },
  { title: "Monthly Revenue", value: "$26,940" },
  { title: "Menu Items", value: "68" },
  { title: "Active Subscribers", value: "512" },
];

export const latestOrders = [
  { id: "ORD-2082", customer: "Sara Benali", amount: "$17.00", status: "Pending" as OrderStatus, date: "Mar 03, 2026" },
  { id: "ORD-2081", customer: "Yassine Hadi", amount: "$24.00", status: "Processing" as OrderStatus, date: "Mar 03, 2026" },
  { id: "ORD-2080", customer: "Nora Ilyas", amount: "$13.00", status: "Shipped" as OrderStatus, date: "Mar 02, 2026" },
  { id: "ORD-2079", customer: "Amine Tahiri", amount: "$28.00", status: "Delivered" as OrderStatus, date: "Mar 02, 2026" },
  { id: "ORD-2078", customer: "Rania Karim", amount: "$19.00", status: "Delivered" as OrderStatus, date: "Mar 01, 2026" },
];

export const products = [
  { sku: "MENU-101", name: "Chicken Burrito Bowl", collection: "Bowls", calories: 510, protein: "38g", carbs: "42g", fat: "18g", price: "$11.90" },
  { sku: "MENU-102", name: "Steak Protein Wrap", collection: "Wraps", calories: 470, protein: "34g", carbs: "39g", fat: "16g", price: "$10.50" },
  { sku: "MENU-103", name: "Tuna Avocado Salad", collection: "Salads", calories: 390, protein: "31g", carbs: "17g", fat: "22g", price: "$9.80" },
  { sku: "MENU-104", name: "Berry Oats Smoothie", collection: "Smoothies", calories: 290, protein: "21g", carbs: "34g", fat: "7g", price: "$6.40" },
  { sku: "MENU-105", name: "Egg White Omelette Box", collection: "Breakfast", calories: 350, protein: "29g", carbs: "14g", fat: "16g", price: "$8.20" },
];

export const orders = [
  { id: "ORD-2082", customer: "Sara Benali", total: "$17.00", itemCount: 2, status: "Pending" as OrderStatus, date: "Mar 03, 2026" },
  { id: "ORD-2081", customer: "Yassine Hadi", total: "$24.00", itemCount: 3, status: "Processing" as OrderStatus, date: "Mar 03, 2026" },
  { id: "ORD-2080", customer: "Nora Ilyas", total: "$13.00", itemCount: 1, status: "Shipped" as OrderStatus, date: "Mar 02, 2026" },
  { id: "ORD-2079", customer: "Amine Tahiri", total: "$28.00", itemCount: 3, status: "Delivered" as OrderStatus, date: "Mar 02, 2026" },
  { id: "ORD-2078", customer: "Rania Karim", total: "$19.00", itemCount: 2, status: "Delivered" as OrderStatus, date: "Mar 01, 2026" },
];

export const customers = [
  { id: "LOC-1", name: "Proteinbar CFC", email: "cfc@proteinbar.ma", city: "Casablanca", orders: 1540, totalSpent: "Open 08:00 - 23:00" },
  { id: "LOC-2", name: "Proteinbar Bourgogne", email: "bourgogne@proteinbar.ma", city: "Casablanca", orders: 1293, totalSpent: "Open 08:00 - 23:00" },
  { id: "LOC-3", name: "Delivery Hub", email: "delivery@proteinbar.ma", city: "Casablanca", orders: 2432, totalSpent: "City-wide delivery" },
];

export const monthlyPlans = [
  {
    id: "PLAN-CUSTOM",
    name: "Custom Plan",
    basePrice: "From $189/mo",
    members: 124,
    status: "Active",
    description: "Build your own monthly subscription with meals and snacks aligned with your fitness goals.",
  },
  {
    id: "PLAN-SUPER-SAVER",
    name: "Super Saver Subscription",
    basePrice: "$209/mo",
    members: 188,
    status: "Active",
    isNew: true,
    description: "A balanced monthly plan focused on daily consistency, healthy variety, and affordable pricing.",
  },
  {
    id: "PLAN-KIDS",
    name: "Kids Meal Plan",
    basePrice: "$169/mo",
    members: 54,
    status: "Active",
    description: "Nutritious portion-controlled meals for children with family-friendly options and better ingredients.",
  },
  {
    id: "PLAN-RAMADAN-LOSE",
    name: "Ramadan Lose Weight",
    basePrice: "$219/mo",
    members: 32,
    status: "Active",
    description: "Smart calorie control for Ramadan with satisfying meals and clean ingredients.",
  },
  {
    id: "PLAN-RAMADAN-GAIN",
    name: "Ramadan Gain Weight",
    basePrice: "$229/mo",
    members: 21,
    status: "Active",
    description: "Higher-calorie Ramadan structure for healthy weight gain and stronger recovery.",
  },
  {
    id: "PLAN-SANDWICH",
    name: "Sandwich Subscription",
    basePrice: "$179/mo",
    members: 67,
    status: "Active",
    description: "Quick and protein-focused monthly option with practical daily meal convenience.",
  },
  {
    id: "PLAN-LOSE",
    name: "Lose Weight",
    basePrice: "$199/mo",
    members: 95,
    status: "Active",
    description: "A guided deficit approach with portioned meals that help cut fat while staying energized.",
  },
  {
    id: "PLAN-GAIN",
    name: "Gain Weight",
    basePrice: "$229/mo",
    members: 71,
    status: "Active",
    description: "Controlled calorie surplus with nutrient-dense meals to support healthy mass gain.",
  },
  {
    id: "PLAN-DETOX",
    name: "Detox Plan",
    basePrice: "$159/mo",
    members: 42,
    status: "Active",
    description: "A lighter monthly plan with clean hydration and fresh ingredient combinations.",
  },
  {
    id: "PLAN-KETO",
    name: "Keto Plan",
    basePrice: "$239/mo",
    members: 49,
    status: "Active",
    description: "Low-carb, high-fat meal structure for people following ketogenic nutrition.",
  },
  {
    id: "PLAN-VEGAN",
    name: "Vegan Diet",
    basePrice: "$209/mo",
    members: 64,
    status: "Active",
    description: "Plant-based monthly meals with high-fiber ingredients and complete daily variety.",
  },
  {
    id: "PLAN-PESCATARIAN",
    name: "Pescatarian Diet",
    basePrice: "$229/mo",
    members: 28,
    status: "Active",
    description: "Seafood-forward meals with vegetables and grains for balanced, lighter nutrition.",
  },
  {
    id: "PLAN-OVO-VEG",
    name: "Ovo-Veg Diet",
    basePrice: "$199/mo",
    members: 34,
    status: "Active",
    description: "Vegetarian structure including eggs for higher protein and better satiety.",
  },
  {
    id: "PLAN-LACTO",
    name: "Lacto Diet Plan",
    basePrice: "$199/mo",
    members: 29,
    status: "Active",
    description: "Vegetarian monthly plan that includes dairy while avoiding egg-based meals.",
  },
];

export const monthlyPlanFlow = [
  { step: "Step 1", title: "Choose plan type" },
  { step: "Step 2", title: "Set meals, snacks and days" },
  { step: "Step 3", title: "Pick delivery days" },
  { step: "Step 4", title: "Select start date and address" },
  { step: "Step 5", title: "Proceed to checkout" },
];

export const subscriptions = [
  { id: "SUB-9201", customer: "Sara Benali", plan: "Gold Plan", nextBilling: "Mar 12, 2026", status: "Active" },
  { id: "SUB-9202", customer: "Yassine Hadi", plan: "Premium Plan", nextBilling: "Mar 08, 2026", status: "Active" },
  { id: "SUB-9203", customer: "Nora Ilyas", plan: "Silver Plan", nextBilling: "Mar 06, 2026", status: "Trial" },
  { id: "SUB-9204", customer: "Amine Tahiri", plan: "Gold Plan", nextBilling: "Mar 22, 2026", status: "Paused" },
  { id: "SUB-9205", customer: "Rania Karim", plan: "Silver Plan", nextBilling: "Mar 18, 2026", status: "Cancelled" },
];

export const contentSections = [
  { title: "Homepage Hero", description: "Main title, CTA, and background media for home page." },
  { title: "Monthly Plan Banner", description: "Promo strip and offer copy shown before plan cards." },
  { title: "Why Proteinbar", description: "Health, no-oil, macro-focused messaging blocks." },
  { title: "Testimonials", description: "Customer reviews and star ratings shown on home page." },
  { title: "Footer Links", description: "About, contact, legal and social link groups." },
];

export const settingsBlocks = [
  { title: "Contact Information", description: "Phone, WhatsApp, support email and map coordinates." },
  { title: "Delivery Settings", description: "Delivery zones, fee slabs and cut-off times." },
  { title: "SEO Settings", description: "Meta title, description and social preview content." },
  { title: "Notification Settings", description: "Order and subscription alerts for customers/admin." },
  { title: "Security Settings", description: "Admin password policies and session duration." },
];
