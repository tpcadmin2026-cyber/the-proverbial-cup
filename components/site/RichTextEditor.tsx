'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Color from '@tiptap/extension-color'
import LinkExtension from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useState } from 'react'

interface FontOption {
  label: string
  family: string
  // When set, selecting this option also forces bold/italic to this exact state.
  // Left undefined for plain family choices so switching fonts never disturbs
  // whatever bold/italic the user already has on.
  bold?: boolean
  italic?: boolean
}

const FONTS: FontOption[] = [
  { label: 'Default', family: '' },
  { label: 'Body serif (Baskerville)', family: "'Libre Baskerville', serif" },
  { label: 'Playfair Display — Regular', family: "'Playfair Display', serif", bold: false, italic: false },
  { label: 'Playfair Display — Bold Italic', family: "'Playfair Display', serif", bold: true, italic: true },
  { label: 'Display (Anton)', family: "'Anton', sans-serif" },
  { label: 'Antonio', family: "'Antonio', sans-serif" },
  { label: 'Sans-serif (Inter)', family: 'Inter, sans-serif' },
  { label: 'Georgia', family: 'Georgia, serif' },
  { label: 'Times New Roman', family: "'Times New Roman', serif" },
  { label: 'Arial', family: 'Arial, sans-serif' },
  { label: 'Courier New', family: "'Courier New', monospace" },
]

/** Resolves which FONTS entry best describes the current selection, for the dropdown's display value. */
function currentFontLabel(editor: Editor): string {
  const family = (editor.getAttributes('textStyle').fontFamily as string | undefined) ?? ''
  const isBold = editor.isActive('bold')
  const isItalic = editor.isActive('italic')
  const exact = FONTS.find((f) => f.family === family && f.bold === isBold && f.italic === isItalic)
  if (exact) return exact.label
  const byFamilyOnly = FONTS.find((f) => f.family === family && f.bold === undefined && f.italic === undefined)
  return byFamilyOnly?.label ?? 'Default'
}

