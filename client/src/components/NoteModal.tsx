import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { X, Save, FileText } from "lucide-react";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  orderId?: string;
  taskId?: string;
  note: string;
  onNoteChange: (note: string) => void;
}

export default function NoteModal({
  isOpen,
  onClose,
  onSave,
  orderId,
  taskId,
  note,
  onNoteChange
}: NoteModalProps) {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
      <Card className="w-full max-w-lg mx-4 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center">
              <FileText className="w-5 h-5 ml-2" />
              {taskId ? 'ملاحظة المهمة' : 'ملاحظة الطلب'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-close-note"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              {taskId ? 'رقم المهمة:' : 'رقم الطلب:'} <span className="text-primary font-bold" data-testid={taskId ? "text-modal-task-id" : "text-modal-order-id"}>{taskId || orderId}</span>
            </label>
            <Textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={6}
              className="rtl-input resize-none"
              placeholder="اكتب ملاحظاتك هنا..."
              data-testid="textarea-note"
            />
          </div>
          
          <div className="flex justify-end space-x-reverse space-x-2">
            <Button onClick={handleSave} data-testid="button-save-note">
              <Save className="w-4 h-4 ml-1" />
              حفظ الملاحظة
            </Button>
            <Button variant="secondary" onClick={onClose} data-testid="button-cancel-note">
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
