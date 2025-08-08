import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Info, Images, Leaf, UtensilsCrossed, ShieldAlert, Globe } from "lucide-react";

/** THEME */
const THEME_COLOR = "#75000e"; // demandé par Randy

/** Known allergens (icons and labels) */
const ALLERGENS = {
  gluten: { label: { fr: "Gluten", en: "Gluten", "zh-HK": "麩質", "zh-CN": "麸质" } },
  dairy: { label: { fr: "Lactose", en: "Dairy", "zh-HK": "奶類", "zh-CN": "乳製品" } },
  egg: { label: { fr: "Œuf", en: "Egg", "zh-HK": "雞蛋", "zh-CN": "鸡蛋" } },
  nuts: { label: { fr: "Fruits à coque", en: "Nuts", "zh-HK": "堅果", "zh-CN": "坚果" } },
  sesame: { label: { fr: "Sésame", en: "Sesame", "zh-HK": "芝麻", "zh-CN": "芝麻" } },
  shellfish: { label: { fr: "Crustacés", en: "Shellfish", "zh-HK": "甲殼類", "zh-CN": "甲壳类" } },
  fish: { label: { fr: "Poisson", en: "Fish", "zh-HK": "魚類", "zh-CN": "鱼" } },
  soy: { label: { fr: "Soja", en: "Soy", "zh-HK": "大豆", "zh-CN": "大豆" } },
  sulphites: { label: { fr: "Sulfites", en: "Sulphites", "zh-HK": "亞硫酸鹽", "zh-CN": "亚硫酸盐" } },
  alcohol: { label: { fr: "Alcool", en: "Alcohol", "zh-HK": "酒精", "zh-CN": "酒精" } },
};

/** i18n helper */
const LANGS = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
  { code: "zh-HK", name: "中文（繁體·粵語）" },
  { code: "zh-CN", name: "中文（简体·普通话）" },
];

function t(obj, lang) {
  if (!obj) return "";
  return obj[lang] ?? obj["en"] ?? Object.values(obj)[0];
}

/** ---------- MENU DATA (subset for demo; extend as needed) ---------- */
const MENU = [
  {
    id: "petits-plaisirs",
    title: { fr: "Petits Plaisirs", en: "Small Bites", "zh-HK": "小食", "zh-CN": "小食" },
    items: [
      {
        key: "burrata",
        name: { fr: "Burrata", en: "Burrata", "zh-HK": "布拉塔芝士", "zh-CN": "布拉塔奶酪" },
        price: 178,
        desc: {
          fr: "Tomates cerises, huile de basilic, pignon, piment d'Espelette.",
          en: "Cherry tomatoes, basil oil, pine nut, Espelette pepper.",
          "zh-HK": "車厘茄、羅勒油、松子、埃斯佩萊特辣椒。",
          "zh-CN": "圣女果、罗勒油、松子、埃斯佩莱特辣椒。",
        },
        tags: ["vegetarian"],
        vegetarian: true,
        allergens: ["dairy", "nuts"],
        image:
          "https://images.unsplash.com/photo-1604908554115-2b2f0e7cdb61?q=80&w=1200&auto=format&fit=crop",
      },
      {
        key: "seabass-ceviche",
        name: { fr: "Ceviche de Bar", en: "Seabass Ceviche", "zh-HK": "鱸魚青檸醃", "zh-CN": "海鲈鱼青柠腌" },
        price: 158,
        desc: {
          fr: "Piment d'Espelette, popcorn croustillant, chimichurri.",
          en: "Espelette, popcorn crunch, chimichurri.",
          "zh-HK": "埃斯佩萊特辣椒、爆米花脆、青醬。",
          "zh-CN": "埃斯佩莱特辣椒、爆米花脆、青酱。",
        },
        tags: ["seafood", "gluten-free"],
        glutenFree: true,
        allergens: ["fish", "sulphites"],
        image:
          "https://images.unsplash.com/photo-1617195737497-0f1ff2e70ef8?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "desserts",
    title: { fr: "Desserts", en: "Desserts", "zh-HK": "甜品", "zh-CN": "甜品" },
    items: [
      {
        key: "choco-mousse",
        name: { fr: "Mousse au Chocolat", en: "Chocolate Mousse", "zh-HK": "朱古力慕斯", "zh-CN": "巧克力慕斯" },
        price: 128,
        desc: {
          fr: "Chocolat noir, amande, fleur de sel.",
          en: "Dark chocolate, almond, sea salt.",
          "zh-HK": "黑朱古力、杏仁、海鹽。",
          "zh-CN": "黑巧克力、杏仁、海盐。",
        },
        tags: ["dessert"],
        allergens: ["nuts", "dairy", "egg"],
        image:
          "https://images.unsplash.com/photo-1606313564200-e75d5e30476e?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
];

/** ---------- UI HELPERS ---------- */
const classNames = (...c) => c.filter(Boolean).join(" ");

function Badge({ children, outline }) {
  return (
    <span className={classNames("inline-flex items-center rounded-full px-2 py-0.5 text-xs", outline ? "border" : "")}>
      {children}
    </span>
  );
}

/** Language Selector */
function LanguageSelector({ lang, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Globe size={16} />
      <select
        value={lang}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border px-2 py-1 text-sm"
        aria-label="Language"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>{l.name}</option>
        ))}
      </select>
    </div>
  );
}

/** ---------- ERROR BOUNDARY + MetaMask noise guard ---------- */
function MetaMaskBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    function onError(ev) {
      const msg = String(ev?.message || ev?.reason || "");
      if (msg.toLowerCase().includes("metamask")) setShow(true);
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
    };
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 bg-white border rounded-xl p-3 shadow-soft" style={{ borderLeft: "6px solid var(--theme)" }}>
      <div className="flex items-center gap-2 text-sm">
        <ShieldAlert size={18} />
        <div><strong>MetaMask n’est pas requis</strong> pour ce menu. Si vous voyez “Failed to connect to MetaMask”, ignorez-le.</div>
        <button className="ml-auto border rounded-md px-2 py-1" onClick={(e)=> (e.currentTarget.parentElement.parentElement.style.display='none')}>OK</button>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("UI crashed:", error, info); }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 24 }}><h2>Une erreur est survenue.</h2><p className="text-gray-600">{String(this.state.error?.message || this.state.error)}</p></div>;
    }
    return this.props.children;
  }
}

