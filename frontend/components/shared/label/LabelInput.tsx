'use client'

import React, { useState } from 'react'
import { Label } from '@/types'
import LabelTag from './LabelTag';
import { useParams } from 'next/navigation';
import { useTasks } from '@/hooks/useTasks';
import { Input } from '@/components/ui/input';


interface CustomTagInputProps {
  onChange: (tags: Label[]) => void;
  initialTags?: Label[];
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder?: string;
}

export function LabelInput({
  onChange,
  initialTags = [],
  inputValue,     
  onInputChange,   
  placeholder      
}: CustomTagInputProps) {
  

  const [tags, setTags] = useState<Label[]>(initialTags)


  React.useEffect(() => {
    setTags(initialTags)
  }, [initialTags])

  const projectId = useParams().projectId as string;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault() 
      
      const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      };

      const now = new Date().toISOString()
      const newTag: Label = {
        id: '',
        name: inputValue.trim(),
        color: getRandomColor(),
        projectId: projectId,
        createdAt: now,
        updatedAt: now,
      }
      
      if (!tags.find(t => t.name.toLowerCase() === newTag.name.toLowerCase())) {
        const newTags = [...tags, newTag]
        setTags(newTags)
        onChange(newTags) 
      }
      
      onInputChange('') 
    }

    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      e.preventDefault()
      const newTags = tags.slice(0, -1)
      setTags(newTags)
      onChange(newTags) 
    }
  }

  const removeTag = (tagToRemove: Label) => {
    const newTags = tags.filter((tag) => tag.id !== tagToRemove.id)
    setTags(newTags)
    onChange(newTags) 
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2">
      {tags.map((tag) => (
        <LabelTag
          key={tag.id}
          onRemove={() => removeTag(tag)}
          label={tag}
        />
      ))}

      <Input
        placeholder={placeholder || "Gõ tag và nhấn Enter..."} 
        value={inputValue} 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e.target.value)} 
        onKeyDown={handleKeyDown}
        className="flex-1 border-none bg-transparent p-0 text-sm shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  )
}