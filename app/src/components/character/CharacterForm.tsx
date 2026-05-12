import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCharacters } from '@/hooks/useCharacters';
import { useAppStore } from '@/stores/appStore';
import { LocationPicker } from '@/components/locations/LocationPicker';
import { useT } from '@/i18n';
import type { Trait } from '@/types';

interface CharacterFormProps {
  onClose: () => void;
}

export function CharacterForm({ onClose }: CharacterFormProps) {
  const t = useT();
  const { session } = useAppStore();
  const { createCharacter } = useCharacters(session?.space.id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [type, setType] = useState<'PJ' | 'PNJ'>('PNJ');
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [traits, setTraits] = useState<Trait[]>([]);
  const [traitInput, setTraitInput] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };
  const handleRemoveTag = (tag: string) =>
    setTags(tags.filter((t) => t !== tag));

  const handleAddTrait = () => {
    if (traitInput.trim()) {
      setTraits([...traits, { label: traitInput.trim(), checked: false }]);
      setTraitInput('');
    }
  };
  const handleRemoveTrait = (index: number) =>
    setTraits(traits.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !session) return;

    setLoading(true);
    try {
      const character = await createCharacter({
        space_id: session.space.id,
        name: name.trim(),
        role: role.trim(),
        type,
        location: locationId,
        notes,
        traits,
        tags,
      });
      navigate(`/character/${character.id}`);
      onClose();
    } catch (err) {
      console.error('Error creating character:', err);
    } finally {
      setLoading(false);
    }
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
        className="relative w-full max-w-lg card-paper p-8 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={20} />
        </button>

        <p className="label-overline mb-1">{t('characterForm.overline')}</p>
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
          {t('characterForm.title')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="label-overline block mb-2">{t('characterForm.nameLabel')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('characterForm.namePlaceholder')}
              required
              className="field-paper"
            />
          </div>

          {/* Type */}
          <div>
            <label className="label-overline block mb-2">{t('characterForm.typeLabel')}</label>
            <div className="flex gap-2">
              {(['PJ', 'PNJ'] as const).map((typ) => (
                <button
                  key={typ}
                  type="button"
                  onClick={() => setType(typ)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium font-body transition-all ${
                    type === typ
                      ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)] border border-[var(--accent-primary)]'
                      : 'bg-transparent border border-[var(--border-paper)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-alt)]'
                  }`}
                >
                  {typ === 'PJ' ? t('character.typePCFull') : t('character.typeNPCFull')}
                </button>
              ))}
            </div>
          </div>


          {/* Role */}
          <div>
            <label className="label-overline block mb-2">{t('characterForm.roleLabel')}</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={t('characterForm.rolePlaceholder')}
              className="field-paper"
            />
          </div>

          {/* Location (LocationPicker) */}
          <div>
            <label className="label-overline block mb-2">{t('characterForm.locationLabel')}</label>
            <LocationPicker
              spaceId={session?.space.id}
              value={locationId}
              onChange={setLocationId}
              placeholder={t('characterForm.locationPlaceholder')}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="label-overline block mb-2">{t('characterForm.tagsLabel')}</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder={t('characterForm.tagsPlaceholder')}
                className="field-paper text-sm h-10"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="h-10 px-3 border border-[var(--border-paper)] rounded-lg hover:bg-[var(--bg-card-alt)] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 -mr-1 text-[var(--text-muted)] hover:text-red-600"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Traits */}
          <div>
            <label className="label-overline block mb-2">{t('characterForm.traitsLabel')}</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={traitInput}
                onChange={(e) => setTraitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTrait();
                  }
                }}
                placeholder={t('characterForm.traitsPlaceholder')}
                className="field-paper text-sm h-10"
              />
              <button
                type="button"
                onClick={handleAddTrait}
                className="h-10 px-3 border border-[var(--border-paper)] rounded-lg hover:bg-[var(--bg-card-alt)] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            {traits.length > 0 && (
              <div className="space-y-1.5">
                {traits.map((trait, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-subtle)] rounded-lg"
                  >
                    <span className="text-sm text-[var(--text-secondary)] font-body">
                      {trait.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTrait(i)}
                      className="text-[var(--text-muted)] hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="label-overline block mb-2">{t('characterForm.notesLabel')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('characterForm.notesPlaceholder')}
              rows={4}
              className="field-paper-area"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="btn-ink w-full"
          >
            {loading ? t('characterForm.submitting') : t('characterForm.submit')}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
