import React from 'react';
import { CameraIcon, ImageIcon, Trash2Icon } from 'lucide-react';
import { Sheet } from './Sheet';
import { ListGroup, ListRow } from './List';
import { Button } from './Button';
import { t } from '../strings';
import { haptic } from '../tokens';
import { useUI } from '../ui';

export function PhotoSheet() {
  const { closeSheet, toast } = useUI();

  return (
    <Sheet detent="medium" onClose={closeSheet}>
      <ListGroup>
        <ListRow
          icon={ImageIcon}
          label={<span className="font-normal">{t.photoUpload}</span>}
          onClick={() => {
            haptic('light');
            closeSheet();
            toast(t.saved);
          }} />
        
        <ListRow
          icon={CameraIcon}
          label={<span className="font-normal">{t.photoCamera}</span>}
          onClick={() => {
            haptic('light');
            closeSheet();
            toast(t.saved);
          }} />
        
        <ListRow
          last
          icon={Trash2Icon}
          iconTone="text-destructive"
          label={<span className="font-normal text-destructive">{t.photoDelete}</span>}
          onClick={() => {
            haptic('warning');
            closeSheet();
          }} />
        
      </ListGroup>
      <div className="px-4 pt-4">
        <Button variant="plain" full onClick={closeSheet}>
          {t.cancel}
        </Button>
      </div>
    </Sheet>);

}