const COLORS = ['#35291C', '#4B4C44', '#7A564C', '#C4AB77', '#7a1515', '#1a5c3a', '#1a3a5c', '#000000']

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 180 }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TextStyle,
      FontFamily,
      Color,
      LinkExtension.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write your text here…' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: `min-height:${minHeight}px`,
        class: 'rte-content',
      },
    },
  })

  if (!editor) return null

  return (
    <div style={{ border: '1px solid #c8c4a8', borderRadius: '5px', backgroundColor: 'white', overflow: 'hidden' }}>
      <Toolbar editor={editor} />
      <div style={{ padding: '10px 12px', fontFamily: "'Libre Baskerville', serif", fontSize: '13px', lineHeight: 1.7 }}>
        <EditorContent editor={editor} />
      </div>
      <style jsx global>{`
        .rte-content { outline: none; }
        .rte-content p { margin: 0 0 0.6em; }
        .rte-content p:last-child { margin-bottom: 0; }
        .rte-content ul, .rte-content ol { margin: 0 0 0.6em; padding-left: 1.2em; }
        .rte-content a { color: #7A564C; text-decoration: underline; }
        .rte-content h2 { font-family: 'Playfair Display', serif; font-size: 1.3em; margin: 0 0 0.4em; }
        .rte-content h3 { font-family: 'Playfair Display', serif; font-size: 1.1em; margin: 0 0 0.4em; }
        .rte-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #b8b090;
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const [showColors, setShowColors] = useState(false)

  function setLink() {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', previousUrl ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const btn = (active: boolean): React.CSSProperties => ({
    background: active ? '#35291C' : 'none',
    color: active ? '#E8E6D8' : '#35291C',
    border: '1px solid transparent',
    borderRadius: '4px',
    width: '26px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
    flexShrink: 0,
  })

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap',
      padding: '6px 8px', backgroundColor: '#f5f2e8', borderBottom: '1px solid #e8e4d0',
    }}>
      <select
        value={currentFontLabel(editor)}
        onChange={(e) => {
          const opt = FONTS.find((f) => f.label === e.target.value)
          if (!opt) return
          let chain = editor.chain().focus()
          chain = opt.family ? chain.setFontFamily(opt.family) : chain.unsetFontFamily()
          if (opt.bold === true) chain = chain.setBold()
          if (opt.bold === false) chain = chain.unsetBold()
          if (opt.italic === true) chain = chain.setItalic()
          if (opt.italic === false) chain = chain.unsetItalic()
          chain.run()
        }}
        style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', border: '1px solid #c8c4a8', borderRadius: '4px', padding: '3px 4px', marginRight: '4px', maxWidth: '160px' }}
        title="Font family"
      >
        {FONTS.map((f) => <option key={f.label} value={f.label}>{f.label}</option>)}
      </select>

      <Divider />

      <button type="button" title="Bold (⌘B)" style={{ ...btn(editor.isActive('bold')), fontWeight: 700 }} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
      <button type="button" title="Italic (⌘I)" style={{ ...btn(editor.isActive('italic')), fontStyle: 'italic' }} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
      <button type="button" title="Underline (⌘U)" style={{ ...btn(editor.isActive('underline')), textDecoration: 'underline' }} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
      <button type="button" title="Strikethrough" style={{ ...btn(editor.isActive('strike')), textDecoration: 'line-through' }} onClick={() => editor.chain().focus().toggleStrike().run()}>S</button>

      <Divider />

      <div style={{ position: 'relative' }}>
        <button type="button" title="Text colour" style={btn(showColors)} onClick={() => setShowColors((v) => !v)}>
          <span style={{ width: '13px', height: '13px', borderRadius: '50%', backgroundColor: editor.getAttributes('textStyle').color || '#35291C', border: '1px solid #c8c4a8', display: 'block' }} />
        </button>
        {showColors && (
          <div style={{ position: 'absolute', top: '30px', left: 0, zIndex: 10, display: 'flex', gap: '4px', padding: '6px', backgroundColor: 'white', border: '1px solid #c8c4a8', borderRadius: '5px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            {COLORS.map((c) => (
              <button
                key={c} type="button" title={c}
                style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: c, border: '1px solid #c8c4a8', cursor: 'pointer' }}
                onClick={() => { editor.chain().focus().setColor(c).run(); setShowColors(false) }}
              />
            ))}
            <button
              type="button" title="Reset colour"
              style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #c8c4a8', cursor: 'pointer', fontSize: '10px', lineHeight: 1 }}
              onClick={() => { editor.chain().focus().unsetColor().run(); setShowColors(false) }}
            >✕</button>
          </div>
        )}
      </div>

      <Divider />

      <button type="button" title="Heading 2" style={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
      <button type="button" title="Heading 3" style={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>

      <Divider />

      <button type="button" title="Bullet list" style={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>≡•</button>
      <button type="button" title="Numbered list" style={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>≡1</button>

      <Divider />

      <button type="button" title="Align left" style={btn(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()}>⟵</button>
      <button type="button" title="Align centre" style={btn(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()}>↔</button>
      <button type="button" title="Align right" style={btn(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()}>⟶</button>

      <Divider />

      <button type="button" title="Add link" style={btn(editor.isActive('link'))} onClick={setLink}>🔗</button>

      <Divider />

      <button type="button" title="Undo (⌘Z)" style={btn(false)} onClick={() => editor.chain().focus().undo().run()}>↶</button>
      <button type="button" title="Redo (⌘⇧Z)" style={btn(false)} onClick={() => editor.chain().focus().redo().run()}>↷</button>
      <button type="button" title="Clear formatting" style={btn(false)} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>Tx</button>
    </div>
  )
}

function Divider() {
  return <div style={{ width: '1px', height: '18px', backgroundColor: '#e0dcc8', margin: '0 3px', flexShrink: 0 }} />
}
