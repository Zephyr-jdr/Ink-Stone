import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, X, Check, Trash2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { TiptapEditor } from '@/components/character/TiptapEditor';
import { RelationsList } from '@/components/character/RelationsList';
import { Toast } from '@/components/shared/Toast';
import { useAppStore } from '@/stores/appStore';
import { useCharacters } from '@/hooks/useCharacters';
import { useRelations } from '@/hooks/useRelations';
import { FALLBACK_LOCATION_COLOR } from '@/lib/constants';
import { LocationPicker } from '@/components/locations/LocationPicker';
import { useLocations } from '@/hooks/useLocations';
import { useT } from '@/i18n';
import type { Trait } from '@/types';


export default function CharacterSheetPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const { session, characters } = useAppStore();
  const { updateCharacter, deleteCharacter } = useCharacters(session?.space.id);
  const { relations } = useRelations(session?.space.id);
  const { locations } = useLocations(session?.space.id);

  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState('');
  const [localRole, setLocalRole] = useState('');
  const [localLocation, setLocalLocation] = useState<string | undefined>(undefined);
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [localNotes, setLocalNotes] = useState('');
  const [localTraits, setLocalTraits] = useState<Trait[]>([]);
  const [traitInput, setTraitInput] = useState('');
  const [loading, setLoading] = useState(false);

  const character = characters.find((c) => c.id === id);

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  
  useEffect(() => {
    if (!character) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalName(character.name);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalRole(character.role || '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalLocation(character.location);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalTags(character.tags || []);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalNotes(character.notes || '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalTraits(character.traits || []);
  }, [character]);

  const handleSave = useCallback(async () => {
    if (!character || !id) return;
    setLoading(true);
    try {
      await updateCharacter(id, {
        name: localName,
        role: localRole,
        location: localLocation,
        tags: localTags,
        notes: localNotes,
        traits: localTraits,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setLoading(false);
    }
  }, [
    character,
    id,
    localName,
    localRole,
    localLocation,
    localTags,
    localNotes,
    localTraits,
    updateCharacter,
  ]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    if (!confirm(t('character.deleteConfirm'))) return;
    await deleteCharacter(id);
    navigate('/dashboard');
  }, [id, deleteCharacter, navigate]);

  const toggleTrait = (index: number) => {
    setLocalTraits((prev) =>
      prev.map((t, i) => (i === index ? { ...t, checked: !t.checked } : t))
    );
  };

  const addTrait = () => {
    if (traitInput.trim()) {
      setLocalTraits((p) => [...p, { label: traitInput.trim(), checked: false }]);
      setTraitInput('');
    }
  };
  const removeTrait = (index: number) =>
    setLocalTraits((p) => p.filter((_, i) => i !== index));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !localTags.includes(t)) {
      setLocalTags((p) => [...p, t]);
      setTagInput('');
    }
  };
  const removeTag = (tag: string) =>
    setLocalTags((p) => p.filter((t) => t !== tag));

  if (!session) return null;
  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-muted)] font-body">{t('character.notFound')}</p>
      </div>
    );
  }

  const characterLocation = character.location
    ? locations.find((l) => l.id === character.location)
    : undefined;
  const locationColor = characterLocation?.color ?? FALLBACK_LOCATION_COLOR;
  const locationName = characterLocation?.name;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Sheet Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 mb-10 flex-wrap"
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title={t('character.backToGrimoire')}
            >
              <ArrowLeft size={22} />
            </button>
            <div className="min-w-0">
              <p className="label-overline mb-1">{t('character.sheetOverline')}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {isEditing ? (
                  <input
                    type="text"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    className="font-display text-3xl md:text-5xl font-bold text-[var(--text-primary)] bg-transparent border-b-2 border-[var(--border-focus)] focus:outline-none pb-1 max-w-full"
                  />
                ) : (
                  <h1 className="font-display text-3xl md:text-5xl font-bold text-[var(--text-primary)] leading-none truncate">
                    {character.name}
                  </h1>
                )}
                <span
                  className={`text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 rounded border ${
                    character.type === 'PJ'
                      ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)] border-[var(--accent-primary)]'
                      : 'text-[var(--text-muted)] border-[var(--border-paper)]'
                  }`}
                >
                  {character.type === 'PJ' ? t('character.typePC') : t('character.typeNPC')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-ink"
                >
                  <Check size={16} />
                  {t('common.save')}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (character) {
                      setLocalName(character.name);
                      setLocalRole(character.role || '');
                      setLocalLocation(character.location);
                      setLocalTags(character.tags || []);
                      setLocalNotes(character.notes || '');
                      setLocalTraits(character.traits || []);
                    }
                  }}
                  className="btn-outline"
                >
                  <X size={16} />
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="btn-outline">
                  <Pencil size={14} />
                  {t('common.edit')}
                </button>
                <button
                  onClick={handleDelete}
                  title={t('common.delete')}
                  className="p-2.5 border border-[var(--border-paper)] rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:border-red-300 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Informations */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-paper p-6 relative overflow-hidden"
            >
              <span
                aria-hidden
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: locationColor }}
              />
              <h3 className="label-overline mb-4">{t('character.informations')}</h3>
              <div className="space-y-3 text-sm font-body">
                <FieldRow label={t('character.role')}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={localRole}
                      onChange={(e) => setLocalRole(e.target.value)}
                      placeholder={t('character.rolePlaceholder')}
                      className="flex-1 bg-transparent border-b border-[var(--border-paper)] focus:border-[var(--border-focus)] focus:outline-none pb-0.5"
                    />
                  ) : (
                    <span className="text-[var(--text-secondary)]">
                      {character.role || '—'}
                    </span>
                  )}
                </FieldRow>

                <FieldRow label={t('character.type')}>
                  <span className="text-[var(--text-secondary)]">
                    {character.type === 'PJ' ? t('character.typePCFull') : t('character.typeNPCFull')}
                  </span>
                </FieldRow>

                <FieldRow label={t('character.location')}>
                  {isEditing ? (
                    <div className="flex-1">
                      <LocationPicker
                        spaceId={session?.space.id}
                        value={localLocation}
                        onChange={setLocalLocation}
                      />
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <MapPin size={12} style={{ color: locationColor }} />
                      {locationName || '—'}
                    </span>
                  )}
                </FieldRow>
              </div>

              {/* Tags */}
              <div className="mt-5">
                <h4 className="label-overline mb-2">{t('character.tags')}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {localTags.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                      {isEditing && (
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 -mr-1 text-[var(--text-muted)] hover:text-red-600"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </span>
                  ))}
                  {isEditing && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[var(--border-paper)] text-xs">
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder={t('character.tagPlaceholder')}
                        className="bg-transparent outline-none w-20 text-xs"
                      />
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Traits */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-paper p-6"
            >
              <h3 className="label-overline mb-4">{t('character.traits')}</h3>

              {localTraits.length === 0 && !isEditing ? (
                <p className="text-sm text-[var(--text-muted)] font-body">
                  {t('character.noTrait')}
                </p>
              ) : (
                <ul className="space-y-2">
                  {localTraits.map((trait, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <button
                        onClick={() => (isEditing ? toggleTrait(index) : undefined)}
                        className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 transition-colors ${
                          trait.checked
                            ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                            : 'border-[var(--border-paper)]'
                        } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        {trait.checked && (
                          <Check size={10} className="text-white" strokeWidth={3} />
                        )}
                      </button>
                      <span className="text-sm text-[var(--text-secondary)] font-body flex-1">
                        {trait.label}
                      </span>
                      {isEditing && (
                        <button
                          onClick={() => removeTrait(index)}
                          className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {isEditing && (
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={traitInput}
                    onChange={(e) => setTraitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTrait();
                      }
                    }}
                    placeholder={t('character.newTrait')}
                    className="field-paper text-sm h-9"
                  />
                  <button
                    onClick={addTrait}
                    className="h-9 px-3 border border-[var(--border-paper)] rounded-lg hover:bg-[var(--bg-card-alt)] transition-colors text-[var(--text-secondary)]"
                  >
                    <Check size={14} />
                  </button>
                </div>
              )}
            </motion.div>

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-paper p-6"
            >
              <h3 className="label-overline mb-4">{t('character.notes')}</h3>
              <TiptapEditor
                content={localNotes}
                onChange={setLocalNotes}
                editable={isEditing}
              />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-paper p-6 sticky top-6"
            >
              <RelationsList
                characterId={character.id}
                characters={characters}
                relations={relations}
              />
            </motion.div>
          </div>
        </div>

      </main>

      <Toast />
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-[var(--text-primary)] min-w-[60px]">
        {label} :
      </span>
      {children}
    </div>
  );
}