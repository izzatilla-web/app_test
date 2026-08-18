import React, { useState } from 'react';
import {
  FileTextIcon,
  DownloadIcon,
  ArrowLeftIcon,
  CheckCircle2Icon
} from 'lucide-react';
import { Sheet } from './Sheet';
import { haptic } from '../tokens';
import type { CurriculumTopic, TopicPresentation, TopicDocumentFile } from '../curriculum';
import { useUI } from '../ui';

interface PresentationViewerSheetProps {
  topic: CurriculumTopic;
  presentation?: TopicPresentation;
}

export function PresentationViewerSheet({ topic, presentation: propPres }: PresentationViewerSheetProps) {
  const { closeSheet, toast } = useUI();
  const [activePreviewFile, setActivePreviewFile] = useState<TopicDocumentFile | null>(null);

  // Resolve presentation files or realistic CRM uploaded file defaults
  const files: TopicDocumentFile[] =
    propPres?.files ||
    topic.content.presentation?.files || [
      {
        id: 1,
        title: `${topic.title} — Asosiy Taqdimot`,
        fileName: `${topic.title.replace(/\s+/g, '_')}_Taqdimot.pdf`,
        sizeStr: '3.4 MB',
        fileType: 'pdf',
        pageCount: 18
      },
      {
        id: 2,
        title: 'Formulalar va Misollar jadvali (PDF)',
        fileName: 'Mavzu_Formulalar_Jadvali.pdf',
        sizeStr: '1.8 MB',
        fileType: 'pdf',
        pageCount: 8
      },
      {
        id: 3,
        title: 'Qo‘shimcha ko‘rgazmali slaydlar',
        fileName: 'Qoshimcha_Korgazmali_Slaydlar.pptx',
        sizeStr: '5.2 MB',
        fileType: 'pptx',
        pageCount: 12
      }
    ];

  function handleDownload(file: TopicDocumentFile, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    haptic('success');
    toast(`"${file.fileName}" yuklab olinmoqda...`, 'success');
  }

  function handleOpenPreview(file: TopicDocumentFile) {
    haptic('light');
    setActivePreviewFile(file);
  }

  return (
    <Sheet
      title={activePreviewFile ? activePreviewFile.title : topic.title}
      subtitle={
        <div className="flex items-center justify-between font-sans text-xs pt-0.5 text-mutedfg">
          <span>{activePreviewFile ? activePreviewFile.fileName : 'Fayllar & Taqdimotlar'}</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {activePreviewFile ? activePreviewFile.sizeStr : `${files.length} ta fayl`}
          </span>
        </div>
      }
      detent="large"
      onClose={closeSheet}
    >
      <div className="space-y-4 px-4 pb-8">
        {activePreviewFile ? (
          /* ── In-App Document Preview Mode ── */
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setActivePreviewFile(null)}
              className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeftIcon size={14} />
              Barcha fayllarga qaytish
            </button>

            {/* Document Viewer Frame */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 p-6 shadow-sm dark:border-indigo-900/60 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-sans text-xs font-semibold text-mutedfg">
                  {activePreviewFile.sizeStr}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleDownload(activePreviewFile, e)}
                  className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 font-sans text-xs font-bold text-indigo-700 shadow-xs hover:bg-white dark:bg-slate-800/90 dark:text-indigo-300"
                >
                  <DownloadIcon size={13} />
                  Yuklab olish
                </button>
              </div>

              <div className="my-auto py-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100/80 text-indigo-600 shadow-xs dark:bg-indigo-950 dark:text-indigo-400">
                  <FileTextIcon size={32} />
                </div>
                <h3 className="mt-3 font-display text-base sm:text-lg font-bold text-foreground">
                  {activePreviewFile.title}
                </h3>
                <p className="mt-1 font-sans text-xs text-mutedfg">
                  {activePreviewFile.fileName}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-indigo-100/80 pt-3 font-sans text-[11px] text-mutedfg dark:border-indigo-950">
                <span>Phoenix LMS Hujjat</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2Icon size={13} /> Tayyor
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => handleDownload(activePreviewFile, e)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 font-sans text-xs font-bold text-white shadow-xs transition-transform active:scale-98 hover:bg-indigo-700"
            >
              <DownloadIcon size={16} />
              Yuklab olish ({activePreviewFile.sizeStr})
            </button>
          </div>
        ) : (
          /* ── Files List Mode: Pure Apple Minimalist Style ── */
          <div className="space-y-2">
            <h3 className="px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Yuklangan Materiallar ({files.length})
            </h3>

            <div className="space-y-2.5">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleOpenPreview(file)}
                  className="group flex cursor-pointer items-center justify-between gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all duration-150 active:scale-[0.99] hover:border-indigo-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800"
                >
                  {/* Left: Clean Vector Icon */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <FileTextIcon size={22} />
                  </div>

                  {/* Middle: Title & Clean Size Subtitle */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-sans text-sm font-bold text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {file.title}
                    </h4>
                    <p className="mt-0.5 font-sans text-xs text-mutedfg">
                      {file.sizeStr}
                    </p>
                  </div>

                  {/* Right: Clean Apple Download Action Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDownload(file, e)}
                    aria-label="Yuklab olish"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-indigo-600 hover:text-white active:scale-90 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-600 dark:hover:text-white"
                    title="Yuklab olish"
                  >
                    <DownloadIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
