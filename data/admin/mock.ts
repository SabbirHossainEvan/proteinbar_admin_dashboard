export type OrderStatus = "Pending" | "Confirmed" | "Prepared" | "Delivered";

export type ProductCategory = "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Add-on" | "Ingredient";

export type ProductAvailability = "Active" | "Inactive";

export type MenuMealType = "Breakfast" | "Lunch" | "Dinner";

export type ConfirmationStatus = "Pending" | "Confirmed" | "Call back" | "No answer";

export const productCategories: ProductCategory[] = ["Breakfast", "Lunch", "Dinner", "Snack", "Add-on", "Ingredient"];
export const menuMealTypes: MenuMealType[] = ["Breakfast", "Lunch", "Dinner"];
export const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const dashboardStats = [
  { title: "Today Orders", value: "84" },
  { title: "Daily Production", value: "126 Meals" },
  { title: "Active Menu Cards", value: "42" },
  { title: "Active Subscribers", value: "512" },
];

export const latestOrders = [
  { id: "ORD-2082", customer: "Sara Benali", amount: "$17.00", status: "Pending" as OrderStatus, date: "Mar 03, 2026" },
  { id: "ORD-2081", customer: "Yassine Hadi", amount: "$24.00", status: "Confirmed" as OrderStatus, date: "Mar 03, 2026" },
  { id: "ORD-2080", customer: "Nora Ilyas", amount: "$13.00", status: "Prepared" as OrderStatus, date: "Mar 02, 2026" },
  { id: "ORD-2079", customer: "Amine Tahiri", amount: "$28.00", status: "Delivered" as OrderStatus, date: "Mar 02, 2026" },
  { id: "ORD-2078", customer: "Rania Karim", amount: "$19.00", status: "Delivered" as OrderStatus, date: "Mar 01, 2026" },
];

export const products = [
  {
    sku: "PRD-101",
    name: "Chicken Burrito Bowl",
    category: "Lunch" as ProductCategory,
    price: "$11.90",
    kcal: 510,
    protein: "38g",
    carbs: "42g",
    fat: "18g",
    tags: ["high-protein", "balanced"],
    allergens: ["dairy"],
    availability: "Active" as ProductAvailability,
  },
  {
    sku: "PRD-102",
    name: "Steak Protein Wrap",
    category: "Lunch" as ProductCategory,
    price: "$10.50",
    kcal: 470,
    protein: "34g",
    carbs: "39g",
    fat: "16g",
    tags: ["muscle-gain"],
    allergens: ["gluten"],
    availability: "Active" as ProductAvailability,
  },
  {
    sku: "PRD-103",
    name: "Berry Oats Smoothie",
    category: "Snack" as ProductCategory,
    price: "$6.40",
    kcal: 290,
    protein: "21g",
    carbs: "34g",
    fat: "7g",
    tags: ["grab-and-go"],
    allergens: ["dairy"],
    availability: "Active" as ProductAvailability,
  },
  {
    sku: "PRD-104",
    name: "Extra Chicken Add-on",
    category: "Add-on" as ProductCategory,
    price: "$2.50",
    kcal: 120,
    protein: "22g",
    carbs: "0g",
    fat: "3g",
    tags: ["extra-protein"],
    allergens: [],
    availability: "Inactive" as ProductAvailability,
  },
];

export const menuItems = [
  {
    id: "MENU-901",
    title: "High Protein Lunch Box",
    linkedProductSkus: ["PRD-101", "PRD-104"],
    visibleDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    timeSlots: ["12:00-14:00", "14:00-16:00"],
    mealTypes: ["Lunch" as MenuMealType],
    planCompatibility: ["Weight Loss", "Muscle Gain"],
    priority: 1,
    status: "Visible",
  },
  {
    id: "MENU-902",
    title: "Quick Breakfast Combo",
    linkedProductSkus: ["PRD-103"],
    visibleDays: ["Sun", "Mon", "Tue", "Wed", "Thu"],
    timeSlots: ["08:00-10:00"],
    mealTypes: ["Breakfast" as MenuMealType],
    planCompatibility: ["Standard", "Keto"],
    priority: 2,
    status: "Visible",
  },
];

