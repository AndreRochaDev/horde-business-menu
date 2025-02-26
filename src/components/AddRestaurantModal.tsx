import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AddBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type BusinessType = {
  id: string;
  name: string;
  description: string;
};

const businessTypes: BusinessType[] = [
  { id: 'restaurant', name: 'Restaurant', description: 'Food service establishment' },
  { id: 'bar', name: 'Bar', description: 'Drinks and entertainment venue' },
  { id: 'barber', name: 'Barber', description: 'Hair styling and grooming services' },
];

export const AddBusinessModal: React.FC<AddBusinessModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateAlias = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');
      if (!businessType) throw new Error('Please select a business type');

      const alias = generateAlias(name);

      const { error: insertError } = await supabase
        .from('restaurants')
        .insert([
          {
            name,
            user_id: user.id,
            address: '', // Required by the schema but can be empty
            alias,
            business_type: businessType,
            currency_code: 'EUR' // Default to EUR
          }
        ]);

      if (insertError) {
        if (insertError.message.includes('restaurants_alias_key')) {
          throw new Error('A business with this name already exists. Please choose a different name.');
        }
        throw insertError;
      }

      onSuccess();
      onClose();
      setName('');
      setBusinessType('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Add New Business</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
              Business Type
            </label>
            <select
              id="businessType"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select a business type</option>
              {businessTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {businessType && (
              <p className="mt-1 text-sm text-gray-500">
                {businessTypes.find(t => t.id === businessType)?.description}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Business Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              placeholder="Enter business name"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !businessType}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Business'}
          </button>
        </form>
      </div>
    </div>
  );
};