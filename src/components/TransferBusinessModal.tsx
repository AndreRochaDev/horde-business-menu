import React, { useState } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

interface TransferBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  business: Restaurant;
}

interface User {
  id: string;
  email: string;
}

export const TransferBusinessModal: React.FC<TransferBusinessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  business,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = async (term: string) => {
    if (term.length < 3) {
      setUsers([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('users_public')
        .select('id, email')
        .ilike('email', `%${term}%`)
        .limit(5);

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    searchUsers(term);
  };

  const handleTransfer = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ user_id: selectedUser.id })
        .eq('id', business.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer business');
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
        
        <h2 className="text-2xl font-bold mb-6">Transfer Business</h2>
        <p className="text-gray-600 mb-4">
          Transfer "{business.name}" to another user
        </p>

        <div className="space-y-4">
          <div className="relative">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Users by Email
            </label>
            <div className="relative">
              <input
                type="email"
                id="search"
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter email address"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {searching ? (
                  <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                ) : (
                  <Search className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {users.length > 0 && (
            <div className="border rounded-md divide-y">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                    selectedUser?.id === user.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  {user.email}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            onClick={handleTransfer}
            disabled={loading || !selectedUser}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Transferring...' : 'Transfer Business'}
          </button>
        </div>
      </div>
    </div>
  );
};