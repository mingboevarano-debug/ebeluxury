'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FaSave, FaTrash, FaEraser, FaPen, FaTimes, FaDownload, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';
import { Draft } from '@/types';
import { createDraft, updateDraft } from '@/lib/db';
import { toast } from 'react-toastify';

interface DraftDrawingProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  foremanId: string;
  foremanName: string;
  editingDraft?: Draft | null;
  onSave: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

export default function DraftDrawing({
  isOpen,
  onClose,
  projectId,
  foremanId,
  foremanName,
  editingDraft,
  onSave,
}: DraftDrawingProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const pathsRef = useRef<DrawingPath[]>([]);
  const currentPathRef = useRef<DrawingPath | null>(null);
  const historyRef = useRef<DrawingPath[][]>([]);
  const historyStepRef = useRef<number>(-1);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = 600;
    }

    // Set canvas style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load existing draft if editing
    if (editingDraft?.canvasData) {
      try {
        const data = JSON.parse(editingDraft.canvasData);
        if (data.paths && Array.isArray(data.paths)) {
          pathsRef.current = data.paths;
          redrawCanvas();
        }
      } catch (error) {
        console.error('Error loading canvas data:', error);
      }
    } else {
      pathsRef.current = [];
      historyRef.current = [];
      historyStepRef.current = -1;
    }
  }, [isOpen, editingDraft]);

  // Reset form when opening/closing
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (editingDraft) {
        setTitle(editingDraft.title);
        setDescription(editingDraft.description || '');
      } else {
        setTitle('');
        setDescription('');
        pathsRef.current = [];
        historyRef.current = [];
        historyStepRef.current = -1;
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, editingDraft]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all paths
    pathsRef.current.forEach((path) => {
      if (path.points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = path.tool === 'eraser' ? '#FFFFFF' : path.color;
      ctx.lineWidth = path.width;
      ctx.globalCompositeOperation = path.tool === 'eraser' ? 'destination-out' : 'source-over';

      const firstPoint = path.points[0];
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < path.points.length; i++) {
        const point = path.points[i];
        ctx.lineTo(point.x, point.y);
      }

      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    });
  }, []);

  const getPointFromEvent = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return null;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getPointFromEvent(e);
    if (!point) return;

    setIsDrawing(true);
    currentPathRef.current = {
      points: [point],
      color: strokeColor,
      width: strokeWidth,
      tool: tool,
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPathRef.current) return;

    const point = getPointFromEvent(e);
    if (!point) return;

    currentPathRef.current.points.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentPathRef.current) return;

    if (currentPathRef.current.points.length > 0) {
      pathsRef.current.push(currentPathRef.current);

      // Save to history
      historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
      historyRef.current.push([...pathsRef.current]);
      historyStepRef.current = historyRef.current.length - 1;
    }

    setIsDrawing(false);
    currentPathRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t('foreman.draft.title_required') || 'Title is required');
      return;
    }

    setSaving(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get canvas data as JSON
      const canvasData = JSON.stringify({
        paths: pathsRef.current,
        width: canvas.width,
        height: canvas.height,
      });

      // Generate thumbnail
      const imageData = canvas.toDataURL('image/png');

      const draftData = {
        projectId,
        foremanId,
        foremanName,
        title: title.trim(),
        description: description.trim() || undefined,
        canvasData,
        thumbnail: imageData || undefined,
      };

      if (editingDraft) {
        await updateDraft(editingDraft.id, draftData);
        toast.success(t('foreman.draft.saved') || 'Draft saved successfully');
      } else {
        await createDraft(draftData);
        toast.success(t('foreman.draft.saved') || 'Draft saved successfully');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error(t('foreman.draft.save_error') || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    if (historyStepRef.current > 0) {
      historyStepRef.current--;
      pathsRef.current = [...historyRef.current[historyStepRef.current]];
      redrawCanvas();
    }
  };

  const handleRedo = () => {
    if (historyStepRef.current < historyRef.current.length - 1) {
      historyStepRef.current++;
      pathsRef.current = [...historyRef.current[historyStepRef.current]];
      redrawCanvas();
    }
  };

  const handleClear = () => {
    if (confirm(t('foreman.draft.confirm_clear') || 'Clear all drawings?')) {
      pathsRef.current = [];
      historyRef.current = [];
      historyStepRef.current = -1;
      redrawCanvas();
    }
  };

  const handleExport = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const imageData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `draft-${Date.now()}.png`;
      link.href = imageData;
      link.click();
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export image');
    }
  };

  const colors = [
    '#000000',
    '#FF0000',
    '#0000FF',
    '#00FF00',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFA500',
    '#800080',
    '#A52A2A',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('foreman.draft.title') || 'Draft Drawing'}</h2>
            <p className="text-indigo-100 text-sm mt-1">
              {t('foreman.draft.subtitle') || 'Draw your draft plans'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-800 text-white w-64 p-4 overflow-y-auto">
          {/* Title and Description */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('foreman.draft.draft_title') || 'Draft Title'} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('foreman.draft.title_placeholder') || 'Enter draft title'}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('foreman.draft.description') || 'Description'}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('foreman.draft.description_placeholder') || 'Enter description (optional)'}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Tools */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('foreman.draft.tools') || 'Tools'}</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTool('pen')}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                    tool === 'pen' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <FaPen className="mx-auto" />
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                    tool === 'eraser' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <FaEraser className="mx-auto" />
                </button>
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('foreman.draft.stroke_width') || 'Stroke Width'}: {strokeWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('foreman.draft.color') || 'Color'}</label>
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    className={`w-10 h-10 rounded border-2 transition-all ${
                      strokeColor === color ? 'border-white scale-110' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-full mt-2 h-10 rounded cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
              <button
                onClick={handleUndo}
                disabled={historyStepRef.current <= 0}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaArrowLeft />
                <span>{t('foreman.draft.undo') || 'Undo'}</span>
              </button>

              <button
                onClick={handleRedo}
                disabled={historyStepRef.current >= historyRef.current.length - 1}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaArrowRight />
                <span>{t('foreman.draft.redo') || 'Redo'}</span>
              </button>

              <button
                onClick={handleClear}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <FaTrash />
                <span>{t('foreman.draft.clear') || 'Clear'}</span>
              </button>

              <button
                onClick={handleExport}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <FaDownload />
                <span>{t('foreman.draft.export') || 'Export'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-100">
          <div className="flex-1 p-4 overflow-auto">
            <div className="bg-white shadow-2xl rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
              <canvas
                ref={canvasRef}
                className="w-full cursor-crosshair"
                style={{ display: 'block', touchAction: 'none' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="text-white text-sm">
              {t('foreman.draft.instructions') || 'Click and drag to draw. Use pen or eraser tool.'}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {t('foreman.draft.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FaSave />
                <span>
                  {saving ? (t('foreman.draft.saving') || 'Saving...') : (t('foreman.draft.save') || 'Save')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
