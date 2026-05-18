import { LessonPage } from '@/components/lesson/LessonPage';
import { lesson } from '@/lib/lesson/lessonData';

export default function LessonRoute() {
  return <LessonPage lesson={lesson} />;
}