/** ---------- COMPONENTS ---------- */

function Header({ value, onChange, lang, setLang }) {
  return (
    <div className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="text-2xl font-semibold tracking-tight text-theme">Nissa La Bella — Menu</div>
        <div className="ml-auto relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-2.5 opacity-60" size={18} />
          <input
            placeholder={
              lang === "fr" ? "Rechercher un plat, un tag, une catégorie…" :
              lang.startsWith("zh") ? "搜索菜名、標籤或類別…" :
              "Search dishes, tags, or categories…"
            }
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border pl-10 pr-4 py-2"
          />
        </div>
        <LanguageSelector lang={lang} onChange={setLang} />
      </div>
    </div>
  );
}

function CategoryPills({ categories, current, setCurrent, lang }) {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-2 flex flex-wrap gap-2">
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => setCurrent(c.id)}
          className={classNames("px-3 py-1.5 rounded-full border text-sm", current === c.id ? "bg-theme text-white" : "bg-white")}
        >
          {t(c.title, lang)}
        </button>
      ))}
    </div>
  );
}

function ItemCard({ item, onOpen, lang }) {
  return (
    <motion.button
      layout
      whileHover={{ y: -2 }}
      onClick={() => onOpen(item)}
      className="text-left rounded-2xl border bg-white overflow-hidden shadow-soft"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img src={item.image} alt={t(item.name, lang)} className="w-full h-full object-cover" />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold leading-tight">{t(item.name, lang)}</div>
            <div className="text-sm text-gray-600">{t(item.desc, lang)}</div>
          </div>
          <div className="text-right font-semibold">${item.price}</div>
        </div>
        <div className="flex gap-2 flex-wrap mt-1">
          {item.vegetarian && (<Badge outline><Leaf className="h-3 w-3 mr-1" />{lang.startsWith("zh") ? "素" : "Veg"}</Badge>)}
          {item.glutenFree && (<Badge outline><UtensilsCrossed className="h-3 w-3 mr-1" />{lang.startsWith("zh") ? "無麩" : "GF"}</Badge>)}
          {item.tags?.slice(0,3).map((tTag) => (<Badge outline key={tTag}>{tTag}</Badge>))}
          {item.allergens?.slice(0,3).map((a) => (<Badge outline key={a}>{ALLERGENS[a]?.label ? t(ALLERGENS[a].label, lang) : a}</Badge>))}
        </div>
      </div>
    </motion.button>
  );
}

