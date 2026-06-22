import { Route, Routes } from 'react-router-dom';
import { CocktailDetailPage } from './features/cocktail-detail/CocktailDetailPage';
import { MenuPage } from './features/menu/MenuPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/cocktails/:id" element={<CocktailDetailPage />} />
    </Routes>
  );
}
