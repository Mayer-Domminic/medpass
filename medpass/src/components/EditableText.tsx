import React, { useState, useRef, useEffect } from 'react';

//keyframes
const styles = `
@keyframes textPulse {
  0%, 100% { opacity: 0.5; }
  70% { opacity: 1; }
}

@keyframes cursorBlink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
`;

interface EditableTextProps {
  defaultValue: string;
  onUpdate: (value: string) => void;
  placeholder?: string;
}
const EditableText: React.FC<EditableTextProps> = ({ 
  defaultValue,
  onUpdate, //callback function that receives updated value
  placeholder = "Click to edit..." 
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [value, setValue] = useState<string>(defaultValue || "");
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const textMeasureRef = useRef<HTMLSpanElement>(null);

  // updates cursor position when editing
  useEffect(() => {
    if (isEditing) {
      updateCursorPosition();
    }
  }, [value, isEditing]);

  // Focus input when editing starts and update the cursor position
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Update cursor position based on current mode (editing or not)
      setTimeout(updateCursorPosition, 0);
    }
  }, [isEditing]);

  // calculate cursor position the width of a hidden, identical span (text element)
  const updateCursorPosition = () => {
    if (textMeasureRef.current) {
      if (inputRef.current) {
        const selectionStart = inputRef.current.selectionStart || value.length;
        textMeasureRef.current.textContent = value.substring(0, selectionStart);

        //text styling needs to match for accurate calculation
        textMeasureRef.current.style.fontSize = isEditing ? 'text-xl' : 'text-2xl';
        textMeasureRef.current.className = isEditing ? 'text-xl' : 'text-2xl';
        
        const textWidth = textMeasureRef.current.getBoundingClientRect().width;
        setCursorPosition(textWidth);
      } else {
        //fallback logic if inputRef isn't available
        // same styling hidden span as text displayed to user and measuring width logic as before
        textMeasureRef.current.textContent = value;
        textMeasureRef.current.style.fontSize = isEditing ? 'text-xl' : 'text-2xl';
        textMeasureRef.current.className = isEditing ? 'text-xl' : 'text-2xl';
        setCursorPosition(textMeasureRef.current.getBoundingClientRect().width);
      }
    } else {
      setCursorPosition(0);
    }
  };

  const handleUpdate = (): void => {
    if (onUpdate) {
      onUpdate(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setValue(e.target.value);
    // forces update to happen after width has calculated
    setTimeout(updateCursorPosition, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      handleUpdate();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(defaultValue); // reset to original value on esc press
    } else {
      // update cursor position for arrow keys, etc.
      setTimeout(updateCursorPosition, 0);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="relative">
        {/* hidden span for measuring text width */}
        <span 
          ref={textMeasureRef} 
          style={{
            visibility: 'hidden',
            position: 'absolute',
            whiteSpace: 'pre',
            fontFamily: 'inherit',
            fontWeight: 'inherit'
          }}
          className={isEditing ? 'text-xl' : 'text-2xl'}
        ></span>
        
        {isEditing ? (
          <div 
            className="relative rounded py-1 px-2 -mx-2 bg-gray-700 bg-opacity-30 text-xl"
          >
                          <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onSelect={updateCursorPosition}
              onClick={updateCursorPosition}
              onBlur={() => {
                setIsEditing(false);
                handleUpdate();
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none focus:outline-none text-gray-300 caret-transparent text-xl"
              style={{ 
                animation: 'textPulse 2s ease-in-out infinite'
              }}
            />
            
            {/* Blinking Cursor */}
            <div 
              className="absolute top-1 h-4 pointer-events-none" 
              style={{ 
                left: `${cursorPosition + 8}px`,
                top: `6px`,
                height: '1.1em', // dynamic height based on font size
                transform: 'translateY(0)',
              }}
            >
              <div 
                className="h-full w-0.5 bg-blue-400" 
                style={{
                  animation: 'cursorBlink 1s step-end infinite'
                }}
              ></div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="cursor-text py-1 px-2 -mx-2 hover:bg-gray-700 hover:bg-opacity-30 rounded-sm transition-colors duration-200 font-semibold text-2xl text-gray-100"
          >
            {value ? (
              <span className="text-white-100">{value}</span>
            ) : (
              <span className="text-gray-500">{placeholder}</span> //emphasis on placeholder w/gray
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default EditableText;