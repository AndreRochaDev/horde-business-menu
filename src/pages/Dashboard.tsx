import React, { useEffect, useState } from 'react';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AddBusinessModal } from '../components/AddRestaurantModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import type { Database } from '../lib/database.types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

const ADMIN_EMAILS = ['kuriseest@gmail.com', 'contact@horde.software'];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingBusiness, setDeletingBusiness] = useState<Restaurant | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchBusinesses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isUserAdmin = ADMIN_EMAILS.includes(user.email || '');
      setIsAdmin(isUserAdmin);

      // If admin, fetch all restaurants, otherwise only fetch user's restaurants
      const query = supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isUserAdmin) {
        query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
      } else {
        fetchBusinesses();
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleDeleteBusiness = async () => {
    if (!deletingBusiness) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', deletingBusiness.id);

      if (error) throw error;
      await fetchBusinesses();
    } catch (error) {
      console.error('Error deleting business:', error);
      throw error;
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? 'All Businesses' : 'My Businesses'}
            </h1>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Business
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading businesses...</div>
            ) : businesses.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No businesses yet. Click "Add Business" to create your first one!
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {businesses.map((business) => (
                  <li key={business.id}>
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">{business.name}</h2>
                        <p className="mt-1 text-sm text-gray-500 break-all">
                          {window.location.origin}/business/{business.alias}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => navigate(`/business/manage/${business.id}`)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </button>
                        <button
                          onClick={() => setDeletingBusiness(business)}
                          className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <AddBusinessModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchBusinesses}
      />
      <ConfirmationModal
        isOpen={!!deletingBusiness}
        onClose={() => setDeletingBusiness(null)}
        onConfirm={handleDeleteBusiness}
        title="Delete Business"
        message={`Are you sure you want to delete "${deletingBusiness?.name}"? This will permanently delete all categories and items. This action cannot be undone.`}
        confirmText="Delete Business"
      />
    </div>
  );
};