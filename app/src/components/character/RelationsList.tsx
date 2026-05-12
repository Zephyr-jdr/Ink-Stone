import { useState } from 'react';
import { ArrowUpRight, Plus, X, Pencil, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { useRelations } from '@/hooks/useRelations';
import { RELATION_TYPES, getRelationType } from '@/lib/constants';
import { useT } from '@/i18n';
import type { Character, Relation } from '@/types';

interface RelationsListProps {
  characterId: string;
  characters: Character[];
  relations: Relation[];
}

export function RelationsList({
  characterId,
  characters,
  relations,
}: RelationsListProps) {
  const t = useT();
  const navigate = useNavigate();
  const { session } = useAppStore();
  const { createRelation, updateRelation, deleteRelation } = useRelations(
    session?.space.id
  );

  const [showAdd, setShowAdd] = useState(false);
  const [selectedChar, setSelectedChar] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>(RELATION_TYPES[0].id);
  const [detail, setDetail] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTypeId, setEditTypeId] = useState<string>(RELATION_TYPES[0].id);
  const [editDetail, setEditDetail] = useState('');

  
  const relLabel = (id: string) => {
    const rt = getRelationType(id);
    return rt.labelKey ? (t as (k: string) => string)(rt.labelKey) : rt.label;
  };

  const characterRelations = relations.filter(
    (r) =>
      r.from_character_id === characterId || r.to_character_id === characterId
  );

  const getRelatedCharacter = (relation: Relation) => {
    const relatedId =
      relation.from_character_id === characterId
        ? relation.to_character_id
        : relation.from_character_id;
    return characters.find((c) => c.id === relatedId);
  };

  const handleAdd = async () => {
    if (!selectedChar || !session) return;
    try {
      await createRelation({
        space_id: session.space.id,
        from_character_id: characterId,
        to_character_id: selectedChar,
        relation_type: selectedTypeId,
        relation_detail: detail.trim() || undefined,
      });
      setShowAdd(false);
      setSelectedChar('');
      setDetail('');
      setSelectedTypeId(RELATION_TYPES[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (rel: Relation) => {
    setEditingId(rel.id);
    setEditTypeId(rel.relation_type);
    setEditDetail(rel.relation_detail || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDetail('');
  };

  const saveEditing = async () => {
    if (!editingId) return;
    try {
      await updateRelation(editingId, {
        relation_type: editTypeId,
        relation_detail: editDetail.trim() || undefined,
      });
      setEditingId(null);
      setEditDetail('');
    } catch (err) {
      console.error(err);
    }
  };

  const availableChars = characters.filter((c) => {
    if (c.id === characterId) return false;
    return !relations.some(
      (r) =>
        (r.from_character_id === characterId && r.to_character_id === c.id) ||
        (r.to_character_id === characterId && r.from_character_id === c.id)
    );
  });

  return (
    <section>
      <h3 className="label-overline mb-4">{t('character.relations')}</h3>

      {characterRelations.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] font-body mb-4">
          {t('character.noRelation')}
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          {characterRelations.map((relation) => {
            const target = getRelatedCharacter(relation);
            if (!target) return null;
            const rt = getRelationType(relation.relation_type);
            const labelTr = relLabel(relation.relation_type);
            const subLabel = relation.relation_detail
              ? `${labelTr} · ${relation.relation_detail}`
              : labelTr;
            const isEditing = editingId === relation.id;

            if (isEditing) {
              const editRt = getRelationType(editTypeId);
              return (
                <article
                  key={relation.id}
                  className="card-paper p-3 space-y-2 relative overflow-hidden"
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: editRt.color }}
                  />
                  <div className="pl-1">
                    <p className="font-display text-base font-semibold text-[var(--text-primary)] mb-2 truncate">
                      {target.name}
                    </p>
                    <select
                      value={editTypeId}
                      onChange={(e) => setEditTypeId(e.target.value)}
                      className="field-paper text-sm h-9 mb-2"
                    >
                      {RELATION_TYPES.map((rtOpt) => (
                        <option key={rtOpt.id} value={rtOpt.id}>
                          {relLabel(rtOpt.id)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editDetail}
                      onChange={(e) => setEditDetail(e.target.value)}
                      placeholder={t('character.relationPrecisionPlaceholder')}
                      className="field-paper text-sm h-9 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEditing}
                        className="btn-ink h-9 px-3 text-xs flex-1"
                      >
                        <Check size={13} /> {t('common.save')}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="btn-outline h-9 px-3 text-xs"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <article key={relation.id} className="relative group">
                <button
                  onClick={() => navigate(`/character/${target.id}`)}
                  className="relation-stamp w-full"
                  title={`${target.name} — ${subLabel}`}
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: rt.color }}
                  />
                  <div className="min-w-0 text-left pl-1">
                    <div className="stamp-name truncate">{target.name}</div>
                    <div className="stamp-sub truncate">{subLabel}</div>
                  </div>
                  <ArrowUpRight size={20} className="stamp-arrow" />
                </button>

                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(relation);
                    }}
                    className="w-6 h-6 rounded-full bg-[var(--bg-card)] border border-[var(--border-paper)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-focus)] flex items-center justify-center"
                    title={t('character.editRelation')}
                    aria-label={t('character.editRelation')}
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t('character.deleteRelationConfirm'))) {
                        deleteRelation(relation.id);
                      }
                    }}
                    className="w-6 h-6 rounded-full bg-[var(--bg-card)] border border-[var(--border-paper)] text-[var(--text-muted)] hover:text-red-600 hover:border-red-300 flex items-center justify-center"
                    title={t('character.deleteRelation')}
                    aria-label={t('character.deleteRelation')}
                  >
                    <X size={12} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showAdd ? (
        <div className="space-y-3 p-4 card-paper">
          <select
            value={selectedChar}
            onChange={(e) => setSelectedChar(e.target.value)}
            className="field-paper text-sm"
          >
            <option value="">{t('character.pickCharacter')}</option>
            {availableChars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.role ? `· ${c.role}` : ''}
              </option>
            ))}
          </select>
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            className="field-paper text-sm"
          >
            {RELATION_TYPES.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {relLabel(rt.id)}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={t('character.detailPlaceholder')}
            className="field-paper text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!selectedChar}
              className="btn-ink flex-1 disabled:opacity-40"
            >
              {t('common.add')}
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setDetail('');
              }}
              className="btn-outline"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          disabled={availableChars.length === 0}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-body disabled:opacity-40"
        >
          <Plus size={14} />
          {t('character.addRelation')}
        </button>
      )}
    </section>
  );
}
