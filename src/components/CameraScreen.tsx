import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Camera, RotateCw, Crop, Check, X, 
  Image as ImageIcon, Sun, Contrast, Palette, Maximize2 
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Slider } from './ui/slider';

interface CameraScreenProps {
  onBack: () => void;
  onSavePhoto: (photoName: string, photoData: string) => void;
}

type EditMode = 'none' | 'crop' | 'adjust';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
}

export function CameraScreen({ onBack, onSavePhoto }: CameraScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [photoName, setPhotoName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  // Crop state
  const [cropArea, setCropArea] = useState<CropArea>({ x: 10, y: 10, width: 80, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Adjustments state
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100
  });
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      // Only log error if it's not a permission denial (expected behavior)
      if (error instanceof Error && error.name !== 'NotAllowedError') {
        console.error('Error accessing camera:', error);
      }
      setCameraError('Unable to access camera. Please grant camera permissions or select a photo from gallery.');
    }
  }, [facingMode, stream]);

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Switch camera
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    startCamera();
  }, [startCamera]);

  // Capture photo from camera
  const handleTakePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataUrl);
      setOriginalPhoto(dataUrl);
      setIsEditing(true);
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [stream]);

  // Select photo from gallery
  const handleSelectFromGallery = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedPhoto(dataUrl);
      setOriginalPhoto(dataUrl);
      setIsEditing(true);
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    reader.readAsDataURL(file);
  }, [stream]);

  // Retake photo
  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
    setOriginalPhoto(null);
    setIsEditing(false);
    setRotation(0);
    setEditMode('none');
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
    setCropArea({ x: 10, y: 10, width: 80, height: 80 });
    startCamera();
  }, [startCamera]);

  // Rotate photo
  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // Apply rotation and adjustments to canvas
  useEffect(() => {
    if (!capturedPhoto || !editCanvasRef.current) return;
    
    const canvas = editCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      // Handle rotation
      if (rotation === 90 || rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-img.width / 2, -img.height / 2);
      
      // Apply adjustments
      ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      
      // Update captured photo with edited version
      const editedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(editedDataUrl);
    };
    img.src = originalPhoto || capturedPhoto;
  }, [rotation, adjustments, originalPhoto]);

  // Toggle crop mode
  const handleToggleCrop = useCallback(() => {
    if (editMode === 'crop') {
      setEditMode('none');
    } else {
      setEditMode('crop');
      setAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
    }
  }, [editMode]);

  // Toggle adjust mode
  const handleToggleAdjust = useCallback(() => {
    if (editMode === 'adjust') {
      setEditMode('none');
    } else {
      setEditMode('adjust');
    }
  }, [editMode]);

  // Apply crop
  const handleApplyCrop = useCallback(() => {
    if (!editCanvasRef.current || !originalPhoto) return;
    
    const canvas = editCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      const cropX = (cropArea.x / 100) * img.width;
      const cropY = (cropArea.y / 100) * img.height;
      const cropW = (cropArea.width / 100) * img.width;
      const cropH = (cropArea.height / 100) * img.height;
      
      canvas.width = cropW;
      canvas.height = cropH;
      
      ctx.drawImage(
        img,
        cropX, cropY, cropW, cropH,
        0, 0, cropW, cropH
      );
      
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(croppedDataUrl);
      setOriginalPhoto(croppedDataUrl);
      setEditMode('none');
      setCropArea({ x: 10, y: 10, width: 80, height: 80 });
    };
    img.src = originalPhoto;
  }, [cropArea, originalPhoto]);

  // Crop drag handlers
  const handleCropMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (editMode !== 'crop' || !cropOverlayRef.current) return;
    
    e.preventDefault();
    const rect = cropOverlayRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    // Check if clicking near edge for resize
    const nearRightEdge = Math.abs(x - (cropArea.x + cropArea.width)) < 5;
    const nearBottomEdge = Math.abs(y - (cropArea.y + cropArea.height)) < 5;
    
    if (nearRightEdge || nearBottomEdge) {
      setIsResizing(true);
    } else if (
      x >= cropArea.x && 
      x <= cropArea.x + cropArea.width && 
      y >= cropArea.y && 
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true);
    }
    
    setDragStart({ x, y });
  }, [editMode, cropArea]);

  const handleCropMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ((!isDragging && !isResizing) || editMode !== 'crop' || !cropOverlayRef.current) return;
    
    e.preventDefault();
    const rect = cropOverlayRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    if (isDragging) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      setCropArea(prev => {
        const newX = Math.max(0, Math.min(100 - prev.width, prev.x + deltaX));
        const newY = Math.max(0, Math.min(100 - prev.height, prev.y + deltaY));
        return { ...prev, x: newX, y: newY };
      });
      setDragStart({ x, y });
    } else if (isResizing) {
      setCropArea(prev => {
        const newWidth = Math.max(20, Math.min(100 - prev.x, x - prev.x));
        const newHeight = Math.max(20, Math.min(100 - prev.y, y - prev.y));
        return { ...prev, width: newWidth, height: newHeight };
      });
    }
  }, [isDragging, isResizing, dragStart, editMode]);

  const handleCropMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Save photo
  const handleSave = useCallback(() => {
    setShowNameDialog(true);
  }, []);

  const handleConfirmSave = useCallback(() => {
    if (capturedPhoto && photoName.trim()) {
      onSavePhoto(photoName.trim(), capturedPhoto);
      setShowNameDialog(false);
      setPhotoName('');
      setCapturedPhoto(null);
      setOriginalPhoto(null);
      setIsEditing(false);
      setRotation(0);
      setEditMode('none');
      setAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
      onBack();
    }
  }, [capturedPhoto, photoName, onSavePhoto, onBack]);

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      {/* Hidden canvas for capturing and editing */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={editCanvasRef} className="hidden" />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {!isEditing && !cameraError && (
            <Button
              variant="ghost"
              size="sm"
              onClick={switchCamera}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Camera View or Captured Photo */}
      <div className="h-full flex items-center justify-center">
        {cameraError ? (
          <div className="text-center px-6">
            <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-white/80 mb-6">{cameraError}</p>
            <Button
              onClick={handleSelectFromGallery}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              Select from Gallery
            </Button>
          </div>
        ) : isEditing && capturedPhoto ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative max-w-full max-h-full"
            >
              <img 
                src={capturedPhoto} 
                alt="Captured" 
                className="max-w-full max-h-[70vh] object-contain"
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease'
                }}
              />
              
              {/* Crop overlay */}
              {editMode === 'crop' && (
                <div 
                  ref={cropOverlayRef}
                  className="absolute inset-0"
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onMouseLeave={handleCropMouseUp}
                  onTouchMove={handleCropMouseMove}
                  onTouchEnd={handleCropMouseUp}
                >
                  {/* Darkened areas outside crop */}
                  <div className="absolute inset-0 bg-black/50" />
                  
                  {/* Crop box */}
                  <div
                    className="absolute border-2 border-white bg-transparent cursor-move"
                    style={{
                      left: `${cropArea.x}%`,
                      top: `${cropArea.y}%`,
                      width: `${cropArea.width}%`,
                      height: `${cropArea.height}%`,
                    }}
                    onMouseDown={handleCropMouseDown}
                    onTouchStart={handleCropMouseDown}
                  >
                    {/* Resize handle */}
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-black cursor-se-resize">
                      <Maximize2 className="w-4 h-4 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-4 border-white/10 pointer-events-none" />
          </>
        )}
      </div>

      {/* Adjustment Controls */}
      <AnimatePresence>
        {editMode === 'adjust' && isEditing && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-32 left-0 right-0 px-6 py-4 bg-black/80 backdrop-blur-sm"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-white" />
                <span className="text-white text-sm w-24">Brightness</span>
                <Slider
                  value={[adjustments.brightness]}
                  onValueChange={([value]) => setAdjustments(prev => ({ ...prev, brightness: value }))}
                  min={50}
                  max={150}
                  step={1}
                  className="flex-1"
                />
                <span className="text-white text-sm w-12 text-right">{adjustments.brightness}%</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Contrast className="w-5 h-5 text-white" />
                <span className="text-white text-sm w-24">Contrast</span>
                <Slider
                  value={[adjustments.contrast]}
                  onValueChange={([value]) => setAdjustments(prev => ({ ...prev, contrast: value }))}
                  min={50}
                  max={150}
                  step={1}
                  className="flex-1"
                />
                <span className="text-white text-sm w-12 text-right">{adjustments.contrast}%</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-white" />
                <span className="text-white text-sm w-24">Saturation</span>
                <Slider
                  value={[adjustments.saturation]}
                  onValueChange={([value]) => setAdjustments(prev => ({ ...prev, saturation: value }))}
                  min={0}
                  max={200}
                  step={1}
                  className="flex-1"
                />
                <span className="text-white text-sm w-12 text-right">{adjustments.saturation}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-20 px-6 bg-gradient-to-t from-black/70 to-transparent z-10">
        {isEditing ? (
          <div className="space-y-4">
            {editMode === 'crop' && (
              <div className="flex justify-center">
                <Button
                  onClick={handleApplyCrop}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Apply Crop
                </Button>
              </div>
            )}
            
            <div className="flex justify-center items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRetake}
                className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRotate}
                className={`w-12 h-12 rounded-full ${
                  editMode === 'none' ? 'bg-white/10' : 'bg-purple-500/30'
                } text-white hover:bg-white/20`}
              >
                <RotateCw className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCrop}
                className={`w-12 h-12 rounded-full ${
                  editMode === 'crop' ? 'bg-purple-500' : 'bg-white/10'
                } text-white hover:bg-white/20`}
              >
                <Crop className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleAdjust}
                className={`w-12 h-12 rounded-full ${
                  editMode === 'adjust' ? 'bg-purple-500' : 'bg-white/10'
                } text-white hover:bg-white/20`}
              >
                <Sun className="w-6 h-6" />
              </Button>
              
              <Button
                size="icon"
                onClick={handleSave}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Check className="w-7 h-7" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSelectFromGallery}
              className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ImageIcon className="w-6 h-6" />
            </Button>
            
            <Button
              size="lg"
              onClick={handleTakePhoto}
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 p-2"
            >
              <div className="w-full h-full rounded-full border-4 border-gray-800"></div>
            </Button>
            
            <div className="w-12 h-12" /> {/* Spacer for symmetry */}
          </div>
        )}
      </div>

      {/* Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="mx-4" aria-describedby="photo-name-description">
          <DialogHeader>
            <DialogTitle>Enter Photo Name</DialogTitle>
            <DialogDescription id="photo-name-description">
              Give your photo a descriptive name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Photo name..."
              value={photoName}
              onChange={(e) => setPhotoName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNameDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSave}
                disabled={!photoName.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <p className="text-white/50 text-xs">Made by Valapatla Yaswanth</p>
      </div>
    </div>
  );
}
