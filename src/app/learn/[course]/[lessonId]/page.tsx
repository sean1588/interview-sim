import { notFound } from "next/navigation";
import LessonWorkspace from "@/components/LessonWorkspace";
import { getCourse, getLesson } from "@/lib/lessons";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ course: string; lessonId: string }>;
}) {
  const { course: courseId, lessonId } = await params;
  const course = getCourse(courseId);
  const lesson = course && getLesson(courseId, lessonId);
  if (!course || !lesson) notFound();
  return <LessonWorkspace course={course} lesson={lesson} />;
}
