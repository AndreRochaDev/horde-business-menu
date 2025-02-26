import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

type Currency = {
  code: string;
  symbol: string;
  name: string;
};

const currencies: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
];

const businessTypeImages = {
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
  bar: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2074&q=80',
  barber: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
};

export const PublicMenu: React.FC = () => {
  const { alias } = useParams();
  const [business, setBusiness] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>(currencies[0]);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        // Fetch business by alias
        const { data: businessData, error: businessError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('alias', alias)
          .single();

        if (businessError) throw businessError;
        if (!businessData) throw new Error('Business not found');

        setBusiness(businessData);
        
        // Set currency
        const businessCurrency = currencies.find(c => c.code === businessData.currency_code) || currencies[0];
        setCurrency(businessCurrency);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('restaurant_id', businessData.id)
          .order('order');

        if (categoriesError) throw categoriesError;
        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData);
          setActiveCategory(categoriesData[0].id);
        }

        // Fetch menu items
        if (categoriesData && categoriesData.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('menu_items')
            .select('*')
            .in('category_id', categoriesData.map(c => c.id))
            .order('order');

          if (itemsError) throw itemsError;
          setMenuItems(itemsData || []);
        }
      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    if (alias) {
      fetchMenuData();
    }
  }, [alias]);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading menu...</div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-red-500 text-lg">Menu not found</div>
      </div>
    );
  }

  const heroImage = businessTypeImages[business.business_type as keyof typeof businessTypeImages] || businessTypeImages.restaurant;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Hero Section */}
      <div 
        className="relative h-64 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl font-bold mb-4">{business.name}</h1>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {business.address && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{business.address}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>{business.phone}</span>
                </div>
              )}
              {business.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>{business.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="sticky top-0 bg-white shadow-md z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-4 gap-4 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`
                  whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${activeCategory === category.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          {categories.map((category) => {
            const categoryItems = menuItems.filter(
              (item) => item.category_id === category.id
            );

            if (categoryItems.length === 0) return null;

            return (
              <div
                key={category.id}
                id={category.id}
                className={`scroll-mt-24 transition-opacity duration-300 ${
                  activeCategory === category.id ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                  <div className="px-6 py-4 bg-gray-900">
                    <h2 className="text-2xl font-bold text-white">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="mt-1 text-gray-300 text-sm">
                        {category.description}
                      </p>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="mt-2 text-gray-600">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {currency.symbol}{item.price.toFixed(2)}
                            {currency.code === 'NOK' && ' kr'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};