export const orders = [
  {
    id: "ORD-2082",
    client: "Sara Benali",
    phone: "+212 600 000 111",
    status: "Pending" as OrderStatus,
    confirmationStatus: "Pending" as ConfirmationStatus,
    plan: "Weight Loss",
    orderType: "Delivery",
    location: "CFC Pickup Hub",
    payment: "Paid",
    schedule: "Mon, Wed, Fri - 12:00-14:00",
    date: "Mar 03, 2026",
    total: "$17.00",
    items: [
      { name: "Chicken Burrito Bowl", qty: 1, macros: "510 kcal | P38 C42 F18" },
      { name: "Berry Oats Smoothie", qty: 1, macros: "290 kcal | P21 C34 F7" },
    ],
    notes: "Ring bell once.",
    subscriptionInfo: "3 days/week for 4 weeks",
    auditLog: [
      { at: "Mar 03, 2026 09:12", by: "Agent Jannat", action: "Created order" },
      { at: "Mar 03, 2026 09:30", by: "System", action: "Payment marked paid" },
    ],
  },
  {
    id: "ORD-2081",
    client: "Yassine Hadi",
    phone: "+212 600 000 222",
    status: "Confirmed" as OrderStatus,
    confirmationStatus: "Confirmed" as ConfirmationStatus,
    plan: "Muscle Gain",
    orderType: "Pickup",
    location: "Bourgogne Branch",
    payment: "COD",
    schedule: "Tue, Thu, Sat - 18:00-20:00",
    date: "Mar 03, 2026",
    total: "$24.00",
    items: [
      { name: "Steak Protein Wrap", qty: 2, macros: "470 kcal | P34 C39 F16" },
    ],
    notes: "Customer will arrive 10 min late.",
    subscriptionInfo: "2 days/week for 6 weeks",
    auditLog: [{ at: "Mar 03, 2026 10:05", by: "Agent Riad", action: "Marked confirmed by call" }],
  },
  {
    id: "ORD-2080",
    client: "Nora Ilyas",
    phone: "+212 600 000 333",
    status: "Prepared" as OrderStatus,
    confirmationStatus: "Confirmed" as ConfirmationStatus,
    plan: "Standard",
    orderType: "Delivery",
    location: "Maarif Zone A",
    payment: "Paid",
    schedule: "Daily - 12:00-14:00",
    date: "Mar 02, 2026",
    total: "$13.00",
    items: [{ name: "Chicken Burrito Bowl", qty: 1, macros: "510 kcal | P38 C42 F18" }],
    notes: "No chili.",
    subscriptionInfo: "5 days/week for 4 weeks",
    auditLog: [{ at: "Mar 02, 2026 11:15", by: "Ops", action: "Moved to prepared" }],
  },
];

export const locations = [
  {
    id: "LOC-1",
    name: "CFC Pickup Hub",
    pickupAddress: "Tower 5, CFC, Casablanca",
    mapLink: "https://maps.google.com/?q=CFC+Casablanca",
    deliveryZone: "CFC + Anfa",
    deliveryFee: "$2.00",
    workingDays: ["Sun", "Mon", "Tue", "Wed", "Thu"],
    cutoffTime: "10:00",
    timeSlots: ["12:00-14:00", "18:00-20:00"],
  },
  {
    id: "LOC-2",
    name: "Bourgogne Branch",
    pickupAddress: "Rue Taha Hussein, Casablanca",
    mapLink: "",
    deliveryZone: "Bourgogne",
    deliveryFee: "$1.50",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    cutoffTime: "11:00",
    timeSlots: ["13:00-15:00", "19:00-21:00"],
  },
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
];

export const monthlyPlanFlow = [
  { step: "Step 1", title: "Choose plan type" },
  { step: "Step 2", title: "Set meals, snacks and days" },
  { step: "Step 3", title: "Pick delivery days" },
  { step: "Step 4", title: "Select start date and address" },
  { step: "Step 5", title: "Proceed to checkout" },
];

export const subscriptions = [
  {
    id: "SUB-9201",
    client: "Sara Benali",
    plan: "3 days/week",
    totalWeeks: 4,
    currentWeek: 2,
    dayProgress: "3/3",
    remainingMeals: 6,
    status: "Active",
  },
  {
    id: "SUB-9202",
    client: "Yassine Hadi",
    plan: "2 days/week",
    totalWeeks: 6,
    currentWeek: 4,
    dayProgress: "1/2",
    remainingMeals: 5,
    status: "Paused",
  },
  {
    id: "SUB-9203",
    client: "Nora Ilyas",
    plan: "5 days/week",
    totalWeeks: 4,
    currentWeek: 1,
    dayProgress: "4/5",
    remainingMeals: 16,
    status: "Active",
  },
];

export const todaysOrders = [
  { id: "ORD-2082", client: "Sara Benali", mode: "Delivery", slot: "12:00-14:00", location: "CFC + Anfa", meals: 2 },
  { id: "ORD-2081", client: "Yassine Hadi", mode: "Pickup", slot: "18:00-20:00", location: "Bourgogne Branch", meals: 2 },
  { id: "ORD-2077", client: "Amine Tahiri", mode: "Delivery", slot: "12:00-14:00", location: "Maarif Zone A", meals: 3 },
  { id: "ORD-2076", client: "Rania Karim", mode: "Pickup", slot: "13:00-15:00", location: "CFC Pickup Hub", meals: 1 },
];

export const printableOrders = [
  {
    orderId: "ORD-2082",
    client: "Sara Benali",
    date: "Mar 03, 2026",
    meal: "Chicken Burrito Bowl",
    macros: "510 kcal | P38 C42 F18",
    bestBefore: "Mar 04, 2026",
  },
  {
    orderId: "ORD-2081",
    client: "Yassine Hadi",
    date: "Mar 03, 2026",
    meal: "Steak Protein Wrap",
    macros: "470 kcal | P34 C39 F16",
    bestBefore: "Mar 04, 2026",
  },
  {
    orderId: "ORD-2080",
    client: "Nora Ilyas",
    date: "Mar 02, 2026",
    meal: "Chicken Burrito Bowl",
    macros: "510 kcal | P38 C42 F18",
    bestBefore: "Mar 03, 2026",
  },
];

export const contentSections = [
  { title: "Homepage Hero", description: "Main title, CTA, and background media for home page." },
  { title: "Monthly Plan Banner", description: "Promo strip and offer copy shown before plan cards." },
  { title: "Why Proteinbar", description: "Health, no-oil, macro-focused messaging blocks." },
];

export const settingsBlocks = [
  { title: "Contact Information", description: "Phone, WhatsApp, support email and map coordinates." },
  { title: "Delivery Settings", description: "Delivery zones, fee slabs and cut-off times." },
  { title: "Notification Settings", description: "Order and subscription alerts for customers/admin." },
];
