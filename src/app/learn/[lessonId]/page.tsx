import { notFound } from "next/navigation";
import LessonWorkspace from "@/components/LessonWorkspace";
import { getLesson } from "@/lib/lessons";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();
  return <LessonWorkspace lesson={lesson} />;
}