function DetailsModal({ open, item, onClose, lang }) {
  return (
    <AnimatePresence>
      {open && item && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-card"
          >
            <button className="absolute right-3 top-3 rounded-full p-2 bg-white/90 border" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
            <div className="grid md:grid-cols-2">
              <div className="aspect-[4/3] md:aspect-auto md:h-full">
                <img src={item.image} alt={t(item.name, lang)} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <div className="text-2xl font-semibold text-theme">{t(item.name, lang)}</div>
                  <div className="text-gray-600 mt-1">${item.price}</div>
                </div>
                <div className="text-gray-800 leading-relaxed">{t(item.desc, lang)}</div>
                <div className="flex gap-2 flex-wrap">
                  {item.vegetarian && <Badge outline><Leaf className="h-3 w-3 mr-1" />{lang.startsWith("zh") ? "素" : "Vegetarian"}</Badge>}
                  {item.glutenFree && <Badge outline><UtensilsCrossed className="h-3 w-3 mr-1" />{lang.startsWith("zh") ? "無麩" : "Gluten Free"}</Badge>}
                  {item.tags?.map((tg) => <Badge outline key={tg}>{tg}</Badge>)}
                </div>
                {item.allergens?.length ? (
                  <div className="text-sm text-gray-700">
                    <strong>{lang === "fr" ? "Allergènes" : lang.startsWith("zh") ? "致敏原" : "Allergens"}:</strong>{" "}
                    {item.allergens.map((a) => (ALLERGENS[a]?.label ? t(ALLERGENS[a].label, lang) : a)).join(" · ")}
                  </div>
                ) : null}
                <div className="text-xs text-gray-600 flex items-center gap-2">
                  <Info className="h-4 w-4" />{" "}
                  {lang === "fr"
                    ? "Merci d’informer l’équipe en cas d’allergie. Les disponibilités peuvent varier."
                    : lang.startsWith("zh")
                    ? "如有食物敏感請告知職員；供應或有變更。"
                    : "Please inform staff of any allergies. Availability may vary."}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ category, query, onOpen, lang }) {
  const filtered = useMemo(() => {
    const list = category.items;
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(
      (it) =>
        t(it.name, lang).toLowerCase().includes(q) ||
        t(it.desc, lang).toLowerCase().includes(q) ||
        it.tags?.some((tt) => tt.toLowerCase().includes(q))
    );
  }, [category.items, query, lang]);

  return (
    <section id={category.id} className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold">{t(category.title, lang)}</h2>
      </div>
      {filtered.length === 0 ? (
        <div className="text-gray-500">
          {lang === "fr" ? "Aucun plat ne correspond à votre recherche." :
          lang.startsWith("zh") ? "沒有符合搜尋的菜式。" :
          "No items match your search."}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filtered.map((item) => (
            <ItemCard key={item.key} item={item} onOpen={onOpen} lang={lang} />
          ))}
        </div>
      )}
    </section>
  );
}

/** ---------- MAIN APP ---------- */
export default function App() {
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState(MENU[0].id);
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [lang, setLang] = useState("fr");

  const categories = MENU;
  const currentIndex = categories.findIndex((c) => c.id === current);

  function openItem(item) { setActiveItem(item); setOpen(true); }
  const currentCategory = categories.find((c) => c.id === current);

  // ---- Self-tests in console ----
  useEffect(() => {
    try {
      const tests = [];
      tests.push({ name: "Category index valid", pass: currentIndex >= 0 });
      const ceviche = MENU[0].items.find((i) => i.key === "seabass-ceviche");
      const i18nHit = ceviche && t(ceviche.name, "en").includes("Seabass");
      tests.push({ name: "i18n EN lookup", pass: !!i18nHit });
      const allerg = MENU.every((cat) => cat.items.every((i) => Array.isArray(i.allergens)));
      tests.push({ name: "Allergens present", pass: allerg });
      console.group("%cNissa Menu — Self tests", "color:"+THEME_COLOR);
      tests.forEach(t => console.log(t.pass ? "✅" : "❌", t.name));
      console.groupEnd();
    } catch(e) { console.warn("Self tests crashed", e); }
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-50" style={{ "--theme": THEME_COLOR }}>
        <Header value={query} onChange={setQuery} lang={lang} setLang={setLang} />

        <div className="max-w-7xl mx-auto px-4">
          <div className="mt-4 mb-2 rounded-2xl p-4 text-white shadow-card" style={{ background: `linear-gradient(90deg, ${THEME_COLOR}, ${THEME_COLOR}CC)` }}>
            <div className="flex items-center gap-3">
              <Images className="h-6 w-6" />
              <p className="font-medium">
                {lang === "fr"
                  ? "Touchez un plat pour voir la photo, la description, les allergènes."
                  : lang.startsWith("zh")
                  ? "點擊菜式可查看圖片、介紹及致敏原。"
                  : "Tap any dish to see photo, description, and allergens."}
              </p>
            </div>
          </div>
        </div>

        <CategoryPills categories={categories} current={current} setCurrent={setCurrent} lang={lang} />

        {currentCategory && <Section category={currentCategory} query={query} onOpen={openItem} lang={lang} />}

        <div className="sticky bottom-4 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <div className="rounded-full bg-white border flex items-center justify-between px-2 py-2 shadow-soft">
              <button
                className="px-4 py-2 rounded-full border"
                onClick={() => setCurrent(categories[Math.max(0, currentIndex - 1)].id)}
                disabled={currentIndex <= 0}
              >
                ◀ Prev
              </button>
              <div className="text-sm text-gray-600">{t(currentCategory?.title, lang)}</div>
              <button
                className="px-4 py-2 rounded-full border"
                onClick={() => setCurrent(categories[Math.min(categories.length - 1, currentIndex + 1)].id)}
                disabled={currentIndex >= categories.length - 1}
              >
                Next ▶
              </button>
            </div>
          </div>
        </div>

        <DetailsModal open={open} item={activeItem} onClose={() => setOpen(false)} lang={lang} />
        <MetaMaskBanner />

        <footer className="max-w-7xl mx-auto px-4 py-10 text-center text-sm text-gray-600">
          <div>© {new Date().getFullYear()} Nissa La Bella — French Bistro & Wine Bar</div>
          <div className="mt-2">Prototype. Photos temporaires. Couleur de thème #75000e.</div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
