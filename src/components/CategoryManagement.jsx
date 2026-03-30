import React from "react";
// ✅ IMPORT Edit2
import { Plus, Edit2 } from "lucide-react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  horizontalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- SUB-COMPONENT: INDIVIDUAL SORTABLE ITEM ---
const SortableCategoryItem = ({ category, isActive, onClick, onEditCategory }) => {
  // Use _id for DnD tracking to match the MongoDB structure
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category._id }); 

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // ✅ Added 'group' class to detect hover on the whole item
      className="flex flex-col items-center gap-2 flex-shrink-0 group outline-none cursor-default relative"
    >
      {/* Draggable Image Container */}
      <div 
        {...attributes} 
        {...listeners}
        onClick={onClick}
        className={`w-[88px] h-[88px] rounded-[24px] flex items-center justify-center transition-all duration-300 cursor-grab active:cursor-grabbing relative overflow-visible ${
          isActive 
            ? "bg-white border-2 border-[#ff6b35] shadow-md shadow-[#ff6b35]/10" 
            : "bg-white border-2 border-transparent shadow-sm hover:border-orange-100 hover:bg-orange-50/30"
        }`}
      >
        <img 
          // FIXED: Use category.image directly as it's already a string URL from the parent
          src={category.image} 
          alt={category.name} 
          className={`w-[60px] h-[60px] object-contain transition-transform duration-300 ${
            isActive ? "drop-shadow-md scale-105" : "drop-shadow-sm group-hover:-translate-y-1"
          }`} 
        />
        
        {/* ✅ NEW: EDIT ICON (Top Right, Hidden until Hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the category click
            onEditCategory(category); 
          }}
          className="absolute -top-2 -right-2 h-7 w-7 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-[#ff6b35] hover:bg-white/95 transition-all shadow-[0_3px_12px_rgba(0,0,0,0.12)] opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
          aria-label={`Edit image for ${category.name}`}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
      </div>
      
      {/* Category Name Label */}
      <span className={`text-[14px] font-bold tracking-wide transition-colors truncate max-w-[88px] text-center ${
        isActive ? "text-slate-900" : "text-gray-400 group-hover:text-slate-700"
      }`}>
        {category.name}
      </span>
    </div>
  );
};

// --- MAIN COMPONENT ---
export const CategoryManagement = ({ 
  categories = [], 
  onAddCategory, 
  onOrderChange,
  activeCategoryId,
  onCategoryClick,
  onEditCategory // ✅ NEW PROP
}) => {
  
  // Sensors configuration for touch and mouse support
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Correctly identify indexes using the MongoDB _id
      const oldIndex = categories.findIndex((c) => (c._id || c.id) === active.id);
      const newIndex = categories.findIndex((c) => (c._id || c.id) === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(categories, oldIndex, newIndex);
        // Sync the new order back to MenuManagement
        onOrderChange(newOrder); 
      }
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Category Management</h3>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <div 
          className="flex items-start gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <SortableContext 
            // FIXED: Items array must match the IDs used inside individual items
            items={categories.map(c => c._id || c.id)} 
            strategy={horizontalListSortingStrategy}
          >
            {categories.map((category) => (
              <SortableCategoryItem 
                // FIXED: Explicitly set unique key to resolve React console warning
                key={category._id || category.id} 
                category={category}
                isActive={activeCategoryId === (category._id || category.id)}
                onClick={() => onCategoryClick?.(category._id || category.id)}
                onEditCategory={onEditCategory} // ✅ PASS THE HANDLER
              />
            ))}
          </SortableContext>

          {/* Add New Category Button */}
          <button 
            onClick={onAddCategory}
            className="flex flex-col items-center gap-2 flex-shrink-0 group outline-none ml-2"
          >
            <div className="w-[88px] h-[88px] rounded-[24px] flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 group-hover:border-[#ff6b35] group-hover:bg-orange-50 transition-all duration-300 shadow-sm">
              <Plus className="h-8 w-8 text-gray-400 group-hover:text-[#ff6b35] transition-colors" />
            </div>
            <span className="text-[14px] font-bold tracking-wide text-gray-400 group-hover:text-[#ff6b35] transition-colors">
              Add New
            </span>
          </button>
        </div>
      </DndContext>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default CategoryManagement;