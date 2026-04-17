'use client';

import React, { useState, useEffect } from 'react';
import { FinanceCategory, SystemSettings } from '@/types';
import { getSystemSettings, updateSystemSettings } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'react-toastify';
import { FaSave, FaLink, FaInfoCircle } from 'react-icons/fa';

interface SupplierSettingsProps {
  categories: FinanceCategory[];
}

export default function SupplierSettings({ categories }: SupplierSettingsProps) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching system settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      toast.success(t('admin.settings_saved') || 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('admin.settings_error') || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">{t('common.loading') || 'Loading...'}</p>
      </div>
    );
  }

  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FaLink />
          {t('admin.supplier_settings') || 'Supplier Settings'}
        </h2>
        <p className="text-indigo-100 mt-1">
          {t('admin.supplier_settings_desc') || 'Link your finance categories to the supplier dashboard logic'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <FaInfoCircle className="text-blue-500 mt-1 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              {t('admin.category_link_hint') || 'Select the category that will be used for all material expenses created from the supplier dashboard.'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('admin.material_category') || 'Material Expense Category'}
              </label>
              <select
                value={settings.materialCategoryId || ''}
                onChange={(e) => setSettings({ ...settings, materialCategoryId: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              >
                <option value="">{t('admin.select_category') || 'Select a category...'}</option>
                {expenseCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`
                  flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2 rounded-lg font-bold text-white transition-all
                  ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md hover:shadow-lg'}
                `}
              >
                <FaSave />
                {saving ? (t('common.saving') || 'Saving...') : (t('admin.save_settings') || 'Save Settings')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
