"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Edit2, Plus, Save, Trash2, Clipboard } from "lucide-react";

// Định nghĩa các nhãn (labels) mà người dùng có thể chọn
const LABELS = [
  "PERSON",
  "TIME",
  "DATE",
  "TASK"
];

// Ánh xạ nhãn với màu Tailwind CSS
const LABEL_COLORS = {
  DATE: "bg-blue-200 border-blue-400",
  TIME: "bg-green-200 border-green-400",
  PERSON: "bg-red-200 border-red-400",
  TASK: "bg-yellow-200 border-yellow-400",
  PROJECT: "bg-purple-200 border-purple-400",
  LOCATION: "bg-pink-200 border-pink-400",
  OTHER: "bg-gray-200 border-gray-400",
  // Màu cho vùng đang chọn (selection)
  SELECTING: "bg-indigo-300 border-indigo-500",
  // Màu cho ô đã được chọn start (start marker)
  START: "bg-indigo-500 text-white font-bold border-indigo-700",
  // Màu cho hover và click states
  HOVER: "bg-blue-300 border-blue-500",
  CLICKED_END: "bg-blue-400 border-blue-600",
};

const AnnotationTool = () => {
  const [data, setData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startIdx, setStartIdx] = useState(null);
  const [endIdx, setEndIdx] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [clickedEndIdx, setClickedEndIdx] = useState(null); // Lưu vị trí end đã click
  const [showLabelSelector, setShowLabelSelector] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [newEntityStart, setNewEntityStart] = useState("");
  const [newEntityEnd, setNewEntityEnd] = useState("");
  const [newEntityLabel, setNewEntityLabel] = useState("PERSON");
  const jsonContainerRef = useRef(null);

  useEffect(() => {
    const storeData = async () => {
      try {
        const response = await fetch("./test-data.json");
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    storeData();
  }, []);

  useEffect(() => {
    if (jsonContainerRef.current && currentIndex !== null) {
      const container = jsonContainerRef.current;

      const itemHeightEstimate = container.scrollHeight / data.length;

      const scrollToPosition = currentIndex * itemHeightEstimate;

      container.scrollTo({
        top: scrollToPosition,
        behavior: "smooth",
      });
    }
  }, [currentIndex, data.length]);

  const currentItem = data[currentIndex] || null;
  let text = currentItem?.[0] ?? "";
  const entities = currentItem?.[1]?.entities ?? [];
  const characters = text.split("");
  characters[characters.length - 1] += " ";
  // Cập nhật highlight khi startIdx hoặc endIdx thay đổi
  useEffect(() => {
    if (startIdx !== null && endIdx !== null) {
      // Tự động highlight vùng được chọn
      setClickedEndIdx(endIdx);
    }
  }, [startIdx, endIdx]);

  // Hàm trả về thông tin entity của một ký tự
  const getEntityInfo = useCallback(
    (charIdx) => {
      // 1. Kiểm tra các thực thể đã có
      for (const [start, end, label] of entities) {
        if (charIdx >= start && charIdx <= end) {
          return {
            label,
            color: LABEL_COLORS[label],
            isExisting: true,
            priority: 3,
          };
        }
      }

      // 2. Kiểm tra trạng thái đang chọn
      if (startIdx !== null) {
        const effectiveStart = startIdx;
        const effectiveEnd = endIdx !== null ? endIdx : startIdx;
        const min = Math.min(effectiveStart, effectiveEnd);
        const max = Math.max(effectiveStart, effectiveEnd);

        if (charIdx >= min && charIdx <= max) {
          if (charIdx === effectiveStart)
            return {
              label: "START",
              color: LABEL_COLORS.START,
              isExisting: false,
              priority: 2,
            };
          return {
            label: "SELECTING",
            color: LABEL_COLORS.SELECTING,
            isExisting: false,
            priority: 2,
          };
        }
      }

      // 3. Kiểm tra clicked end state (ưu tiên cao hơn hover)
      if (clickedEndIdx !== null && charIdx === clickedEndIdx) {
        return {
          label: "CLICKED_END",
          color: LABEL_COLORS.CLICKED_END,
          isExisting: false,
          priority: 1,
        };
      }

      // 4. Kiểm tra hover state
      if (hoverIdx === charIdx) {
        return {
          label: "HOVER",
          color: LABEL_COLORS.HOVER,
          isExisting: false,
          priority: 0,
        };
      }

      return {
        label: null,
        color: "hover:bg-gray-100",
        isExisting: false,
        priority: -1,
      };
    },
    [entities, startIdx, endIdx, hoverIdx, clickedEndIdx]
  );

  // Xử lý click vào ký tự
  const handleCharClick = (charIdx) => {
    const isLastChar = charIdx === characters.length - 1;
    const adjustedIdx = isLastChar ? charIdx + 1 : charIdx;
    console.log(adjustedIdx, characters.length -1)

    if (startIdx === null) {
      setStartIdx(adjustedIdx);
      setEndIdx(adjustedIdx);
      setNewEntityStart(adjustedIdx);
      setNewEntityEnd(adjustedIdx);
      setClickedEndIdx(adjustedIdx);
    } else {
      if (adjustedIdx === startIdx) {
        setStartIdx(null);
        setEndIdx(null);
        setNewEntityEnd("");
        setNewEntityStart("");
        setClickedEndIdx(null);
      } else {
        setEndIdx(adjustedIdx);
        setNewEntityEnd(adjustedIdx);
        setClickedEndIdx(adjustedIdx);
      }
    }
  };

  // Xử lý hover
  const handleCharHover = (charIdx) => {
    setHoverIdx(charIdx);
    if (startIdx !== null) {
      setEndIdx(charIdx);
    }
  };

  // Xử lý mouse leave
  const handleCharMouseLeave = () => {
    setHoverIdx(null);
    if (startIdx !== null && clickedEndIdx !== null) {
      setEndIdx(clickedEndIdx);
    }
  };

  // Xử lý gán nhãn
  const handleLabelSelect = (label) => {
    if (startIdx === null || endIdx === null) return;

    const newStart = Math.min(startIdx, endIdx);
    const newEnd = Math.max(startIdx, endIdx);
    const newEntity = [newStart, newEnd, label];

    const newData = [...data];
    const newEntities = [...entities, newEntity];
    newData[currentIndex] = [text, { entities: newEntities }];

    setData(newData);
    setStartIdx(null);
    setEndIdx(null);
    setClickedEndIdx(null);
    setShowLabelSelector(false);
  };

  // Xóa entity
  const deleteEntity = (index) => {
    const newData = [...data];
    const newEntities = entities.filter((_, i) => i !== index);
    newData[currentIndex] = [text, { entities: newEntities }];
    setData(newData);
  };

  // Sửa entity
  const editEntity = (index, newStart, newEnd, newLabel) => {
    const newData = [...data];
    const newEntities = [...entities];
    newEntities[index] = [parseInt(newStart), parseInt(newEnd), newLabel];
    newData[currentIndex] = [text, { entities: newEntities }];
    setData(newData);
    setEditingEntity(null);
  };

  // Thêm entity mới
  const addNewEntity = () => {
    if (!newEntityEnd || !newEntityLabel) return;

    const start = parseInt(newEntityStart);
    const end = parseInt(newEntityEnd);

    if (start > end || start < 0 || end >= text.length) {
      alert("Vị trí không hợp lệ!");
      return;
    }

    const newEntity = [start, end, newEntityLabel];
    const newData = [...data];
    const newEntities = [...entities, newEntity];
    newData[currentIndex] = [text, { entities: newEntities }];

    setData(newData);
    setNewEntityStart("");
    setNewEntityEnd("");
    setNewEntityLabel("PERSON");
  };

  // Reset states khi chuyển item
  const resetStates = () => {
    setStartIdx(null);
    setEndIdx(null);
    setClickedEndIdx(null);
    setHoverIdx(null);
    setNewEntityLabel("PERSON");
    setNewEntityStart("");
    setNewEntityEnd("");
  };

  if (data.length === 0) {
    return <div className="p-4 text-center">Đang tải dữ liệu...</div>;
  }

  const copyToClipboard = () => {
    console.log(navigator.clipboard);
    data.forEach((item, index) => {
      item === "\u00A0" && (data[index] = " ");
    });
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("Copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Annotation Tool</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Left Panel - Text Area */}
        <div className="flex-2 col-span-2 p-6">
          <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
            <div className="p-6 border-b min-h-54">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  Text Content
                </h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setCurrentIndex((prev) => Math.max(0, prev - 1));
                      resetStates();
                    }}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600 transition"
                  >
                    ← Previous
                  </button>
                  <span className="font-medium text-gray-600">
                    {currentIndex + 1} / {data.length}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentIndex((prev) =>
                        Math.min(data.length - 1, prev + 1)
                      );
                      resetStates();
                    }}
                    disabled={currentIndex === data.length - 1}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600 transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
              {startIdx !== null && endIdx !== null && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Selection: {Math.min(startIdx, endIdx)} →{" "}
                    {Math.max(startIdx, endIdx)}
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    Selected text: "
                    {text.slice(
                      Math.min(startIdx, endIdx),
                      Math.max(startIdx, endIdx) + 1
                    )}
                    "
                  </p>
                  <div className="grid grid-cols-4 gap-4">
                    {LABELS.map((label) => (
                      <button
                        key={label}
                        onClick={() => handleLabelSelect(label)}
                        className={`px-3 py-3 w-52 text-xs rounded-full border-2 transition-all hover:scale-105 ${LABEL_COLORS[label]}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 overflow-auto">
              <div
                className="text-lg leading-relaxed relative"
                onMouseLeave={handleCharMouseLeave}
              >
                {characters.map((char, index) => {
                  if (index == characters.length - 1) {
                    index += 1;
                  }
                  const { label, color, isExisting } = getEntityInfo(index);

                  return (
                    <span
                      key={index}
                      className={`inline-block min-w-[12px] h-7 text-center cursor-pointer select-none transition-all duration-200 border-2 border-transparent
            ${color} 
            ${isExisting ? "border-opacity-100" : ""}
            hover:scale-110 active:scale-95`}
                      onClick={() => handleCharClick(index)}
                      onMouseEnter={() => handleCharHover(index)}
                      title={`Index: ${index}${
                        label ? `, Label: ${label}` : ""
                      }`}
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
              {/* Entities List */}
              <div className="grid grid-cols-3 gap-3">
                {entities.map((entity, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      LABEL_COLORS[entity[2]]
                    } hover:shadow-md transition`}
                  >
                    {editingEntity === index ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            defaultValue={entity[0]}
                            ref={(el) => {
                              if (el) el.entityStart = el;
                            }}
                            className="px-2 py-1 border rounded text-sm"
                          />
                          <input
                            type="number"
                            defaultValue={entity[1]}
                            ref={(el) => {
                              if (el) el.entityEnd = el;
                            }}
                            className="px-2 py-1 border rounded text-sm"
                          />
                          <select
                            defaultValue={entity[2]}
                            ref={(el) => {
                              if (el) el.entityLabel = el;
                            }}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            {LABELS.map((label) => (
                              <option key={label} value={label}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              const container = e.target.closest(".space-y-2");
                              const start = container.querySelector(
                                'input[type="number"]'
                              ).value;
                              const end = container.querySelectorAll(
                                'input[type="number"]'
                              )[1].value;
                              const label =
                                container.querySelector("select").value;
                              editEntity(index, start, end, label);
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingEntity(null)}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-sm">
                            [{entity[0]}, {entity[1]}, "{entity[2]}"]
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingEntity(index)}
                              className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteEntity(index)}
                              className="p-1 hover:bg-red-200 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">
                          "{text.slice(entity[0], entity[1] + 1)}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - JSON Editor */}
        <div className="col-span-1 p-6">
          <div className="bg-white rounded-lg shadow-lg h-full">
            <div className="p-6">
              <div className="flex justify-between item-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  JSON Output
                </h3>
                <Clipboard
                  size={20}
                  onClick={copyToClipboard}
                  className="cursor-pointer"
                />
              </div>

              <div className="bg-gray-900 text-green-400 rounded-lg p-4">
                <pre
                  className="text-xs overflow-auto max-h-96 whitespace-pre-wrap"
                  ref={jsonContainerRef}
                >
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnotationTool;
