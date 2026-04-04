import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getInitials } from '../../lib/utils';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
  userName: string;
  isPending: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 70 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

export default function AvatarCropModal({ isOpen, onClose, onSave, userName, isPending }: AvatarCropModalProps) {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  const getCroppedBlob = (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !crop) return Promise.resolve(null);

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelCrop = {
      x: (crop.x ?? 0) * scaleX,
      y: (crop.y ?? 0) * scaleY,
      width: (crop.width ?? 0) * scaleX,
      height: (crop.height ?? 0) * scaleY,
    };

    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 256, 256);

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  };

  const handleSave = async () => {
    const blob = await getCroppedBlob();
    if (!blob) return;
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    await onSave(file);
    handleClose();
  };

  const handleClose = () => {
    setImgSrc('');
    setCrop(undefined);
    onClose();
  };

  // 크롭된 미리보기 URL
  const previewUrl = imgSrc; // 실제 크롭 미리보기는 canvas 기반이므로 원본 사용

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={handleClose} />

          <motion.div
            className="relative rounded-xl w-full max-w-md overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-base font-semibold">프로필 사진 추가</h3>
              <button onClick={handleClose} className="text-lg cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>✕</button>
            </div>

            {/* 본문 */}
            <div className="px-6 py-4 flex flex-col gap-4">
              {!imgSrc ? (
                /* 파일 선택 영역 */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 py-12 rounded-lg cursor-pointer transition-colors hover:brightness-95"
                  style={{ backgroundColor: 'var(--color-bg)', border: '2px dashed var(--color-border)' }}
                >
                  <div className="text-3xl">📷</div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    클릭하여 이미지를 선택하세요
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    JPG, PNG, WebP (최대 5MB)
                  </p>
                </div>
              ) : (
                /* 크롭 영역 */
                <div className="flex justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    aspect={1}
                    circularCrop
                    className="max-h-80"
                  >
                    <img
                      ref={imgRef}
                      src={imgSrc}
                      alt="크롭 대상"
                      onLoad={onImageLoad}
                      className="max-h-80"
                    />
                  </ReactCrop>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* 미리보기 */}
              {imgSrc && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>미리보기</span>
                  <div className="flex items-center gap-2">
                    {previewUrl ? (
                      <img src={previewUrl} alt="preview" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                        {getInitials(userName)}
                      </div>
                    )}
                    <span className="text-sm font-medium">{userName}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors hover:brightness-90"
                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!imgSrc || isPending}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                저장
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
