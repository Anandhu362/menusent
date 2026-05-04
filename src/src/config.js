// src/config.js

const GCS_PUBLIC_ASSETS_BASE_URL = import.meta.env.VITE_GCP_PUBLIC_BASE_URL;

export const GLOBAL_CATEGORY_SUGGESTIONS = [
  { name: "Breakfast", image: `${GCS_PUBLIC_ASSETS_BASE_URL}/masala-dosa.png` },
  { name: "Snacks", image: `${GCS_PUBLIC_ASSETS_BASE_URL}/snacks.png` },
  { name: "Veg", image: `${GCS_PUBLIC_ASSETS_BASE_URL}/veg.png` },
  { name: "Non-Veg", image: `${GCS_PUBLIC_ASSETS_BASE_URL}/non-veg.png` },
  { name: "Beverages", image: `${GCS_PUBLIC_ASSETS_BASE_URL}/beverage.png` },
  { name: "Desserts", image: `${GCS_PUBLIC_ASSETS_BASE_URL}/desert.png` },
];