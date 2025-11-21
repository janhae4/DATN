'use client'

import React, { useState } from 'react'
import LabelTag from './LabelTag'
import { Label } from '@/types'
// Giả lập, mày nhớ xóa khi về local
const LabelInputProp = (props: any) => <input {...props} />


interface CustomTagInputProps {
  // Callback function to handle tag changes
  onChange: (tags: Label[]) => void;
  // Initial tags to display
  initialTags?: Label[];
  
  // --- THÊM 2 PROP MỚI ---
  // Giá trị text đang gõ (từ cha)
  inputValue: string;
  // Callback khi text gõ thay đổi (báo cho cha)
  onInputChange: (value: string) => void;
  
  // Prop cũ, xài ké luôn
  placeholder?: string;
}

export function LabelInput({
  onChange,
  initialTags = [],
  inputValue,      // Nhận từ prop
  onInputChange,   // Nhận từ prop
  placeholder      // Nhận từ prop
}: CustomTagInputProps) {
  
  // State (Trạng thái) để lưu trữ các tags VẪN GIỮ NGUYÊN
  const [tags, setTags] = useState<Label[]>(initialTags)
  
  // XÓA STATE CỦA INPUTVALUE (Giờ cha quản lý)
  // const [inputValue, setInputValue] = useState('') // XÓA DÒNG NÀY

  // Sync state (nếu initialTags thay đổi từ bên ngoài)
  React.useEffect(() => {
    setTags(initialTags)
  }, [initialTags])

  // Hàm xử lý khi nhấn phím (đặc biệt là Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Chỉ xử lý khi nhấn Enter và ô input không trống
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault() // Ngăn form submit (gửi) nếu có
      
      const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      };

      const newTag = {
        id: `label-${Date.now()}`,
        name: inputValue.trim(),
        color: getRandomColor(),
        projectId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      // Kiểm tra để không thêm tag trùng lặp (check bằng name)
      if (!tags.find(t => t.name.toLowerCase() === newTag.name.toLowerCase())) {
        const newTags = [...tags, newTag]
        setTags(newTags)
        onChange(newTags) // Gửi mảng tags mới ra component cha
      }
      
      onInputChange('') // Xóa trắng ô input (bằng cách báo cha)
    }

    // Xử lý khi nhấn Backspace (Xóa lùi) lúc ô input trống
    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      e.preventDefault()
      // Xóa tag cuối cùng
      const newTags = tags.slice(0, -1)
      setTags(newTags)
      onChange(newTags) // Gửi mảng tags mới ra
    }
  }

  // Hàm xóa tag khi nhấn vào icon 'x'
  const removeTag = (tagToRemove: Label) => {
    const newTags = tags.filter((tag) => tag.id !== tagToRemove.id)
    setTags(newTags)
    onChange(newTags) // Gửi mảng tags mới ra
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

      <LabelInputProp
        placeholder={placeholder || "Gõ tag và nhấn Enter..."} // Dùng placeholder từ prop
        value={inputValue} // Dùng giá trị từ prop
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e.target.value)} // Báo cho cha khi gõ
        onKeyDown={handleKeyDown}
        // Style (Kiểu) cho cái input này "vô hình" (transparent)
        className="flex-1 border-none bg-transparent p-0 text-sm shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  )
}