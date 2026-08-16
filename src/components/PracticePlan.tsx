import { DumbbellIcon } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { NewBookingSheet } from '../screens/NewBookingSheet';
import { t } from '../strings';
import { masteryState } from '../academics';
import { curriculumFor } from '../curriculum';
import type { CurriculumModule, CurriculumTopic } from '../curriculum';
import { allModules } from '../curriculum';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';

interface PracticeItem {
  topic: CurriculumTopic;
  module: CurriculumModule;
}

/**
 * Practice plan inside Lessons — the topics actually worth drilling this week,
 * weakest first. Derived from assessment data, so it changes as the student
 * improves. The action routes into the existing extra-lesson booking flow.
 */
export function PracticePlan({ child }: {child: ChildRecord;}) {
  const ui = useUI();

  const items: PracticeItem[] = allModules(curriculumFor(child.id)).
  flatMap((module) => module.topics.map((topic) => ({ topic, module }))).
  filter((item) => {
    const state = masteryState(item.topic);
    return state === 'needs_review' || state === 'in_progress';
  }).
  sort((a, b) => (a.topic.mastery ?? 101) - (b.topic.mastery ?? 101)).
  slice(0, 3);

  if (items.length === 0) {
    return (
      <section className="px-4">
        <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
          {t.practiceHeader}
        </h2>
        <Card>
          <p className="py-1 text-center font-sans text-subhead text-mutedfg">{t.practiceEmpty}</p>
        </Card>
      </section>);

  }

  const weakest = items[0];

  return (
    <section className="px-4">
      <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
        {t.practiceHeader}
      </h2>
      <Card>
        <div className="flex items-start gap-3">
          <DumbbellIcon size={20} className="mt-[2px] shrink-0 text-primary" />
          <p className="font-sans text-subhead text-mutedfg">{t.practiceIntro}</p>
        </div>

        <ul className="mt-4 space-y-4">
          {items.map(({ topic, module }) =>
          <li key={topic.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-sans text-subhead font-semibold text-foreground">
                    {topic.title}
                  </span>
                  <span className="block truncate font-sans text-caption text-mutedfg">
                    {module.code} · {module.title}
                  </span>
                </span>
                <span className="shrink-0 font-sans text-subhead font-semibold tabular-nums text-primary">
                  {topic.mastery === null ? '—' : `${topic.mastery}%`}
                </span>
              </div>
              <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-muted">
                <div
                className="bar-fill h-full rounded-full bg-primary"
                style={{ width: `${topic.mastery ?? 0}%` }} />

              </div>
            </li>
          )}
        </ul>

        <div className="mt-4 border-t border-hairline pt-4">
          <Button
            variant="secondary"
            full
            onClick={() => {
              ui.goToTab(4);
              ui.openSheet({
                key: 'new-booking',
                detent: 'large',
                node:
                <NewBookingSheet
                  initialPurpose={`${weakest.topic.title} — ${weakest.module.title.toLowerCase()}`} />


              });
            }}>

            {t.weakPointCta}
          </Button>
        </div>
      </Card>
    </section>);

}
