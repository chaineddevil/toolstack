"use client";

import { useFieldArray, type Control } from "react-hook-form";

interface DynamicListEditorProps {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  addLabel?: string;
}

export default function DynamicListEditor({
  control,
  name,
  label,
  placeholder = "Enter item...",
  addLabel = "Add Item",
}: DynamicListEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <input
              {...control.register(`${name}.${index}.value`)}
              className="flex-1 p-2 border rounded-lg text-sm"
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => append({ value: "" })}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + {addLabel}
      </button>
    </div>
  );
}
