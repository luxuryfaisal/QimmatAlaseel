import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Upload, Download, Trash2, Package } from "lucide-react";
import { useState } from "react";

interface Attachment {
  id: string;
  taskId: string;
  filename: string;
  mimeType: string;
  dataBase64: string;
  size: string;
  createdAt?: string;
}

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  attachments: Attachment[];
  onUpload: (data: { taskId: string; filename: string; mimeType: string; dataBase64: string; size: string }) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

export default function AttachmentModal({
  isOpen,
  onClose,
  taskId,
  attachments,
  onUpload,
  onDelete,
  canEdit
}: AttachmentModalProps) {
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      alert("حجم الملف يتجاوز الحد المسموح (2MB)");
      return;
    }

    // Check file type (images only)
    if (!file.type.startsWith('image/')) {
      alert("يُسمح فقط برفع الصور");
      return;
    }

    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        onUpload({
          taskId,
          filename: file.name,
          mimeType: file.type,
          dataBase64: base64Data,
          size: file.size.toString()
        });
        setUploading(false);
        event.target.value = ''; // Reset file input
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploading(false);
      alert("خطأ في رفع الملف");
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.dataBase64;
    link.download = attachment.filename;
    link.click();
  };

  const taskAttachments = attachments.filter(att => att.taskId === taskId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
      <Card className="w-full max-w-2xl mx-4 shadow-xl max-h-[80vh] overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center">
              <Package className="w-5 h-5 ml-2" />
              مرفقات المهمة
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-close-attachment"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              رقم المهمة: <span className="text-primary font-bold" data-testid="text-modal-attachment-task-id">{taskId}</span>
            </label>
          </div>

          {/* Upload Section */}
          {canEdit && (
            <div className="mb-6 p-4 border-2 border-dashed border-border rounded-lg">
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  اسحب الصور هنا أو انقر لتحديد الملفات
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                  data-testid="input-file-upload"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  الصور فقط - حد أقصى 2MB
                </p>
              </div>
            </div>
          )}

          {/* Attachments List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {taskAttachments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد مرفقات حالياً
              </div>
            ) : (
              taskAttachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-reverse space-x-3">
                    {attachment.dataBase64.startsWith('data:image/') && (
                      <img
                        src={attachment.dataBase64}
                        alt={attachment.filename}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">{attachment.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(parseInt(attachment.size) / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                      data-testid={`button-download-${attachment.id}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(attachment.id)}
                        data-testid={`button-delete-${attachment.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <Button variant="secondary" onClick={onClose} data-testid="button-close-attachment-modal">
              إغلاق
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}