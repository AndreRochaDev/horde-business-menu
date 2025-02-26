import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, PlusCircle, Trash2, CheckCircle2, Copy, Check, Plus, Pencil, ArrowLeft, ExternalLink, QrCode, ChevronDown, ChevronRight, UserPlus, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { MenuCategoryForm } from '../components/MenuCategoryForm';
import { MenuItemForm } from '../components/MenuItemForm';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { TransferBusinessModal } from '../components/TransferBusinessModal';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

type Currency = {
  code: string;
  symbol: string;
  name: string;
};

type BusinessType = {
  id: string;
  name: string;
  description: string;
};

const currencies: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
];

const businessTypes: BusinessType[] = [
  { id: 'restaurant', name: 'Restaurant', description: 'Food service establishment' },
  { id: 'bar', name: 'Bar', description: 'Drinks and entertainment venue' },
  { id: 'barber', name: 'Barber', description: 'Hair styling and grooming services' },
];

const ADMIN_EMAILS = ['kuriseest@gmail.com', 'contact@horde.software'];

export default function BusinessManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MenuCategory | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [isLinksExpanded, setIsLinksExpanded] = useState(true);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType>(businessTypes[0]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [transferringBusiness, setTransferringBusiness] = useState<Restaurant | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [selectedCategoryForNewItem, setSelectedCategoryForNewItem] = useState<string>('');

  // Form state
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
      } else {
        setIsAdmin(ADMIN_EMAILS.includes(session.user.email || ''));
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Generate alias from name
  const generateAlias = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  // Handle name change and update alias
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!alias || alias === generateAlias(name)) {
      setAlias(generateAlias(newName));
    }
  };

  const handleCopyAlias = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/business/${alias}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const fetchMenuData = async () => {
    if (!id) return;

    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', id)
        .order('order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .in('category_id', (categoriesData || []).map(c => c.id))
        .order('order');

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setError('Failed to load catalog data');
    }
  };

  const fetchBusiness = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setBusiness(data);
        setName(data.name);
        setAlias(data.alias || generateAlias(data.name));
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        
        // Set currency from database
        const currency = currencies.find(c => c.code === data.currency_code) || currencies[0];
        setSelectedCurrency(currency);
        
        // Set business type from database
        const businessType = businessTypes.find(t => t.id === data.business_type) || businessTypes[0];
        setSelectedBusinessType(businessType);

        // Fetch owner's email
        const { data: ownerData, error: ownerError } = await supabase
          .from('users_public')
          .select('email')
          .eq('id', data.user_id)
          .single();

        if (!ownerError && ownerData) {
          setOwnerEmail(ownerData.email);
        }
      }
    } catch (err) {
      console.error('Error fetching business:', err);
      setError('Failed to load business details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBusiness();
      fetchMenuData();
    }
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name,
          alias,
          address,
          phone,
          email,
          currency_code: selectedCurrency.code,
          business_type: selectedBusinessType.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (data: { name: string; description: string }) => {
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('menu_categories')
          .update({
            name: data.name,
            description: data.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Create new category
        const { error } = await supabase
          .from('menu_categories')
          .insert([
            {
              name: data.name,
              description: data.description,
              restaurant_id: id!,
              order: categories.length,
            }
          ]);

        if (error) throw error;
      }
      await fetchMenuData();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save category');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', deletingCategory.id);

      if (error) throw error;
      await fetchMenuData();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
      throw err;
    }
  };

  const handleAddMenuItem = async (data: { name: string; description: string; price: number; categoryId: string }) => {
    try {
      const categoryItems = menuItems.filter(item => item.category_id === data.categoryId);
      
      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: data.name,
            description: data.description,
            price: data.price,
            category_id: data.categoryId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([
            {
              name: data.name,
              description: data.description,
              price: data.price,
              category_id: data.categoryId,
              order: categoryItems.length,
            }
          ]);

        if (error) throw error;
      }
      
      setEditingItem(undefined);
      await fetchMenuData();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save item');
    }
  };

  const handleDeleteMenuItem = async () => {
    if (!deletingItem) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', deletingItem.id);

      if (error) throw error;
      await fetchMenuData();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading business details...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-500">Business not found</div>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/business/${alias}`;
  const qrCodeUrl = `${window.location.origin}/business/${alias}/qrcode`;

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="sm:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Business</h1>
            </div>
          </div>

          {/* Useful Links Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <button
              onClick={() => setIsLinksExpanded(!isLinksExpanded)}
              className="w-full px-4 py-5 sm:px-6 flex justify-between items-center hover:bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Useful Links</h3>
                <p className="mt-1 text-sm text-gray-500">Quick access to your public pages</p>
              </div>
              {isLinksExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {isLinksExpanded && (
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Public Catalog</h4>
                    <div className="flex items-center gap-2">
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Public Catalog
                      </a>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">QR Code</h4>
                    <div className="flex items-center gap-2">
                      <a
                        href={qrCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        View QR Code
                      </a>
                    </div>
                  </div>
                  {isAdmin && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Admin Actions</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTransferringBusiness(business)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Transfer Business
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <button
              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              className="w-full px-4 py-5 sm:px-6 flex justify-between items-center hover:bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Settings</h3>
                <p className="mt-1 text-sm text-gray-500">Configure your business preferences</p>
              </div>
              {isSettingsExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {isSettingsExpanded && (
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="space-y-6">
                  {/* Owner Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Owner
                    </label>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {ownerEmail}
                    </div>
                  </div>

                  {/* Business Type Dropdown */}
                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                      Business Type
                    </label>
                    <div className="mt-2">
                      <select
                        id="businessType"
                        value={selectedBusinessType.id}
                        onChange={(e) => {
                          const type = businessTypes.find(t => t.id === e.target.value);
                          if (type) setSelectedBusinessType(type);
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {businessTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-gray-500">{selectedBusinessType.description}</p>
                    </div>
                  </div>

                  {/* Currency Dropdown */}
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                      Currency
                    </label>
                    <div className="mt-2">
                      <select
                        id="currency"
                        value={selectedCurrency.code}
                        onChange={(e) => {
                          const currency = currencies.find(c => c.code === e.target.value);
                          if (currency) setSelectedCurrency(currency);
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.name} ({currency.symbol} {currency.code})
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        Selected currency: {selectedCurrency.symbol} ({selectedCurrency.code})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Business Details Form */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="col-span-1 sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={handleNameChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label htmlFor="alias" className="block text-sm font-medium text-gray-700">
                    Business URL
                  </label>
                  <div className="mt-1 flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        id="alias"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="flex-1 block w-full rounded-l-md border-r-0 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleCopyAlias}
                        className="inline-flex items-center px-3 rounded-r-md border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        title="Copy URL"
                      >
                        {copySuccess ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 break-all">
                    {window.location.origin}/business/{alias}
                  </p>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              {saveSuccess && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Changes saved successfully!
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Catalog Management Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Catalog</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </button>
                <button
                  onClick={() => {
                    setEditingItem(undefined);
                    setSelectedCategoryForNewItem('');
                    setIsAddItemModalOpen(true);
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={categories.length === 0}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <div className="p-4 sm:p-6 text-center text-gray-500">
                    No categories yet. Click "Add Category" to create your first category.
                  </div>
                ) : (
                  categories.map((category) => {
                    const categoryItems = menuItems.filter(
                      (item) => item.category_id === category.id
                    );

                    return (
                      <div key={category.id} className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {category.name}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedCategoryForNewItem(category.id);
                                    setEditingItem(undefined);
                                    setIsAddItemModalOpen(true);
                                  }}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Item
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setIsCategoryModalOpen(true);
                                  }}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletingCategory(category)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  title="Delete category"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                            {category.description && (
                              <p className="mt-1 text-sm text-gray-500">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div> {categoryItems.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No items in this category yet.
                          </p>
                        ) : (
                          <div className="mt-2 space-y-4">
                            {categoryItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-lg border border-gray-300 bg-white hover:border-gray-400"
                              >
                                <div className="flex-1 min-w-0 w-full">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </h4>
                                    <div className="flex items-center justify-between sm:justify-end gap-4">
                                      <p className="text-sm font-medium text-gray-900">
                                        {selectedCurrency.symbol}{item.price.toFixed(2)}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingItem(item);
                                            setIsAddItemModalOpen(true);
                                          }}
                                          className="p-1 text-gray-400 hover:text-gray-500"
                                          title="Edit item"
                                        >
                                          <Pencil className="h-5 w-5" />
                                        </button>
                                        <button
                                          onClick={() => setDeletingItem(item)}
                                          className="p-1 text-red-400 hover:text-red-500"
                                          title="Delete item"
                                        >
                                          <Trash2 className="h-5 w-5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  {item.description && (
                                    <p className="mt-1 text-sm text-gray-500">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MenuCategoryForm
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleAddCategory}
        editCategory={editingCategory || undefined}
      />

      <MenuItemForm
        isOpen={isAddItemModalOpen}
        onClose={() => {
          setIsAddItemModalOpen(false);
          setEditingItem(undefined);
          setSelectedCategoryForNewItem('');
        }}
        onSubmit={handleAddMenuItem}
        categories={categories}
        editItem={editingItem}
        initialCategoryId={selectedCategoryForNewItem}
      />

      <ConfirmationModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete "${deletingCategory?.name}"? This will also delete all items in this category. This action cannot be undone.`}
        confirmText="Delete Category"
      />

      <ConfirmationModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteMenuItem}
        title="Delete Item"
        message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        confirmText="Delete Item"
      />

      {transferringBusiness && (
        <TransferBusinessModal
          isOpen={!!transferringBusiness}
          onClose={() => setTransferringBusiness(null)}
          onSuccess={() => {
            fetchBusiness();
            setTransferringBusiness(null);
          }}
          business={transferringBusiness}
        />
      )}
    </div>
  );
}