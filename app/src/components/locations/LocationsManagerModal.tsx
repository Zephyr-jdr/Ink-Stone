import { useState } from 'react';
import { Pencil, Plus, Trash2, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocations } from '@/hooks/useLocations';
import { useAppStore } from '@/stores/appStore';
import { ColorSwatch } from './LocationPicker';
import { DEFAULT_LOCATION_PALETTE } from '@/lib/constants';
import { useT } from '@/i18n';
import type { Location } from '@/types';

interface Props {
  spaceId: string;
  onClose: () => void;
}

export function LocationsManagerModal({ spaceId, onClose }: Props) {
  const t = useT();
  const { locations, createLocation, updateLocation, deleteLocation } = useLocations(spaceId);
  const { characters, showToast } = useAppStore();

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(
    () => DEFAULT_LOCATION_PALETTE[Math.floor(Math.random() * DEFAULT_LOCATION_PALETTE.length)]
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createLocation({ name: newName.trim(), color: newColor });
      setNewName('');
      setNewColor(
        DEFAULT_LOCATION_PALETTE[Math.floor(Math.random() * DEFAULT_LOCATION_PALETTE.length)]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (loc: Location) => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditColor(loc.color);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateLocation(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const handleDelete = async (loc: Location) => {
    const charsCount = characters.filter((c) => c.location === loc.id).length;
    const message =
      charsCount > 0
        ? t('locations.deleteConfirmWithChars', { name: loc.name, n: charsCount })
        : t('locations.deleteConfirm', { name: loc.name });
    if (!confirm(message)) return;
    await deleteLocation(loc.id);
    showToast(t('locations.deleted', { name: loc.name }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md card-paper p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X size={20} />
        </button>

        <p className="label-overline mb-1">{t('locations.overline')}</p>
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-5 leading-tight">
          {t('locations.title')}
        </h2>

        {/* Liste */}
        <div className="space-y-1.5 mb-5 max-h-[40vh] overflow-y-auto pr-1">
          {locations.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] font-body italic py-3">
              {t('locations.empty')}
            </p>
          )}
          {locations.map((loc) => {
            const isEditing = loc.id === editingId;
            const charsCount = characters.filter((c) => c.location === loc.id).length;
            return (
              <div
                key={loc.id}
                className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card-alt)]/50"
              >
                {isEditing ? (
                  <>
                    <ColorSwatch value={editColor} onChange={setEditColor} />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="field-paper text-sm h-9 flex-1"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[var(--border-paper)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)]"
                      title={t('common.save')}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[var(--border-paper)] hover:bg-[var(--bg-card)] text-[var(--text-muted)]"
                      title={t('common.cancel')}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      aria-hidden
                      className="w-4 h-4 rounded border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: loc.color }}
                    />
                    <span className="flex-1 text-sm font-body text-[var(--text-primary)] truncate">
                      {loc.name}
                    </span>
                    {charsCount > 0 && (
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                        {t('locations.countLabel', { n: charsCount })}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(loc)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                      title={t('locations.rename')}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(loc)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-600 hover:bg-[var(--bg-card)]"
                      title={t('common.delete')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Ajouter */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <p className="label-overline mb-2">{t('locations.addOverline')}</p>
          <div className="flex items-center gap-2">
            <ColorSwatch value={newColor} onChange={setNewColor} />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder={t('locations.addPlaceholder')}
              className="field-paper text-sm h-9 flex-1"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || submitting}
              className="btn-ink h-9 px-3 text-xs disabled:opacity-40"
            >
              <Plus size={14} />
              {t('locations.create')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
