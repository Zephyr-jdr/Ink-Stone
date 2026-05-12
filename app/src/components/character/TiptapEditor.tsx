import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
}

/**
 * Éditeur Tiptap pour les notes d'un personnage.
 *
 * Important : Tiptap ne réagit PAS au changement de prop `editable`
 * après initialisation. On force la synchro via `editor.setEditable()`
 * dans un `useEffect`. Sans ça, on reste figé en read-only quand on
 * passe la fiche en mode édition.
 *
 * On synchronise aussi `content` quand il change depuis l'extérieur
 * (par exemple au chargement d'une nouvelle fiche), pour que l'éditeur
 * reflète bien la nouvelle valeur.
 */
export function TiptapEditor({ content, onChange, editable = true }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Écrivez vos notes ici…',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Synchroniser le mode édition (clé du fix : sans ça, le passage en mode
  // édition côté CharacterSheet ne se propage pas à Tiptap).
  useEffect(() => {
    if (!editor) return;
    if (editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Synchroniser le contenu si la prop change depuis l'extérieur (changement
  // de fiche, annulation d'édition, etc.). On ne le fait que si la valeur
  // diffère vraiment de l'état actuel pour ne pas casser le curseur de
  // l'utilisateur en train de taper.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      // `emitUpdate: false` : ne déclenche pas onUpdate (pas de boucle).
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      {editable && (
        <div className="flex items-center gap-1 px-3 py-2 bg-[var(--bg-card-alt)] border-b border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bold')
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('italic')
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <ListOrdered size={14} />
          </button>
        </div>
      )}
      <div className="bg-[var(--bg-card)]">
        <EditorContent
          editor={editor}
          className="px-4 py-3 min-h-[150px] text-[var(--text-secondary)] font-body text-sm leading-relaxed"
        />
      </div>
    </div>
  );
}
