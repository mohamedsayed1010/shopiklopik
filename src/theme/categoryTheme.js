import {
  Amphora,
  BriefcaseBusiness,
  Building,
  Building2,
  Car,
  Dog,
  HandHeart,
  House,
  MapPinned,
  Package,
  PackageSearch,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sofa,
  Sparkles,
  Stethoscope,
  Tractor,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";


const THEMES = {
  cars: {
    icon: Car,
    accent: "#1d4e7c",
    accentDark: "#3c91e2",
    soft: "#eaf1f8",
    keywords: ["سيار", "مركب", "عرب", "موتوسيكل", "دراج", "نقل", "car", "vehicle"],
  },

  animals: {
    icon: Dog,
    accent: "#b4661c",
    accentDark: "#dd7818",
    soft: "#fbf1e6",
    keywords: ["حيوان", "طيور", "طير", "مواشي", "دواجن", "أسماك", "animal", "pet"],
  },

  jobs: {
    icon: BriefcaseBusiness,
    accent: "#4f3a9c",
    accentDark: "#9a86d6",
    soft: "#eeecfa",
    keywords: ["وظائف", "وظيف", "توظيف", "شواغر", "عمل", "job", "career"],
  },

  charity: {
    icon: HandHeart,
    accent: "#a93b34",
    accentDark: "#d4776e",
    soft: "#fbecea",
    keywords: [
      "خير",
      "تبرع",
      "تطوع",
      "إغاث",
      "اغاث",
      "إنقاذ",
      "انقاذ",
      "charity",
      "donat",
    ],
  },

  antiques: {
    icon: Amphora,
    accent: "#8a6a2f",
    accentDark: "#b98c39",
    soft: "#f7f2e6",
    keywords: ["تحف", "أنتيك", "انتيك", "أثري", "اثري", "مقتنيات", "تراث", "antique"],
  },

  clothes: {
    icon: Shirt,
    accent: "#9d3f63",
    accentDark: "#c97797",
    soft: "#f9edf1",
    keywords: ["ملابس", "أزياء", "ازياء", "موضة", "حذاء", "أحذية", "cloth", "fashion"],
  },

  lostFound: {
    icon: PackageSearch,
    accent: "#0e7490",
    accentDark: "#12a0c6",
    soft: "#e6f3f6",
    keywords: ["مفقود", "ضائع", "عثر", "لقطة", "lost", "found"],
  },

  workshops: {
    icon: Wrench,
    accent: "#a15118",
    accentDark: "#d17e42",
    soft: "#fbeee5",
    keywords: ["ورش", "حرفي", "صيان", "فني", "سباك", "نجار", "workshop", "craft"],
  },

  business: {
    icon: Building2,
    accent: "#143156",
    accentDark: "#6794ce",
    soft: "#e9eef5",
    keywords: ["أعمال", "اعمال", "شرك", "مصنع", "مصانع", "تجار", "business", "company"],
  },

  realEstate: {
    icon: House,
    accent: "#15706b",
    accentDark: "#1fa39c",
    soft: "#e6f3f2",
    keywords: ["عقار", "شقق", "شقة", "أراضي", "اراضي", "منزل", "فيلا", "محل"],
  },

  electronics: {
    icon: Smartphone,
    accent: "#3f4a9e",
    accentDark: "#8189cb",
    soft: "#ecedf8",
    keywords: ["إلكترون", "الكترون", "موبايل", "هاتف", "هواتف", "أجهزة", "كمبيوتر"],
  },

  furniture: {
    icon: Sofa,
    accent: "#6d4830",
    accentDark: "#bb875b",
    soft: "#f6efe7",
    keywords: ["افرش", "فرش", "أثاث", "اثاث", "مفروش", "مطابخ", "furniture"],
  },

  agriculture: {
    icon: Tractor,
    accent: "#4b7a2b",
    accentDark: "#63a038",
    soft: "#eef5e8",
    keywords: ["زراع", "مزارع", "محاصيل", "أسمدة", "بذور", "farm"],
  },

  services: {
    icon: Sparkles,
    accent: "#5b5f7a",
    accentDark: "#8d90a5",
    soft: "#eeeff4",
    keywords: ["خدم", "service" ],
  },

  /* Below the rest on purpose: matching stops at the first theme, so these
     can only claim names that no theme above already resolves. */
  health: {
    icon: Stethoscope,
    accent: "#0f7a55",
    accentDark: "#2fb585",
    soft: "#e7f5ef",
    keywords: ["صحتي", "صحة", "صحي", "طبي", "أطباء", "اطباء", "مستشف", "health", "medical"],
  },

  offices: {
    icon: Building,
    accent: "#2f5d62",
    accentDark: "#62a9b0",
    soft: "#e8f2f3",
    keywords: ["مكاتب", "مكتب", "office"],
  },

  restaurants: {
    icon: UtensilsCrossed,
    accent: "#c2410c",
    accentDark: "#f0814a",
    soft: "#fdeee6",
    keywords: ["مطاعم", "مطعم", "كافيه", "كافيهات", "مقهى", "مقاهي", "restaurant", "cafe"],
  },

  onlineShopping: {
    icon: ShoppingBag,
    accent: "#a3367a",
    accentDark: "#d977b5",
    soft: "#f9ebf4",
    keywords: ["تسوق", "أونلاين", "اونلاين", "shopping", "online"],
  },

  governorateGuide: {
    icon: MapPinned,
    accent: "#8a6400",
    accentDark: "#e0ac2e",
    soft: "#faf3df",
    keywords: ["دليل", "محافظت", "guide"],
  },
};

/** Brand-navy fallback: still deliberate, never a leftover grey. */
const DEFAULT_THEME = {
  icon: Package,
  accent: "#23426c",
  accentDark: "#7793b8",
  soft: "#e9eef5",
};

export function getCategoryTheme(name) {
  const haystack = String(name ?? "").toLowerCase();

  if (haystack) {
    for (const theme of Object.values(THEMES)) {
      if (theme.keywords.some((keyword) => haystack.includes(keyword))) {
        return theme;
      }
    }
  }

  return DEFAULT_THEME;
}

export function categoryVars(theme) {
  return {
    "--accent-light": theme.accent,
    "--accent-dark": theme.accentDark ?? theme.accent,
    "--accent-soft-light": theme.soft,
  };
}

export default getCategoryTheme;
