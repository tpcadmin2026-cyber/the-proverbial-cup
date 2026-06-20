'use client'

// A single admin settings field — renders the correct input type for every setting.
// Designed for non-technical users: plain English labels, always visible helper text.

interface Option { label: string; value: string }

interface SettingsFieldProps {
  settingKey: string
  label: string
  helpText?: string
  inputType: string
  value: unknown
  options?: Option[]
  onChange: (key: string, value: unknown) => void
}

export function SettingsField({ settingKey, label, helpText, inputType, value, options, onChange }: SettingsFieldProps) {
  const id = `setting-${settingKey}`

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-900 mb-0.5">
        {label}
      </label>
      {helpText && (
        <p className="text-xs text-gray-500 mb-2">{helpText}</p>
      )}

      {inputType === 'toggle' && (
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={!!value}
          onClick={() => onChange(settingKey, !value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C4AB77] ${value ? 'bg-[#C4AB77]' : 'bg-gray-200'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      )}

      {inputType === 'color' && (
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="color"
            value={String(value || '#000000')}
            onChange={(e) => onChange(settingKey, e.target.value)}
            className="h-9 w-16 cursor-pointer rounded border border-gray-200 p-0.5"
          />
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => onChange(settingKey, e.target.value)}
            className="w-32 rounded border border-gray-200 px-2 py-1 text-sm font-mono"
            placeholder="#000000"
          />
        </div>
      )}

      {inputType === 'select' && options && (
        <select
          id={id}
          value={String(value || '')}
          onChange={(e) => onChange(settingKey, e.target.value)}
          className="w-full max-w-xs rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4AB77]"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {inputType === 'textarea' && (
        <textarea
          id={id}
          value={String(value || '')}
          onChange={(e) => onChange(settingKey, e.target.value)}
          rows={4}
          className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4AB77]"
        />
      )}

      {inputType === 'image' && (
        <div className="flex items-center gap-3">
          {!!value && <img src={String(value)} alt={label} className="h-10 w-10 rounded object-cover border border-gray-200" />}
          <input
            id={id}
            type="url"
            value={String(value || '')}
            onChange={(e) => onChange(settingKey, e.target.value)}
            placeholder="Paste image URL or upload below"
            className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4AB77]"
          />
        </div>
      )}

      {(inputType === 'text' || inputType === 'email' || inputType === 'url') && (
        <input
          id={id}
          type={inputType}
          value={String(value || '')}
          onChange={(e) => onChange(settingKey, e.target.value)}
          className="w-full max-w-lg rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4AB77]"
        />
      )}

      {inputType === 'number' && (
        <input
          id={id}
          type="number"
          value={Number(value)}
          onChange={(e) => onChange(settingKey, parseFloat(e.target.value))}
          className="w-32 rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4AB77]"
        />
      )}
    </div>
  )
}
