"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";
import StatusBadge from "@/components/admin/StatusBadge";
import { monthlyPlans, products } from "@/data/admin/mock";

type PlanItem = (typeof monthlyPlans)[number] & { imageUrl?: string };
type ProductItem = (typeof products)[number];
type CustomPlanProductItem = {
  id: string;
  tab: string;
  name: string;
  price: string;
  calories: number;
  fat: number;
  protein: number;
  carb: number;
  imageUrl?: string;
  isActive: boolean;
  sourceSku?: string;
};

const getProductTab = (item: ProductItem) => {
  const name = item.name.toLowerCase();
  if (name.includes("chicken")) return "Chicken";
  if (name.includes("steak")) return "Steak Beef";
  if (name.includes("beef")) return "Minced Beef";
  if (item.category === "Breakfast") return "Breakfast";
  return item.category;
};

export default function MonthlyPlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>(monthlyPlans);
  const [customPlanProducts, setCustomPlanProducts] = useState<CustomPlanProductItem[]>(() =>
    products.map((item) => ({
      id: item.sku,
      sourceSku: item.sku,
      tab: getProductTab(item),
      name: item.name,
      price: item.price,
      calories: 0,
      fat: 0,
      protein: 0,
      carb: 0,
      isActive: item.availability === "Active",
    })),
  );
  const [productEditingId, setProductEditingId] = useState<string | null>(null);
  const [customPlanCategories, setCustomPlanCategories] = useState<string[]>(() => {
    const seeded = Array.from(new Set(products.map((item) => getProductTab(item).trim()).filter(Boolean)));
    return seeded.length ? seeded : ["Breakfast"];
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [activeProductTab, setActiveProductTab] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    basePrice: "",
    description: "",
    isNew: false,
    imageUrl: "",
  });

  const [productForm, setProductForm] = useState({
    tab: customPlanCategories[0] ?? "Breakfast",
    name: "",
    price: "",
    calories: "",
    fat: "",
    protein: "",
    carb: "",
    imageUrl: "",
    isActive: true,
  });

  const resetForm = () => {
    setForm({
      name: "",
      basePrice: "",
      description: "",
      isNew: false,
      imageUrl: "",
    });
    setEditingId(null);
  };

  const resetProductForm = () => {
    setProductForm({
      tab: customPlanCategories[0] ?? "Breakfast",
      name: "",
      price: "",
      calories: "",
      fat: "",
      protein: "",
      carb: "",
      imageUrl: "",
      isActive: true,
    });
    setProductEditingId(null);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleProductImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setProductForm((prev) => ({ ...prev, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.basePrice.trim()) {
      return;
    }

    if (editingId) {
      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === editingId
            ? {
                ...plan,
                name: form.name.trim(),
                basePrice: form.basePrice.trim(),
                members: plan.members,
                description: form.description.trim() || "No description added yet.",
                isNew: form.isNew,
                imageUrl: form.imageUrl || undefined,
              }
            : plan,
        ),
      );
      resetForm();
      return;
    }

    const newPlan: PlanItem = {
      id: `PLAN-${Date.now()}`,
      name: form.name.trim(),
      basePrice: form.basePrice.trim(),
      members: 0,
      description: form.description.trim() || "No description added yet.",
      status: "Active",
      isNew: form.isNew,
      imageUrl: form.imageUrl || undefined,
    };

    setPlans((prev) => [newPlan, ...prev]);
    resetForm();
  };

  const handleSubmitProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!productForm.name.trim() || !productForm.tab.trim()) {
      return;
    }

    const normalized: CustomPlanProductItem = {
      id: productEditingId ?? `CP-${Date.now()}`,
      sourceSku: productEditingId ? customPlanProducts.find((item) => item.id === productEditingId)?.sourceSku : undefined,
      tab: productForm.tab.trim(),
      name: productForm.name.trim(),
      price: productForm.price.trim() || "$0.00",
      calories: Number(productForm.calories) || 0,
      fat: Number(productForm.fat) || 0,
      protein: Number(productForm.protein) || 0,
      carb: Number(productForm.carb) || 0,
      imageUrl: productForm.imageUrl || undefined,
      isActive: productForm.isActive,
    };

    if (productEditingId) {
      setCustomPlanProducts((prev) => prev.map((item) => (item.id === productEditingId ? normalized : item)));
      resetProductForm();
      return;
    }

    setCustomPlanProducts((prev) => [normalized, ...prev]);
    setActiveProductTab(normalized.tab);
    resetProductForm();
  };

  const handleAddCategory = () => {
    const normalized = newCategoryName.trim();
    if (!normalized) return;

    const exists = customPlanCategories.some((item) => item.toLowerCase() === normalized.toLowerCase());
    if (exists) return;

    setCustomPlanCategories((prev) => [...prev, normalized]);
    setProductForm((prev) => ({ ...prev, tab: normalized }));
    setActiveProductTab(normalized);
    setNewCategoryName("");
  };

  const deleteCategory = (category: string) => {
    if (customPlanCategories.length <= 1) return;
    const hasProducts = customPlanProducts.some((item) => item.tab === category);
    if (hasProducts) return;

    setCustomPlanCategories((prev) => prev.filter((item) => item !== category));
    setProductForm((prev) => {
      if (prev.tab !== category) return prev;
      const fallback = customPlanCategories.find((item) => item !== category) ?? "Breakfast";
      return { ...prev, tab: fallback };
    });
    setActiveProductTab((prev) => {
      if (prev !== category) return prev;
      return "All";
    });
  };

  const startEditPlan = (plan: PlanItem) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      basePrice: plan.basePrice,
      description: plan.description ?? "",
      isNew: Boolean(plan.isNew),
      imageUrl: plan.imageUrl ?? "",
    });

    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 120);
  };

  const startEditProduct = (item: CustomPlanProductItem) => {
    setProductEditingId(item.id);
    setProductForm({
      tab: item.tab,
      name: item.name,
      price: item.price,
      calories: String(item.calories),
      fat: String(item.fat),
      protein: String(item.protein),
      carb: String(item.carb),
      imageUrl: item.imageUrl ?? "",
      isActive: item.isActive,
    });
  };

  const deletePlan = (planId: string) => {
    setPlans((prev) => prev.filter((plan) => plan.id !== planId));
    if (editingId === planId) {
      resetForm();
    }
  };

  const deleteProduct = (productId: string) => {
    setCustomPlanProducts((prev) => prev.filter((item) => item.id !== productId));
    if (productEditingId === productId) {
      resetProductForm();
    }
  };

  const productTabs = useMemo(() => ["All", ...customPlanCategories], [customPlanCategories]);

  const filteredProducts = useMemo(() => {
    if (activeProductTab === "All") return customPlanProducts;
    return customPlanProducts.filter((item) => item.tab === activeProductTab);
  }, [activeProductTab, customPlanProducts]);

  const activeCustomProductCount = useMemo(() => customPlanProducts.filter((item) => item.isActive).length, [customPlanProducts]);

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Subscriptions</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Monthly Plans</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage plan cards and selectable custom-plan products.</p>
      </div>

      <section ref={formSectionRef} className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Monthly Plan" : "Add Monthly Plan"}</h3>
        <p className="mt-2 text-sm text-zinc-300">Create, image upload, edit, and delete plan cards (frontend-only).</p>
        <form onSubmit={handleSubmitPlan} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            ref={nameInputRef}
            type="text"
            placeholder="Plan name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            required
          />
          <input
            type="text"
            placeholder="Price (e.g. $209/mo)"
            value={form.basePrice}
            onChange={(event) => setForm((prev) => ({ ...prev, basePrice: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            required
          />
          <label className="flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={form.isNew}
              onChange={(event) => setForm((prev) => ({ ...prev, isNew: event.target.checked }))}
              className="h-4 w-4 accent-amber-300"
            />
            Mark as NEW plan
          </label>
          <div className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-200">
            <label htmlFor="plan-image" className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Upload Plan Image
            </label>
            <input id="plan-image" type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:font-semibold file:text-zinc-900" />
          </div>
          <textarea
            placeholder="Plan description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="md:col-span-2 min-h-24 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          {form.imageUrl ? (
            <div className="md:col-span-2 overflow-hidden rounded-xl border border-zinc-700">
              <Image src={form.imageUrl} alt="Plan preview" width={1200} height={300} className="h-36 w-full object-cover" unoptimized />
            </div>
          ) : null}
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
            >
              {editingId ? "Update Plan" : "Add Plan"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">Custom Plan Product Pool</h3>
        <p className="mt-2 text-sm text-zinc-300">Add products that customers can browse and select in custom monthly plan flow.</p>
        <p className="mt-2 text-xs text-zinc-400">
          Active selectable custom-plan products: <span className="font-semibold text-amber-200">{activeCustomProductCount}</span>
        </p>

        <div className="mt-4 rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Category Management</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="New category name"
              className="min-w-56 flex-1 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
            >
              Add Category
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {customPlanCategories.map((category) => {
              const count = customPlanProducts.filter((item) => item.tab === category).length;
              return (
                <div key={category} className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950/50 px-2 py-1.5 text-xs text-zinc-200">
                  <span>{category}</span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">{count}</span>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category)}
                    disabled={count > 0 || customPlanCategories.length <= 1}
                    className="rounded-md border border-rose-400/40 px-2 py-0.5 text-[10px] text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                    title={count > 0 ? "Delete products in this category first" : customPlanCategories.length <= 1 ? "At least one category is required" : "Remove category"}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmitProduct} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={productForm.tab}
            onChange={(event) => setProductForm((prev) => ({ ...prev, tab: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            required
          >
            {customPlanCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Product name"
            value={productForm.name}
            onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            required
          />
          <input
            type="text"
            placeholder="Price (e.g. $11.90)"
            value={productForm.price}
            onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            min={0}
            step="0.1"
            placeholder="Calories"
            value={productForm.calories}
            onChange={(event) => setProductForm((prev) => ({ ...prev, calories: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            min={0}
            step="0.1"
            placeholder="Fat"
            value={productForm.fat}
            onChange={(event) => setProductForm((prev) => ({ ...prev, fat: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            min={0}
            step="0.1"
            placeholder="Protein"
            value={productForm.protein}
            onChange={(event) => setProductForm((prev) => ({ ...prev, protein: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            min={0}
            step="0.1"
            placeholder="Carb"
            value={productForm.carb}
            onChange={(event) => setProductForm((prev) => ({ ...prev, carb: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <label className="flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={productForm.isActive}
              onChange={(event) => setProductForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              className="h-4 w-4 accent-amber-300"
            />
            Visible in customer app
          </label>
          <div className="md:col-span-2 xl:col-span-4 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-200">
            <label htmlFor="custom-plan-product-image" className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Upload Product Image
            </label>
            <input
              id="custom-plan-product-image"
              type="file"
              accept="image/*"
              onChange={handleProductImageUpload}
              className="text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:font-semibold file:text-zinc-900"
            />
          </div>
          {productForm.imageUrl ? (
            <div className="md:col-span-2 xl:col-span-4 overflow-hidden rounded-xl border border-zinc-700">
              <Image src={productForm.imageUrl} alt="Product preview" width={1200} height={280} className="h-32 w-full object-cover" unoptimized />
            </div>
          ) : null}
          <div className="md:col-span-2 xl:col-span-4 flex items-center gap-2">
            <button type="submit" className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200">
              {productEditingId ? "Update Product" : "Add Product"}
            </button>
            {productEditingId ? (
              <button
                type="button"
                onClick={resetProductForm}
                className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {productTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveProductTab(tab)}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                activeProductTab === tab ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 bg-zinc-900/60 text-zinc-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.length ? (
            filteredProducts.map((item) => (
              <article key={item.id} className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-3">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} width={600} height={280} className="h-28 w-full rounded-lg object-cover" unoptimized />
                ) : (
                  <div className="h-28 rounded-lg bg-gradient-to-br from-zinc-700/70 via-zinc-800/70 to-zinc-900/70" />
                )}
                <p className="mt-3 text-xs uppercase tracking-[0.12em] text-amber-200">{item.tab}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">{item.name}</p>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                  <span className="text-zinc-400">{item.price}</span>
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${item.isActive ? "bg-emerald-500/15 text-emerald-200" : "bg-zinc-700 text-zinc-300"}`}>
                    {item.isActive ? "Visible" : "Hidden"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                  <p className="rounded-md border border-zinc-700 bg-zinc-950/50 px-2 py-1">Calories: {item.calories.toFixed(1)}</p>
                  <p className="rounded-md border border-zinc-700 bg-zinc-950/50 px-2 py-1">Fat: {item.fat.toFixed(1)}</p>
                  <p className="rounded-md border border-zinc-700 bg-zinc-950/50 px-2 py-1">Protein: {item.protein.toFixed(1)}</p>
                  <p className="rounded-md border border-zinc-700 bg-zinc-950/50 px-2 py-1">Carb: {item.carb.toFixed(1)}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => startEditProduct(item)} className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900">
                    Edit
                  </button>
                  <button onClick={() => deleteProduct(item.id)} className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-100">
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No products in this tab yet.</p>
          )}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className="admin-panel rounded-2xl p-5">
            {plan.imageUrl ? (
              <Image
                src={plan.imageUrl}
                alt={`${plan.name} plan`}
                width={1000}
                height={240}
                className="mb-4 h-28 w-full rounded-xl object-cover"
                unoptimized
              />
            ) : (
              <div className="mb-4 h-28 rounded-xl bg-gradient-to-br from-zinc-700/70 via-zinc-800/70 to-zinc-900/70" />
            )}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <div className="flex items-center gap-2">
                {plan.isNew ? <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-zinc-900">NEW</span> : null}
                <StatusBadge label={plan.status} />
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-300">{plan.description}</p>
            <p className="mt-4 text-2xl font-semibold text-zinc-100">{plan.basePrice}</p>
            <p className="mt-1 text-sm text-zinc-400">{plan.members} active members</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                onClick={() => startEditPlan(plan)}
                className="rounded-xl bg-amber-300 px-3.5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
              >
                Edit Plan
              </button>
              <button
                onClick={() => deletePlan(plan.id)}
                className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-3.5 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}